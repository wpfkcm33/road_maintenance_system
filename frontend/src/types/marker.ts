// frontend/src/types/marker.ts
export enum MarkerStatus {
    PENDING = 'pending',
    PROGRESS = 'progress',
    COMPLETED = 'completed'
  }
  
  export enum MarkerPriority {
    URGENT = 'urgent',
    HIGH = 'high',
    NORMAL = 'normal'
  }
  
  export enum IssueType {
    POTHOLE = 'pothole',
    CRACK = 'crack',
    SIGN_DAMAGE = 'sign_damage'
  }
  
  export interface Marker {
    id: number;
    title: string;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    road_name?: string;
    issue_type: IssueType;
    status: MarkerStatus;
    priority: MarkerPriority;
    assigned_to?: string;
    created_by: string;
    created_at: string;
    updated_at?: string;
    video_count: number;
    analysis_count: number;
  }
  
  export interface MarkerCreate {
    title: string;
    description?: string;
    latitude: number;
    longitude: number;
    address?: string;
    road_name?: string;
    issue_type: IssueType;
    priority: MarkerPriority;
    assigned_to?: string;
    created_by: string;
  }
  
  export interface MarkerUpdate {
    title?: string;
    description?: string;
    status?: MarkerStatus;
    priority?: MarkerPriority;
    assigned_to?: string;
  }