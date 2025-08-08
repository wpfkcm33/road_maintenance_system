// frontend/src/utils/helpers.ts
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

export const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'yyyy.MM.dd HH:mm', { locale: ko });
};

export const formatDateShort = (dateString: string): string => {
  return format(new Date(dateString), 'MM.dd', { locale: ko });
};

export const formatRelativeTime = (dateString: string): string => {
  return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: ko });
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const isVideoFile = (file: File): boolean => {
  const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm'];
  return allowedTypes.includes(file.type);
};

export const validateVideoFile = (file: File, maxSize: number = 100 * 1024 * 1024): { valid: boolean; error?: string } => {
  if (!isVideoFile(file)) {
    return { valid: false, error: '지원하지 않는 비디오 형식입니다.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: `파일 크기가 너무 큽니다. 최대 ${formatFileSize(maxSize)}` };
  }
  
  return { valid: true };
};

export const formatDuration = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ko-KR', {
    style: 'currency',
    currency: 'KRW'
  }).format(amount);
};

export const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('ko-KR').format(num);
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateCoordinate = (lat: number, lng: number): boolean => {
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
};

export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

export const getStatusBadgeClass = (status: string, colorMap: Record<string, string>): string => {
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[status] || 'bg-gray-100 text-gray-800'}`;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const downloadFile = (url: string, filename: string): void => {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
};

export const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};