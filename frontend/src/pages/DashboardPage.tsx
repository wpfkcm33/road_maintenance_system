// frontend/src/pages/DashboardPage.tsx (동영상 업로드 지원)
import React, { useEffect, useState } from 'react';
import { dashboardService } from '../services/dashboardService';
import { markerService } from '../services/markerService';
import { videoService } from '../services/videoService';
import { DashboardStats, Activity, RegionStat } from '../types/dashboard';
import { Marker, MarkerCreate } from '../types/marker';
import LoadingSpinner from '../components/common/LoadingSpinner';
import StatCard from '../components/dashboard/StatCard';
import ActivityList from '../components/dashboard/ActivityList';
import NaverMap from '../components/map/NaverMap';
import MarkerAddPopup from '../components/map/MarkerAddPopup';
import { formatNumber } from '../utils/helpers';
import toast from 'react-hot-toast';

const DashboardPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [regions, setRegions] = useState<RegionStat[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMarker, setSelectedMarker] = useState<Marker | null>(null);
  
  // 마커 추가 팝업 상태
  const [showMarkerAddPopup, setShowMarkerAddPopup] = useState(false);
  const [newMarkerPosition, setNewMarkerPosition] = useState<{lat: number, lng: number} | null>(null);
  const [creatingMarker, setCreatingMarker] = useState(false);

  // 데이터 새로고침 함수
  const refreshData = async () => {
    try {
      const [statsData, activitiesData, regionsData, markersData] = await Promise.all([
        dashboardService.getStats(),
        dashboardService.getRecentActivities(10),
        dashboardService.getRegionStats(),
        markerService.getMarkers({ limit: 50 })
      ]);
      
      setStats(statsData);
      setActivities(activitiesData);
      setRegions(regionsData);
      setMarkers(markersData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.';
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);
        await refreshData();
      } catch (err) {
        // 오류는 refreshData에서 처리됨
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // 마커 클릭 핸들러
  const handleMarkerClick = (marker: Marker) => {
    setSelectedMarker(marker);
    toast.success(`마커 선택: ${marker.title}`);
  };

  // 지도 클릭 핸들러 (일반 클릭)
  const handleMapClick = (lat: number, lng: number) => {
    console.log('지도 클릭:', lat, lng);
    if (selectedMarker) {
      setSelectedMarker(null);
    }
  };

  // 지도 우클릭 핸들러 (마커 추가)
  const handleMapRightClick = (lat: number, lng: number) => {
    console.log('지도 우클릭 - 마커 추가:', lat, lng);
    setNewMarkerPosition({ lat, lng });
    setShowMarkerAddPopup(true);
    toast('우클릭한 위치에 새 마커를 추가합니다.', {
      icon: '📍',
      duration: 2000
    });
  };

  // 마커 생성 핸들러 (동영상 업로드 포함)
  const handleCreateMarker = async (markerData: MarkerCreate, videoFile?: File) => {
    try {
      setCreatingMarker(true);
      
      console.log('새 마커 생성:', markerData);
      console.log('첨부된 비디오:', videoFile?.name);
      
      // 1. 마커 생성
      const newMarker = await markerService.createMarker(markerData);
      console.log('마커 생성 완료:', newMarker);
      
      // 2. 동영상이 있으면 업로드
      if (videoFile) {
        try {
          toast.loading('동영상 업로드 중...', { duration: 1000 });
          
          const videoUpload = await videoService.uploadVideo(newMarker.id, {
            file: videoFile,
            description: `${markerData.title} 관련 영상`,
            uploaded_by: markerData.created_by
          });
          
          console.log('비디오 업로드 완료:', videoUpload);
          toast.success(`동영상 업로드 완료: ${videoUpload.original_filename}`);
          
          // 마커 정보 업데이트 (비디오 수 반영)
          newMarker.video_count = 1;
          
        } catch (videoError) {
          console.error('비디오 업로드 오류:', videoError);
          toast.error('마커는 생성되었지만 동영상 업로드에 실패했습니다.');
        }
      }
      
      // 3. 로컬 상태 업데이트
      setMarkers(prev => [newMarker, ...prev]);
      
      // 4. 통계 데이터 새로고침
      await refreshData();
      
      const successMessage = videoFile 
        ? `새 마커와 동영상이 업로드되었습니다: ${newMarker.title}`
        : `새 마커가 생성되었습니다: ${newMarker.title}`;
      
      toast.success(successMessage);
      
      // 5. 생성된 마커 선택
      setSelectedMarker(newMarker);
      
    } catch (error) {
      console.error('마커 생성 오류:', error);
      const errorMessage = error instanceof Error ? error.message : '마커 생성 중 오류가 발생했습니다.';
      toast.error(errorMessage);
      throw error;
    } finally {
      setCreatingMarker(false);
    }
  };

  // 마커 추가 팝업 닫기
  const handleCloseMarkerAddPopup = () => {
    setShowMarkerAddPopup(false);
    setNewMarkerPosition(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <LoadingSpinner size="lg" text="대시보드 데이터를 불러오는 중..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center space-x-2">
          <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span className="text-red-700 font-medium">오류 발생</span>
        </div>
        <p className="text-red-600 mt-2">{error}</p>
        <button 
          onClick={() => window.location.reload()} 
          className="mt-4 bg-red-100 hover:bg-red-200 text-red-800 px-4 py-2 rounded-lg transition-colors"
        >
          다시 시도
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">대시보드</h1>
            <p className="text-gray-600">전국 도로 유지보수 현황을 한눈에 확인하세요</p>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500 mb-2">
              <p>마지막 업데이트: {new Date().toLocaleString('ko-KR')}</p>
              <p>총 {markers.length}개 마커 표시 중</p>
            </div>
            <button
              onClick={() => refreshData()}
              className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors text-sm flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>새로고침</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <StatCard
            title="전체 마커"
            value={formatNumber(stats.total_markers)}
            icon="📍"
            color="blue"
          />
          <StatCard
            title="긴급 이슈"
            value={formatNumber(stats.urgent_issues)}
            icon="🚨"
            color="red"
          />
          <StatCard
            title="주간 완료"
            value={formatNumber(stats.weekly_completed)}
            icon="✅"
            color="green"
          />
          <StatCard
            title="대기 중"
            value={formatNumber(stats.pending_markers)}
            icon="⏳"
            color="yellow"
          />
          <StatCard
            title="활성 마커"
            value={formatNumber(stats.active_markers)}
            icon="👤"
            color="purple"
          />
        </div>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map Section */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <div className="flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  🗺️ 전국 현황
                </h2>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <span>📍 {markers.length}개 마커</span>
                  </div>
                  {selectedMarker && (
                    <span className="bg-primary-100 text-primary-800 px-2 py-1 rounded text-xs">
                      선택: {selectedMarker.title}
                    </span>
                  )}
                  <div className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                    💡 우클릭으로 마커 추가 (동영상 포함 가능)
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6">
              {/* 네이버 지도 */}
              <NaverMap
                markers={markers}
                onMarkerClick={handleMarkerClick}
                onMapClick={handleMapClick}
                onMapRightClick={handleMapRightClick}
                height="500px"
                showControls={true}
                center={{ lat: 37.3595704, lng: 127.105399 }}
                zoom={11}
              />
              
              {/* 선택된 마커 정보 */}
              {selectedMarker && (
                <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-blue-900">{selectedMarker.title}</h3>
                      <p className="text-blue-700 text-sm mt-1">{selectedMarker.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-blue-600">
                        <span>📍 {selectedMarker.road_name || selectedMarker.address}</span>
                        <span>상태: {selectedMarker.status}</span>
                        <span>우선순위: {selectedMarker.priority}</span>
                        <span>담당자: {selectedMarker.assigned_to || '미배정'}</span>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-blue-500">
                        <span>생성일: {new Date(selectedMarker.created_at).toLocaleDateString('ko-KR')}</span>
                        <span>🎥 비디오: {selectedMarker.video_count}개</span>
                        <span>🤖 분석: {selectedMarker.analysis_count}개</span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setSelectedMarker(null)}
                      className="text-blue-400 hover:text-blue-600 p-1"
                      title="선택 해제"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              )}
              
              {/* Region Stats */}
              {regions.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">지역별 통계</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {regions.map((region) => (
                      <div key={region.name} className="bg-gray-50 rounded-lg p-3 text-center hover:bg-gray-100 transition-colors cursor-pointer">
                        <div className="text-sm text-gray-600">{region.name}</div>
                        <div className="text-lg font-semibold text-gray-900">{formatNumber(region.count)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Activities */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                🔄 실시간 활동
              </h2>
            </div>
            <ActivityList activities={activities} />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">빠른 작업</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => {
              const centerPosition = { lat: 37.3595704, lng: 127.105399 };
              handleMapRightClick(centerPosition.lat, centerPosition.lng);
            }}
            className="flex items-center justify-center p-4 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📍🎥</div>
              <div className="text-sm font-medium text-blue-900">마커 + 동영상 등록</div>
            </div>
          </button>
          <button 
            onClick={() => window.location.href = '/markers'}
            className="flex items-center justify-center p-4 bg-green-50 hover:bg-green-100 rounded-lg transition-colors"
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-sm font-medium text-green-900">마커 관리</div>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">🎥</div>
              <div className="text-sm font-medium text-purple-900">영상 분석</div>
            </div>
          </button>
          <button className="flex items-center justify-center p-4 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
            <div className="text-center">
              <div className="text-2xl mb-2">⚙️</div>
              <div className="text-sm font-medium text-orange-900">시스템 설정</div>
            </div>
          </button>
        </div>
      </div>

      {/* 마커 추가 팝업 (동영상 업로드 포함) */}
      <MarkerAddPopup
        isOpen={showMarkerAddPopup}
        position={newMarkerPosition}
        onSubmit={handleCreateMarker}
        onClose={handleCloseMarkerAddPopup}
        loading={creatingMarker}
      />
    </div>
  );
};

export default DashboardPage;