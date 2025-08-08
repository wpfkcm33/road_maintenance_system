// frontend/src/components/common/LoadingSpinner.tsx
import React from 'react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md', 
  text = '로딩 중...' 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-2">
      <div className={`
        ${sizeClasses[size]} 
        border-4 border-gray-200 border-t-primary-500 
        rounded-full animate-spin
      `} />
      {text && <p className="text-gray-600 text-sm">{text}</p>}
    </div>
  );
};

export default LoadingSpinner;