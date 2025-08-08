// frontend/src/services/markerService.ts
import api from './api';
import { Marker, MarkerCreate, MarkerUpdate, MarkerStatus, MarkerPriority, IssueType } from '../types/marker';

export interface MarkerQueryParams {
  skip?: number;
  limit?: number;
  status?: MarkerStatus;
  priority?: MarkerPriority;
  issue_type?: IssueType;
  search?: string;
}

export const markerService = {
  // 마커 목록 조회
  async getMarkers(params: MarkerQueryParams = {}): Promise<Marker[]> {
    const response = await api.get('/api/markers/', { params });
    return response.data;
  },

  // 특정 마커 조회
  async getMarker(id: number): Promise<Marker> {
    const response = await api.get(`/api/markers/${id}`);
    return response.data;
  },

  // 마커 생성
  async createMarker(marker: MarkerCreate): Promise<Marker> {
    const response = await api.post('/api/markers/', marker);
    return response.data;
  },

  // 마커 수정
  async updateMarker(id: number, updates: MarkerUpdate): Promise<Marker> {
    const response = await api.patch(`/api/markers/${id}`, updates);
    return response.data;
  },

  // 마커 삭제
  async deleteMarker(id: number): Promise<void> {
    await api.delete(`/api/markers/${id}`);
  }
};
