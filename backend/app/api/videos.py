# backend/app/api/videos.py (완전한 버전)
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, Request
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from typing import List
import os
import uuid
import aiofiles
from datetime import datetime
import mimetypes

from ..core.database import get_db
from ..core.config import settings
from ..models.marker import Marker
from ..models.video import Video
from ..schemas.video import VideoCreate, VideoResponse
from ..utils.file_utils import validate_video_file, get_video_metadata
from ..utils.video_utils import video_processor
import logging

logger = logging.getLogger(__name__)
router = APIRouter()

@router.post("/upload/{marker_id}", response_model=VideoResponse)
async def upload_video(
    marker_id: int,
    file: UploadFile = File(...),
    description: str = Form(None),
    uploaded_by: str = Form(...),
    db: Session = Depends(get_db)
):
    """비디오 파일 업로드 및 웹 호환성 변환"""
    
    # 마커 존재 확인
    marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if not marker:
        raise HTTPException(status_code=404, detail="마커를 찾을 수 없습니다.")
    
    # 파일 유효성 검사
    if not validate_video_file(file):
        raise HTTPException(status_code=400, detail="지원하지 않는 비디오 형식입니다.")
    
    # 파일 크기 체크
    if file.size and file.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail=f"파일 크기가 너무 큽니다. 최대 {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB")
    
    # 고유 파일명 생성
    file_extension = os.path.splitext(file.filename or "")[1]
    unique_id = uuid.uuid4()
    original_filename = f"original_{unique_id}{file_extension}"
    web_filename = f"web_{unique_id}.mp4"
    
    # 저장 경로 설정
    upload_dir = os.path.join(settings.UPLOAD_FOLDER, "videos")
    os.makedirs(upload_dir, exist_ok=True)
    
    original_path = os.path.join(upload_dir, original_filename)
    web_compatible_path = os.path.join(upload_dir, web_filename)
    
    try:
        # 1. 원본 파일 저장
        logger.info(f"📥 비디오 업로드 시작: {file.filename}")
        
        async with aiofiles.open(original_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        file_size = len(content)
        logger.info(f"✅ 원본 파일 저장 완료: {original_path}")
        
        # 2. 웹 호환성 검사
        compatibility = video_processor.validate_web_compatibility(original_path)
        logger.info(f"🔍 웹 호환성 검사: {compatibility}")
        
        # 3. 웹 호환 형식으로 변환 (필요한 경우)
        final_video_path = original_path
        web_converted = False
        
        if not compatibility.get("compatible", False):
            logger.info("🔄 웹 호환 형식으로 변환 시작...")
            
            conversion_result = video_processor.convert_to_web_compatible(
                original_path, 
                web_compatible_path
            )
            
            if conversion_result["success"]:
                final_video_path = web_compatible_path
                web_converted = True
                file_size = conversion_result["file_size"]
                logger.info("✅ 웹 호환 변환 완료")
            else:
                logger.warning(f"⚠️ 웹 호환 변환 실패, 원본 사용: {conversion_result.get('error')}")
        else:
            logger.info("✅ 이미 웹 호환 형식")
        
        # 4. 비디오 메타데이터 추출
        try:
            metadata = get_video_metadata(final_video_path)
        except Exception as e:
            logger.warning(f"메타데이터 추출 실패: {e}")
            metadata = {}
        
        # 5. 데이터베이스에 저장
        video_data = VideoCreate(
            filename=web_filename if web_converted else original_filename,
            original_filename=file.filename or "unknown.mp4",
            file_path=final_video_path,
            file_size=file_size,
            marker_id=marker_id,
            uploaded_by=uploaded_by,
            description=description,
            duration=metadata.get("duration"),
            width=metadata.get("width"),
            height=metadata.get("height"),
            fps=metadata.get("fps")
        )
        
        db_video = Video(**video_data.dict())
        db.add(db_video)
        db.commit()
        db.refresh(db_video)
        
        # 6. 불필요한 파일 정리
        if web_converted and os.path.exists(original_path):
            try:
                os.remove(original_path)
                logger.info("🗑️ 원본 파일 삭제 (웹 호환 버전 생성됨)")
            except:
                pass
        
        video_response = VideoResponse.from_orm(db_video)
        video_response.has_analysis = False
        
        logger.info(f"🎉 비디오 업로드 및 처리 완료: ID={db_video.id}")
        
        return video_response
        
    except Exception as e:
        # 실패 시 파일 정리
        for path in [original_path, web_compatible_path]:
            if os.path.exists(path):
                try:
                    os.remove(path)
                except:
                    pass
        
        if 'db_video' in locals():
            try:
                db.rollback()
            except:
                pass
        
        logger.error(f"💥 비디오 업로드 실패: {e}")
        raise HTTPException(status_code=500, detail=f"비디오 업로드 중 오류: {str(e)}")

# backend/app/api/videos.py 수정
@router.get("/{video_id}/stream")
async def stream_video(request: Request, video_id: int, db: Session = Depends(get_db)):
    """간단하고 안정적인 비디오 스트리밍"""
    
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="비디오를 찾을 수 없습니다.")
    
    if not os.path.exists(video.file_path):
        raise HTTPException(status_code=404, detail="비디오 파일을 찾을 수 없습니다.")
    
    # 간단한 파일 스트리밍 (Range Request 처리 단순화)
    def iter_file():
        with open(video.file_path, 'rb') as f:
            while chunk := f.read(8192):
                yield chunk
    
    return StreamingResponse(
        iter_file(), 
        media_type="video/mp4",
        headers={
            "Accept-Ranges": "bytes",
            "Cache-Control": "public, max-age=3600"
        }
    )

