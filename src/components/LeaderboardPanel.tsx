import React, { useMemo } from 'react';
import { PlayHistory, LeaderboardEntry } from '../types';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';

interface LeaderboardPanelProps {
  history: PlayHistory[];
}

export const LeaderboardPanel: React.FC<LeaderboardPanelProps> = ({ history }) => {
  const leaderboard = useMemo(() => {
    const map = new Map<string, LeaderboardEntry>();

    history.forEach((h) => {
      const key = `${h.studentName}_${h.className}`;
      if (!map.has(key)) {
        map.set(key, {
          studentName: h.studentName,
          className: h.className,
          totalScore: 0,
          totalGames: 0,
          avgAccuracy: 0,
        });
      }
      const entry = map.get(key)!;
      entry.totalScore += h.score;
      entry.totalGames += 1;
      
      // We will recalculate avgAccuracy after summing up all accuracies
      // Using avgAccuracy to store sum of accuracy temporarily
      entry.avgAccuracy += h.accuracy;
    });

    const list = Array.from(map.values()).map(entry => {
      return {
        ...entry,
        avgAccuracy: entry.totalGames > 0 ? Math.round(entry.avgAccuracy / entry.totalGames) : 0,
      };
    });

    // Sort by total score descending, then avg accuracy descending
    list.sort((a, b) => {
      if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
      return b.avgAccuracy - a.avgAccuracy;
    });

    return list.slice(0, 10);
  }, [history]);

  return (
    <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 h-full flex flex-col">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
          <Trophy className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-800">Bảng Xếp Hạng</h2>
          <p className="text-xs text-slate-500">Top 10 học sinh xuất sắc nhất</p>
        </div>
      </div>

      {leaderboard.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-slate-400 py-10">
          <Trophy className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium">Chưa có dữ liệu thành tích</p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
          {leaderboard.map((entry, idx) => {
            let rankColor = 'text-slate-500';
            let bgRank = 'bg-slate-100';
            if (idx === 0) {
              rankColor = 'text-amber-500';
              bgRank = 'bg-amber-100 border border-amber-200';
            } else if (idx === 1) {
              rankColor = 'text-slate-400';
              bgRank = 'bg-slate-200 border border-slate-300';
            } else if (idx === 2) {
              rankColor = 'text-orange-400';
              bgRank = 'bg-orange-100 border border-orange-200';
            }

            return (
              <div key={`${entry.studentName}_${entry.className}`} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition border border-transparent hover:border-slate-100">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${bgRank} ${rankColor}`}>
                  {idx + 1}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-slate-800 truncate text-sm">{entry.studentName}</h4>
                  <p className="text-[10px] text-slate-500 truncate">{entry.className}</p>
                </div>

                <div className="text-right shrink-0">
                  <div className="font-bold text-blue-600 text-sm">{entry.totalScore} điểm</div>
                  <div className="text-[10px] text-slate-500 flex items-center justify-end gap-1 mt-0.5">
                    <TrendingUp className="w-3 h-3" />
                    {entry.avgAccuracy}% chính xác
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
