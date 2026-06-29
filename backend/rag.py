import os
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage
from sqlalchemy.orm import Session
from sqlalchemy import func
import models

_context_cache = {}

def build_user_knowledge_base(user_id: int, db: Session):
    # Invalidate cache when new data is uploaded
    if user_id in _context_cache:
        del _context_cache[user_id]
    return True

def query_insights(user_id: int, query: str, db: Session):
    try:
        global _context_cache
        
        if user_id in _context_cache:
            context_lines = _context_cache[user_id]
        else:
            upload_ids = [u.id for u in db.query(models.Upload).filter(models.Upload.user_id == user_id).all()]
            if not upload_ids:
                return {"answer": "No data has been processed for insights yet. Please upload data.", "evidence": []}
                
            # Dynamically aggregate data for the LLM context
            results = db.query(
                models.DataRow.sku,
                models.DataRow.product_name,
                func.sum(models.DataRow.sales_quantity).label('quantity'),
                func.sum(models.DataRow.revenue).label('revenue')
            ).filter(models.DataRow.upload_id.in_(upload_ids)).group_by(models.DataRow.sku, models.DataRow.product_name).all()
            
            if not results:
                return {"answer": "No data available in your uploads.", "evidence": []}
                
            context_lines = []
            for r in results:
                context_lines.append(f"Product {r.product_name or 'Unknown'} (SKU: {r.sku}) has total historical sales quantity of {r.quantity} units and total revenue of ${r.revenue}.")
                
            _context_cache[user_id] = context_lines
            
        context = "\n".join(context_lines)
        
        # Initialize ChatGroq LLM with fastest model
        llm = ChatGroq(
            temperature=0, 
            model="llama-3.1-8b-instant", 
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
        
        response = llm.invoke([HumanMessage(content=prompt)])
        
        return {"answer": response.content, "evidence": context_lines}
    except Exception as e:
        print(f"RAG Query Error: {e}")
        return {"answer": f"I'm currently unable to process your request due to an error: {str(e)}", "evidence": []}
