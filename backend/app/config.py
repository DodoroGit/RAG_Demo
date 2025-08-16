from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Postgres
    PG_DSN: str
    # Mongo
    MONGO_DSN: str
    MONGO_DB: str
    # JWT
    JWT_SECRET: str
    JWT_ALG: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    # OpenAI
    OPENAI_API_KEY: str

    class Config:
        env_file = ".env"

settings = Settings()
