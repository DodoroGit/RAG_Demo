from motor.motor_asyncio import AsyncIOMotorClient
from .config import settings

mongo_client = AsyncIOMotorClient(settings.MONGO_DSN)
mongo_db = mongo_client[settings.MONGO_DB]
messages_col = mongo_db["messages"]
