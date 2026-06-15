import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
import models
from statsmodels.tsa.holtwinters import SimpleExpSmoothing
from datetime import timedelta

def get_dashboard_stats(user_id: int, db: Session):
    # Get all user uploads
    upload_ids = [u.id for u in db.query(models.Upload).filter(models.Upload.user_id == user_id).all()]
    if not upload_ids:
        return {"error": "No data uploaded"}
    
    # Get basic stats
    total_skus = db.query(func.count(func.distinct(models.DataRow.sku))).filter(models.DataRow.upload_id.in_(upload_ids)).scalar()
    total_sales = db.query(func.sum(models.DataRow.sales_quantity)).filter(models.DataRow.upload_id.in_(upload_ids)).scalar()
    
    # Get monthly trends
    rows = db.query(models.DataRow).filter(models.DataRow.upload_id.in_(upload_ids)).all()
    df = pd.DataFrame([{
        "date": r.date, 
        "quantity": r.sales_quantity, 
        "revenue": r.revenue
    } for r in rows])
    
    if df.empty:
        return {"total_skus": 0, "total_sales": 0, "trends": []}
        
    df['date'] = pd.to_datetime(df['date'])
    df['month'] = df['date'].dt.to_period('M').astype(str)
    
    monthly_sales = df.groupby('month')['quantity'].sum().reset_index()
    trends = monthly_sales.to_dict('records')
    
    return {
        "total_skus": total_skus,
        "total_sales": total_sales,
        "trends": trends
    }

def generate_forecast(user_id: int, sku: str, periods: int, db: Session):
    upload_ids = [u.id for u in db.query(models.Upload).filter(models.Upload.user_id == user_id).all()]
    if not upload_ids:
        return {"error": "No data"}
        
    rows = db.query(models.DataRow).filter(
        models.DataRow.upload_id.in_(upload_ids),
        models.DataRow.sku == sku
    ).all()
    
    if len(rows) < 3:
        return {"error": "Not enough data for forecasting"}
        
    df = pd.DataFrame([{"date": r.date, "quantity": r.sales_quantity} for r in rows])
    df['date'] = pd.to_datetime(df['date'])
    df = df.groupby('date')['quantity'].sum().reset_index().sort_values('date')
    
    df.set_index('date', inplace=True)
    # Simple Exponential Smoothing
    model = SimpleExpSmoothing(df['quantity'], initialization_method="estimated").fit()
    forecast = model.forecast(periods)
    
    # Generate future dates (assuming monthly data for simplicity)
    last_date = df.index[-1]
    future_dates = [last_date + pd.DateOffset(months=i) for i in range(1, periods + 1)]
    
    forecast_results = [
        {"date": date.strftime('%Y-%m-%d'), "predicted_quantity": round(val, 2)}
        for date, val in zip(future_dates, forecast)
    ]
    
    return forecast_results
