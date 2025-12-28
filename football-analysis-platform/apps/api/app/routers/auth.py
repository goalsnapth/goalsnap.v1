import os
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from pydantic import BaseModel, EmailStr
from passlib.context import CryptContext
from jose import JWTError, jwt
from app.database import get_db
from app.models import User
from dotenv import load_dotenv
import bcrypt

load_dotenv()

# --- Configuration (แก้เพิ่ม Default Value กันพัง) ---
# ถ้าหาใน .env ไม่เจอ ให้ใช้ค่า Default ด้านหลังแทน
SECRET_KEY = os.getenv("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7 # 7 Days

# --- Security Setup ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login") # แก้ path ให้ตรงกับ router จริง

router = APIRouter()

# --- Pydantic Schemas ---
class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str
    is_premium: bool

class UserOut(BaseModel):
    id: int
    username: str
    email: EmailStr
    is_premium: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Helper Functions ---
def verify_password(plain_password, hashed_password):
    return bcrypt.checkpw(
        plain_password.encode('utf-8'), 
        hashed_password.encode('utf-8')
    )

def get_password_hash(password):
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # แปลง user_id เป็น int ก่อน query (เพราะใน DB เป็น Integer)
    user = db.query(User).filter(User.id == int(user_id)).first()
    if user is None:
        raise credentials_exception
    return user

# --- Endpoints ---

@router.post("/register", response_model=UserOut)
def register(user: UserCreate, db: Session = Depends(get_db)):
    # 1. Check if user exists
    db_user = db.query(User).filter((User.email == user.email) | (User.username == user.username)).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email or Username already registered")
    
    # 2. Hash password & Create User
    hashed_password_val = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        username=user.username,
        # ⚠️ แก้ชื่อตัวแปรให้ตรงกับ models.py (password_hash -> hashed_password)
        hashed_password=hashed_password_val, 
        is_premium=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=Token)
def login(user_credentials: UserLogin, db: Session = Depends(get_db)):
    # 1. Fetch User (Login ด้วย Email)
    user = db.query(User).filter(User.email == user_credentials.email).first()
    if not user:
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    # 2. Verify Password (ใช้ hashed_password ให้ตรงกับ DB)
    if not verify_password(user_credentials.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    
    # 3. Generate JWT
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    
    # ใส่ user_id และ is_premium ลงใน Token
    access_token = create_access_token(
        data={"sub": str(user.id), "is_premium": user.is_premium},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "username": user.username,
        "is_premium": user.is_premium
    }

@router.get("/me", response_model=UserOut)
def read_users_me(current_user: User = Depends(get_current_user)):
    """Protected route: Returns the current user's profile."""
    return current_user