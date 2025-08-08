//frontend/src/components/map/MarkerPopup.tsx
import React from 'react';
import { Marker } from '../../types/marker';

interface MarkerPopupProps {
  marker: Marker;
  onClose: () => void;
}

const MarkerPopup: React.FC<MarkerPopupProps> = ({ marker, onClose }) => {
  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-semibold text-gray-900">{marker.title}</h3>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          ✕
        </button>
      </div>
      <p className="text-sm text-gray-600 mb-2">{marker.description}</p>
      <div className="text-xs text-gray-500">
        📍 {marker.address || `${marker.latitude}, ${marker.longitude}`}
      </div>
    </div>
  );
};

export default MarkerPopup;
