# backend/app/api/analysis.py (완전한 구현)
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from fastapi.responses import FileResponse, StreamingResponse
from sqlalchemy.orm import Session
from typing import List
import os
import logging

from ..core.database import get_db
from ..models.video import Video
from ..models.analysis import Analysis, AnalysisStatus
from ..schemas.analysis import AnalysisCreate, AnalysisResponse, AnalysisUpdate
from ..services.ai_service import start_video_analysis

logger = logging.getLogger(__name__)
router = APIRouter()

@router.get("/video/{video_id}", response_model=List[AnalysisResponse])
async def get_video_analyses(video_id: int, db: Session = Depends(get_db)):
    """특정 비디오의 분석 결과 목록 조회"""
    
    # 비디오 존재 확인
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="비디오를 찾을 수 없습니다.")
    
    analyses = db.query(Analysis).filter(Analysis.video_id == video_id).order_by(Analysis.created_at.desc()).all()
    
    return [AnalysisResponse.from_orm(analysis) for analysis in analyses]

@router.get("/{analysis_id}", response_model=AnalysisResponse)
async def get_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """특정 분석 결과 상세 조회"""
    
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="분석 결과를 찾을 수 없습니다.")
    
    return AnalysisResponse.from_orm(analysis)

@router.post("/start/{video_id}", response_model=AnalysisResponse)
async def start_analysis(
    video_id: int, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    """비디오 AI 분석 시작"""
    
    # 비디오 존재 확인
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="비디오를 찾을 수 없습니다.")
    
    # 이미 진행 중인 분석이 있는지 확인
    existing_analysis = db.query(Analysis).filter(
        Analysis.video_id == video_id,
        Analysis.status.in_([AnalysisStatus.PENDING, AnalysisStatus.PROCESSING])
    ).first()
    
    if existing_analysis:
        logger.info(f"기존 진행 중인 분석 반환: {existing_analysis.id}")
        return AnalysisResponse.from_orm(existing_analysis)
    
    # 새 분석 생성
    analysis_data = AnalysisCreate(
        marker_id=video.marker_id,
        video_id=video_id
    )
    
    db_analysis = Analysis(**analysis_data.dict())
    db_analysis.status = AnalysisStatus.PENDING
    db.add(db_analysis)
    db.commit()
    db.refresh(db_analysis)
    
    logger.info(f"새 분석 시작: {db_analysis.id} for video {video_id}")
    
    # 백그라운드에서 AI 분석 시작
    background_tasks.add_task(start_video_analysis, db_analysis.id, video.file_path)
    
    return AnalysisResponse.from_orm(db_analysis)

@router.get("/{analysis_id}/result-video")
async def get_analysis_result_video(analysis_id: int, db: Session = Depends(get_db)):
    """분석 결과 비디오 스트리밍"""
    
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="분석 결과를 찾을 수 없습니다.")
    
    if analysis.status != AnalysisStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="분석이 완료되지 않았습니다.")
    
    if not analysis.result_video_path or not os.path.exists(analysis.result_video_path):
        raise HTTPException(status_code=404, detail="분석 결과 비디오 파일을 찾을 수 없습니다.")
    
    # Range Request 지원하는 스트리밍
    def iter_file():
        with open(analysis.result_video_path, 'rb') as f:
            while chunk := f.read(8192):
                yield chunk
    
    file_size = os.path.getsize(analysis.result_video_path)
    headers = {
        'Content-Length': str(file_size),
        'Content-Type': 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600'
    }
    
    return StreamingResponse(iter_file(), headers=headers)

