# backend/app/services/marker_service.py
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta

from ..models.marker import Marker, MarkerStatus, MarkerPriority, IssueType
from ..models.video import Video
from ..models.analysis import Analysis
from ..schemas.marker import MarkerCreate, MarkerUpdate


class MarkerService:
    """마커 관련 비즈니스 로직을 처리하는 서비스 클래스"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def get_marker_with_stats(self, marker_id: int) -> Optional[Dict[str, Any]]:
        """통계 정보가 포함된 마커 조회"""
        
        marker = self.db.query(Marker).filter(Marker.id == marker_id).first()
        if not marker:
            return None
        
        # 비디오 통계
        video_stats = self.db.query(
            func.count(Video.id).label('total_videos'),
            func.sum(Video.file_size).label('total_size'),
            func.avg(Video.duration).label('avg_duration')
        ).filter(Video.marker_id == marker_id).first()
        
        # 분석 통계
        analysis_stats = self.db.query(
            func.count(Analysis.id).label('total_analyses'),
            func.avg(Analysis.confidence_score).label('avg_confidence'),
            func.sum(Analysis.total_cracks_detected).label('total_cracks')
        ).filter(Analysis.marker_id == marker_id).first()
        
        return {
            "marker": marker,
            "video_stats": {
                "count": video_stats.total_videos or 0,
                "total_size_mb": round((video_stats.total_size or 0) / (1024 * 1024), 2),
                "avg_duration_seconds": round(video_stats.avg_duration or 0, 1)
            },
            "analysis_stats": {
                "count": analysis_stats.total_analyses or 0,
                "avg_confidence": round((analysis_stats.avg_confidence or 0) * 100, 1),
                "total_cracks": analysis_stats.total_cracks or 0
            }
        }
    
    def get_markers_by_status_priority(
        self, 
        status: Optional[MarkerStatus] = None,
        priority: Optional[MarkerPriority] = None,
        limit: int = 10
    ) -> List[Marker]:
        """상태와 우선순위로 마커 조회"""
        
        query = self.db.query(Marker)
        
        if status:
            query = query.filter(Marker.status == status)
        
        if priority:
            query = query.filter(Marker.priority == priority)
        
        return query.order_by(Marker.created_at.desc()).limit(limit).all()
    
    def get_urgent_markers(self, days: int = 7) -> List[Marker]:
        """지정된 기간 내 긴급 마커 조회"""
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        return self.db.query(Marker).filter(
            and_(
                Marker.priority == MarkerPriority.URGENT,
                Marker.status != MarkerStatus.COMPLETED,
                Marker.created_at >= cutoff_date
            )
        ).order_by(Marker.created_at.desc()).all()
    
    def get_completion_rate(self, days: int = 30) -> Dict[str, Any]:
        """완료율 통계"""
        
        cutoff_date = datetime.now() - timedelta(days=days)
        
        total_markers = self.db.query(Marker).filter(
            Marker.created_at >= cutoff_date
        ).count()
        
        completed_markers = self.db.query(Marker).filter(
            and_(
                Marker.created_at >= cutoff_date,
                Marker.status == MarkerStatus.COMPLETED
            )
        ).count()
        
        completion_rate = (completed_markers / total_markers * 100) if total_markers > 0 else 0
        
        return {
            "period_days": days,
            "total_markers": total_markers,
            "completed_markers": completed_markers,
            "completion_rate": round(completion_rate, 2)
        }
    
    def assign_marker_automatically(self, marker_id: int) -> Optional[str]:
        """마커 자동 배정 로직 (예시)"""
        
        marker = self.db.query(Marker).filter(Marker.id == marker_id).first()
        if not marker:
            return None
        
        # 간단한 자동 배정 로직 (실제로는 더 복잡한 로직 구현)
        if marker.priority == MarkerPriority.URGENT:
            assigned_to = "긴급대응팀"
        elif marker.issue_type == IssueType.POTHOLE:
            assigned_to = "도로보수팀"
        elif marker.issue_type == IssueType.SIGN_DAMAGE:
            assigned_to = "표지판관리팀"
        else:
            assigned_to = "일반관리팀"
        
        marker.assigned_to = assigned_to
        marker.updated_at = datetime.now()
        
        try:
            self.db.commit()
            return assigned_to
        except Exception:
            self.db.rollback()
            return None
    
    def get_markers_needing_attention(self) -> List[Marker]:
        """주의가 필요한 마커들 조회"""
        
        # 긴급 마커 중 3일 이상 처리되지 않은 것들
        three_days_ago = datetime.now() - timedelta(days=3)
        
        urgent_old = self.db.query(Marker).filter(
            and_(
                Marker.priority == MarkerPriority.URGENT,
                Marker.status == MarkerStatus.PENDING,
                Marker.created_at <= three_days_ago
            )
        ).all()
        
        # 담당자가 배정되지 않은 마커들
        unassigned = self.db.query(Marker).filter(
            and_(
                Marker.assigned_to.is_(None),
                Marker.status != MarkerStatus.COMPLETED
            )
        ).limit(10).all()
        
        return urgent_old + unassigned


# backend/app/services/video_service.py
from sqlalchemy.orm import Session
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
        
        return self.db.query(Video).filter(
            ~Video.id.in_(
                self.db.query(Analysis.video_id).filter(
                    Analysis.status.in_([AnalysisStatus.COMPLETED, AnalysisStatus.PROCESSING])
                )
            )
        ).order_by(Video.created_at.desc()).limit(limit).all()