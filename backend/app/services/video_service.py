# backend/app/services/video_service.py
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional, Dict, Any
import os

from ..models.video import Video
from ..models.marker import Marker
from ..core.config import settings


class VideoService:
    """비디오 관련 비즈니스 로직을 처리하는 서비스 클래스"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_storage_usage(self) -> Dict[str, Any]:
        """저장소 사용량 조회"""
        
        total_size = self.db.query(func.sum(Video.file_size)).scalar() or 0
        total_videos = self.db.query(Video).count()
        
        # 평균 파일 크기
        avg_size = total_size / total_videos if total_videos > 0 else 0
        
        return {
            "total_videos": total_videos,
            "total_size_bytes": total_size,
            "total_size_mb": round(total_size / (1024 * 1024), 2),
            "total_size_gb": round(total_size / (1024 * 1024 * 1024), 2),
            "average_size_mb": round(avg_size / (1024 * 1024), 2)
        }
    
    def cleanup_orphaned_videos(self) -> int:
        """마커가 삭제된 고아 비디오들 정리"""
        
        orphaned_videos = self.db.query(Video).filter(
            ~Video.marker_id.in_(
                self.db.query(Marker.id)
            )
        ).all()
        
        deleted_count = 0
        for video in orphaned_videos:
            try:
                # 파일 시스템에서 파일 삭제
                if os.path.exists(video.file_path):
                    os.remove(video.file_path)
                
                # 데이터베이스에서 삭제
                self.db.delete(video)
                deleted_count += 1
                
            except Exception as e:
                print(f"고아 비디오 삭제 실패: {video.id} - {e}")
        
        try:
            self.db.commit()
        except Exception:
            self.db.rollback()
            deleted_count = 0
        
        return deleted_count
    
    def get_videos_without_analysis(self, limit: int = 10) -> List[Video]:
        """분석되지 않은 비디오들 조회"""
        from ..models.analysis import Analysis
        
        return self.db.query(Video).filter(
            ~Video.id.in_(
                self.db.query(Analysis.video_id)
            )
        ).order_by(Video.created_at.desc()).limit(limit).all()