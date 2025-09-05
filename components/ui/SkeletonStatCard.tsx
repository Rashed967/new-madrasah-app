import React from 'react';
import { Card } from './Card';

const SkeletonStatCard: React.FC = () => {
  return (
    <Card className="animate-pulse">
      <div className="p-6">
        <div className="mx-auto h-12 w-12 rounded-full bg-gray-300"></div>
        <div className="mt-4 h-4 w-3/4 mx-auto rounded bg-gray-300"></div>
        <div className="mt-2 h-8 w-1/2 mx-auto rounded bg-gray-300"></div>
      </div>
    </Card>
  );
};

export default SkeletonStatCard;
