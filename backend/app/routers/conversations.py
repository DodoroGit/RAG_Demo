from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.deps import get_db, get_current_user
from app import models

router = APIRouter(prefix="/api/conversations", tags=["conversations"])

@router.post("")
def create_conv(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    conv = models.Conversation(user_id=user.id)
    db.add(conv); db.commit(); db.refresh(conv)
    return {"id": str(conv.id), "title": conv.title}

@router.get("")
def list_conv(db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    convs = db.query(models.Conversation).filter_by(user_id=user.id).order_by(models.Conversation.created_at.desc()).all()
    return [{"id": str(c.id), "title": c.title, "created_at": c.created_at} for c in convs]
