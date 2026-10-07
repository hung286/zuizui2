import React from 'react';
import { Badge } from '../types';

interface BadgeDisplayProps {
  badge: Badge;
  earned?: boolean;
}

export const BadgeDisplay: React.FC<BadgeDisplayProps> = ({ badge, earned = true }) => {
  return (
    <div className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 ${earned ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-gray-50 opacity-60'} transition-all hover:scale-105`}>
      <div className="text-3xl mb-2">{badge.icon}</div>
      <div className={`font-semibold text-sm text-center ${earned ? 'text-amber-700' : 'text-gray-500'}`}>{badge.name}</div>
      <div className="text-xs text-center text-gray-500 mt-1">{badge.description}</div>
      {earned && badge.earnedAt && (
        <div className="text-[10px] text-gray-400 mt-2">
          {new Date(badge.earnedAt).toLocaleDateString('vi-VN')}
        </div>
      )}
    </div>
  );
};