@router.get("/{video_id}/download")
async def download_video(video_id: int, db: Session = Depends(get_db)):
    """비디오 다운로드"""
    
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="비디오를 찾을 수 없습니다.")
    
    if not os.path.exists(video.file_path):
        raise HTTPException(status_code=404, detail="비디오 파일을 찾을 수 없습니다.")
    
    return FileResponse(
        video.file_path,
        media_type="video/mp4",
        filename=video.original_filename,
        headers={"Content-Disposition": f"attachment; filename={video.original_filename}"}
    )

@router.get("/{video_id}/info")
async def get_video_info(video_id: int, db: Session = Depends(get_db)):
    """비디오 상세 정보 및 웹 호환성 체크"""
    
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="비디오를 찾을 수 없습니다.")
    
    if not os.path.exists(video.file_path):
        raise HTTPException(status_code=404, detail="비디오 파일을 찾을 수 없습니다.")
    
    # 웹 호환성 검사
    compatibility = video_processor.validate_web_compatibility(video.file_path)
    
    # 파일 정보
    file_stats = os.stat(video.file_path)
    
    return {
        "video_id": video_id,
        "filename": video.original_filename,
        "file_size": video.file_size,
        "duration": video.duration,
        "resolution": f"{video.width}x{video.height}" if video.width and video.height else None,
        "fps": video.fps,
        "uploaded_by": video.uploaded_by,
        "created_at": video.created_at,
        "web_compatibility": compatibility,
        "file_exists": True,
        "last_modified": file_stats.st_mtime
    }

@router.get("/marker/{marker_id}", response_model=List[VideoResponse])
async def get_marker_videos(marker_id: int, db: Session = Depends(get_db)):
    """특정 마커의 비디오 목록 조회"""
    
    marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if not marker:
        raise HTTPException(status_code=404, detail="마커를 찾을 수 없습니다.")
    
    videos = db.query(Video).filter(Video.marker_id == marker_id).order_by(Video.created_at.desc()).all()
    
    result = []
    for video in videos:
        video_data = VideoResponse.from_orm(video)
        video_data.has_analysis = len(video.analyses) > 0
        result.append(video_data)
    
    return result


