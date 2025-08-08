# backend/app/core/database.py
from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from .config import settings

# SQLAlchemy 엔진 생성
engine = create_engine(
    settings.DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=False  # 개발 시 True로 변경하면 SQL 쿼리 로그 확인 가능
)

# 세션 팩토리 생성
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base 클래스 생성
Base = declarative_base()


# 의존성 주입을 위한 데이터베이스 세션 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 데이터베이스 테이블 생성 함수
def create_tables():
    Base.metadata.create_all(bind=engine)