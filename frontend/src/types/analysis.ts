// frontend/src/types/analysis.ts
export enum AnalysisStatus {
    PENDING = 'pending',
    PROCESSING = 'processing',
    COMPLETED = 'completed',
    FAILED = 'failed'
  }
  
  export interface CrackDetail {
    crack_id: string;
    crack_type: string;
    length: number;
    width: number;
    area: number;
    severity: string;
    confidence: number;
  }
  
  export interface MaterialEstimation {
    asphalt_concrete: number;
    sealer: number;
    primer: number;
    mesh?: number;
    total_cost: number;
  }
  
  export interface SeverityAnalysis {
    overall_severity: string;
    risk_score: number;
    urgent_repairs_needed: boolean;
    estimated_repair_time: string;
  }
  
  export interface Analysis {
    id: number;
    marker_id: number;
    video_id: number;
    status: AnalysisStatus;
    progress: number;
    total_cracks_detected: number;
    total_crack_area: number;
    confidence_score: number;
    crack_details?: CrackDetail[];
    material_estimation?: MaterialEstimation;
    severity_analysis?: SeverityAnalysis;
    result_video_path?: string;
    error_message?: string;
    started_at?: string;
    completed_at?: string;
    created_at: string;
  }