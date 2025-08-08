// frontend/src/components/dashboard/StatCard.tsx
import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: 'blue' | 'red' | 'green' | 'yellow' | 'purple';
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color, change }) => {
  const colorClasses = {
    blue: 'bg-blue-500 text-blue-500',
    red: 'bg-red-500 text-red-500',
    green: 'bg-green-500 text-green-500',
    yellow: 'bg-yellow-500 text-yellow-500',
    purple: 'bg-purple-500 text-purple-500',
  };

  const bgColorClass = colorClasses[color].split(' ')[0];
  const textColorClass = colorClasses[color].split(' ')[1];

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          
          {change && (
            <div className="flex items-center mt-2">
              <span className={`
                inline-flex items-center text-xs font-medium
                ${change.type === 'increase' ? 'text-green-600' : 'text-red-600'}
              `}>
                {change.type === 'increase' ? (
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
                {Math.abs(change.value)}%
              </span>
              <span className="text-xs text-gray-500 ml-1">지난주 대비</span>
            </div>
          )}
        </div>
        
        <div className={`
          w-12 h-12 rounded-lg flex items-center justify-center text-white text-xl
          ${bgColorClass}
        `}>
          {icon}
        </div>
      </div>
    </div>
  );
};

export default StatCard;
