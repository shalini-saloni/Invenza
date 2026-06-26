from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import timedelta

from pydantic import BaseModel
import models, schemas, auth
from database import engine, get_db

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Invenza API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000"
    ],
    allow_origin_regex=r"https://invenza.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email, 
        hashed_password=hashed_password,
        full_name=user.full_name
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@app.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

import requests
class GoogleAuthRequest(BaseModel):
    token: str

@app.post("/api/auth/google", response_model=schemas.Token)
def google_auth(request: GoogleAuthRequest, db: Session = Depends(get_db)):
    user_info_url = "https://www.googleapis.com/oauth2/v3/userinfo"
    response = requests.get(user_info_url, headers={"Authorization": f"Bearer {request.token}"})
    
    if response.status_code != 200:
        raise HTTPException(status_code=400, detail="Invalid Google token")
        
    user_info = response.json()
    email = user_info.get("email")
    name = user_info.get("name")
    
    if not email:
        raise HTTPException(status_code=400, detail="Google authentication failed")
        
    user = db.query(models.User).filter(models.User.email == email).first()
    
    if not user:
        hashed_password = auth.get_password_hash("google_oauth_dummy_password_" + email)
        user = models.User(
            email=email,
            full_name=name,
            hashed_password=hashed_password,
            profile_picture=user_info.get("picture")
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

import analysis
from fastapi import Query

@app.get("/api/dashboard")
def get_dashboard(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    return analysis.get_dashboard_stats(current_user.id, db)

@app.get("/api/forecast")
def get_forecast(
    sku: str = Query(..., description="SKU to forecast"),
    periods: int = Query(6, description="Number of periods (months) to forecast"),
    current_user: models.User = Depends(auth.get_current_user), 
    db: Session = Depends(get_db)
):
    return analysis.generate_forecast(current_user.id, sku, periods, db)

@app.get("/users/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(auth.get_current_user)):
    return current_user

class UserUpdate(BaseModel):
    full_name: str

@app.put("/users/me", response_model=schemas.UserResponse)
def update_user_me(user_update: UserUpdate, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    current_user.full_name = user_update.full_name
    db.commit()
    db.refresh(current_user)
    return current_user

from fastapi import UploadFile, File, BackgroundTasks
import shutil
import os
import services

UPLOAD_DIR = "./uploaded_files"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/upload", response_model=schemas.UploadResponse)
def upload_data(background_tasks: BackgroundTasks, file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    file_path = os.path.join(UPLOAD_DIR, f"{current_user.id}_{file.filename}")
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    db_upload = models.Upload(user_id=current_user.id, filename=file.filename, file_path=file_path, status="processing")
    db.add(db_upload)
    db.commit()
    db.refresh(db_upload)
    
    # Process Data
    result = services.process_and_clean_csv(file_path, db_upload.id, db)
    
    if result["status"] == "success":
        db_upload.status = "cleaned"
        message = f"Successfully processed {result['rows_processed']} rows."
        import rag
        # Run RAG knowledge base generation in the background so it doesn't block the UI
        background_tasks.add_task(rag.build_user_knowledge_base, current_user.id, db)
        db.commit()
    else:
        db_upload.status = "error"
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return schemas.UploadResponse(id=db_upload.id, filename=db_upload.filename, status=db_upload.status, message=message)

from pydantic import BaseModel
class ChatRequest(BaseModel):
    query: str

@app.post("/api/chat")
def get_insights(request: ChatRequest, current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    import rag
    import os
    persist_directory = f"./chroma_db/user_{current_user.id}"
    if not os.path.exists(persist_directory):
        # RAG index missing (server may have restarted before background build finished)
        # Try to rebuild it now
        rag.build_user_knowledge_base(current_user.id, db)
    return rag.query_insights(current_user.id, request.query)

@app.get("/api/skus")
def get_skus(user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    upload_ids = [u.id for u in db.query(models.Upload).filter(models.Upload.user_id == user.id).all()]
    if not upload_ids:
        return []
    skus = db.query(models.DataRow.sku, models.DataRow.product_name).filter(models.DataRow.upload_id.in_(upload_ids)).distinct().all()
    return [{"sku": s.sku, "product_name": s.product_name} for s in skus]

@app.get("/api/inventory")
def get_inventory(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    # Simple logic to determine stock levels and reorder points based on recent sales
    import pandas as pd
    from sqlalchemy import func
    
    upload_ids = [u.id for u in db.query(models.Upload).filter(models.Upload.user_id == current_user.id).all()]
    if not upload_ids:
        return []
        
    rows = db.query(models.DataRow).filter(models.DataRow.upload_id.in_(upload_ids)).all()
    if not rows:
        return []
        
    df = pd.DataFrame([{"sku": r.sku, "product": r.product_name, "qty": r.sales_quantity, "date": r.date} for r in rows])
    df['date'] = pd.to_datetime(df['date'])
    
    # Calculate average monthly sales as a naive proxy for demand
    # Group by SKU
    skus = df.groupby(['sku', 'product']).agg({
        'qty': ['sum', 'mean', 'count']
    }).reset_index()
    
    skus.columns = ['sku', 'product', 'total_sales', 'avg_sales', 'months_data']
    
    inventory = []
    for _, row in skus.iterrows():
        avg = row['avg_sales']
        # Naive rules:
        # recommended_stock = 1.5 * average monthly sales
        # reorder_point = 0.5 * average monthly sales
        recommended = int(avg * 1.5)
        reorder = int(avg * 0.5)
        status = "Healthy" if avg > 10 else "Low Demand"
        
        inventory.append({
            "sku": row['sku'],
            "product": row['product'],
            "avg_monthly_sales": int(avg),
            "recommended_stock": recommended,
            "reorder_point": reorder,
            "status": status
        })
        
    return inventory

AVATAR_DIR = "./uploaded_files/avatars"
os.makedirs(AVATAR_DIR, exist_ok=True)

@app.post("/users/me/avatar")
def upload_avatar(file: UploadFile = File(...), current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    import uuid
    ext = os.path.splitext(file.filename)[1] if file.filename else ".png"
    filename = f"{current_user.id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = os.path.join(AVATAR_DIR, filename)
    with open(file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    
    current_user.profile_picture = f"/uploaded_files/avatars/{filename}"
    db.add(current_user)
    db.commit()
    db.refresh(current_user)
    return {"url": current_user.profile_picture}

from fastapi.staticfiles import StaticFiles
app.mount("/uploaded_files", StaticFiles(directory="./uploaded_files"), name="uploaded_files")

@app.get("/api/user-stats")
def get_user_stats(current_user: models.User = Depends(auth.get_current_user), db: Session = Depends(get_db)):
    import datetime
    uploads = db.query(models.Upload).filter(models.Upload.user_id == current_user.id).all()
    upload_ids = [u.id for u in uploads]
    total_rows = 0
    total_skus = 0
    if upload_ids:
        total_rows = db.query(models.DataRow).filter(models.DataRow.upload_id.in_(upload_ids)).count()
        total_skus = db.query(models.DataRow.sku).filter(models.DataRow.upload_id.in_(upload_ids)).distinct().count()
    
    days_active = 0
    if current_user.created_at:
        days_active = (datetime.datetime.utcnow() - current_user.created_at).days or 1
    
    last_upload = None
    if uploads:
        sorted_uploads = sorted(uploads, key=lambda u: u.created_at, reverse=True)
        last_upload = sorted_uploads[0].created_at.isoformat() if sorted_uploads[0].created_at else None
    
    recent_uploads = []
    if uploads:
        sorted_uploads = sorted(uploads, key=lambda u: u.created_at, reverse=True)[:5]
        recent_uploads = [{"filename": u.filename, "status": u.status, "date": u.created_at.isoformat() if u.created_at else None} for u in sorted_uploads]
    
    return {
        "total_uploads": len(uploads),
        "total_rows": total_rows,
        "total_skus": total_skus,
        "days_active": days_active,
        "last_upload": last_upload,
        "recent_uploads": recent_uploads
    }
