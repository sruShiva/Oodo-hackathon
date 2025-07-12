from pydantic_settings import BaseSettings
import os

class Settings(BaseSettings):
    database_path: str = "data/stackit.json"
    secret_key: str = "seckey_seckey"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    google_ai_api_key: str = "your-google-ai-key"
    
    class Config:
        env_file = ".env"

settings = Settings()
