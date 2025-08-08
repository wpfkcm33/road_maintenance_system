// frontend/src/components/map/MarkerAddPopup.tsx (동영상 업로드 포함)
import React, { useState, useEffect, useRef } from 'react';
import { MarkerCreate, IssueType, MarkerPriority } from '../../types/marker';
import { ISSUE_TYPE_LABELS, MARKER_PRIORITY_LABELS } from '../../utils/constants';
import { formatFileSize } from '../../utils/helpers';

interface MarkerAddPopupProps {
  isOpen: boolean;
  position: { lat: number; lng: number } | null;
  onSubmit: (marker: MarkerCreate, videoFile?: File) => Promise<void>;
  onClose: () => void;
  loading?: boolean;
}

const MarkerAddPopup: React.FC<MarkerAddPopupProps> = ({
  isOpen,
  position,
  onSubmit,
  onClose,
  loading = false
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<Omit<MarkerCreate, 'latitude' | 'longitude'>>({
    title: '',
    description: '',
    address: '',
    road_name: '',
    issue_type: IssueType.CRACK,
    priority: MarkerPriority.NORMAL,
    assigned_to: '',
    created_by: '김관리자'
  });

  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [addressLoading, setAddressLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  // 허용되는 비디오 형식
  const allowedVideoTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv'];
  const maxVideoSize = 100 * 1024 * 1024; // 100MB

  // 좌표로부터 주소 검색 (역지오코딩)
  const reverseGeocode = async (lat: number, lng: number) => {
    if (!(window as any).naver?.maps?.Service) {
      console.warn('네이버 지도 Geocoding 서비스를 사용할 수 없습니다.');
      return;
    }

    setAddressLoading(true);
    setAddressError(null);

    try {
      const coords = new (window as any).naver.maps.LatLng(lat, lng);
      
      (window as any).naver.maps.Service.reverseGeocode({
        coords: coords,
        orders: [
          (window as any).naver.maps.Service.OrderType.ADDR,
          (window as any).naver.maps.Service.OrderType.ROAD_ADDR
        ].join(',')
      }, (status: any, response: any) => {
        setAddressLoading(false);
        
        if (status === (window as any).naver.maps.Service.Status.ERROR) {
          setAddressError('주소를 찾을 수 없습니다.');
          return;
        }

        if (response.v2 && response.v2.results && response.v2.results.length > 0) {
          const result = response.v2.results[0];
          const roadAddr = result.region?.area1?.name + ' ' + 
                          result.region?.area2?.name + ' ' + 
                          (result.land?.name || '');
          
          setFormData(prev => ({
            ...prev,
            address: result.region?.area1?.name + ' ' + result.region?.area2?.name,
            road_name: roadAddr.trim()
          }));
        }
      });
    } catch (error) {
      console.error('역지오코딩 오류:', error);
      setAddressLoading(false);
      setAddressError('주소 검색 중 오류가 발생했습니다.');
    }
  };

  // 비디오 파일 선택 핸들러
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 검증
    if (!allowedVideoTypes.includes(file.type)) {
      alert('지원하지 않는 비디오 형식입니다.\n지원 형식: MP4, MOV, AVI, MKV');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    // 파일 크기 검증
    if (file.size > maxVideoSize) {
      alert(`파일 크기가 너무 큽니다.\n최대 크기: ${formatFileSize(maxVideoSize)}`);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setSelectedVideo(file);

    // 비디오 미리보기 생성
    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  // 비디오 제거 핸들러
  const handleVideoRemove = () => {
    setSelectedVideo(null);
    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
      setVideoPreview(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 팝업이 열릴 때마다 폼 초기화
  useEffect(() => {
    if (isOpen && position) {
      // 폼 초기화
      setFormData({
        title: '',
        description: '',
        address: '',
        road_name: '',
        issue_type: IssueType.CRACK,
        priority: MarkerPriority.NORMAL,
        assigned_to: '',
        created_by: '김관리자'
      });
      
      // 비디오 관련 상태 초기화
      setSelectedVideo(null);
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
        setVideoPreview(null);
      }
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      // 주소 검색
      reverseGeocode(position.lat, position.lng);
    }
  }, [isOpen, position]);

  // 컴포넌트 언마운트 시 미리보기 URL 정리
  useEffect(() => {
    return () => {
      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!position) return;

    const markerData: MarkerCreate = {
      ...formData,
      latitude: position.lat,
      longitude: position.lng
    };

    try {
      await onSubmit(markerData, selectedVideo || undefined);
      onClose();
    } catch (error) {
      console.error('마커 생성 오류:', error);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isOpen || !position) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 백드롭 */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
      />
      
      {/* 팝업 */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white p-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">📍 새 마커 추가</h2>
              <p className="text-sm opacity-90">
                위치: {position.lat.toFixed(6)}, {position.lng.toFixed(6)}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-20 rounded-full transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 기본 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              📋 기본 정보
            </h3>
            
            {/* 제목 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                제목 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                placeholder="예: 서울로 교차점 방사 균열"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 이슈 유형 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">이슈 유형</label>
                <select
                  value={formData.issue_type}
                  onChange={(e) => handleInputChange('issue_type', e.target.value as IssueType)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {Object.entries(ISSUE_TYPE_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>

              {/* 우선순위 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value as MarkerPriority)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                >
                  {Object.entries(MARKER_PRIORITY_LABELS).map(([key, label]) => (
                    <option key={key} value={key}>{label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 설명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
              <textarea
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                rows={3}
                placeholder="상세 설명을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none"
              />
            </div>
          </div>

          {/* 위치 정보 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              📍 위치 정보
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 주소 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  주소
                  {addressLoading && (
                    <span className="ml-2 text-xs text-blue-600">
                      <span className="inline-block animate-spin mr-1">🔄</span>
                      검색 중...
                    </span>
                  )}
                </label>
                {addressError && (
                  <p className="text-xs text-red-600 mb-1">{addressError}</p>
                )}
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="주소가 자동으로 검색됩니다"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              {/* 도로명 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">도로명</label>
                <input
                  type="text"
                  value={formData.road_name}
                  onChange={(e) => handleInputChange('road_name', e.target.value)}
                  placeholder="도로명이 자동으로 검색됩니다"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </div>

            {/* 담당자 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
              <input
                type="text"
                value={formData.assigned_to}
                onChange={(e) => handleInputChange('assigned_to', e.target.value)}
                placeholder="담당자명 (선택사항)"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>

          {/* 비디오 업로드 섹션 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              🎥 비디오 업로드 (선택사항)
            </h3>
            
            {!selectedVideo ? (
              <div>
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary-400 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleVideoSelect}
                    accept="video/mp4,video/mov,video/avi,video/mkv"
                    className="hidden"
                  />
                  <div className="text-4xl mb-3">🎥</div>
                  <p className="text-lg font-medium text-gray-700 mb-2">비디오 파일 선택</p>
                  <p className="text-sm text-gray-500 mb-2">클릭하여 파일을 선택하세요</p>
                  <p className="text-xs text-gray-400">
                    지원 형식: MP4, MOV, AVI, MKV<br/>
                    최대 크기: {formatFileSize(maxVideoSize)}
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 선택된 파일 정보 */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-900 mb-1">선택된 비디오</h4>
                      <p className="text-sm text-blue-700 mb-1">{selectedVideo.name}</p>
                      <p className="text-xs text-blue-600">
                        크기: {formatFileSize(selectedVideo.size)} | 
                        형식: {selectedVideo.type}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleVideoRemove}
                      className="text-red-500 hover:text-red-700 p-1"
                      title="비디오 제거"
                    >
                      🗑️
                    </button>
                  </div>
                </div>

                {/* 비디오 미리보기 */}
                {videoPreview && (
                  <div className="bg-black rounded-lg overflow-hidden">
                    <video
                      src={videoPreview}
                      controls
                      className="w-full max-h-48"
                      preload="metadata"
                    >
                      브라우저에서 비디오를 지원하지 않습니다.
                    </video>
                  </div>
                )}

                {/* 다른 비디오 선택 버튼 */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-2 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  다른 비디오 선택
                </button>
              </div>
            )}
          </div>

          {/* 버튼 */}
          <div className="flex space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading || !formData.title.trim()}
              className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center justify-center"
            >
              {loading ? (
                <>
                  <span className="inline-block animate-spin mr-2">🔄</span>
                  {selectedVideo ? '마커 생성 및 업로드 중...' : '마커 생성 중...'}
                </>
              ) : (
                <>
                  {selectedVideo ? '📍🎥 마커 생성 및 업로드' : '📍 마커 생성'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarkerAddPopup;