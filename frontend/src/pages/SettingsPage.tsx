// frontend/src/pages/SettingsPage.tsx
import React from 'react';

const SettingsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">시스템 설정</h1>
        <p className="text-gray-600">시스템 설정 및 사용자 권한을 관리합니다</p>
      </div>
      
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center text-gray-500">
          <div className="text-4xl mb-4">⚙️</div>
          <p className="text-lg font-medium">설정 페이지</p>
          <p className="text-sm">시스템 설정과 관리 기능이 여기에 표시됩니다</p>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;