@router.get("/{video_id}", response_model=VideoResponse)
async def get_video(video_id: int, db: Session = Depends(get_db)):
    """특정 비디오 상세 조회"""
    
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="비디오를 찾을 수 없습니다.")
    
    video_data = VideoResponse.from_orm(video)
    video_data.has_analysis = len(video.analyses) > 0
    
    return video_data


@router.post("/upload/{marker_id}", response_model=VideoResponse)
async def upload_video(
    marker_id: int,
    file: UploadFile = File(...),
    description: str = Form(None),
    uploaded_by: str = Form(...),
    db: Session = Depends(get_db)
):
    """비디오 파일 업로드"""
    
    # 마커 존재 확인
    marker = db.query(Marker).filter(Marker.id == marker_id).first()
    if not marker:
        raise HTTPException(status_code=404, detail="마커를 찾을 수 없습니다.")
    
    # 파일 유효성 검사
    if not validate_video_file(file):
        raise HTTPException(status_code=400, detail="지원하지 않는 비디오 형식입니다.")
    
    # 파일 크기 체크
    if file.size and file.size > settings.MAX_UPLOAD_SIZE:
        raise HTTPException(status_code=400, detail=f"파일 크기가 너무 큽니다. 최대 {settings.MAX_UPLOAD_SIZE // (1024*1024)}MB")
    
    # 고유 파일명 생성
    file_extension = os.path.splitext(file.filename or "")[1]
    if not file_extension:
        file_extension = ".mp4"  # 기본 확장자
    
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    
    # 저장 경로 설정
    upload_dir = os.path.join(settings.UPLOAD_FOLDER, "videos")
    os.makedirs(upload_dir, exist_ok=True)
    file_path = os.path.join(upload_dir, unique_filename)
    
    # 파일 저장
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
        
        file_size = len(content)
        
    except Exception as e:
        # 파일 저장 실패 시 정리
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        raise HTTPException(status_code=500, detail=f"파일 저장 중 오류가 발생했습니다: {str(e)}")
    
    # 비디오 메타데이터 추출
    try:
        metadata = get_video_metadata(file_path)
    except Exception as e:
        print(f"메타데이터 추출 실패: {e}")
        metadata = {}
    
    # 데이터베이스에 저장
    try:
        video_data = VideoCreate(
            filename=unique_filename,
            original_filename=file.filename or "unknown.mp4",
            file_path=file_path,
            file_size=file_size,
            marker_id=marker_id,
            uploaded_by=uploaded_by,
            description=description,
            duration=metadata.get("duration"),
            width=metadata.get("width"),
            height=metadata.get("height"),
            fps=metadata.get("fps")
        )
        
        db_video = Video(**video_data.dict())
        db.add(db_video)
        db.commit()
        db.refresh(db_video)
        
        video_response = VideoResponse.from_orm(db_video)
        video_response.has_analysis = False
        
        return video_response
        
    except Exception as e:
        # DB 저장 실패 시 파일 정리
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except:
                pass
        db.rollback()
        raise HTTPException(status_code=500, detail=f"데이터베이스 저장 중 오류가 발생했습니다: {str(e)}")


