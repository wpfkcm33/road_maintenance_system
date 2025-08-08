# backend/ai_model/inference.py
import cv2
import numpy as np
import os
from typing import Dict, List, Tuple, Any, Optional, Callable
from .model_loader import get_model_loader
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

class CrackDetector:
    """균열 검출 및 분석 클래스"""
    
    def __init__(self):
        self.model_loader = get_model_loader()
        self.confidence_threshold = 0.5
        self.iou_threshold = 0.45
        
    def analyze_video(
        self, 
        video_path: str, 
        output_path: str, 
        progress_callback: Optional[Callable[[float], None]] = None
    ) -> Dict[str, Any]:
        """
        비디오 분석 및 웹 호환 결과 영상 생성
        
        Args:
            video_path: 입력 비디오 경로
            output_path: 출력 비디오 경로
            progress_callback: 진행률 콜백 함수
            
        Returns:
            분석 결과 딕셔너리
        """
        try:
            # 모델 로드 확인
            model = self.model_loader.get_model()
            if model is None:
                raise Exception("YOLO 모델을 로드할 수 없습니다.")
            
            # 비디오 캡처 초기화
            cap = cv2.VideoCapture(video_path)
            if not cap.isOpened():
                raise Exception(f"비디오 파일을 열 수 없습니다: {video_path}")
            
            # 비디오 정보 추출
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            
            # 웹 호환 해상도 조정
            max_width, max_height = 1920, 1080
            if width > max_width or height > max_height:
                scale = min(max_width/width, max_height/height)
                width = int(width * scale)
                height = int(height * scale)
                # 2의 배수로 맞춤
                width = width if width % 2 == 0 else width - 1
                height = height if height % 2 == 0 else height - 1
            
            # 임시 출력 파일 (OpenCV 용)
            temp_output = output_path.replace('.mp4', '_temp.mp4')
            
            # 비디오 라이터 초기화 (임시)
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(temp_output, fourcc, min(fps, 30), (width, height))
            
            # 분석 결과 저장용
            all_detections = []
            processed_frames = []
            crack_statistics = {
                'total_frames': total_frames,
                'frames_with_cracks': 0,
                'total_detections': 0,
                'confidence_scores': []
            }
            
            frame_count = 0
            
            logger.info(f"🎥 비디오 분석 시작: {total_frames} 프레임 ({width}x{height})")
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # 해상도 조정
                if frame.shape[:2] != (height, width):
                    frame = cv2.resize(frame, (width, height))
                
                # YOLO 추론 실행
                results = model(frame, conf=self.confidence_threshold, iou=self.iou_threshold)
                
                # 검출 결과 처리
                frame_detections = []
                annotated_frame = frame.copy()
                
                for result in results:
                    boxes = result.boxes
                    if boxes is not None:
                        for box in boxes:
                            # 바운딩 박스 좌표
                            x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                            confidence = box.conf[0].cpu().numpy()
                            class_id = int(box.cls[0].cpu().numpy())
                            
                            # 검출 정보 저장
                            detection = {
                                'frame': frame_count,
                                'bbox': [int(x1), int(y1), int(x2), int(y2)],
                                'confidence': float(confidence),
                                'class_id': class_id,
                                'area': (x2 - x1) * (y2 - y1)
                            }
                            frame_detections.append(detection)
                            
                            # 웹 친화적 바운딩 박스 그리기
                            color = (0, 0, 255)  # 빨간색
                            thickness = max(2, int(min(width, height) / 400))  # 해상도에 비례한 두께
                            
                            # 박스 그리기
                            cv2.rectangle(annotated_frame, (int(x1), int(y1)), (int(x2), int(y2)), color, thickness)
                            
                            # 배경이 있는 텍스트 (가독성 향상)
                            label = f"Crack: {confidence:.2f}"
                            font_scale = max(0.5, min(width, height) / 1600)  # 해상도에 비례한 폰트 크기
                            text_thickness = max(1, thickness // 2)
                            
                            # 텍스트 크기 계산
                            (text_width, text_height), baseline = cv2.getTextSize(
                                label, cv2.FONT_HERSHEY_SIMPLEX, font_scale, text_thickness
                            )
                            
                            # 텍스트 배경
                            cv2.rectangle(
                                annotated_frame, 
                                (int(x1), int(y1) - text_height - baseline - 5),
                                (int(x1) + text_width + 5, int(y1)),
                                color, -1
                            )
                            
                            # 텍스트
                            cv2.putText(
                                annotated_frame, label, 
                                (int(x1) + 2, int(y1) - baseline - 2), 
                                cv2.FONT_HERSHEY_SIMPLEX, font_scale, (255, 255, 255), text_thickness
                            )
                
                # 프레임 저장
                out.write(annotated_frame)
                processed_frames.append(annotated_frame)
                
                # 통계 업데이트
                if frame_detections:
                    crack_statistics['frames_with_cracks'] += 1
                    crack_statistics['total_detections'] += len(frame_detections)
                    crack_statistics['confidence_scores'].extend([d['confidence'] for d in frame_detections])
                    all_detections.extend(frame_detections)
                
                frame_count += 1
                
                # 진행률 콜백 호출
                if progress_callback and frame_count % 10 == 0:
                    progress = (frame_count / total_frames) * 80  # 80%까지 (변환용 20% 남김)
                    progress_callback(progress)
            
            # 리소스 해제
            cap.release()
            out.release()
            
            # 웹 호환 형식으로 변환
            logger.info("🔄 웹 호환 형식으로 변환 중...")
            if progress_callback:
                progress_callback(85)
            
            # FFmpeg를 사용한 웹 호환 변환
            import subprocess
            
            ffmpeg_cmd = [
                'ffmpeg',
                '-i', temp_output,
                '-c:v', 'libx264',
                '-preset', 'fast',
                '-crf', '23',
                '-movflags', '+faststart',
                '-pix_fmt', 'yuv420p',
                '-y',
                output_path
            ]
            
            result = subprocess.run(ffmpeg_cmd, capture_output=True, text=True)
            
            # 임시 파일 삭제
            if os.path.exists(temp_output):
                os.remove(temp_output)
            
            if result.returncode != 0:
                logger.warning(f"FFmpeg 변환 실패, 원본 사용: {result.stderr}")
                # 원본을 최종 결과로 복사
                import shutil
                shutil.move(temp_output, output_path)
            
            if progress_callback:
                progress_callback(100)
            
            # 최종 분석 결과 생성
            analysis_result = self._generate_analysis_result(crack_statistics, all_detections)
            
            logger.info(f"✅ 비디오 분석 완료: {frame_count} 프레임 처리, {analysis_result['total_cracks']}개 균열 검출")
            
            return analysis_result
            
        except Exception as e:
            logger.error(f"💥 비디오 분석 중 오류: {str(e)}")
            raise
    
    def _generate_analysis_result(self, statistics: Dict, detections: List[Dict]) -> Dict[str, Any]:
        """분석 결과 생성"""
        
        total_frames = statistics['total_frames']
        frames_with_cracks = statistics['frames_with_cracks']
        total_detections = statistics['total_detections']
        confidence_scores = statistics['confidence_scores']
        
        # 기본 통계
        crack_ratio = (frames_with_cracks / total_frames) * 100 if total_frames > 0 else 0
        avg_confidence = np.mean(confidence_scores) if confidence_scores else 0
        
        # 균열 세부 정보 생성
        crack_details = []
        if detections:
            # 프레임별로 그룹화하여 균열 정보 생성
            frame_groups = {}
            for detection in detections:
                frame = detection['frame']
                if frame not in frame_groups:
                    frame_groups[frame] = []
                frame_groups[frame].append(detection)
            
            # 주요 균열들 선별 (신뢰도 높은 순)
            sorted_detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)
            
            for i, detection in enumerate(sorted_detections[:10]):  # 상위 10개만
                area_pixels = detection['area']
                # 픽셀을 실제 면적으로 변환 (가정: 1픽셀 = 1mm²)
                area_mm2 = area_pixels
                
                crack_detail = {
                    "crack_id": f"crack_{i+1:03d}",
                    "crack_type": "도로 균열",  # YOLO 클래스에 따라 분류 가능
                    "length": float(np.sqrt(area_mm2)),  # 근사값
                    "width": 2.0,  # 기본값
                    "area": float(area_mm2 / 1000000),  # m² 변환
                    "severity": self._determine_severity(detection['confidence'], area_mm2),
                    "confidence": float(detection['confidence']),
                    "frame": detection['frame'],
                    "bbox": detection['bbox']
                }
                crack_details.append(crack_detail)
        
        # 보수재 용량 산정
        total_crack_area = sum([detail['area'] for detail in crack_details])
        material_estimation = self._estimate_materials(total_crack_area)
        
        # 심각도 분석
        severity_analysis = self._analyze_severity(crack_ratio, avg_confidence, total_crack_area)
        
        return {
            "success": True,
            "total_cracks": total_detections,
            "total_area": total_crack_area,
            "confidence": avg_confidence,
            "crack_ratio": crack_ratio,
            "frames_analyzed": total_frames,
            "frames_with_cracks": frames_with_cracks,
            "crack_details": crack_details,
            "material_estimation": material_estimation,
            "severity_analysis": severity_analysis
        }
    
    def _determine_severity(self, confidence: float, area: float) -> str:
        """균열 심각도 판정"""
        if confidence > 0.8 and area > 10000:  # 높은 신뢰도 + 큰 면적
            return "위험"
        elif confidence > 0.6 and area > 5000:
            return "보통"
        else:
            return "경미"
    
    def _estimate_materials(self, total_area: float) -> Dict[str, Any]:
        """보수재 용량 산정"""
        if total_area == 0:
            return {
                "asphalt_concrete": 0,
                "sealer": 0,
                "primer": 0,
                "mesh": None,
                "total_cost": 0
            }
        
        # 단위당 소요량 (예시값)
        asphalt_per_m2 = 0.1  # 톤/m²
        sealer_per_m2 = 2.0   # 리터/m²
        primer_per_m2 = 0.5   # 리터/m²
        
        # 단위당 비용 (원)
        asphalt_cost = 150000  # 원/톤
        sealer_cost = 5000     # 원/리터
        primer_cost = 8000     # 원/리터
        
        asphalt_amount = total_area * asphalt_per_m2
        sealer_amount = total_area * sealer_per_m2
        primer_amount = total_area * primer_per_m2
        
        total_cost = (asphalt_amount * asphalt_cost + 
                     sealer_amount * sealer_cost + 
                     primer_amount * primer_cost)
        
        return {
            "asphalt_concrete": round(asphalt_amount, 2),
            "sealer": round(sealer_amount, 1),
            "primer": round(primer_amount, 1),
            "mesh": round(total_area, 2) if total_area > 1.0 else None,
            "total_cost": int(total_cost)
        }
    
    def _analyze_severity(self, crack_ratio: float, avg_confidence: float, total_area: float) -> Dict[str, Any]:
        """전체 심각도 분석"""
        
        # 위험도 점수 계산 (0-100)
        ratio_score = min(crack_ratio * 2, 50)  # 최대 50점
        confidence_score = avg_confidence * 30   # 최대 30점
        area_score = min(total_area * 10, 20)    # 최대 20점
        
        risk_score = ratio_score + confidence_score + area_score
        
        # 전체 심각도 판정
        if risk_score >= 70:
            overall_severity = "위험"
            urgent_repairs = True
            repair_time = "즉시 (1일 이내)"
        elif risk_score >= 40:
            overall_severity = "보통"
            urgent_repairs = False
            repair_time = "1주일 이내"
        else:
            overall_severity = "경미"
            urgent_repairs = False
            repair_time = "1개월 이내"
        
        return {
            "overall_severity": overall_severity,
            "risk_score": round(risk_score, 1),
            "urgent_repairs_needed": urgent_repairs,
            "estimated_repair_time": repair_time,
            "crack_coverage": f"{crack_ratio:.1f}%"
        }