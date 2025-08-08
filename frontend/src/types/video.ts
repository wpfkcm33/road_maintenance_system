// frontend/src/types/video.ts
export interface Video {
    id: number;
    filename: string;
    original_filename: string;
    file_size: number;
    duration?: number;
    width?: number;
    height?: number;
    fps?: number;
    marker_id: number;
    uploaded_by: string;
    description?: string;
    created_at: string;
    has_analysis: boolean;
  }
  
  export interface VideoUpload {
    file: File;
    description?: string;
    uploaded_by: string;
  }
  