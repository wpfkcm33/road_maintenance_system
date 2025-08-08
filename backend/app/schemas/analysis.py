from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, Dict, Any, List
from ..models.analysis import AnalysisStatus


class CrackDetail(BaseModel):
    crack_id: str
    crack_type: str  # "횡방향", "종방향", "망상" 등
    length: float    # 미터
    width: float     # 밀리미터
    area: float      # 제곱미터
    severity: str    # "위험", "보통", "경미"
    confidence: float # 0-1


class MaterialEstimation(BaseModel):
    asphalt_concrete: float  # 톤
    sealer: float           # 리터
    primer: float           # 리터
    mesh: Optional[float] = None  # 제곱미터
    total_cost: float       # 원


class SeverityAnalysis(BaseModel):
    overall_severity: str   # "위험", "보통", "경미"
    risk_score: float      # 0-100
    urgent_repairs_needed: bool
    estimated_repair_time: str  # "1일", "3일" 등


class AnalysisBase(BaseModel):
    marker_id: int
    video_id: int


class AnalysisCreate(AnalysisBase):
    pass


class AnalysisUpdate(BaseModel):
    status: Optional[AnalysisStatus] = None
    progress: Optional[float] = Field(None, ge=0, le=100)
    total_cracks_detected: Optional[int] = None
    total_crack_area: Optional[float] = None
    confidence_score: Optional[float] = Field(None, ge=0, le=1)
    crack_details: Optional[List[CrackDetail]] = None
    material_estimation: Optional[MaterialEstimation] = None
    severity_analysis: Optional[SeverityAnalysis] = None
    result_video_path: Optional[str] = None
    result_data_path: Optional[str] = None
    error_message: Optional[str] = None


class AnalysisResponse(AnalysisBase):
    id: int
    status: AnalysisStatus
    progress: float
    total_cracks_detected: int
    total_crack_area: float
    confidence_score: float
    crack_details: Optional[List[Dict[str, Any]]] = None
    material_estimation: Optional[Dict[str, Any]] = None
    severity_analysis: Optional[Dict[str, Any]] = None
    result_video_path: Optional[str] = None
    error_message: Optional[str] = None
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime

    class Config:
        from_attributes = True
