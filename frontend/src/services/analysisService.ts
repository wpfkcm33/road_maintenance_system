
// frontend/src/services/analysisService.ts
import api from './api';
import { Analysis } from '../types/analysis';

export const analysisService = {
  // 비디오별 분석 결과 조회
  async getVideoAnalyses(videoId: number): Promise<Analysis[]> {
    const response = await api.get(`/api/analysis/video/${videoId}`);
    return response.data;
  },

  // 특정 분석 결과 조회
  async getAnalysis(id: number): Promise<Analysis> {
    const response = await api.get(`/api/analysis/${id}`);
    return response.data;
  },

  // AI 분석 시작
  async startAnalysis(videoId: number): Promise<Analysis> {
    const response = await api.post(`/api/analysis/start/${videoId}`);
    return response.data;
  }
};