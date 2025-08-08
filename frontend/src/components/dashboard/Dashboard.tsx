// frontend/src/components/dashboard/Dashboard.tsx
import React from 'react';

interface DashboardProps {
  children: React.ReactNode;
}

const Dashboard: React.FC<DashboardProps> = ({ children }) => {
  return (
    <div className="space-y-6">
      {children}
    </div>
  );
};

export default Dashboard;