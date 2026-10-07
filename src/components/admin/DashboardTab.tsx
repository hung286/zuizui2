import React, { useMemo } from 'react';
import { Question, PlayHistory } from '../../types';
import { 
  Users, 
  Target, 
  HelpCircle, 
  TrendingUp, 
  AlertCircle,
  Award
} from 'lucide-react';

interface DashboardTabProps {
  questions: Question[];
  history: PlayHistory[];
}

export const DashboardTab: React.FC<DashboardTabProps> = ({ questions, history }) => {
  // 1. Basic Stats
  const totalQuestions = questions.length;
  const totalPlays = history.length;
  
  const averageAccuracy = useMemo(() => {
    if (history.length === 0) return 0;
    const totalAccuracy = history.reduce((sum, h) => sum + h.accuracy, 0);
    return Math.round(totalAccuracy / history.length);
  }, [history]);

  // 2. Top 5 Students
  const topStudents = useMemo(() => {
    const studentMap = new Map<string, { name: string, className: string, plays: number, score: number }>();
    
    history.forEach(h => {
      const key = `${h.studentName}-${h.className}`;
      if (!studentMap.has(key)) {
        studentMap.set(key, { name: h.studentName, className: h.className, plays: 0, score: 0 });
      }
      const student = studentMap.get(key)!;
      student.plays += 1;
      student.score += h.score;
    });

    return Array.from(studentMap.values())
      .sort((a, b) => b.plays - a.plays || b.score - a.score)
      .slice(0, 5);
  }, [history]);

  // 3. Top 5 Most Incorrectly Answered Questions
  const topIncorrectQuestions = useMemo(() => {
    const errorCountMap = new Map<string, number>();

    history.forEach(h => {
      if (h.details) {
        try {
          const parsed = JSON.parse(h.details);
          // Assuming details is an array of objects like { questionId, isCorrect } or similar.
          if (Array.isArray(parsed)) {
            parsed.forEach((detail: any) => {
              if (detail.questionId && detail.isCorrect === false) {
                const count = errorCountMap.get(detail.questionId) || 0;
                errorCountMap.set(detail.questionId, count + 1);
              }
            });
          }
        } catch (e) {
          // ignore parse error
        }
      }
    });

    return Array.from(errorCountMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id, errors]) => {
        const q = questions.find(q => q.id === id);
        return {
          id,
          questionText: q ? q.question : 'Câu hỏi đã bị xoá',
          errors
        };
      });
  }, [history, questions]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
          <TrendingUp className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900">Tổng Quan Hệ Thống</h2>
          <p className="text-sm text-slate-500">Thống kê dữ liệu hoạt động của học sinh</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Tổng câu hỏi</p>
            <p className="text-3xl font-black text-slate-900">{totalQuestions}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Tổng lượt chơi</p>
            <p className="text-3xl font-black text-slate-900">{totalPlays}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500 mb-1">Độ chính xác trung bình</p>
            <p className="text-3xl font-black text-slate-900">{averageAccuracy}%</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Students */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <Award className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-slate-800">Top 5 Học sinh năng nổ nhất</h3>
          </div>
          <div className="p-0">
            {topStudents.length === 0 ? (
              <p className="text-sm text-slate-500 p-5 text-center">Chưa có dữ liệu học sinh.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {topStudents.map((student, idx) => (
                  <li key={idx} className="p-4 hover:bg-slate-50 flex items-center justify-between transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
                        idx === 0 ? 'bg-amber-100 text-amber-600' :
                        idx === 1 ? 'bg-slate-200 text-slate-600' :
                        idx === 2 ? 'bg-orange-100 text-orange-600' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        #{idx + 1}
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 text-sm">{student.name}</p>
                        <p className="text-xs text-slate-500">{student.className}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-blue-600">{student.plays} lượt</p>
                      <p className="text-xs text-slate-500">{student.score} điểm</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Most Incorrectly Answered Questions */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-rose-500" />
            <h3 className="font-bold text-slate-800">Top 5 Câu hỏi sai nhiều nhất</h3>
          </div>
          <div className="p-0">
            {topIncorrectQuestions.length === 0 ? (
              <p className="text-sm text-slate-500 p-5 text-center">Chưa có dữ liệu câu sai.</p>
            ) : (
              <ul className="divide-y divide-slate-100">
                {topIncorrectQuestions.map((item, idx) => (
                  <li key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-slate-900 font-medium line-clamp-2" title={item.questionText}>
                          {item.questionText}
                        </p>
                      </div>
                      <div className="shrink-0 bg-rose-50 text-rose-600 px-2.5 py-1 rounded-lg text-xs font-bold">
                        {item.errors} lỗi sai
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
