# backend/app/main.py (최종 수정 버전)
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
import os
import uvicorn
import logging

from .core.config import settings
from .core.database import engine, create_tables
from .api import markers, videos, analysis, dashboard
try:
    from .api import debug
    debug_available = True
except ImportError:
    debug_available = False

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# AI 모델 사전 로드 시도
def try_preload_ai_model():
    """AI 모델 사전 로드 시도 (여러 경로)"""
    ai_status = "not_available"
    
    try:
        # 방법 1: app 패키지 내부에서 로드
        from .ai_model.model_loader import preload_model
        preload_model()
        ai_status = "loaded_from_app"
        logger.info("✅ AI 모델을 app 패키지에서 사전 로드 완료")
    except ImportError:
        try:
            # 방법 2: backend 레벨에서 로드
            import sys
            backend_path = os.path.dirname(os.path.dirname(__file__))
            if backend_path not in sys.path:
                sys.path.insert(0, backend_path)
            
            from ai_model.model_loader import preload_model
            preload_model()
            ai_status = "loaded_from_backend"
            logger.info("✅ AI 모델을 backend 레벨에서 사전 로드 완료")
        except ImportError:
            ai_status = "not_found"
            logger.warning("⚠️  AI 모델 로더를 찾을 수 없습니다. AI 기능이 시뮬레이션 모드로 실행됩니다.")
        except Exception as e:
            ai_status = "load_error"
            logger.error(f"❌ AI 모델 로드 중 오류: {e}")
    except Exception as e:
        ai_status = "load_error"
        logger.error(f"❌ AI 모델 사전 로드 실패: {e}")
    
    return ai_status

# AI 모델 로드 시도
ai_load_status = try_preload_ai_model()

# 테이블 생성
try:
    create_tables()
    logger.info("✅ 데이터베이스 테이블 생성/확인 완료")
except Exception as e:
    logger.error(f"❌ 데이터베이스 테이블 생성 실패: {e}")

# FastAPI 앱 생성
app = FastAPI(
    title=settings.PROJECT_NAME,
    description=settings.DESCRIPTION + f" (AI 상태: {ai_load_status})",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc"
)

# CORS 미들웨어 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 업로드된 파일 정적 서빙
if not os.path.exists(settings.UPLOAD_FOLDER):
    os.makedirs(settings.UPLOAD_FOLDER, exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_FOLDER, "videos"), exist_ok=True)
    os.makedirs(os.path.join(settings.UPLOAD_FOLDER, "analysis_results"), exist_ok=True)

app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_FOLDER), name="uploads")

# API 라우터 등록
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(markers.router, prefix="/api/markers", tags=["Markers"])
app.include_router(videos.router, prefix="/api/videos", tags=["Videos"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])

# 디버그 라우터 (개발 환경에서만)
if debug_available:
    app.include_router(debug.router, prefix="/api/debug", tags=["Debug"])

# 루트 엔드포인트
@app.get("/")
async def root():
    return {
        "message": "🤖 도로 유지보수 관리 시스템 API",
        "version": settings.VERSION,
        "ai_status": ai_load_status,
        "docs": "/docs",
        "features": [
            "마커 관리",
            "비디오 업로드", 
            "AI 균열 검출",
            "분석 결과 시각화"
        ]
    }

# 헬스체크 엔드포인트
@app.get("/health")
async def health_check():
    # AI 모델 상태 확인
    model_status = "unknown"
    try:
        # 방법 1: app 내부
        from .ai_model.model_loader import get_model_loader
        model_info = get_model_loader().get_model_info()
        model_status = "ready" if model_info.get("loaded") else "not_loaded"
    except ImportError:
        try:
            # 방법 2: backend 레벨
            import sys
            backend_path = os.path.dirname(os.path.dirname(__file__))
            if backend_path not in sys.path:
                sys.path.insert(0, backend_path)
            from ai_model.model_loader import get_model_loader
            model_info = get_model_loader().get_model_info()
            model_status = "ready" if model_info.get("loaded") else "not_loaded"
        except:
            model_status = "not_available"
    except:
        model_status = "error"
    
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z",
        "ai_model": model_status,
        "ai_load_status": ai_load_status,
        "database": "connected",
        "upload_folder": os.path.exists(settings.UPLOAD_FOLDER)
    }

# 전역 예외 핸들러
@app.exception_handler(404)
async def not_found_handler(request, exc):
    return JSONResponse(
        status_code=404,
        content={"message": "요청된 리소스를 찾을 수 없습니다."}
    )

@app.exception_handler(500)
async def internal_error_handler(request, exc):
    logger.error(f"내부 서버 오류: {exc}")
    return JSONResponse(
        status_code=500,
        content={"message": "내부 서버 오류가 발생했습니다."}
    )

# 애플리케이션 시작 이벤트
@app.on_event("startup")
async def startup_event():
    logger.info("🚀 도로 유지보수 관리 시스템 시작")
    logger.info(f"📍 API 문서: http://localhost:8000/docs")
    logger.info(f"🤖 AI 상태: {ai_load_status}")
    logger.info(f"📁 업로드 폴더: {settings.UPLOAD_FOLDER}")

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )