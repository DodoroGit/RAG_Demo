from datetime import timedelta, datetime
from jose import jwt
from passlib.context import CryptContext
from .config import settings

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(p: str) -> str: return pwd_ctx.hash(p)
def verify_password(p: str, hashed: str) -> bool: return pwd_ctx.verify(p, hashed)

def create_access_token(sub: str):
    exp = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    return jwt.encode({"sub": sub, "exp": exp}, settings.JWT_SECRET, algorithm=settings.JWT_ALG)
