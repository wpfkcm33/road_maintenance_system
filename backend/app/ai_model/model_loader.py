# backend/ai_model/model_loader.py
import os
import torch
from ultralytics import YOLO
from typing import Optional
import logging

logger = logging.getLogger(__name__)

class ModelLoader:
    """YOLO 모델 로더 및 관리 클래스"""
    
    def __init__(self, model_path: str = "best.pt"):
        self.model_path = model_path
        self.model: Optional[YOLO] = None
        self.device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
    def load_model(self) -> bool:
        """YOLO 모델 로드"""
        try:
            # 모델 파일 존재 확인
            if not os.path.exists(self.model_path):
                logger.error(f"모델 파일을 찾을 수 없습니다: {self.model_path}")
                return False
            
            # YOLO 모델 로드
            self.model = YOLO(self.model_path)
            self.model.to(self.device)
            
            logger.info(f"YOLO 모델 로드 완료: {self.model_path} (Device: {self.device})")
            return True
            
        except Exception as e:
            logger.error(f"모델 로드 실패: {str(e)}")
            return False
    
    def is_loaded(self) -> bool:
        """모델 로드 상태 확인"""
        return self.model is not None
    
    def get_model(self) -> Optional[YOLO]:
        """로드된 모델 반환"""
        if not self.is_loaded():
            if not self.load_model():
                return None
        return self.model
    
    def get_model_info(self) -> dict:
        """모델 정보 반환"""
        if not self.is_loaded():
            return {"loaded": False, "error": "모델이 로드되지 않음"}
        
        return {
            "loaded": True,
            "model_path": self.model_path,
            "device": self.device,
            "model_type": "YOLOv8" if hasattr(self.model, 'model') else "YOLO"
        }

# 전역 모델 인스턴스
_model_loader = None

def get_model_loader() -> ModelLoader:
    """싱글톤 모델 로더 반환"""
    global _model_loader
    if _model_loader is None:
        # 모델 파일 경로 설정
        model_path = os.path.join(os.path.dirname(__file__), "best.pt")
        _model_loader = ModelLoader(model_path)
    return _model_loader

def preload_model():
    """애플리케이션 시작 시 모델 미리 로드"""
    loader = get_model_loader()
    if loader.load_model():
        logger.info("YOLO 모델 사전 로드 완료")
    else:
        logger.warning("YOLO 모델 사전 로드 실패")