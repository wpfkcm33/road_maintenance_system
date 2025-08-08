# backend/app/ai_model/__init__.py
"""
도로 균열 검출 AI 모듈

YOLO 기반 균열 검출 및 분석 기능을 제공합니다.
"""

try:
    from .model_loader import ModelLoader, get_model_loader, preload_model
    from .inference import CrackDetector
    
    __all__ = [
        'ModelLoader',
        'get_model_loader', 
        'preload_model',
        'CrackDetector'
    ]
    
    # 모듈 로드 상태
    AI_MODULE_AVAILABLE = True
    
except ImportError as e:
    print(f"AI 모듈 의존성 누락: {e}")
    print("ultralytics, torch, opencv-python 패키지를 설치하세요.")
    
    # 더미 클래스 정의
    class ModelLoader:
        def __init__(self, *args, **kwargs):
            self.loaded = False
        
        def load_model(self):
            return False
        
        def get_model_info(self):
            return {"loaded": False, "error": "AI 패키지 미설치"}
    
    class CrackDetector:
        def analyze_video(self, *args, **kwargs):
            raise Exception("AI 모듈이 설치되지 않았습니다. requirements.txt의 AI 패키지들을 설치하세요.")
    
    def get_model_loader():
        return ModelLoader()
    
    def preload_model():
        print("AI 모듈이 설치되지 않아 모델을 로드할 수 없습니다.")
    
    __all__ = [
        'ModelLoader',
        'get_model_loader', 
        'preload_model',
        'CrackDetector'
    ]
    
    AI_MODULE_AVAILABLE = False

# 버전 정보
__version__ = "1.0.0"