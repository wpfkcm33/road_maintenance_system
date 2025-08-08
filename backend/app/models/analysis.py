from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
import enum
from ..core.database import Base


class AnalysisStatus(str, enum.Enum):
    PENDING = "pending"      # 분석 대기
    PROCESSING = "processing" # 분석 중
    COMPLETED = "completed"   # 분석 완료
    FAILED = "failed"        # 분석 실패


class Analysis(Base):
    __tablename__ = "analyses"

    id = Column(Integer, primary_key=True, index=True)
    
    # 관계 설정
    marker_id = Column(Integer, ForeignKey("markers.id"), nullable=False)
    video_id = Column(Integer, ForeignKey("videos.id"), nullable=False)
    
    # 분석 상태
    status = Column(String(20), default=AnalysisStatus.PENDING)
    progress = Column(Float, default=0.0)  # 0-100 진행률
    
    # AI 분석 결과
    total_cracks_detected = Column(Integer, default=0)
    total_crack_area = Column(Float, default=0.0)  # m² 단위
    confidence_score = Column(Float, default=0.0)  # 0-1 신뢰도
    
    # 상세 분석 데이터 (JSON)
    crack_details = Column(JSON)  # 개별 균열 정보들
    material_estimation = Column(JSON)  # 보수재 용량 산정
    severity_analysis = Column(JSON)  # 심각도 분석
    
    # 결과 파일
    result_video_path = Column(String(500))  # AI 분석 결과 비디오
    result_data_path = Column(String(500))   # 분석 데이터 파일
    
    # 오류 정보
    error_message = Column(Text)
    
    # 시간 정보
    started_at = Column(DateTime(timezone=True))
    completed_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # 관계 설정
    marker = relationship("Marker", back_populates="analyses")
    video = relationship("Video", back_populates="analyses")
