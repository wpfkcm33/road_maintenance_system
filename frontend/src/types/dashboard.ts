// frontend/src/types/dashboard.ts
export interface DashboardStats {
  total_markers: number;
  urgent_issues: number;
  weekly_completed: number;
  pending_markers: number;
  active_markers: number;
}

export interface Activity {
  id: number;
  type: string;
  message: string;
  user: string;
  location?: string;
  timestamp: string;
  marker_id?: number;
}

export interface RegionStat {
  name: string;
  count: number;
}