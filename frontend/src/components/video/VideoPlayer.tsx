import React from 'react';
import { Video } from '../../types/video';

interface VideoPlayerProps {
  video: Video;
  showAnalysis?: boolean;
}

const VideoPlayer: React.FC<VideoPlayerProps> = ({ video, showAnalysis = false }) => {
  return (
    <div className="space-y-4">
      <div className="bg-black rounded-lg overflow-hidden">
        <video
          controls
          className="w-full h-64"
          poster="/api/videos/thumbnail/${video.id}"
        >
          <source src={`/api/videos/${video.id}/stream`} type="video/mp4" />
          브라우저에서 비디오를 지원하지 않습니다.
        </video>
      </div>
      
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-medium text-gray-900 mb-2">{video.original_filename}</h3>
        <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
          <div>파일 크기: {(video.file_size / (1024 * 1024)).toFixed(2)} MB</div>
          <div>길이: {video.duration ? `${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2, '0')}` : '알 수 없음'}</div>
          <div>해상도: {video.width && video.height ? `${video.width}x${video.height}` : '알 수 없음'}</div>
          <div>업로드: {video.uploaded_by}</div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;
