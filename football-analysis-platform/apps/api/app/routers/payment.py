import os
import requests
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from supabase import create_client, Client
from datetime import datetime, timedelta

router = APIRouter()

# Supabase Setup
SUPABASE_URL = os.getenv("SUPABASE_URL", "https://nyfohwfdtvqikkfyxjwo.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im55Zm9od2ZkdHZxaWtrZnl4andvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQyMTQ2NCwiZXhwIjoyMDgxOTk3NDY0fQ.Ina87erXG778hKusO-pN8gPQmRx0Gev0OKTr_fN7aUA")
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

class PaymentRequest(BaseModel):
    user_id: str
    tx_hash: str
    network: str = "TRC20"

@router.post("/verify")
async def verify_payment(payload: PaymentRequest):
    # 1. Mock TronScan Verification
    # In production, use requests.get("https://apilist.tronscan.org/api/transaction-info?hash=...")
    print(f"Verifying hash: {payload.tx_hash}")
    
    is_valid = True # Mocking success
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid Transaction")

    # 2. Update DB
    new_expiry = (datetime.utcnow() + timedelta(days=30)).isoformat()
    
    try:
        # Log Transaction
        supabase.table("transactions").insert({
            "user_id": payload.user_id,
            "tx_hash": payload.tx_hash,
            "amount_usdt": 20.0,
            "status": "confirmed",
            "network": payload.network
        }).execute()

        # Update Profile
        supabase.table("profiles").update({
            "subscription_status": "premium",
            "subscription_expiry": new_expiry
        }).eq("id", payload.user_id).execute()
        
    except Exception as e:
        print(e)
        # Proceeding for demo purposes even if DB fails (usually return 500)
        
    return {"status": "success", "new_expiry": new_expiry}