@router.get("/{video_id}/stream")
async def stream_video(request: Request, video_id: int, db: Session = Depends(get_db)):
    """웹 호환 비디오 스트리밍 (Range Request 지원)"""
    
    try:
        video = db.query(Video).filter(Video.id == video_id).first()
        if not video:
            logger.error(f"비디오를 찾을 수 없음: {video_id}")
            raise HTTPException(status_code=404, detail="비디오를 찾을 수 없습니다.")
        
        if not os.path.exists(video.file_path):
            logger.error(f"비디오 파일이 존재하지 않음: {video.file_path}")
            raise HTTPException(status_code=404, detail="비디오 파일을 찾을 수 없습니다.")
        
        logger.info(f"비디오 스트리밍 요청: {video_id} -> {video.file_path}")
        
        # Range Request 지원 (비디오 스트리밍)
        file_size = os.path.getsize(video.file_path)
        range_header = request.headers.get('range')
        
        if range_header:
            # Range Request 처리
            try:
                range_match = range_header.replace('bytes=', '').split('-')
                start = int(range_match[0]) if range_match[0] else 0
                end = int(range_match[1]) if range_match[1] else file_size - 1
                end = min(end, file_size - 1)
                
                content_length = end - start + 1
                
                def iter_file_range():
                    with open(video.file_path, 'rb') as f:
                        f.seek(start)
                        remaining = content_length
                        while remaining:
                            chunk_size = min(8192, remaining)
                            chunk = f.read(chunk_size)
                            if not chunk:
                                break
                            remaining -= len(chunk)
                            yield chunk
                
                headers = {
                    'Content-Range': f'bytes {start}-{end}/{file_size}',
                    'Accept-Ranges': 'bytes',
                    'Content-Length': str(content_length),
                    'Content-Type': 'video/mp4',
                    'Cache-Control': 'public, max-age=3600'
                }
                
                logger.info(f"Range Request: {start}-{end}/{file_size}")
                
                return StreamingResponse(
                    iter_file_range(), 
                    status_code=206,
                    headers=headers
                )
            except Exception as e:
                logger.error(f"Range Request 처리 실패: {e}")
                # Range 요청 실패시 전체 파일로 fallback
        
        # 전체 파일 스트리밍
        def iter_file():
            try:
                with open(video.file_path, 'rb') as f:
                    while chunk := f.read(8192):
                        yield chunk
            except Exception as e:
                logger.error(f"파일 읽기 오류: {e}")
                raise
        
        headers = {
            'Content-Length': str(file_size),
            'Content-Type': 'video/mp4',
            'Accept-Ranges': 'bytes',
            'Cache-Control': 'public, max-age=3600'
        }
        
        logger.info(f"전체 파일 스트리밍: {file_size} bytes")
        
        return StreamingResponse(iter_file(), headers=headers)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"비디오 스트리밍 중 오류: {e}")
        raise HTTPException(status_code=500, detail=f"비디오 스트리밍 중 오류가 발생했습니다: {str(e)}")


@router.get("/{video_id}/download")
async def download_video(video_id: int, db: Session = Depends(get_db)):
    """비디오 다운로드"""
    
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="비디오를 찾을 수 없습니다.")
    
    if not os.path.exists(video.file_path):
        raise HTTPException(status_code=404, detail="비디오 파일을 찾을 수 없습니다.")
    
    return FileResponse(
        video.file_path,
        media_type="application/octet-stream",
        filename=video.original_filename,
        headers={"Content-Disposition": f"attachment; filename={video.original_filename}"}
    )


@router.get("/{video_id}/thumbnail")
async def get_video_thumbnail(video_id: int, db: Session = Depends(get_db)):
    """비디오 썸네일 생성/반환"""
    
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="비디오를 찾을 수 없습니다.")
    
    if not os.path.exists(video.file_path):
        raise HTTPException(status_code=404, detail="비디오 파일을 찾을 수 없습니다.")
    
    # 썸네일 생성 (간단한 구현)
    thumbnail_dir = os.path.join(settings.UPLOAD_FOLDER, "thumbnails")
    os.makedirs(thumbnail_dir, exist_ok=True)
    thumbnail_path = os.path.join(thumbnail_dir, f"{video.id}.jpg")
    
    # 썸네일이 이미 있으면 반환
    if os.path.exists(thumbnail_path):
        return FileResponse(thumbnail_path, media_type="image/jpeg")
    
    try:
        # OpenCV를 사용한 썸네일 생성
        import cv2
        cap = cv2.VideoCapture(video.file_path)
        
        if cap.isOpened():
            # 중간 프레임으로 이동
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            middle_frame = frame_count // 2
            cap.set(cv2.CAP_PROP_POS_FRAMES, middle_frame)
            
            ret, frame = cap.read()
            if ret:
                # 썸네일 크기 조정
                height, width = frame.shape[:2]
                if width > 320:
                    ratio = 320 / width
                    new_width = 320
                    new_height = int(height * ratio)
                    frame = cv2.resize(frame, (new_width, new_height))
                
                # 썸네일 저장
                cv2.imwrite(thumbnail_path, frame)
                cap.release()
                
                return FileResponse(thumbnail_path, media_type="image/jpeg")
            
        cap.release()
        
    except Exception as e:
        print(f"썸네일 생성 실패: {e}")
    
    # 썸네일 생성 실패 시 기본 이미지 반환 (선택사항)
    raise HTTPException(status_code=404, detail="썸네일을 생성할 수 없습니다.")


