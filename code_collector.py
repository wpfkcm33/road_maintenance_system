#!/usr/bin/env python3
import os
import pathlib
from typing import List, Dict, Optional

def collect_project_code(
    project_dir: str,
    output_file: str = "collected_code.md",
    include_extensions: List[str] = None,
    exclude_dirs: List[str] = None,
    max_file_size: int = 100000  # 100KB
) -> None:
    """
    프로젝트 디렉토리의 코드를 수집하여 LLM 입력용 마크다운 파일로 생성
    
    Args:
        project_dir: 프로젝트 루트 디렉토리
        output_file: 출력 파일명
        include_extensions: 포함할 파일 확장자 (None이면 기본값 사용)
        exclude_dirs: 제외할 디렉토리 목록
        max_file_size: 최대 파일 크기 (바이트)
    """
    
    if include_extensions is None:
        include_extensions = [
            '.py', '.ts', '.tsx', '.js', '.jsx',  # 주요 소스코드
            '.sql', '.json', '.yml', '.yaml',     # 설정 및 데이터
            '.md', '.txt'                         # 문서
        ]
    
    if exclude_dirs is None:
        exclude_dirs = [
            'node_modules', 'venv', '__pycache__', '.git',
            'uploads', 'analysis_results', 'videos', 'public',
            '.next', 'dist', 'build'
        ]
    
    collected_files = []
    
    # 파일 수집
    for root, dirs, files in os.walk(project_dir):
        # 제외 디렉토리 필터링
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        
        for file in files:
            if any(file.endswith(ext) for ext in include_extensions):
                file_path = os.path.join(root, file)
                rel_path = os.path.relpath(file_path, project_dir)
                
                try:
                    # 파일 크기 확인
                    if os.path.getsize(file_path) > max_file_size:
                        print(f"파일 크기가 큼 (건너뜀): {rel_path}")
                        continue
                    
                    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                    
                    # 파일 정보 수집
                    collected_files.append({
                        'filename': file,
                        'path': rel_path,
                        'content': content,
                        'extension': pathlib.Path(file).suffix,
                        'size': len(content)
                    })
                    
                except Exception as e:
                    print(f"파일 읽기 오류: {rel_path} - {e}")
    
    # 우선순위별 정렬
    def get_priority(file_info):
        priority_map = {
            # 설정 파일들
            'main.py': 1, 'app.py': 1, 'App.tsx': 1, 'index.tsx': 1,
            'package.json': 2, 'requirements.txt': 2, 'docker-compose.yml': 2,
            # 모델 및 스키마
            '.py': 3 if 'models' in file_info['path'] else 5,
            '.ts': 3 if 'types' in file_info['path'] else 5,
            # API 및 서비스
            '.py': 4 if 'api' in file_info['path'] or 'services' in file_info['path'] else 5,
            '.ts': 4 if 'services' in file_info['path'] else 5,
            # 기타
            '.md': 10, '.txt': 10, '.json': 6, '.sql': 7
        }
        
        # 파일명 기준 우선순위
        if file_info['filename'] in priority_map:
            return priority_map[file_info['filename']]
        
        # 확장자 기준 우선순위
        ext = file_info['extension']
        if ext in priority_map:
            return priority_map[ext]
        
        return 5  # 기본 우선순위
    
    collected_files.sort(key=get_priority)
    
    # 마크다운 파일 생성
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("# 프로젝트 코드 수집 결과\n\n")
        f.write(f"**프로젝트 디렉토리:** {project_dir}\n")
        f.write(f"**수집된 파일 수:** {len(collected_files)}\n")
        f.write(f"**생성 일시:** {os.popen('date').read().strip()}\n\n")
        
        # 파일 목록 요약
        f.write("## 📋 파일 목록\n\n")
        for i, file_info in enumerate(collected_files, 1):
            f.write(f"{i}. **{file_info['filename']}** - `{file_info['path']}` ({file_info['size']:,} chars)\n")
        f.write("\n---\n\n")
        
        # 각 파일 상세 내용
        f.write("## 📁 파일 상세 내용\n\n")
        
        for i, file_info in enumerate(collected_files, 1):
            f.write(f"### {i}. {file_info['filename']}\n\n")
            f.write(f"- **경로:** `{file_info['path']}`\n")
            f.write(f"- **크기:** {file_info['size']:,} characters\n")
            f.write(f"- **타입:** {file_info['extension']}\n\n")
            
            # 언어별 코드 블록
            lang_map = {
                '.py': 'python', '.ts': 'typescript', '.tsx': 'tsx',
                '.js': 'javascript', '.jsx': 'jsx', '.sql': 'sql',
                '.json': 'json', '.yml': 'yaml', '.yaml': 'yaml',
                '.md': 'markdown', '.txt': 'text'
            }
            
            lang = lang_map.get(file_info['extension'], 'text')
            f.write(f"```{lang}\n{file_info['content']}\n```\n\n")
            f.write("---\n\n")
    
    print(f"✅ 코드 수집 완료!")
    print(f"📄 출력 파일: {output_file}")
    print(f"📊 총 {len(collected_files)}개 파일 수집")
    
    # 통계 정보
    ext_count = {}
    for file_info in collected_files:
        ext = file_info['extension']
        ext_count[ext] = ext_count.get(ext, 0) + 1
    
    print(f"📈 파일 타입별 통계:")
    for ext, count in sorted(ext_count.items()):
        print(f"  {ext}: {count}개")


def collect_road_maintenance_project(project_dir: str = "."):
    """도로 유지보수 프로젝트 전용 코드 수집"""
    
    # 프로젝트별 맞춤 설정
    include_extensions = [
        '.py', '.ts', '.tsx', '.js', '.jsx',
        '.sql', '.json', '.yml', '.yaml', '.md'
    ]
    
    exclude_dirs = [
        'node_modules', 'venv', '__pycache__', '.git',
        'uploads', 'analysis_results', 'videos', 'public',
        'logo192.png', 'logo512.png', 'favicon.ico'
    ]
    
    collect_project_code(
        project_dir=project_dir,
        output_file="road_maintenance_code.md",
        include_extensions=include_extensions,
        exclude_dirs=exclude_dirs,
        max_file_size=200000  # 200KB로 증가 (AI 모델 파일 고려)
    )


if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description='프로젝트 코드를 LLM 입력용으로 수집')
    parser.add_argument('--dir', '-d', default='.', help='프로젝트 디렉토리 경로')
    parser.add_argument('--output', '-o', default='collected_code.md', help='출력 파일명')
    parser.add_argument('--road-maintenance', action='store_true', 
                       help='도로 유지보수 프로젝트 전용 설정 사용')
    
    args = parser.parse_args()
    
    if args.road_maintenance:
        collect_road_maintenance_project(args.dir)
    else:
        collect_project_code(args.dir, args.output)