// frontend/src/utils/constants.ts
import { MarkerStatus, MarkerPriority, IssueType } from '../types/marker';
import { AnalysisStatus } from '../types/analysis';

export const MARKER_STATUS_LABELS = {
  [MarkerStatus.PENDING]: '처리 대기',
  [MarkerStatus.PROGRESS]: '작업 중',
  [MarkerStatus.COMPLETED]: '완료'
};

export const MARKER_PRIORITY_LABELS = {
  [MarkerPriority.URGENT]: '긴급',
  [MarkerPriority.HIGH]: '높음',
  [MarkerPriority.NORMAL]: '보통'
};

export const ISSUE_TYPE_LABELS = {
  [IssueType.POTHOLE]: '방사 균열',
  [IssueType.CRACK]: '도로 균열',
  [IssueType.SIGN_DAMAGE]: '표지판 손상'
};

export const ANALYSIS_STATUS_LABELS = {
  [AnalysisStatus.PENDING]: '분석 대기',
  [AnalysisStatus.PROCESSING]: '분석 중',
  [AnalysisStatus.COMPLETED]: '분석 완료',
  [AnalysisStatus.FAILED]: '분석 실패'
};

export const MARKER_STATUS_COLORS = {
  [MarkerStatus.PENDING]: 'bg-yellow-100 text-yellow-800',
  [MarkerStatus.PROGRESS]: 'bg-blue-100 text-blue-800',
  [MarkerStatus.COMPLETED]: 'bg-green-100 text-green-800'
};

export const MARKER_PRIORITY_COLORS = {
  [MarkerPriority.URGENT]: 'bg-red-100 text-red-800',
  [MarkerPriority.HIGH]: 'bg-orange-100 text-orange-800',
  [MarkerPriority.NORMAL]: 'bg-gray-100 text-gray-800'
};

export const ANALYSIS_STATUS_COLORS = {
  [AnalysisStatus.PENDING]: 'bg-gray-100 text-gray-800',
  [AnalysisStatus.PROCESSING]: 'bg-yellow-100 text-yellow-800',
  [AnalysisStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [AnalysisStatus.FAILED]: 'bg-red-100 text-red-800'
};
