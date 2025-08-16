from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session
from datetime import datetime
from app.db_mongo import messages_col
from app import models
from app.deps import get_db, get_current_user


router = APIRouter(prefix="/api", tags=["chat"])

class ChatIn(BaseModel):
    conversation_id: str
    message: str

@router.post("/chat")
async def chat(body: ChatIn, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    # 擁有權驗證（Postgres）
    conv = db.query(models.Conversation).filter_by(id=body.conversation_id, user_id=user.id).first()
    if not conv: raise HTTPException(status_code=404, detail="Conversation not found")

    # 寫入使用者訊息（Mongo）
    now = datetime.utcnow()
    await messages_col.insert_one({
        "conversation_id": str(conv.id),
        "role": "user",
        "content": body.message,
        "created_at": now
    })

    # TODO: 呼叫你的 LLM（或 RAG）→ reply
    reply_text = f"（示範回覆）你說：{body.message}"

    # 寫入系統回覆
    await messages_col.insert_one({
        "conversation_id": str(conv.id),
        "role": "assistant",
        "content": reply_text,
        "created_at": datetime.utcnow()
    })
    return {"reply": reply_text}

@router.get("/messages")
async def list_messages(conversation_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    conv = db.query(models.Conversation).filter_by(id=conversation_id, user_id=user.id).first()
    if not conv: raise HTTPException(status_code=404, detail="Conversation not found")
    cursor = messages_col.find({"conversation_id": str(conv.id)}).sort("created_at", 1)
    docs = await cursor.to_list(length=1000)
    return [{"role": d["role"], "content": d["content"], "created_at": d["created_at"]} for d in docs]
