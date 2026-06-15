from sqlalchemy import Column, Integer, String, Boolean, DateTime
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    full_name = Column(String, nullable=True)
    profile_picture = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Upload(Base):
    __tablename__ = "uploads"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    filename = Column(String)
    file_path = Column(String)
    status = Column(String, default="processed") # e.g. "uploaded", "cleaned", "error"
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class DataRow(Base):
    __tablename__ = "data_rows"
    
    id = Column(Integer, primary_key=True, index=True)
    upload_id = Column(Integer, index=True)
    date = Column(DateTime, index=True)
    sku = Column(String, index=True)
    product_name = Column(String, nullable=True)
    sales_quantity = Column(Integer)
    revenue = Column(Integer, nullable=True)

