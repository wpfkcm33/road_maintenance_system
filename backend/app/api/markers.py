# backend/app/api/markers.py (완전한 CRUD 포함)
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, func
from typing import List, Optional
from datetime import datetime

from ..core.database import get_db
from ..models.marker import Marker, MarkerStatus, MarkerPriority, IssueType
from ..models.video import Video
from ..models.analysis import Analysis
from ..schemas.marker import MarkerCreate, MarkerUpdate, MarkerResponse

router = APIRouter()


@router.get("/", response_model=List[MarkerResponse])
async def get_markers(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    status: Optional[MarkerStatus] = None,
    priority: Optional[MarkerPriority] = None,
    issue_type: Optional[IssueType] = None,
    search: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """마커 목록 조회 (필터링 및 검색 지원)"""
    
    query = db.query(Marker)
    
    # 필터 적용
    if status:
        query = query.filter(Marker.status == status)
    if priority:
        query = query.filter(Marker.priority == priority)
    if issue_type:
        query = query.filter(Marker.issue_type == issue_type)
    if search:
        query = query.filter(
            or_(
                Marker.title.ilike(f"%{search}%"),
                Marker.road_name.ilike(f"%{search}%"),
                Marker.address.ilike(f"%{search}%"),
                Marker.assigned_to.ilike(f"%{search}%")
            )
        )
    
    # 정렬 및 페이징
    markers = query.order_by(Marker.created_at.desc()).offset(skip).limit(limit).all()
    
    # 마커별 비디오 및 분석 수 계산
    result = []
    for marker in markers:
        marker_data = MarkerResponse.from_orm(marker)
        marker_data.video_count = len(marker.videos)
        marker_data.analysis_count = len(marker.analyses)
        result.append(marker_data)
    
    return result


@router.get("/{marker_id}", response_model=MarkerResponse)
async def get_marker(marker_id: int, db: Session = Depends(get_db)):
    """특정 마커 상세 조회"""
    
    marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if not marker:
        raise HTTPException(status_code=404, detail="마커를 찾을 수 없습니다.")
    
    marker_data = MarkerResponse.from_orm(marker)
    marker_data.video_count = len(marker.videos)
    marker_data.analysis_count = len(marker.analyses)
    
    return marker_data


@router.post("/", response_model=MarkerResponse)
async def create_marker(marker: MarkerCreate, db: Session = Depends(get_db)):
    """새 마커 생성"""
    
    db_marker = Marker(**marker.dict())
    db.add(db_marker)
    db.commit()
    db.refresh(db_marker)
    
    marker_data = MarkerResponse.from_orm(db_marker)
    marker_data.video_count = 0
    marker_data.analysis_count = 0
    
    return marker_data


@router.patch("/{marker_id}", response_model=MarkerResponse)
async def update_marker(
    marker_id: int, 
    marker_update: MarkerUpdate, 
    db: Session = Depends(get_db)
):
    """마커 정보 수정"""
    
    # 마커 존재 확인
    marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if not marker:
        raise HTTPException(status_code=404, detail="마커를 찾을 수 없습니다.")
    
    # 업데이트할 필드만 수정
    update_data = marker_update.dict(exclude_unset=True)
    
    # 빈 문자열을 None으로 변환 (선택사항)
    for field, value in update_data.items():
        if isinstance(value, str) and value.strip() == "":
            update_data[field] = None
    
    # 필드 업데이트
    for field, value in update_data.items():
        if hasattr(marker, field):
            setattr(marker, field, value)
    
    # 수정 시간 업데이트
    marker.updated_at = datetime.now()
    
    try:
        db.commit()
        db.refresh(marker)
        
        # 응답 데이터 생성
        marker_data = MarkerResponse.from_orm(marker)
        marker_data.video_count = len(marker.videos)
        marker_data.analysis_count = len(marker.analyses)
        
        return marker_data
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"마커 수정 중 오류가 발생했습니다: {str(e)}")


@router.delete("/{marker_id}")
async def delete_marker(marker_id: int, db: Session = Depends(get_db)):
    """마커 삭제"""
    
    # 마커 존재 확인
    marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if not marker:
        raise HTTPException(status_code=404, detail="마커를 찾을 수 없습니다.")
    
    try:
        # 관련된 비디오 수 확인
        video_count = db.query(Video).filter(Video.marker_id == marker_id).count()
        
        # 관련된 분석 수 확인
        analysis_count = db.query(Analysis).filter(Analysis.marker_id == marker_id).count()
        
        # 마커 삭제 (CASCADE로 인해 관련 데이터도 자동 삭제됨)
        db.delete(marker)
        db.commit()
        
        return {
            "message": "마커가 성공적으로 삭제되었습니다.",
            "deleted_marker_id": marker_id,
            "deleted_videos": video_count,
            "deleted_analyses": analysis_count
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"마커 삭제 중 오류가 발생했습니다: {str(e)}")