@router.patch("/{video_id}", response_model=VideoResponse)
async def update_video(
    video_id: int,
    description: str = Form(None),
    db: Session = Depends(get_db)
):
    """비디오 정보 수정"""
    
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="비디오를 찾을 수 없습니다.")
    
    if description is not None:
        video.description = description.strip() if description.strip() else None
    
    try:
        db.commit()
        db.refresh(video)
        
        video_response = VideoResponse.from_orm(video)
        video_response.has_analysis = len(video.analyses) > 0
        
        return video_response
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"비디오 정보 수정 중 오류가 발생했습니다: {str(e)}")


@router.delete("/{video_id}")
async def delete_video(video_id: int, db: Session = Depends(get_db)):
    """비디오 삭제"""
    
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="비디오를 찾을 수 없습니다.")
    
    file_path = video.file_path
    original_filename = video.original_filename
    
    try:
        # 데이터베이스에서 삭제
        db.delete(video)
        db.commit()
        
        # 파일 시스템에서 파일 삭제
        if os.path.exists(file_path):
            try:
                os.remove(file_path)
            except Exception as e:
                print(f"파일 삭제 실패 (무시됨): {e}")
        
        # 썸네일 삭제
        thumbnail_path = os.path.join(settings.UPLOAD_FOLDER, "thumbnails", f"{video_id}.jpg")
        if os.path.exists(thumbnail_path):
            try:
                os.remove(thumbnail_path)
            except Exception as e:
                print(f"썸네일 삭제 실패 (무시됨): {e}")
        
        return {
            "message": "비디오가 성공적으로 삭제되었습니다.",
            "deleted_video_id": video_id,
            "filename": original_filename
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=f"비디오 삭제 중 오류가 발생했습니다: {str(e)}")


@router.get("/")
async def list_all_videos(
    skip: int = 0,
    limit: int = 50,
    marker_id: int = None,
    uploaded_by: str = None,
    db: Session = Depends(get_db)
):
    """모든 비디오 목록 조회 (관리자용)"""
    
    query = db.query(Video)
    
    if marker_id:
        query = query.filter(Video.marker_id == marker_id)
    
    if uploaded_by:
        query = query.filter(Video.uploaded_by.ilike(f"%{uploaded_by}%"))
    
    videos = query.order_by(Video.created_at.desc()).offset(skip).limit(limit).all()
    
    result = []
    for video in videos:
        video_data = VideoResponse.from_orm(video)
        video_data.has_analysis = len(video.analyses) > 0
        result.append({
            "video": video_data,
            "marker_title": video.marker.title if video.marker else None
        })
    
    return {
        "total": query.count(),
        "videos": result
    }
@router.get("/{video_id}")
async def get_video_info(video_id: int, db: Session = Depends(get_db)):
    """비디오 정보 조회 (디버깅용)"""
    
    video = db.query(Video).filter(Video.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="비디오를 찾을 수 없습니다.")
    
    file_exists = os.path.exists(video.file_path) if video.file_path else False
    
    return {
        "id": video.id,
        "filename": video.filename,
        "original_filename": video.original_filename,
        "file_path": video.file_path,
        "file_exists": file_exists,
        "file_size": video.file_size,
        "duration": video.duration,
        "width": video.width,
        "height": video.height,
        "fps": video.fps,
        "marker_id": video.marker_id,
        "uploaded_by": video.uploaded_by,
        "created_at": video.created_at,
        "has_analysis": len(video.analyses) > 0,
        "stream_url": f"/api/videos/{video.id}/stream"
    }