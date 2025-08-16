from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from app.db_pg import SessionLocal
from app import models
from app.auth import hash_password, verify_password, create_access_token
from app.deps import get_db

router = APIRouter(prefix="/api", tags=["auth"])

class RegisterIn(BaseModel):
    username: str
    email: EmailStr
    password: str

class LoginIn(BaseModel):
    username: str
    password: str

@router.post("/register")
def register(body: RegisterIn, db: Session = Depends(get_db)):
    if db.query(models.User).filter((models.User.username==body.username)|(models.User.email==body.email)).first():
        raise HTTPException(status_code=400, detail="Username or email already exists")
    u = models.User(username=body.username, email=body.email, password_hash=hash_password(body.password))
    db.add(u); db.commit()
    return {"ok": True}

@router.post("/login")
def login(body: LoginIn, db: Session = Depends(get_db)):
    u = db.query(models.User).filter_by(username=body.username).first()
    if not u or not verify_password(body.password, u.password_hash):
        raise HTTPException(status_code=400, detail="Invalid credentials")
    token = create_access_token(u.username)
    return {"access_token": token, "username": u.username}
