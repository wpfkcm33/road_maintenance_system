# 도로 유지보수 관리 시스템

YOLO 기반 AI 균열 검출을 활용한 도로 유지보수 관리 시스템

## 기술 스택
- Frontend: React + TypeScript + Tailwind CSS
- Backend: FastAPI + SQLAlchemy + PostgreSQL
- AI: YOLO (Ultralytics)
- Map: Naver Maps API

## 시작하기

### 1. 환경변수 설정
```bash
# Backend 환경변수
cp backend/.env.example backend/.env
# Frontend 환경변수  
cp frontend/.env.local.example frontend/.env.local
```

### 2. Docker로 실행
```bash
docker-compose up --build
```

### 3. 개별 실행
```bash
# Backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload

# Frontend
cd frontend
npm start
```

## API 문서
- Backend API: http://localhost:8000/docs
- Frontend: http://localhost:3000

## 디렉토리 구조
```
road-maintenance-system/
├── frontend/          # React 프론트엔드
├── backend/           # FastAPI 백엔드
├── database/          # DB 초기화 스크립트
├── ai_model/          # AI 모델 파일
└── uploads/           # 업로드된 파일들
```
