import React from 'react';
import { Card } from './ui/Card';

const SkeletonDashboardCard: React.FC = () => {
  return (
    <Card className="relative overflow-hidden transition-all bg-white group animate-pulse">
      <div className="absolute -top-3 -right-3 text-gray-200">
        {/* Placeholder for icon */}
        <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
      </div>
      <div className="relative z-10 p-4">
        <div className="h-5 bg-gray-300 rounded w-3/4 mb-3"></div>
        <div className="h-9 bg-gray-300 rounded w-1/2"></div>
      </div>
    </Card>
  );
};
export default SkeletonDashboardCard;
