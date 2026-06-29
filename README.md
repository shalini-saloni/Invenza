# Invenza 

Invenza is an AI-powered inventory and sales analytics platform designed to help businesses manage their stock, visualize sales trends, and predict future demand using machine learning. It features a modern, interactive dashboard with an integrated RAG (Retrieval-Augmented Generation) chatbot for instant data insights.

## Features

- **Interactive Dashboard**: Visualize key performance indicators (KPIs) like total sales, revenue, and stock levels using beautiful, responsive Chart.js graphs.
- **Demand Forecasting**: Utilize ARIMA time-series forecasting to predict future sales trends and demand based on your historical data.
- **RAG Insights Chatbot**: Ask natural language questions about your inventory (e.g., "Which product has the highest sales?") and get instant, context-aware answers powered by Groq's lightning-fast Llama 3 API.
- **CSV Data Upload**: Easily upload, clean, and process your historical sales data.
- **Secure Authentication**: Full user registration and login flow using JWT-based authentication.

## Tech Stack

**Frontend**
- React 18 + TypeScript + Vite
- React Router DOM
- Chart.js & React-Chartjs-2
- Lucide React (Icons)
- Vercel (Deployment)

**Backend**
- Python 3 + FastAPI
- PostgreSQL (Neon Serverless DB) + SQLAlchemy ORM
- Pandas + Statsmodels (Data processing & ARIMA forecasting)
- LangChain + Groq API (RAG Chatbot)
- JWT (Authentication)
- Render (Deployment)

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.9+)
- PostgreSQL Database (e.g., Neon)
- Groq API Key

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use `venv\Scripts\activate`
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Configure environment variables. Create a `.env` file in the `backend` directory:
   ```env
   DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
   SECRET_KEY=your_secret_jwt_key
   ALGORITHM=HS256
   ACCESS_TOKEN_EXPIRE_MINUTES=1440
   GROQ_API_KEY=your_groq_api_key
   ```
5. Run the FastAPI server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure environment variables. Create a `.env` file in the `frontend` directory:
   ```env
   VITE_API_URL=http://localhost:8000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Sample Data Format
To test the upload feature, your CSV should follow this format:
```csv
Date,SKU,Product Name,Sales Quantity,Revenue,Stock Remaining,Category
2023-01-01,LAP-13,Laptop Pro 15,10,10000,50,Electronics
2023-01-02,MOU-01,Wireless Mouse,15,450,120,Electronics
```
