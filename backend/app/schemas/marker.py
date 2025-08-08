# backend/app/schemas/marker.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional, List
from ..models.marker import MarkerStatus, MarkerPriority, IssueType


class MarkerBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    address: Optional[str] = None
    road_name: Optional[str] = None
    issue_type: IssueType = IssueType.CRACK
    priority: MarkerPriority = MarkerPriority.NORMAL
    assigned_to: Optional[str] = None


class MarkerCreate(MarkerBase):
    created_by: str


class MarkerUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    status: Optional[MarkerStatus] = None
    priority: Optional[MarkerPriority] = None
    assigned_to: Optional[str] = None


class MarkerResponse(MarkerBase):
    id: int
    status: MarkerStatus
    created_by: str
    created_at: datetime
    updated_at: Optional[datetime]
    video_count: int = 0
    analysis_count: int = 0

    class Config:
        from_attributes = True


# backend/app/schemas/video.py
from pydantic import BaseModel, Field
from datetime import datetime
from typing import Optional


class VideoBase(BaseModel):
    original_filename: str
    description: Optional[str] = None


class VideoCreate(VideoBase):
    filename: str
    file_path: str
    file_size: int
    marker_id: int
    uploaded_by: str
    duration: Optional[float] = None
    width: Optional[int] = None
    height: Optional[int] = None
    fps: Optional[float] = None


class VideoResponse(VideoBase):
    id: int
    filename: str
    file_size: int
    duration: Optional[float]
    width: Optional[int]
    height: Optional[int]
    fps: Optional[float]
    marker_id: int
    uploaded_by: str
    created_at: datetime
    has_analysis: bool = False

    class Config:
        from_attributes = True

