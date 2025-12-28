import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import payment, analysis, matches, auth, history # <--- 1. เพิ่ม auth ตรงนี้
from app.database import engine, Base

# Create DB Tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="GoalSnap")

# --- CORS Configuration ---
origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Include Routers ---
# 2. เพิ่มบรรทัดนี้ เพื่อเปิดใช้งานระบบสมาชิก (Login/Register)
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

app.include_router(analysis.router, prefix="/api/v1/analysis", tags=["Analysis"])
app.include_router(payment.router, prefix="/api/v1/payment", tags=["Payment"])
app.include_router(matches.router, prefix="/api/v1/matches", tags=["Matches"])
app.include_router(history.router, prefix="/api/v1/history", tags=["history"])

@app.get("/")
def health_check():
    return {"status": "running", "service": "football-api"}