@router.get("/{analysis_id}/comparison")
async def get_video_comparison_data(analysis_id: int, db: Session = Depends(get_db)):
    """원본 비디오와 분석 결과 비디오 비교 정보"""
    
    try:
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            logger.error(f"분석 결과를 찾을 수 없음: {analysis_id}")
            raise HTTPException(status_code=404, detail="분석 결과를 찾을 수 없습니다.")
        
        # 원본 비디오 정보
        original_video = analysis.video
        if not original_video:
            logger.error(f"원본 비디오를 찾을 수 없음: analysis_id={analysis_id}")
            raise HTTPException(status_code=404, detail="원본 비디오를 찾을 수 없습니다.")
        
        # 결과 비디오 경로 확인
        has_result_video = (
            analysis.status == AnalysisStatus.COMPLETED and 
            analysis.result_video_path and 
            os.path.exists(analysis.result_video_path)
        )
        
        logger.info(f"비교 데이터 생성 - analysis_id: {analysis_id}, status: {analysis.status}, has_result: {has_result_video}")
        
        response_data = {
            "analysis_id": analysis_id,
            "status": analysis.status.value if hasattr(analysis.status, 'value') else str(analysis.status),
            "progress": analysis.progress or 0,
            "original_video": {
                "id": original_video.id,
                "filename": original_video.original_filename,
                "stream_url": f"/api/videos/{original_video.id}/stream",
                "duration": original_video.duration,
                "size": original_video.file_size
            },
            "result_video": {
                "available": has_result_video,
                "stream_url": f"/api/analysis/{analysis_id}/result-video" if has_result_video else None
            }
        }
        
        # 분석 완료시 요약 정보 추가
        if analysis.status == AnalysisStatus.COMPLETED:
            response_data["analysis_summary"] = {
                "total_cracks": analysis.total_cracks_detected or 0,
                "total_area": analysis.total_crack_area or 0,
                "confidence": analysis.confidence_score or 0,
                "severity": None
            }
            
            # severity_analysis가 dict인 경우 처리
            if analysis.severity_analysis:
                if isinstance(analysis.severity_analysis, dict):
                    response_data["analysis_summary"]["severity"] = analysis.severity_analysis.get("overall_severity")
                else:
                    # JSON 문자열인 경우
                    try:
                        import json
                        severity_data = json.loads(analysis.severity_analysis)
                        response_data["analysis_summary"]["severity"] = severity_data.get("overall_severity")
                    except:
                        pass
        
        logger.info(f"응답 데이터: {response_data}")
        return response_data
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"비교 데이터 생성 중 오류: {e}")
        raise HTTPException(status_code=500, detail=f"비교 데이터 생성 중 오류가 발생했습니다: {str(e)}")

@router.patch("/{analysis_id}", response_model=AnalysisResponse)
async def update_analysis(
    analysis_id: int,
    analysis_update: AnalysisUpdate,
    db: Session = Depends(get_db)
):
    """분석 결과 업데이트 (AI 서비스에서 사용)"""
    
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="분석 결과를 찾을 수 없습니다.")
    
    # 업데이트할 필드만 수정
    update_data = analysis_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field in ["crack_details", "material_estimation", "severity_analysis"] and value is not None:
            # Pydantic 모델을 dict로 변환
            if hasattr(value, 'dict'):
                value = value.dict()
            elif isinstance(value, list) and value and hasattr(value[0], 'dict'):
                value = [item.dict() for item in value]
        setattr(analysis, field, value)
    
    # 완료 시간 설정
    if update_data.get("status") == AnalysisStatus.COMPLETED:
        from datetime import datetime
        analysis.completed_at = datetime.now()
    
    try:
        db.commit()
        db.refresh(analysis)
        return AnalysisResponse.from_orm(analysis)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"분석 결과 업데이트 중 오류가 발생했습니다: {str(e)}")

@router.delete("/{analysis_id}")
async def delete_analysis(analysis_id: int, db: Session = Depends(get_db)):
    """분석 결과 삭제"""
    
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise HTTPException(status_code=404, detail="분석 결과를 찾을 수 없습니다.")
    
    # 결과 파일도 삭제
    if analysis.result_video_path and os.path.exists(analysis.result_video_path):
        try:
            os.remove(analysis.result_video_path)
            logger.info(f"분석 결과 파일 삭제: {analysis.result_video_path}")
        except Exception as e:
            logger.warning(f"분석 결과 파일 삭제 실패: {e}")
    
    try:
        db.delete(analysis)
        db.commit()
        
        return {
            "message": "분석 결과가 성공적으로 삭제되었습니다.",
            "deleted_analysis_id": analysis_id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"분석 결과 삭제 중 오류가 발생했습니다: {str(e)}")

@router.get("/")
async def list_analyses(
    skip: int = 0,
    limit: int = 50,
    status: str = None,
    marker_id: int = None,
    db: Session = Depends(get_db)
):
    """모든 분석 결과 목록 조회 (관리자용)"""
    
    query = db.query(Analysis)
    
    if status:
        try:
            status_enum = AnalysisStatus(status)
            query = query.filter(Analysis.status == status_enum)
        except ValueError:
            raise HTTPException(status_code=400, detail=f"유효하지 않은 상태: {status}")
    
    if marker_id:
        query = query.filter(Analysis.marker_id == marker_id)
    
    analyses = query.order_by(Analysis.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for analysis in analyses:
        analysis_data = AnalysisResponse.from_orm(analysis)
        result.append({
            "analysis": analysis_data,
            "marker_title": analysis.marker.title if analysis.marker else None,
            "video_filename": analysis.video.original_filename if analysis.video else None
        })
    
    return {
        "total": query.count(),
        "analyses": result
    }