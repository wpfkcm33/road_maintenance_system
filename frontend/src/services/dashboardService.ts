// frontend/src/services/dashboardService.ts
import api from './api';
import { DashboardStats, Activity, RegionStat } from '../types/dashboard';

export const dashboardService = {
  // 대시보드 통계 조회
  async getStats(): Promise<DashboardStats> {
    const response = await api.get('/api/dashboard/stats');
    return response.data;
  },

  // 최근 활동 조회
  async getRecentActivities(limit: number = 10): Promise<Activity[]> {
    const response = await api.get('/api/dashboard/recent-activities', {
      params: { limit }
    });
    return response.data.activities;
  },

  // 지역별 통계 조회
  async getRegionStats(): Promise<RegionStat[]> {
    const response = await api.get('/api/dashboard/region-stats');
    return response.data.regions;
  }
};