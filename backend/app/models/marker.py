# backend/app/models/marker.py
from sqlalchemy import Column, Integer, String, Text, DateTime, Float, Enum
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class MarkerStatus(str, enum.Enum):
    PENDING = "pending"      # 처리 대기
    PROGRESS = "progress"    # 작업 중  
    COMPLETED = "completed"  # 완료


class MarkerPriority(str, enum.Enum):
    URGENT = "urgent"        # 긴급
    HIGH = "high"           # 높음
    NORMAL = "normal"       # 보통


class IssueType(str, enum.Enum):
    POTHOLE = "pothole"           # 방사 균열
    CRACK = "crack"               # 도로 균열
    SIGN_DAMAGE = "sign_damage"   # 표지판 손상


class Marker(Base):
    __tablename__ = "markers"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False, index=True)
    description = Column(Text)
    
    # 위치 정보
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    address = Column(String(500))
    road_name = Column(String(255))
    
    # 분류 정보
    issue_type = Column(Enum(IssueType), default=IssueType.CRACK)
    status = Column(Enum(MarkerStatus), default=MarkerStatus.PENDING)
    priority = Column(Enum(MarkerPriority), default=MarkerPriority.NORMAL)
    
    # 담당자 및 등록자
    assigned_to = Column(String(100))
    created_by = Column(String(100))
    
    # 시간 정보
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계 설정
    videos = relationship("Video", back_populates="marker", cascade="all, delete-orphan")
    analyses = relationship("Analysis", back_populates="marker", cascade="all, delete-orphan")