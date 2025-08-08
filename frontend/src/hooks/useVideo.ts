// frontend/src/hooks/useVideo.ts
import { useState, useEffect } from 'react';
import { Video, VideoUpload } from '../types/video';
import { videoService } from '../services/videoService';

export const useVideos = (markerId: number | null) => {
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchVideos = async (id: number) => {
    try {
      setLoading(true);
      setError(null);
      const data = await videoService.getMarkerVideos(id);
      setVideos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : '비디오 조회 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const uploadVideo = async (id: number, upload: VideoUpload): Promise<Video | null> => {
    try {
      const newVideo = await videoService.uploadVideo(id, upload);
      setVideos(prev => [newVideo, ...prev]);
      return newVideo;
    } catch (err) {
      setError(err instanceof Error ? err.message : '비디오 업로드 중 오류가 발생했습니다.');
      return null;
    }
  };

  const deleteVideo = async (id: number): Promise<boolean> => {
    try {
      await videoService.deleteVideo(id);
      setVideos(prev => prev.filter(video => video.id !== id));
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : '비디오 삭제 중 오류가 발생했습니다.');
      return false;
    }
  };

  useEffect(() => {
    if (markerId) {
      fetchVideos(markerId);
    }
  }, [markerId]);

  return {
    videos,
    loading,
    error,
    refetch: () => markerId && fetchVideos(markerId),
    uploadVideo: (upload: VideoUpload) => markerId && uploadVideo(markerId, upload),
    deleteVideo
  };
};