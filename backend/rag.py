import os
import shutil
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_groq import ChatGroq
from langchain_community.vectorstores import Chroma
from langchain_core.documents import Document
from sqlalchemy.orm import Session
import pandas as pd
import models

_embeddings = None

def get_embeddings():
    global _embeddings
    if _embeddings is None:
        # Use HuggingFace embeddings which is free, runs locally, and is cached globally in-memory
        _embeddings = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")
    return _embeddings

def build_user_knowledge_base(user_id: int, db: Session):
    upload_ids = [u.id for u in db.query(models.Upload).filter(models.Upload.user_id == user_id).all()]
    if not upload_ids:
        return False
        
    rows = db.query(models.DataRow).filter(models.DataRow.upload_id.in_(upload_ids)).all()
    if not rows:
        return False
        
    # Create simple text summaries per SKU
    df = pd.DataFrame([{"sku": r.sku, "product_name": r.product_name, "quantity": r.sales_quantity, "revenue": r.revenue} for r in rows])
    summary = df.groupby(['sku', 'product_name']).sum().reset_index()
    
    docs = []
    for _, row in summary.iterrows():
        text = f"Product {row['product_name']} (SKU: {row['sku']}) has total historical sales quantity of {row['quantity']} units and total revenue of ${row['revenue']}."
        docs.append(Document(page_content=text, metadata={"sku": row['sku']}))
        
    try:
        embeddings = get_embeddings()
        persist_directory = f"./chroma_db/user_{user_id}"
        
        # Clear existing Chroma DB directory to avoid dimension mismatch (OpenAI vs HuggingFace)
        if os.path.exists(persist_directory):
            shutil.rmtree(persist_directory)
            
        vectordb = Chroma.from_documents(docs, embeddings, persist_directory=persist_directory)
        if hasattr(vectordb, 'persist'):
            vectordb.persist()
        return True
    except Exception as e:
        print(f"RAG Knowledge Base Build Error: {e}")
        return False

def query_insights(user_id: int, query: str):
    persist_directory = f"./chroma_db/user_{user_id}"
    if not os.path.exists(persist_directory):
        return {"answer": "No data has been processed for insights yet. Please upload data."}
        
    try:
        embeddings = get_embeddings()
        vectordb = Chroma(persist_directory=persist_directory, embedding_function=embeddings)
        
        docs = vectordb.similarity_search(query, k=5)
        context = "\n".join([doc.page_content for doc in docs])
        
        # Initialize ChatGroq LLM
        llm = ChatGroq(
            temperature=0, 
            model="llama-3.3-70b-versatile", 
            groq_api_key=os.getenv("GROQ_API_KEY")
        )
        
        prompt = (
            "You are an AI inventory and sales analyst named Invenza. Based on the following data context, "
            "answer the user's question clearly and professionally.\n\n"
            "CRITICAL: Keep your response extremely concise, direct, and limited to exactly 2 to 3 lines. "
            "Provide the actual answer directly without long analysis, breakdown, or excessive explanation.\n\n"
            f"Context:\n{context}\n\n"
            f"Question: {query}\n\n"
            "Answer:"
        )
        
        from langchain_core.messages import HumanMessage
        response = llm.invoke([HumanMessage(content=prompt)])
        
        return {"answer": response.content, "evidence": [doc.page_content for doc in docs]}
    except Exception as e:
        print(f"RAG Query Error: {e}")
        return {"answer": f"I'm currently unable to process your request due to an error: {str(e)}", "evidence": []}
