// frontend/src/pages/AnalyticsPage.tsx
import React from 'react';

const AnalyticsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">통계 분석</h1>
        <p className="text-gray-600">도로 유지보수 데이터를 분석하여 인사이트를 제공합니다</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">📈</div>
          <p className="text-lg font-medium">통계 분석 페이지</p>
          <p className="text-sm">차트와 분석 데이터가 여기에 표시됩니다</p>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsPage;
