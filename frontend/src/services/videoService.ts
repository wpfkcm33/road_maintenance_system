// frontend/src/services/videoService.ts
import api from './api';
import { Video, VideoUpload } from '../types/video';

export const videoService = {
  // 마커별 비디오 목록 조회
  async getMarkerVideos(markerId: number): Promise<Video[]> {
    const response = await api.get(`/api/videos/marker/${markerId}`);
    return response.data;
  },

  // 특정 비디오 조회
  async getVideo(id: number): Promise<Video> {
    const response = await api.get(`/api/videos/${id}`);
    return response.data;
  },

  // 비디오 업로드
  async uploadVideo(markerId: number, upload: VideoUpload): Promise<Video> {
    const formData = new FormData();
    formData.append('file', upload.file);
    formData.append('uploaded_by', upload.uploaded_by);
    if (upload.description) {
      formData.append('description', upload.description);
    }

    const response = await api.post(`/api/videos/upload/${markerId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${progress}%`);
        }
      }
    });
    return response.data;
  },

  // 비디오 삭제
  async deleteVideo(id: number): Promise<void> {
    await api.delete(`/api/videos/${id}`);
  }
};
