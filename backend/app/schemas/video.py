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
