from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, BigInteger, Float
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..core.database import Base


class Video(Base):
    __tablename__ = "videos"

    id = Column(Integer, primary_key=True, index=True)
    filename = Column(String(255), nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(String(500), nullable=False)
    file_size = Column(BigInteger)  # 바이트 단위
    
    # 비디오 메타데이터
    duration = Column(Float)  # 초 단위
    width = Column(Integer)
    height = Column(Integer)
    fps = Column(Float)
    
    # 마커와의 관계
    marker_id = Column(Integer, ForeignKey("markers.id"), nullable=False)
    
    # 업로드 정보
    uploaded_by = Column(String(100))
    description = Column(String(500))
    
    # 시간 정보
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 설정
    marker = relationship("Marker", back_populates="videos")
    analyses = relationship("Analysis", back_populates="video", cascade="all, delete-orphan")
