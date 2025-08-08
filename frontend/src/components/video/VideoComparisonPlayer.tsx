import React, { useState, useEffect } from 'react';
import { Analysis } from '../../types/analysis';
import LoadingSpinner from '../common/LoadingSpinner';

interface VideoComparisonData {
  analysis_id: number;
  status: string;
  progress: number;
  original_video: {
    id: number;
    filename: string;
    stream_url: string;
    duration: number;
    size: number;
  };
  result_video: {
    available: boolean;
    stream_url: string | null;
  };
  analysis_summary?: {
    total_cracks: number;
    total_area: number;
    confidence: number;
    severity: string | null;
  };
}

interface VideoComparisonPlayerProps {
  analysis: Analysis;
}

const VideoComparisonPlayer: React.FC<VideoComparisonPlayerProps> = ({ analysis }) => {
  const [comparisonData, setComparisonData] = useState<VideoComparisonData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'original' | 'result'>('original');
  const [videoError, setVideoError] = useState<string | null>(null);

  // URL 완성 함수
  const getVideoUrl = (path: string) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    
    const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    return path.startsWith('/') ? `${baseUrl}${path}` : `${baseUrl}/${path}`;
  };

  useEffect(() => {
    fetchComparisonData();
  }, [analysis.id]);

  // 수정된 fetchComparisonData 함수
  const fetchComparisonData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 완전한 백엔드 URL 사용
      const baseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
      const url = `${baseUrl}/api/analysis/${analysis.id}/comparison`;
      
      console.log(`🔍 비교 데이터 요청: ${url}`);
      
      const response = await fetch(url);
      
      console.log(`📡 응답 상태: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ API 오류 응답:`, errorText);
        
        if (response.status === 404) {
          throw new Error('분석 결과를 찾을 수 없습니다.');
        } else if (response.status === 500) {
          throw new Error('서버 내부 오류가 발생했습니다.');
        } else {
          throw new Error(`API 오류: ${response.status} ${response.statusText}`);
        }
      }
      
      const contentType = response.headers.get('content-type');
      console.log(`📋 응답 Content-Type: ${contentType}`);
      
      if (!contentType || !contentType.includes('application/json')) {
        const textResponse = await response.text();
        console.error(`❌ JSON이 아닌 응답:`, textResponse);
        throw new Error('서버에서 올바르지 않은 응답 형식을 반환했습니다.');
      }
      
      const data = await response.json();
      console.log(`✅ 비교 데이터 수신:`, data);
      
      setComparisonData(data);
      
    } catch (err) {
      console.error(`💥 비교 데이터 페치 오류:`, err);
      setError(err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <LoadingSpinner text="비디오 데이터 로딩 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-700">{error}</p>
        <button 
          onClick={fetchComparisonData}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (!comparisonData) {
    return null;
  }

  const isAnalysisComplete = comparisonData.status === 'completed';
  const isAnalysisInProgress = comparisonData.status === 'processing';

  return (
    <div className="space-y-6">
      {/* 분석 상태 표시 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-lg font-semibold text-gray-900">🤖 AI 분석 상태</h3>
          <div className="flex items-center space-x-2">
            {isAnalysisInProgress && (
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
            )}
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              isAnalysisComplete 
                ? 'bg-green-100 text-green-800' 
                : isAnalysisInProgress 
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {isAnalysisComplete ? '분석 완료' : isAnalysisInProgress ? '분석 중' : '대기 중'}
            </span>
          </div>
        </div>
        
        {isAnalysisInProgress && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>진행률</span>
              <span>{comparisonData.progress.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${comparisonData.progress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* 분석 요약 */}
        {comparisonData.analysis_summary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {comparisonData.analysis_summary.total_cracks}
              </div>
              <div className="text-sm text-gray-600">검출된 균열</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {comparisonData.analysis_summary.total_area.toFixed(1)}m²
              </div>
              <div className="text-sm text-gray-600">총 균열 면적</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(comparisonData.analysis_summary.confidence * 100).toFixed(0)}%
              </div>
              <div className="text-sm text-gray-600">평균 신뢰도</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                comparisonData.analysis_summary.severity === '위험' 
                  ? 'text-red-600' 
                  : comparisonData.analysis_summary.severity === '보통'
                  ? 'text-yellow-600'
                  : 'text-green-600'
              }`}>
                {comparisonData.analysis_summary.severity || 'N/A'}
              </div>
              <div className="text-sm text-gray-600">심각도</div>
            </div>
          </div>
        )}
      </div>

      {/* 비디오 비교 탭 */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* 탭 헤더 */}
        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            <button
              onClick={() => setActiveTab('original')}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'original'
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              📹 원본 영상
            </button>
            <button
              onClick={() => setActiveTab('result')}
              disabled={!comparisonData.result_video.available}
              className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === 'result'
                  ? 'text-purple-600 border-b-2 border-purple-600 bg-white'
                  : comparisonData.result_video.available
                  ? 'text-gray-500 hover:text-gray-700'
                  : 'text-gray-300 cursor-not-allowed'
              }`}
            >
              🤖 분석 결과 영상 
              {!comparisonData.result_video.available && ' (분석 중)'}
            </button>
          </div>
        </div>

        {/* 비디오 플레이어 */}
        <div className="p-6">
          {activeTab === 'original' && (
            <div className="space-y-4">
              <div className="bg-black rounded-lg overflow-hidden">
                <video
                  controls
                  className="w-full h-80"
                  key={`original-${comparisonData.original_video.id}`}
                  preload="metadata"
                  playsInline
                  crossOrigin="anonymous"
                  style={{ maxHeight: '400px' }}
                  onLoadStart={() => console.log('🎬 비디오 로드 시작')}
                  onLoadedMetadata={() => console.log('📋 비디오 메타데이터 로드됨')}
                  onCanPlay={() => console.log('✅ 비디오 재생 준비됨')}
                  onError={(e) => {
                    console.error('❌ 비디오 로드 오류:', e);
                    console.error('비디오 URL:', comparisonData.original_video.stream_url);
                  }}
                >
                  <source 
                    src={getVideoUrl(comparisonData.original_video.stream_url)} 
                    type="video/mp4"
                    onError={() => console.error('❌ MP4 소스 로드 실패')}
                  />
                  브라우저에서 비디오를 지원하지 않습니다.
                </video>
                
                {/* 디버깅 정보 */}
                <div className="mt-2 p-2 bg-gray-800 text-green-400 text-xs font-mono">
                  <div>🔗 Stream URL: {comparisonData.original_video.stream_url}</div>
                  <div>📁 Video ID: {comparisonData.original_video.id}</div>
                  <div>📏 Size: {(comparisonData.original_video.size / (1024 * 1024)).toFixed(1)} MB</div>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">📹 원본 영상 정보</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-blue-700">파일명:</span>
                    <span className="ml-2 text-blue-900">{comparisonData.original_video.filename}</span>
                  </div>
                  <div>
                    <span className="text-blue-700">파일 크기:</span>
                    <span className="ml-2 text-blue-900">
                      {(comparisonData.original_video.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">재생 시간:</span>
                    <span className="ml-2 text-blue-900">
                      {comparisonData.original_video.duration 
                        ? `${Math.floor(comparisonData.original_video.duration / 60)}:${Math.floor(comparisonData.original_video.duration % 60).toString().padStart(2, '0')}`
                        : '알 수 없음'
                      }
                    </span>
                  </div>
                  <div>
                    <span className="text-blue-700">상태:</span>
                    <span className="ml-2 text-green-600 font-medium">✅ 웹 호환</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'result' && (
            <div className="space-y-4">
              {comparisonData.result_video.available ? (
                <>
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      controls
                      className="w-full h-80"
                      key={`result-${comparisonData.analysis_id}`}
                      preload="metadata"
                      playsInline
                      style={{ maxHeight: '400px' }}
                    >
                      <source src={getVideoUrl(comparisonData.result_video.stream_url!)} type="video/mp4" />
                      브라우저에서 비디오를 지원하지 않습니다.
                    </video>
                  </div>
                  
                  <div className="bg-purple-50 rounded-lg p-4">
                    <h4 className="font-medium text-purple-900 mb-2">🤖 AI 분석 결과</h4>
                    <div className="space-y-2 text-sm text-purple-700">
                      <p>• 이 영상은 YOLO AI 모델로 분석되어 균열이 빨간색 박스로 표시됩니다.</p>
                      <p>• 각 박스에는 신뢰도가 함께 표시됩니다.</p>
                      <p>• 웹 브라우저에서 최적화된 H.264 형식으로 인코딩되었습니다.</p>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🔄</div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">분석 진행 중</h3>
                  <p className="text-gray-600 mb-4">
                    AI가 영상을 분석하고 웹 호환 형식으로 변환하고 있습니다.
                  </p>
                  {isAnalysisInProgress && (
                    <div className="max-w-xs mx-auto">
                      <div className="flex justify-between text-sm text-gray-600 mb-1">
                        <span>진행률</span>
                        <span>{comparisonData.progress.toFixed(1)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${comparisonData.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {comparisonData.progress < 80 ? '프레임 분석 중...' : '웹 호환 형식 변환 중...'}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoComparisonPlayer;