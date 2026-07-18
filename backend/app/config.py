import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

class Settings(BaseSettings):
    PORT: int = 8000
    GEMINI_API_KEY: str = ""
    USE_MOCK_DATABASE: bool = True
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_CLIENT_EMAIL: str = ""
    FIREBASE_PRIVATE_KEY: str = ""

    class Config:
        env_file = ".env"
        extra = "ignore"

settings = Settings()
