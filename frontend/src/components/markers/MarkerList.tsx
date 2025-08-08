import React from 'react';
import { Marker } from '../../types/marker';
import { MARKER_STATUS_COLORS, MARKER_PRIORITY_COLORS } from '../../utils/constants';
import { formatDate, getStatusBadgeClass } from '../../utils/helpers';

interface MarkerListProps {
  markers: Marker[];
  onMarkerClick: (marker: Marker) => void;
  loading?: boolean;
}

const MarkerList: React.FC<MarkerListProps> = ({ markers, onMarkerClick, loading }) => {
  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  if (markers.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <div className="text-4xl mb-4">📍</div>
        <p>등록된 마커가 없습니다</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {markers.map((marker) => (
        <div
          key={marker.id}
          onClick={() => onMarkerClick(marker)}
          className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-semibold text-gray-900">{marker.title}</h3>
            <div className="flex space-x-2">
              <span className={getStatusBadgeClass(marker.status, MARKER_STATUS_COLORS)}>
                {marker.status}
              </span>
              <span className={getStatusBadgeClass(marker.priority, MARKER_PRIORITY_COLORS)}>
                {marker.priority}
              </span>
            </div>
          </div>
          
          <p className="text-sm text-gray-600 mb-2">{marker.description}</p>
          
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>�� {marker.road_name || marker.address}</span>
            <span>{formatDate(marker.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MarkerList;
