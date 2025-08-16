from fastapi import Depends, HTTPException, status
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from .db_pg import SessionLocal
from .config import settings
from . import models

def get_db():
    db = SessionLocal()
    try: yield db
    finally: db.close()

from fastapi.security import OAuth2PasswordBearer
oauth2 = OAuth2PasswordBearer(tokenUrl="/api/login")

def get_current_user(token: str = Depends(oauth2), db: Session = Depends(get_db)) -> models.User:
    cred_exc = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    try:
        sub = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALG]).get("sub")
    except JWTError:
        raise cred_exc
    user = db.query(models.User).filter_by(username=sub).first()
    if not user: raise cred_exc
    return user
