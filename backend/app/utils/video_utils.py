# backend/app/utils/video_utils.py
import cv2
import subprocess
import os
import tempfile
from pathlib import Path
from typing import Dict, Optional, Tuple
import logging

logger = logging.getLogger(__name__)

class VideoProcessor:
    """웹 호환 비디오 처리 클래스"""
    
    def __init__(self):
        self.web_compatible_codec = 'libx264'
        self.web_compatible_format = 'mp4'
        self.target_fps = 30
        self.max_resolution = (1920, 1080)
    
    def convert_to_web_compatible(self, input_path: str, output_path: str) -> Dict[str, any]:
        """
        비디오를 웹 호환 형식으로 변환
        
        Args:
            input_path: 원본 비디오 경로
            output_path: 변환된 비디오 저장 경로
            
        Returns:
            변환 결과 딕셔너리
        """
        try:
            logger.info(f"🎬 비디오 웹 호환성 변환 시작: {input_path}")
            
            # FFmpeg를 사용한 웹 호환 변환
            cmd = [
                'ffmpeg',
                '-i', input_path,
                '-c:v', 'libx264',          # H.264 비디오 코덱
                '-c:a', 'aac',              # AAC 오디오 코덱
                '-preset', 'fast',          # 빠른 인코딩
                '-crf', '23',               # 품질 설정 (18-28, 낮을수록 고품질)
                '-movflags', '+faststart',  # 웹 스트리밍 최적화
                '-pix_fmt', 'yuv420p',      # 픽셀 형식 (웹 호환)
                '-r', str(self.target_fps), # 프레임율 설정
                '-y',                       # 덮어쓰기 허용
                output_path
            ]
            
            # 해상도 조정 (너무 큰 경우)
            width, height = self._get_video_resolution(input_path)
            if width > self.max_resolution[0] or height > self.max_resolution[1]:
                scale = min(self.max_resolution[0]/width, self.max_resolution[1]/height)
                new_width = int(width * scale)
                new_height = int(height * scale)
                # 2의 배수로 맞춤 (인코딩 호환성)
                new_width = new_width if new_width % 2 == 0 else new_width - 1
                new_height = new_height if new_height % 2 == 0 else new_height - 1
                
                cmd.insert(-2, '-vf')  # output_path 앞에 추가
                cmd.insert(-2, f'scale={new_width}:{new_height}')
            
            logger.info(f"🔧 FFmpeg 명령어: {' '.join(cmd)}")
            
            # FFmpeg 실행
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5분 타임아웃
            )
            
            if result.returncode == 0:
                # 변환 성공
                file_size = os.path.getsize(output_path)
                duration = self._get_video_duration(output_path)
                
                logger.info(f"✅ 웹 호환 변환 완료: {output_path}")
                
                return {
                    "success": True,
                    "output_path": output_path,
                    "file_size": file_size,
                    "duration": duration,
                    "codec": "H.264/AAC",
                    "web_compatible": True
                }
            else:
                logger.error(f"❌ FFmpeg 변환 실패: {result.stderr}")
                return {
                    "success": False,
                    "error": f"FFmpeg 오류: {result.stderr}"
                }
                
        except subprocess.TimeoutExpired:
            logger.error("⏰ 비디오 변환 타임아웃")
            return {"success": False, "error": "변환 시간 초과"}
        except Exception as e:
            logger.error(f"💥 비디오 변환 중 오류: {e}")
            return {"success": False, "error": str(e)}
    
    def process_analysis_video(
        self, 
        original_path: str, 
        analysis_frames: list, 
        output_path: str
    ) -> Dict[str, any]:
        """
        분석 결과가 포함된 웹 호환 비디오 생성
        
        Args:
            original_path: 원본 비디오 경로
            analysis_frames: 분석된 프레임 리스트
            output_path: 출력 비디오 경로
        """
        try:
            logger.info(f"🎯 분석 결과 비디오 생성 시작")
            
            # 원본 비디오 정보 추출
            cap = cv2.VideoCapture(original_path)
            fps = int(cap.get(cv2.CAP_PROP_FPS))
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            
            # 해상도 조정 (웹 호환성)
            if width > self.max_resolution[0] or height > self.max_resolution[1]:
                scale = min(self.max_resolution[0]/width, self.max_resolution[1]/height)
                width = int(width * scale)
                height = int(height * scale)
                # 2의 배수로 맞춤
                width = width if width % 2 == 0 else width - 1
                height = height if height % 2 == 0 else height - 1
            
            # 웹 호환 비디오 라이터 설정
            fourcc = cv2.VideoWriter_fourcc(*'mp4v')
            out = cv2.VideoWriter(output_path, fourcc, min(fps, self.target_fps), (width, height))
            
            # 프레임 처리 및 저장
            frame_count = 0
            for frame in analysis_frames:
                if frame is not None:
                    # 해상도 조정
                    if frame.shape[:2] != (height, width):
                        frame = cv2.resize(frame, (width, height))
                    
                    out.write(frame)
                    frame_count += 1
            
            cap.release()
            out.release()
            
            if frame_count > 0:
                # OpenCV로 생성된 파일을 웹 호환 형식으로 재변환
                temp_path = output_path + '_temp.mp4'
                os.rename(output_path, temp_path)
                
                conversion_result = self.convert_to_web_compatible(temp_path, output_path)
                
                # 임시 파일 삭제
                if os.path.exists(temp_path):
                    os.remove(temp_path)
                
                if conversion_result["success"]:
                    logger.info(f"✅ 분석 비디오 생성 완료: {frame_count} 프레임")
                    return {
                        "success": True,
                        "output_path": output_path,
                        "frame_count": frame_count,
                        "web_compatible": True
                    }
                else:
                    return conversion_result
            else:
                logger.error("❌ 분석 비디오에 프레임이 없음")
                return {"success": False, "error": "분석 프레임 없음"}
                
        except Exception as e:
            logger.error(f"💥 분석 비디오 생성 중 오류: {e}")
            return {"success": False, "error": str(e)}
    
    def _get_video_resolution(self, video_path: str) -> Tuple[int, int]:
        """비디오 해상도 추출"""
        try:
            cap = cv2.VideoCapture(video_path)
            width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
            height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
            cap.release()
            return width, height
        except:
            return 1280, 720  # 기본값
    
    def _get_video_duration(self, video_path: str) -> float:
        """비디오 길이 추출"""
        try:
            cap = cv2.VideoCapture(video_path)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            fps = cap.get(cv2.CAP_PROP_FPS)
            duration = frame_count / fps if fps > 0 else 0
            cap.release()
            return duration
        except:
            return 0.0
    
    def validate_web_compatibility(self, video_path: str) -> Dict[str, any]:
        """비디오 웹 호환성 검사"""
        try:
            # FFprobe를 사용한 상세 정보 추출
            cmd = [
                'ffprobe',
                '-v', 'quiet',
                '-print_format', 'json',
                '-show_format',
                '-show_streams',
                video_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            
            if result.returncode == 0:
                import json
                info = json.loads(result.stdout)
                
                video_stream = None
                audio_stream = None
                
                for stream in info.get('streams', []):
                    if stream.get('codec_type') == 'video':
                        video_stream = stream
                    elif stream.get('codec_type') == 'audio':
                        audio_stream = stream
                
                # 웹 호환성 체크
                is_compatible = True
                issues = []
                
                if video_stream:
                    video_codec = video_stream.get('codec_name', '')
                    if video_codec not in ['h264', 'x264']:
                        is_compatible = False
                        issues.append(f"비디오 코덱 비호환: {video_codec}")
                
                if audio_stream:
                    audio_codec = audio_stream.get('codec_name', '')
                    if audio_codec not in ['aac', 'mp3']:
                        is_compatible = False
                        issues.append(f"오디오 코덱 비호환: {audio_codec}")
                
                return {
                    "compatible": is_compatible,
                    "issues": issues,
                    "video_codec": video_stream.get('codec_name') if video_stream else None,
                    "audio_codec": audio_stream.get('codec_name') if audio_stream else None,
                    "format": info.get('format', {}).get('format_name', '')
                }
            else:
                return {"compatible": False, "error": "파일 분석 실패"}
                
        except Exception as e:
            return {"compatible": False, "error": str(e)}

# 전역 비디오 프로세서 인스턴스
video_processor = VideoProcessor()