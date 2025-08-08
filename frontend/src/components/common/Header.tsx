// frontend/src/components/common/Header.tsx
import React from 'react';

interface HeaderProps {
  onToggleSidebar: () => void;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar }) => {
  return (
    <header className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white shadow-lg fixed top-0 left-0 right-0 z-50 h-16">
      <div className="flex items-center justify-between h-full px-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={onToggleSidebar}
            className="p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center space-x-2">
            <span className="text-2xl">🛣️</span>
            <h1 className="text-xl font-bold">도로관리 시스템</h1>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="relative p-2 rounded-lg hover:bg-white hover:bg-opacity-20 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5-5-5h5v-12a4 4 0 00-8 0v12" />
            </svg>
            <span className="absolute -top-1 -right-1 bg-red-500 text-xs rounded-full h-5 w-5 flex items-center justify-center">
              3
            </span>
          </button>
          
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium">김</span>
            </div>
            <span className="text-sm font-medium">김관리자</span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;