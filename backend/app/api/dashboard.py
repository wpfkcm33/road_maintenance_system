# backend/app/api/dashboard.py
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime, timedelta
from typing import Dict, Any, List

from ..core.database import get_db
from ..models.marker import Marker, MarkerStatus, MarkerPriority
from ..models.video import Video
from ..models.analysis import Analysis

router = APIRouter()


@router.get("/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """대시보드 통계 데이터 조회"""
    
    # 전체 마커 수
    total_markers = db.query(Marker).count()
    
    # 긴급 이슈 수
    urgent_issues = db.query(Marker).filter(
        Marker.priority == MarkerPriority.URGENT,
        Marker.status != MarkerStatus.COMPLETED
    ).count()
    
    # 주간 완료 수 (지난 7일)
    week_ago = datetime.now() - timedelta(days=7)
    weekly_completed = db.query(Marker).filter(
        Marker.status == MarkerStatus.COMPLETED,
        Marker.updated_at >= week_ago
    ).count()
    
    # 대기 중인 마커 수
    pending_markers = db.query(Marker).filter(
        Marker.status == MarkerStatus.PENDING
    ).count()
    
    # 활성 마커 수 (예시로 진행 중인 마커)
    active_markers = db.query(Marker).filter(
        Marker.status == MarkerStatus.PROGRESS
    ).count()
    
    return {
        "total_markers": total_markers,
        "urgent_issues": urgent_issues,
        "weekly_completed": weekly_completed,
        "pending_markers": pending_markers,
        "active_markers": active_markers
    }


@router.get("/recent-activities")
async def get_recent_activities(limit: int = 10, db: Session = Depends(get_db)):
    """최근 활동 조회"""
    
    # 최근 마커들을 생성일 기준으로 조회
    recent_markers = db.query(Marker).order_by(
        Marker.created_at.desc()
    ).limit(limit).all()
    
    activities = []
    for marker in recent_markers:
        activities.append({
            "id": marker.id,
            "type": "marker_created",
            "message": f"{marker.created_by}가 {marker.road_name or '도로'}에서 {marker.issue_type}을 등록했습니다.",
            "user": marker.created_by,
            "location": marker.road_name or marker.address,
            "timestamp": marker.created_at,
            "marker_id": marker.id
        })
    
    return {"activities": activities}


@router.get("/region-stats")
async def get_region_stats(db: Session = Depends(get_db)):
    """지역별 통계"""
    
    # 간단한 지역별 집계 (실제로는 주소를 파싱해서 시/도별로 집계)
    regions = [
        {"name": "서울", "count": 234},
        {"name": "경기", "count": 189}, 
        {"name": "부산", "count": 156},
        {"name": "인천", "count": 98},
        {"name": "대구", "count": 87},
        {"name": "기타", "count": 123}
    ]
    
    return {"regions": regions}


