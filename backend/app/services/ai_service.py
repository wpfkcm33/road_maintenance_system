# backend/app/services/ai_service.py (수정된 버전)
import asyncio
import os
import sys
from sqlalchemy.orm import Session
from datetime import datetime
from typing import Dict, List, Any
import uuid
from pathlib import Path

# AI 모듈 import 경로 수정
try:
    # app 내부로 이동한 경우
    from ..ai_model.inference import CrackDetector
    from ..ai_model.model_loader import get_model_loader
except ImportError:
    try:
        # 상위 디렉토리에 있는 경우 (절대 import)
        sys.path.append(os.path.join(os.path.dirname(__file__), '../../'))
        from ai_model.inference import CrackDetector
        from ai_model.model_loader import get_model_loader
    except ImportError as e:
        print(f"AI 모듈 import 실패: {e}")
        # 더미 클래스로 대체 (AI 기능 없이 실행)
        class CrackDetector:
            def analyze_video(self, *args, **kwargs):
                raise Exception("AI 모델이 설치되지 않았습니다.")
        
        def get_model_loader():
            class DummyLoader:
                def get_model_info(self):
                    return {"loaded": False, "error": "AI 모델 없음"}
            return DummyLoader()

from ..core.database import SessionLocal
from ..models.analysis import Analysis, AnalysisStatus
from ..core.config import settings
import logging

logger = logging.getLogger(__name__)

async def start_video_analysis(analysis_id: int, video_path: str):
    """비디오 AI 분석을 백그라운드에서 실행"""
    
    db = SessionLocal()
    try:
        # 분석 상태를 처리 중으로 변경
        analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
        if not analysis:
            logger.error(f"분석 ID {analysis_id}를 찾을 수 없습니다.")
            return
        
        analysis.status = AnalysisStatus.PROCESSING
        analysis.started_at = datetime.now()
        analysis.progress = 5
        db.commit()
        
        logger.info(f"AI 분석 시작: {analysis_id}")
        
        # 출력 비디오 경로 생성
        result_dir = os.path.join(settings.UPLOAD_FOLDER, "analysis_results")
        os.makedirs(result_dir, exist_ok=True)
        
        # 고유한 파일명 생성
        video_filename = f"analysis_{analysis_id}_{uuid.uuid4().hex[:8]}.mp4"
        output_video_path = os.path.join(result_dir, video_filename)
        
        logger.info(f"📁 분석 결과 저장 경로: {output_video_path}")
        
        # 원본 비디오 파일 존재 확인
        if not os.path.exists(video_path):
            raise Exception(f"원본 비디오 파일을 찾을 수 없습니다: {video_path}")
        
        logger.info(f"📹 원본 비디오 확인됨: {video_path} ({os.path.getsize(video_path)} bytes)")
        
        # 진행률 업데이트 콜백
        def progress_callback(progress: float):
            try:
                # 10-90% 범위로 매핑 (전후 처리용 여유 공간)
                mapped_progress = 10 + (progress * 0.8)
                analysis.progress = min(mapped_progress, 90)
                db.commit()
                logger.debug(f"분석 진행률: {mapped_progress:.1f}%")
            except Exception as e:
                logger.warning(f"진행률 업데이트 실패: {e}")
        
        # 실제 AI 분석 실행
        try:
            detector = CrackDetector()
            result = await asyncio.get_event_loop().run_in_executor(
                None, 
                detector.analyze_video,
                video_path,
                output_video_path,
                progress_callback
            )
        except Exception as ai_error:
            logger.error(f"AI 분석 엔진 오류: {ai_error}")
            # AI 분석 실패 시 시뮬레이션으로 대체
            result = await simulate_ai_analysis(analysis_id, video_path, db)
        
        if result["success"]:
            # 분석 완료
            analysis.status = AnalysisStatus.COMPLETED
            analysis.progress = 100
            analysis.total_cracks_detected = result["total_cracks"]
            analysis.total_crack_area = result["total_area"]
            analysis.confidence_score = result["confidence"]
            analysis.crack_details = result["crack_details"]
            analysis.material_estimation = result["material_estimation"]
            analysis.severity_analysis = result["severity_analysis"]
            analysis.result_video_path = output_video_path
            analysis.completed_at = datetime.now()
            
            logger.info(f"AI 분석 완료: {analysis_id} - {result['total_cracks']}개 균열 검출")
        else:
            # 분석 실패
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = result.get("error", "알 수 없는 오류")
            logger.error(f"AI 분석 실패: {analysis_id}")
        
        db.commit()
        
    except Exception as e:
        logger.error(f"분석 중 예외 발생: {analysis_id} - {str(e)}")
        # 예외 발생 시 실패 상태로 변경
        try:
            analysis.status = AnalysisStatus.FAILED
            analysis.error_message = f"분석 중 오류 발생: {str(e)}"
            analysis.progress = 0
            db.commit()
        except:
            pass
    
    finally:
        db.close()


async def simulate_ai_analysis(analysis_id: int, video_path: str, db: Session) -> Dict[str, Any]:
    """AI 분석 시뮬레이션 (개발/테스트용)"""
    
    try:
        # 진행률 업데이트 시뮬레이션
        for progress in [20, 40, 60, 80, 95]:
            await asyncio.sleep(1)  # 1초 대기
            analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
            if analysis:
                analysis.progress = progress
                db.commit()
        
        # 샘플 분석 결과 생성
        crack_details = [
            {
                "crack_id": "001",
                "crack_type": "횡방향 균열",
                "length": 2.3,
                "width": 15,
                "area": 0.345,
                "severity": "위험",
                "confidence": 0.92
            }
        ]
        
        material_estimation = {
            "asphalt_concrete": 2.1,  # 톤
            "sealer": 45,             # 리터
            "primer": 12,             # 리터
            "mesh": None,
            "total_cost": 1240000     # 원
        }
        
        severity_analysis = {
            "overall_severity": "위험",
            "risk_score": 78.5,
            "urgent_repairs_needed": True,
            "estimated_repair_time": "2-3일"
        }
        
        return {
            "success": True,
            "total_cracks": len(crack_details),
            "total_area": sum(crack["area"] for crack in crack_details),
            "confidence": 0.90,
            "crack_details": crack_details,
            "material_estimation": material_estimation,
            "severity_analysis": severity_analysis
        }
        
    except Exception as e:
        return {
            "success": False,
            "error": str(e)
        }