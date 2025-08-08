import os
import cv2
from fastapi import UploadFile
from typing import Dict, Optional
from ..core.config import settings


def validate_video_file(file: UploadFile) -> bool:
    """비디오 파일 유효성 검사"""
    
    if not file.filename:
        return False
    
    # 파일 확장자 체크
    file_extension = os.path.splitext(file.filename)[1].lower()
    if file_extension not in settings.ALLOWED_VIDEO_EXTENSIONS:
        return False
    
    # MIME 타입 체크 (선택적)
    if file.content_type and not file.content_type.startswith('video/'):
        return False
    
    return True


def get_video_metadata(file_path: str) -> Dict[str, Optional[float]]:
    """비디오 파일 메타데이터 추출"""
    
    metadata = {
        "duration": None,
        "width": None,
        "height": None,
        "fps": None
    }
    
    try:
        cap = cv2.VideoCapture(file_path)
        
        if cap.isOpened():
            # 프레임 수와 FPS로 지속시간 계산
            frame_count = cap.get(cv2.CAP_PROP_FRAME_COUNT)
            fps = cap.get(cv2.CAP_PROP_FPS)
            
            if fps > 0:
                metadata["duration"] = frame_count / fps
                metadata["fps"] = fps
            
            # 해상도 정보
            metadata["width"] = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            metadata["height"] = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        
        cap.release()
        
    except Exception as e:
        print(f"비디오 메타데이터 추출 오류: {e}")
    
    return metadata