@router.get("/{marker_id}/statistics")
async def get_marker_statistics(marker_id: int, db: Session = Depends(get_db)):
    """특정 마커의 통계 정보 조회"""
    
    # 마커 존재 확인
    marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if not marker:
        raise HTTPException(status_code=404, detail="마커를 찾을 수 없습니다.")
    
    # 비디오 통계
    video_stats = db.query(
        func.count(Video.id).label('total_videos'),
        func.sum(Video.file_size).label('total_size'),
        func.avg(Video.duration).label('avg_duration')
    ).filter(Video.marker_id == marker_id).first()
    
    # 분석 통계
    analysis_stats = db.query(
        func.count(Analysis.id).label('total_analyses'),
        func.avg(Analysis.confidence_score).label('avg_confidence'),
        func.sum(Analysis.total_cracks_detected).label('total_cracks'),
        func.sum(Analysis.total_crack_area).label('total_area')
    ).filter(Analysis.marker_id == marker_id).first()
    
    return {
        "marker_id": marker_id,
        "marker_title": marker.title,
        "video_statistics": {
            "total_videos": video_stats.total_videos or 0,
            "total_size_bytes": int(video_stats.total_size or 0),
            "average_duration_seconds": float(video_stats.avg_duration or 0)
        },
        "analysis_statistics": {
            "total_analyses": analysis_stats.total_analyses or 0,
            "average_confidence": float(analysis_stats.avg_confidence or 0),
            "total_cracks_detected": int(analysis_stats.total_cracks or 0),
            "total_crack_area": float(analysis_stats.total_area or 0)
        },
        "created_at": marker.created_at,
        "updated_at": marker.updated_at
    }


@router.patch("/{marker_id}/status")
async def update_marker_status(
    marker_id: int, 
    status: MarkerStatus,
    db: Session = Depends(get_db)
):
    """마커 상태만 빠르게 업데이트"""
    
    marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if not marker:
        raise HTTPException(status_code=404, detail="마커를 찾을 수 없습니다.")
    
    old_status = marker.status
    marker.status = status
    marker.updated_at = datetime.now()
    
    try:
        db.commit()
        db.refresh(marker)
        
        return {
            "message": "마커 상태가 업데이트되었습니다.",
            "marker_id": marker_id,
            "old_status": old_status,
            "new_status": status,
            "updated_at": marker.updated_at
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"상태 업데이트 중 오류가 발생했습니다: {str(e)}")


@router.patch("/{marker_id}/assign")
async def assign_marker(
    marker_id: int, 
    assigned_to: str,
    db: Session = Depends(get_db)
):
    """마커 담당자 배정"""
    
    marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if not marker:
        raise HTTPException(status_code=404, detail="마커를 찾을 수 없습니다.")
    
    old_assigned_to = marker.assigned_to
    marker.assigned_to = assigned_to.strip() if assigned_to.strip() else None
    marker.updated_at = datetime.now()
    
    try:
        db.commit()
        db.refresh(marker)
        
        return {
            "message": "담당자가 배정되었습니다.",
            "marker_id": marker_id,
            "old_assigned_to": old_assigned_to,
            "new_assigned_to": marker.assigned_to,
            "updated_at": marker.updated_at
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"담당자 배정 중 오류가 발생했습니다: {str(e)}")


@router.get("/search/nearby")
async def search_nearby_markers(
    lat: float = Query(..., description="위도"),
    lng: float = Query(..., description="경도"),
    radius_km: float = Query(1.0, description="검색 반경 (킬로미터)"),
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
):
    """특정 좌표 주변의 마커 검색"""
    
    # 간단한 거리 계산 (정확하지 않지만 데모용)
    # 실제로는 PostGIS나 다른 공간 데이터베이스를 사용하는 것이 좋음
    lat_range = radius_km / 111.0  # 대략적인 위도 1도 = 111km
    lng_range = radius_km / (111.0 * abs(lat))  # 경도는 위도에 따라 달라짐
    
    markers = db.query(Marker).filter(
        and_(
            Marker.latitude.between(lat - lat_range, lat + lat_range),
            Marker.longitude.between(lng - lng_range, lng + lng_range)
        )
    ).limit(limit).all()
    
    # 거리 계산 및 정렬 (실제 거리 계산)
    import math
    
    def calculate_distance(lat1, lng1, lat2, lng2):
        # Haversine 공식을 사용한 거리 계산
        R = 6371  # 지구 반지름 (km)
        
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lng = math.radians(lng2 - lng1)
        
        a = (math.sin(delta_lat/2) * math.sin(delta_lat/2) + 
             math.cos(lat1_rad) * math.cos(lat2_rad) * 
             math.sin(delta_lng/2) * math.sin(delta_lng/2))
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))
        
        return R * c
    
    # 거리 정보 포함한 결과 생성
    results = []
    for marker in markers:
        distance = calculate_distance(lat, lng, marker.latitude, marker.longitude)
        if distance <= radius_km:
            marker_data = MarkerResponse.from_orm(marker)
            marker_data.video_count = len(marker.videos)
            marker_data.analysis_count = len(marker.analyses)
            
            results.append({
                "marker": marker_data,
                "distance_km": round(distance, 3)
            })
    
    # 거리순으로 정렬
    results.sort(key=lambda x: x["distance_km"])
    
    return {
        "search_center": {"lat": lat, "lng": lng},
        "radius_km": radius_km,
        "total_found": len(results),
        "results": results
    }