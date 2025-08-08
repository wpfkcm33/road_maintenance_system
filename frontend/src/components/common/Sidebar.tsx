// frontend/src/components/common/Sidebar.tsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: string;
  path: string;
}

const menuItems: MenuItem[] = [
  { id: 'dashboard', label: '대시보드', icon: '📊', path: '/' },
  { id: 'markers', label: '마커 관리', icon: '📍', path: '/markers' },
  { id: 'analytics', label: '통계 분석', icon: '📈', path: '/analytics' },
  { id: 'settings', label: '설정', icon: '⚙️', path: '/settings' },
];

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavigation = (path: string) => {
    navigate(path);
    if (window.innerWidth < 768) {
      onClose();
    }
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`
        fixed top-16 left-0 h-full w-64 bg-white shadow-lg z-40 transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <nav className="mt-4">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`
                    w-full flex items-center space-x-3 px-6 py-3 text-left transition-colors duration-200
                    border-l-4 border-transparent hover:bg-gray-50 hover:border-primary-500
                    ${location.pathname === item.path 
                      ? 'bg-primary-50 border-primary-500 text-primary-700 font-medium' 
                      : 'text-gray-700'
                    }
                  `}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="absolute bottom-4 left-4 right-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">시스템 상태</h4>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-sm text-gray-600">정상 운영 중</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;