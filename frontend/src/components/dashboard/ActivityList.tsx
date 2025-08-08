// frontend/src/components/dashboard/ActivityList.tsx
import React from 'react';
import { Activity } from '../../types/dashboard';
import { formatRelativeTime } from '../../utils/helpers';

interface ActivityListProps {
  activities: Activity[];
}

const ActivityList: React.FC<ActivityListProps> = ({ activities }) => {
  if (activities.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <div className="text-3xl mb-2">📝</div>
        <p>최근 활동이 없습니다</p>
      </div>
    );
  }

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'marker_created':
        return '📍';
      case 'video_uploaded':
        return '🎥';
      case 'analysis_completed':
        return '🤖';
      case 'status_updated':
        return '🔄';
      default:
        return '📋';
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'marker_created':
        return 'bg-blue-100 text-blue-800';
      case 'video_uploaded':
        return 'bg-purple-100 text-purple-800';
      case 'analysis_completed':
        return 'bg-green-100 text-green-800';
      case 'status_updated':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="max-h-96 overflow-y-auto">
      <div className="divide-y divide-gray-200">
        {activities.map((activity) => (
          <div key={activity.id} className="p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-start space-x-3">
              <div className={`
                flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm
                ${getActivityColor(activity.type)}
              `}>
                {getActivityIcon(activity.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-900 leading-relaxed">
                  {activity.message}
                </p>
                
                <div className="flex items-center mt-1 space-x-4">
                  <span className="text-xs text-gray-500">
                    {formatRelativeTime(activity.timestamp)}
                  </span>
                  
                  {activity.location && (
                    <span className="text-xs text-gray-500 flex items-center">
                      <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {activity.location}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActivityList;