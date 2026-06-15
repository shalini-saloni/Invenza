import pandas as pd
from sqlalchemy.orm import Session
import models
import os

def process_and_clean_csv(file_path: str, upload_id: int, db: Session):
    try:
        # Load CSV
        df = pd.read_csv(file_path)
        
        # Standardize column names
        df.columns = df.columns.str.lower().str.strip().str.replace(' ', '_')
        
        # We expect columns like: date, sku, product_name, quantity, revenue
        # Mapping variations
        column_mapping = {
            'sales_date': 'date',
            'order_date': 'date',
            'item_code': 'sku',
            'product': 'product_name',
            'qty': 'sales_quantity',
            'quantity': 'sales_quantity',
            'units_sold': 'sales_quantity',
            'sales': 'revenue',
            'price': 'unit_price',
            'unit_price_usd': 'unit_price'
        }
        df = df.rename(columns=column_mapping)
        
        # If no SKU but we have product_name, generate SKU
        if 'sku' not in df.columns and 'product_name' in df.columns:
            df['sku'] = df['product_name'].str.upper().str[:3] + "-" + df['product_name'].str.len().astype(str)
            
        if 'product_name' not in df.columns:
            df['product_name'] = "Unknown"
            
        # Data Cleaning
        # 1. Drop rows without essential fields
        required_cols = [c for c in ['date', 'sku', 'sales_quantity'] if c in df.columns]
        df = df.dropna(subset=required_cols)
        
        # 2. Convert date column
        if 'date' in df.columns:
            df['date'] = pd.to_datetime(df['date'], errors='coerce')
            df = df.dropna(subset=['date'])
        else:
            raise ValueError("CSV must contain a 'date' column.")
            
        # 3. Ensure quantities are numeric
        if 'sales_quantity' in df.columns:
            df['sales_quantity'] = pd.to_numeric(df['sales_quantity'], errors='coerce').fillna(0).astype(int)
        else:
            raise ValueError("CSV must contain a 'sales_quantity' or 'units_sold' column.")
        
        # 4. Calculate revenue if price is available but revenue isn't
        if 'revenue' not in df.columns and 'unit_price' in df.columns:
            df['unit_price'] = pd.to_numeric(df['unit_price'], errors='coerce').fillna(0)
            df['revenue'] = df['sales_quantity'] * df['unit_price']
            
        if 'revenue' in df.columns:
            df['revenue'] = pd.to_numeric(df['revenue'], errors='coerce').fillna(0)
        else:
            df['revenue'] = 0
            
        # Bulk insert into DB
        records = df.to_dict(orient='records')
        data_rows = []
        for r in records:
            data_rows.append(models.DataRow(
                upload_id=upload_id,
                date=r['date'],
                sku=str(r['sku']),
                product_name=str(r['product_name']),
                sales_quantity=int(r['sales_quantity']),
                revenue=int(r['revenue'])
            ))
            
        # Chunked insert for safety
        chunk_size = 1000
        for i in range(0, len(data_rows), chunk_size):
            db.bulk_save_objects(data_rows[i:i+chunk_size])
            db.commit()
            
        return {"status": "success", "rows_processed": len(data_rows)}
        
    except Exception as e:
        print(f"Error processing CSV: {e}")
        return {"status": "error", "message": str(e)}
