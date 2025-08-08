# backend/app/api/debug.py (새 파일)
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
import os
import logging

from ..core.database import get_db
from ..core.config import settings
from ..models.video import Video
from ..models.analysis import Analysis

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/videos")
async def debug_videos(db: Session = Depends(get_db)):
    """비디오 디버깅 정보"""
    
    videos = db.query(Video).all()
    
    result = []
    for video in videos:
        file_exists = os.path.exists(video.file_path) if video.file_path else False
        file_size_actual = os.path.getsize(video.file_path) if file_exists else 0
        
        result.append({
            "id": video.id,
            "filename": video.filename,
            "original_filename": video.original_filename,
            "file_path": video.file_path,
            "file_exists": file_exists,
            "file_size_db": video.file_size,
            "file_size_actual": file_size_actual,
            "marker_id": video.marker_id,
            "created_at": video.created_at.isoformat(),
            "stream_url": f"/api/videos/{video.id}/stream"
        })
    
    return {
        "total_videos": len(videos),
        "upload_folder": settings.UPLOAD_FOLDER,
        "upload_folder_exists": os.path.exists(settings.UPLOAD_FOLDER),
        "videos": result
    }

@router.get("/analyses")
async def debug_analyses(db: Session = Depends(get_db)):
    """분석 결과 디버깅 정보"""
    
    analyses = db.query(Analysis).all()
    
    result = []
    for analysis in analyses:
        result_file_exists = False
        if analysis.result_video_path:
            result_file_exists = os.path.exists(analysis.result_video_path)
        
        result.append({
            "id": analysis.id,
            "video_id": analysis.video_id,
            "marker_id": analysis.marker_id,
            "status": analysis.status,
            "progress": analysis.progress,
            "result_video_path": analysis.result_video_path,
            "result_file_exists": result_file_exists,
            "total_cracks": analysis.total_cracks_detected,
            "created_at": analysis.created_at.isoformat(),
            "completed_at": analysis.completed_at.isoformat() if analysis.completed_at else None
        })
    
    return {
        "total_analyses": len(analyses),
        "analyses": result
    }

@router.get("/system")
async def debug_system():
    """시스템 디버깅 정보"""
    
    return {
        "upload_folder": settings.UPLOAD_FOLDER,
        "upload_folder_exists": os.path.exists(settings.UPLOAD_FOLDER),
        "videos_folder": os.path.join(settings.UPLOAD_FOLDER, "videos"),
        "videos_folder_exists": os.path.exists(os.path.join(settings.UPLOAD_FOLDER, "videos")),
        "analysis_results_folder": os.path.join(settings.UPLOAD_FOLDER, "analysis_results"),
        "analysis_results_folder_exists": os.path.exists(os.path.join(settings.UPLOAD_FOLDER, "analysis_results")),
        "max_upload_size": settings.MAX_UPLOAD_SIZE,
        "cors_origins": settings.CORS_ORIGINS
    }