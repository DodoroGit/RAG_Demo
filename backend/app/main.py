from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import auth, conversations, chat
from app.db_pg import Base, engine

Base.metadata.create_all(bind=engine)  # 初期用，之後改 Alembic

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(conversations.router)
app.include_router(chat.router)
