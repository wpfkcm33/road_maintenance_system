import React, { useState } from 'react';
import { MarkerCreate, IssueType, MarkerPriority } from '../../types/marker';

interface MarkerFormProps {
  onSubmit: (marker: MarkerCreate) => void;
  onCancel: () => void;
  initialData?: Partial<MarkerCreate>;
}

const MarkerForm: React.FC<MarkerFormProps> = ({ onSubmit, onCancel, initialData }) => {
  const [formData, setFormData] = useState<MarkerCreate>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    latitude: initialData?.latitude || 37.5665,
    longitude: initialData?.longitude || 126.9780,
    address: initialData?.address || '',
    road_name: initialData?.road_name || '',
    issue_type: initialData?.issue_type || IssueType.CRACK,
    priority: initialData?.priority || MarkerPriority.NORMAL,
    assigned_to: initialData?.assigned_to || '',
    created_by: '김관리자' // 임시값
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">제목</label>
        <input
          type="text"
          required
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">설명</label>
        <textarea
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
        />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">위도</label>
          <input
            type="number"
            step="any"
            required
            value={formData.latitude}
            onChange={(e) => setFormData({ ...formData, latitude: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">경도</label>
          <input
            type="number"
            step="any"
            required
            value={formData.longitude}
            onChange={(e) => setFormData({ ...formData, longitude: parseFloat(e.target.value) })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
      </div>
      
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
        >
          취소
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600"
        >
          저장
        </button>
      </div>
    </form>
  );
};

export default MarkerForm;
