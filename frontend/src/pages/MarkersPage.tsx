import React, { useState, useEffect } from 'react';
import { useMarkers } from '../hooks/useMarkers';
import { useVideos } from '../hooks/useVideo';
import { useAnalyses } from '../hooks/useAIAnalysis';
import { Marker, MarkerStatus, MarkerPriority, IssueType } from '../types/marker';
import { Video } from '../types/video';
import { Analysis } from '../types/analysis';
import LoadingSpinner from '../components/common/LoadingSpinner';
import Modal from '../components/common/Modal';
import MarkerList from '../components/markers/MarkerList';
import MarkerDetail from '../components/markers/MarkerDetail';
import VideoComparisonPlayer from '../components/video/VideoComparisonPlayer';
import AIAnalysisResult from '../components/video/AIAnalysisResult';
import { MARKER_STATUS_LABELS, MARKER_PRIORITY_LABELS, ISSUE_TYPE_LABELS } from '../utils/constants';
import { formatDate, formatFileSize } from '../utils/helpers';
import toast from 'react-hot-toast';

const MarkersPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<MarkerStatus | ''>('');
  const [priorityFilter, setPriorityFilter] = useState<MarkerPriority | ''>('');
  const [issueTypeFilter, setIssueTypeFilter] = useState<IssueType | ''>('');
  
  // 모달 상태
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);

  // 페이지네이션
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize] = useState(10);

  // 필터링된 마커들 조회
  const { 
    markers, 
    loading, 
    error, 
    refetch,
    updateMarker,
    deleteMarker 
  } = useMarkers({
    skip: currentPage * pageSize,
    limit: pageSize,
    search: searchQuery || undefined,
    status: statusFilter || undefined,
    priority: priorityFilter || undefined,
    issue_type: issueTypeFilter || undefined
  });

  // 선택된 마커의 비디오들
  const {
    videos,
    loading: videosLoading
  } = useVideos(selectedMarker?.id || null);

  // 선택된 비디오의 분석들
  const {
    analyses,
    loading: analysesLoading,
    startAnalysis
  } = useAnalyses(selectedVideo?.id || null);

  // 마커 클릭 핸들러
  const handleMarkerClick = (marker: Marker) => {
    setSelectedMarker(marker);
    setShowDetailModal(true);
  };

  // 마커 수정 핸들러
  const handleMarkerEdit = async (markerId: number, updates: any) => {
    try {
      const updatedMarker = await updateMarker(markerId, updates);
      if (updatedMarker) {
        toast.success('마커 정보가 수정되었습니다.');
        if (selectedMarker?.id === markerId) {
          setSelectedMarker(updatedMarker);
        }
      }
    } catch (error) {
      console.error('마커 수정 오류:', error);
      toast.error('마커 수정 중 오류가 발생했습니다.');
    }
  };

  // 마커 삭제 핸들러
  const handleMarkerDelete = async (markerId: number) => {
    if (!window.confirm('이 마커를 삭제하시겠습니까?')) return;
    
    try {
      const success = await deleteMarker(markerId);
      if (success) {
        toast.success('마커가 삭제되었습니다.');
        setShowDetailModal(false);
        setSelectedMarker(null);
      }
    } catch (error) {
      console.error('마커 삭제 오류:', error);
      toast.error('마커 삭제 중 오류가 발생했습니다.');
    }
  };

  // 비디오 클릭 핸들러 (분석 포함)
  const handleVideoClick = (video: Video) => {
    setSelectedVideo(video);
    setShowVideoModal(true);
  };

  // AI 분석 시작 핸들러
  const handleStartAnalysis = async (videoId: number) => {
    try {
      const newAnalysis = await startAnalysis();
      if (newAnalysis) {
        toast.success('AI 분석이 시작되었습니다. 진행 상황을 확인하세요.');
        // 분석 모달 열기
        setSelectedAnalysis(newAnalysis);
        setShowAnalysisModal(true);
      }
    } catch (error) {
      console.error('분석 시작 오류:', error);
      toast.error('AI 분석 시작 중 오류가 발생했습니다.');
    }
  };

  // 분석 결과 클릭 핸들러
  const handleAnalysisClick = (analysis: Analysis) => {
    setSelectedAnalysis(analysis);
    setShowAnalysisModal(true);
  };

  // 검색 초기화
  const handleSearchReset = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
    setIssueTypeFilter('');
    setCurrentPage(0);
  };

  // 페이지 변경 핸들러
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  useEffect(() => {
    // 필터가 변경되면 첫 페이지로 이동
    setCurrentPage(0);
  }, [searchQuery, statusFilter, priorityFilter, issueTypeFilter]);

  if (loading && markers.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="마커 데이터를 불러오는 중..." />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">🤖 AI 분석 마커 관리</h1>
            <p className="text-gray-600">도로 균열을 AI로 분석하고 유지보수 작업을 관리합니다</p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => refetch()}
              disabled={loading}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>새로고침</span>
            </button>
          </div>
        </div>
      </div>

      {/* 검색 및 필터 */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">검색 및 필터</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
          {/* 검색 */}
          <div className="lg:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">검색</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="마커 제목, 도로명, 담당자명..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>
          
          {/* 상태 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as MarkerStatus | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">전체</option>
              {Object.entries(MARKER_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          {/* 우선순위 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as MarkerPriority | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">전체</option>
              {Object.entries(MARKER_PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          
          {/* 이슈 유형 필터 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">이슈 유형</label>
            <select
              value={issueTypeFilter}
              onChange={(e) => setIssueTypeFilter(e.target.value as IssueType | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="">전체</option>
              {Object.entries(ISSUE_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div className="text-sm text-gray-600">
            {loading ? '검색 중...' : `총 ${markers.length}개의 마커`}
          </div>
          <button
            onClick={handleSearchReset}
            className="text-sm text-primary-600 hover:text-primary-700"
          >
            필터 초기화
          </button>
        </div>
      </div>

      {/* 마커 목록 */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">마커 목록</h2>
        </div>
        
        {error ? (
          <div className="p-6 text-center text-red-600">
            <p className="mb-4">마커 데이터를 불러오는 중 오류가 발생했습니다.</p>
            <p className="text-sm mb-4">{error}</p>
            <button
              onClick={() => refetch()}
              className="bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg transition-colors"
            >
              다시 시도
            </button>
          </div>
        ) : (
          <div className="p-6">
            <MarkerList 
              markers={markers}
              onMarkerClick={handleMarkerClick}
              loading={loading}
            />
            
            {/* 페이지네이션 */}
            {markers.length > 0 && (
              <div className="flex justify-center items-center mt-6 space-x-2">
                <button
                  onClick={() => handlePageChange(Math.max(0, currentPage - 1))}
                  disabled={currentPage === 0}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  이전
                </button>
                
                <span className="px-4 py-2 text-sm text-gray-600">
                  페이지 {currentPage + 1}
                </span>
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={markers.length < pageSize}
                  className="px-3 py-2 border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  다음
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 마커 상세 모달 */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedMarker(null);
        }}
        title={selectedMarker ? `${selectedMarker.title}` : '마커 상세 정보'}
        size="xl"
      >
        {selectedMarker && (
          <div className="space-y-6">
            {/* 기본 정보 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <MarkerDetail
                  marker={selectedMarker}
                  onEdit={(updates) => handleMarkerEdit(selectedMarker.id, updates)}
                  onDelete={() => handleMarkerDelete(selectedMarker.id)}
                />
              </div>
              
              {/* 상세 통계 */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">📊 상세 통계</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-blue-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-blue-600">{selectedMarker.video_count}</div>
                    <div className="text-sm text-blue-800">업로드된 비디오</div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-4 text-center">
                    <div className="text-2xl font-bold text-green-600">{selectedMarker.analysis_count}</div>
                    <div className="text-sm text-green-800">AI 분석 완료</div>
                  </div>
                </div>
              </div>
            </div>

            {/* 비디오 및 분석 목록 */}
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">🎥 업로드된 비디오 및 AI 분석</h3>
                <span className="text-sm text-gray-500">{videos.length}개</span>
              </div>
              
              {videosLoading ? (
                <div className="text-center py-8">
                  <LoadingSpinner text="비디오 목록 로딩 중..." />
                </div>
              ) : videos.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">🎥</div>
                  <p>업로드된 비디오가 없습니다</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-2xl">🎥</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 truncate">
                              {video.original_filename}
                            </h4>
                            <div className="text-sm text-gray-500 space-y-1">
                              <div>크기: {formatFileSize(video.file_size)} | 업로드: {video.uploaded_by}</div>
                              <div>날짜: {formatDate(video.created_at)}</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleVideoClick(video)}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                          >
                            📹 영상 보기
                          </button>
                          
                          {video.has_analysis ? (
                            <span className="inline-flex items-center text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                              🤖 분석 완료
                            </span>
                          ) : (
                            <button
                              onClick={() => handleStartAnalysis(video.id)}
                              className="bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                            >
                              🚀 AI 분석
                            </button>
                          )}
                        </div>
                      </div>
                      
                      {/* 해당 비디오의 분석 목록 표시 */}
                      {video.has_analysis && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="text-sm text-gray-600 mb-2">AI 분석 결과:</div>
                          <button
                            onClick={() => {
                              // 해당 비디오의 최신 분석 찾기
                              const latestAnalysis = analyses.find(a => a.video_id === video.id);
                              if (latestAnalysis) {
                                handleAnalysisClick(latestAnalysis);
                              }
                            }}
                            className="text-purple-600 hover:text-purple-700 text-sm underline"
                          >
                            📊 분석 결과 보기
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* 비디오 재생 및 분석 모달 */}
      <Modal
        isOpen={showVideoModal}
        onClose={() => {
          setShowVideoModal(false);
          setSelectedVideo(null);
        }}
        title={selectedVideo ? `${selectedVideo.original_filename}` : '비디오 재생'}
        size="xl"
      >
{selectedVideo && (
  <div className="space-y-6">
    {/* 실제 분석 데이터 존재 여부로 판단 */}
    {analyses.length > 0 ? (
      // 분석 완료된 경우
      <VideoComparisonPlayer analysis={analyses[0]} />
    ) : analysesLoading ? (
      // 로딩 중
      <LoadingSpinner text="분석 데이터 확인 중..." />
    ) : (
      // 분석되지 않은 비디오 - 일반 플레이어
      <div className="space-y-4">
        <div className="bg-black rounded-lg overflow-hidden">
          <video controls className="w-full h-80">
            <source 
              src={`http://localhost:8000/api/videos/${selectedVideo.id}/stream`}
              type="video/mp4" 
            />
            브라우저에서 비디오를 지원하지 않습니다.
          </video>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">🤖 AI 분석 대기 중</h4>
          <p className="text-yellow-700 text-sm mb-3">
            이 영상은 아직 AI 분석이 완료되지 않았습니다.
          </p>
          <button
            onClick={() => handleStartAnalysis(selectedVideo.id)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg"
          >
            🚀 AI 분석 시작
          </button>
        </div>
      </div>
    )}
  </div>
)}
      </Modal>

      {/* AI 분석 결과 모달 */}
      <Modal
        isOpen={showAnalysisModal}
        onClose={() => {
          setShowAnalysisModal(false);
          setSelectedAnalysis(null);
        }}
        title="🤖 AI 분석 결과"
        size="xl"
      >
        {selectedAnalysis && (
          <AIAnalysisResult
            analysis={selectedAnalysis}
            onStartAnalysis={() => selectedVideo && handleStartAnalysis(selectedVideo.id)}
            canStartAnalysis={selectedAnalysis.status === 'failed'}
          />
        )}
      </Modal>
    </div>
  );
};

export default MarkersPage;