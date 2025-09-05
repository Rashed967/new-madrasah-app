
import React from 'react';
import { Card } from './ui/Card';
import { DashboardStat } from '../types';

interface DashboardCardProps {
  stat: DashboardStat;
}

const DashboardCard: React.FC<DashboardCardProps> = ({ stat }) => {
  return (
    <Card className="relative overflow-hidden transition-all hover:shadow-2xl hover:scale-105 bg-white group">
      <div className="absolute -top-3 -right-3 text-emerald-500/20 group-hover:text-emerald-500/30 transition-colors duration-300">
        {/* Clone icon to set consistent size and color */}
        {React.cloneElement(stat.icon, { 
          className: "w-16 h-16 text-emerald-500" 
        })}
      </div>
      <div className="relative z-10 p-4">
        <h3 className="text-lg font-semibold text-gray-700">{stat.title}</h3>
        <p className="text-4xl font-bold mt-2 text-emerald-600">{stat.value}</p>
      </div>
    </Card>
  );
};

export default DashboardCard;
