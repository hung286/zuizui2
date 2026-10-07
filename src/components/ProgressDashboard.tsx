import React, { useMemo } from 'react';
import { PlayHistory, StudentProfile } from '../types';
import { Activity, BarChart2, Star, Target, Clock, Zap } from 'lucide-react';

interface ProgressDashboardProps {
  student: StudentProfile;
  history: PlayHistory[];
}

export const ProgressDashboard: React.FC<ProgressDashboardProps> = ({ student, history }) => {
  const stats = useMemo(() => {
    const myHistory = history.filter(
      (h) => h.studentName === student.name && h.className === student.className
    );

    const totalGames = myHistory.length;
    let totalScore = 0;
    let totalTime = 0;
    let totalAcc = 0;

    const modeCounts: Record<string, number> = {};

    myHistory.forEach((h) => {
      totalScore += h.score;
      totalTime += h.timeSpentSeconds;
      totalAcc += h.accuracy;
      modeCounts[h.mode] = (modeCounts[h.mode] || 0) + 1;
    });

    let favoriteMode = 'Chưa có';
    let maxModeCount = 0;
    for (const [mode, count] of Object.entries(modeCounts)) {
      if (count > maxModeCount) {
        maxModeCount = count;
        favoriteMode = mode;
      }
    }

    const avgScore = totalGames > 0 ? Math.round(totalScore / totalGames) : 0;
    const avgAcc = totalGames > 0 ? Math.round(totalAcc / totalGames) : 0;
    
    // Recent 7 days activity
    const days: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      days[dateStr] = 0;
    }

    myHistory.forEach((h) => {
      const d = new Date(h.timestamp);
      const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
      if (days[dateStr] !== undefined) {
        days[dateStr] += h.score; // Or maybe count of games, let's use score.
      }
    });

    return {
      totalGames,
      totalScore,
      totalTime,
      avgScore,
      avgAcc,
      favoriteMode,
      recentActivity: days,
    };
  }, [history, student]);

  const maxActivity = Math.max(1, ...Object.values(stats.recentActivity));

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Tiến Độ Học Tập</h2>
            <p className="text-xs text-slate-500">Thống kê của {student.name}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
            <Target className="w-3.5 h-3.5" />
            <span>TỔNG ĐIỂM</span>
          </div>
          <div className="text-2xl font-bold text-slate-800">{stats.totalScore}</div>
        </div>
        
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
            <Zap className="w-3.5 h-3.5" />
            <span>ĐỘ CHÍNH XÁC</span>
          </div>
          <div className="text-2xl font-bold text-blue-600">{stats.avgAcc}%</div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>SỐ BÀI TẬP</span>
          </div>
          <div className="text-xl font-bold text-slate-800">{stats.totalGames}</div>
        </div>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
          <div className="flex items-center gap-2 text-slate-500 text-xs font-semibold mb-1">
            <Star className="w-3.5 h-3.5" />
            <span>CHẾ ĐỘ YÊU THÍCH</span>
          </div>
          <div className="text-xl font-bold text-amber-600">{stats.favoriteMode}</div>
        </div>
      </div>

      <div className="flex-1 min-h-[150px]">
        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Hoạt động 7 ngày qua (Điểm)
        </h3>
        
        <div className="flex items-end justify-between h-32 gap-2">
          {Object.entries(stats.recentActivity).map(([dateStr, score]) => {
            const height = Math.max(5, (score / maxActivity) * 100);
            return (
              <div key={dateStr} className="flex flex-col items-center gap-2 flex-1 group">
                <div className="relative w-full flex justify-center h-full items-end">
                  <div className="absolute -top-8 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    {score}
                  </div>
                  <div 
                    className="w-full max-w-[24px] bg-blue-500 rounded-t-sm transition-all duration-500 ease-out group-hover:bg-blue-600"
                    style={{ height: `${height}%` }}
                  ></div>
                </div>
                <div className="text-[9px] text-slate-500 font-medium truncate w-full text-center">
                  {dateStr}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
