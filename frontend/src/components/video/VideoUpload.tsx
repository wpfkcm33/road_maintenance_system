import React, { useState } from 'react';

interface VideoUploadProps {
  onUpload: (file: File, description?: string) => void;
  uploading?: boolean;
}

const VideoUpload: React.FC<VideoUploadProps> = ({ onUpload, uploading = false }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleUpload = () => {
    if (selectedFile) {
      onUpload(selectedFile, description);
      setSelectedFile(null);
      setDescription('');
    }
  };

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
          id="video-upload"
        />
        <label htmlFor="video-upload" className="cursor-pointer">
          <div className="text-4xl mb-4">🎥</div>
          <p className="text-lg font-medium text-gray-900 mb-2">비디오 파일 선택</p>
          <p className="text-sm text-gray-500">클릭하여 파일을 선택하세요</p>
        </label>
      </div>
      
      {selectedFile && (
        <div className="space-y-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">선택된 파일</h4>
            <p className="text-sm text-gray-600">{selectedFile.name}</p>
            <p className="text-xs text-gray-500">
              {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">설명 (선택사항)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-primary-500 focus:border-primary-500"
              placeholder="비디오에 대한 설명을 입력하세요"
            />
          </div>
          
          <button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full bg-primary-500 text-white py-2 px-4 rounded-lg hover:bg-primary-600 disabled:opacity-50"
          >
            {uploading ? '업로드 중...' : '업로드'}
          </button>
        </div>
      )}
    </div>
  );
};

export default VideoUpload;
