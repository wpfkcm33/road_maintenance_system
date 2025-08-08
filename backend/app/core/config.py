# backend/app/core/config.py
import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://admin:password@localhost:5432/road_maintenance")
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "your-secret-key-here-change-this-in-production")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://127.0.0.1:3000"]
    
    # File Upload
    UPLOAD_FOLDER: str = os.getenv("UPLOAD_FOLDER", "./uploads")
    MAX_UPLOAD_SIZE: int = int(os.getenv("MAX_UPLOAD_SIZE", 104857600))  # 100MB
    ALLOWED_VIDEO_EXTENSIONS: List[str] = [".mp4", ".avi", ".mov", ".mkv"]
    
    # AI Model
    AI_MODEL_PATH: str = os.getenv("AI_MODEL_PATH", "./ai_model/best.pt")
    
    # Naver Maps
    NAVER_MAP_CLIENT_ID: str = os.getenv("NAVER_MAP_CLIENT_ID", "")
    NAVER_MAP_CLIENT_SECRET: str = os.getenv("NAVER_MAP_CLIENT_SECRET", "")
    
    # Application
    PROJECT_NAME: str = "도로 유지보수 관리 시스템"
    VERSION: str = "1.0.0"
    DESCRIPTION: str = "YOLO 기반 AI 균열 검출을 활용한 도로 유지보수 관리 시스템"

    class Config:
        env_file = ".env"


settings = Settings()