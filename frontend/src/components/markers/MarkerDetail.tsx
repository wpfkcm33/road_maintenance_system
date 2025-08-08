// frontend/src/components/markers/MarkerDetail.tsx (수정된 버전)
import React, { useState } from 'react';
import { Marker, MarkerStatus, MarkerPriority, MarkerUpdate } from '../../types/marker';
import { MARKER_STATUS_LABELS, MARKER_PRIORITY_LABELS, MARKER_STATUS_COLORS, MARKER_PRIORITY_COLORS } from '../../utils/constants';
import { formatDate, getStatusBadgeClass } from '../../utils/helpers';

interface MarkerDetailProps {
  marker: Marker;
  onEdit: (updates: MarkerUpdate) => Promise<void>; // Promise<void> 명시
  onDelete: () => Promise<void>; // Promise<void> 명시
}

const MarkerDetail: React.FC<MarkerDetailProps> = ({ marker, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<MarkerUpdate>({
    title: marker.title,
    description: marker.description,
    status: marker.status,
    priority: marker.priority,
    assigned_to: marker.assigned_to
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setIsLoading(true);
      await onEdit(editData);
      setIsEditing(false);
    } catch (error) {
      console.error('수정 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = async () => {
    if (!window.confirm('이 마커를 삭제하시겠습니까?')) return;
    
    try {
      setIsLoading(true);
      await onDelete();
    } catch (error) {
      console.error('삭제 중 오류:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditCancel = () => {
    setEditData({
      title: marker.title,
      description: marker.description,
      status: marker.status,
      priority: marker.priority,
      assigned_to: marker.assigned_to
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-2">
          ✏️ 마커 수정
        </h3>
        
        <form onSubmit={handleEditSubmit} className="space-y-4">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
            <input
              type="text"
              value={editData.title || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              required
            />
          </div>

          {/* 설명 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
            <textarea
              value={editData.description || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />
          </div>

          {/* 상태 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
            <select
              value={editData.status || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, status: e.target.value as MarkerStatus }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {Object.entries(MARKER_STATUS_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* 우선순위 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
            <select
              value={editData.priority || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, priority: e.target.value as MarkerPriority }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            >
              {Object.entries(MARKER_PRIORITY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>

          {/* 담당자 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
            <input
              type="text"
              value={editData.assigned_to || ''}
              onChange={(e) => setEditData(prev => ({ ...prev, assigned_to: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              placeholder="담당자명 (선택사항)"
            />
          </div>

          {/* 버튼 */}
          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={handleEditCancel}
              disabled={isLoading}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={isLoading || !editData.title?.trim()}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin">🔄</span>
                  <span>저장 중...</span>
                </>
              ) : (
                <>
                  <span>✅</span>
                  <span>저장</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 기본 정보 */}
      <div>
        <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">📋 기본 정보</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              className="text-blue-600 hover:text-blue-700 p-1 disabled:opacity-50"
              title="수정"
            >
              ✏️
            </button>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 text-lg mb-2">{marker.title}</h4>
            <p className="text-gray-600 leading-relaxed">{marker.description || '설명 없음'}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">상태</label>
              <span className={getStatusBadgeClass(marker.status, MARKER_STATUS_COLORS)}>
                {MARKER_STATUS_LABELS[marker.status]}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">우선순위</label>
              <span className={getStatusBadgeClass(marker.priority, MARKER_PRIORITY_COLORS)}>
                {MARKER_PRIORITY_LABELS[marker.priority]}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">담당자</label>
              <p className="text-sm text-gray-900">{marker.assigned_to || '미배정'}</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">생성자</label>
              <p className="text-sm text-gray-900">{marker.created_by}</p>
            </div>
          </div>
        </div>
      </div>

      {/* 위치 정보 */}
      <div>
        <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">📍 위치 정보</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">주소</label>
            <p className="text-sm text-gray-900">{marker.address || '주소 없음'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">도로명</label>
            <p className="text-sm text-gray-900">{marker.road_name || '도로명 없음'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">좌표</label>
            <p className="text-sm text-gray-900 font-mono">
              {marker.latitude.toFixed(6)}, {marker.longitude.toFixed(6)}
            </p>
          </div>
        </div>
      </div>

      {/* 시간 정보 */}
      <div>
        <h4 className="font-semibold text-gray-900 border-b border-gray-200 pb-2 mb-4">🕐 시간 정보</h4>
        <div className="space-y-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">생성일</label>
            <p className="text-sm text-gray-900">{formatDate(marker.created_at)}</p>
          </div>
          {marker.updated_at && (
            <div>
              <label className="block text-sm font-medium text-gray-700">수정일</label>
              <p className="text-sm text-gray-900">{formatDate(marker.updated_at)}</p>
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼 */}
      <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
        <button
          onClick={() => setIsEditing(true)}
          disabled={isLoading}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          <span>✏️</span>
          <span>수정</span>
        </button>
        <button
          onClick={handleDeleteClick}
          disabled={isLoading}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <span className="animate-spin">🔄</span>
              <span>삭제 중...</span>
            </>
          ) : (
            <>
              <span>🗑️</span>
              <span>삭제</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default MarkerDetail;