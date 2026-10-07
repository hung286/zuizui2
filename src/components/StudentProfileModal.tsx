import React, { useState, useEffect } from 'react';
import { StudentProfile } from '../types';
import { soundFx } from '../utils/sound';
import { User, X, Check, School, Trophy } from 'lucide-react';
import { getEarnedBadges, getBadgeProgress, BADGE_CATALOG } from '../utils/badges';
import { BadgeDisplay } from './BadgeDisplay';

interface StudentProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProfile: StudentProfile;
  onSave: (profile: StudentProfile) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  isOpen,
  onClose,
  currentProfile,
  onSave,
}) => {
  const [name, setName] = useState(currentProfile.name);
  const [className, setClassName] = useState(currentProfile.className);
  
  const [earnedBadges, setEarnedBadges] = useState(getEarnedBadges(currentProfile.name, currentProfile.className));
  const [badgeProgress, setBadgeProgress] = useState(getBadgeProgress(currentProfile.name, currentProfile.className));

  useEffect(() => {
    if (isOpen) {
      setName(currentProfile.name);
      setClassName(currentProfile.className);
      setEarnedBadges(getEarnedBadges(currentProfile.name, currentProfile.className));
      setBadgeProgress(getBadgeProgress(currentProfile.name, currentProfile.className));
    }
  }, [isOpen, currentProfile]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();
    onSave({
      name: name.trim() || 'Học sinh',
      className: className.trim() || 'Lớp 12A1',
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden transform scale-100 transition-all my-8">
        {/* Header */}
        <div className="p-6 bg-linear-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">Hồ sơ học sinh & Thành tích</h3>
              <p className="text-xs text-blue-100">Lưu cục bộ trên trình duyệt</p>
            </div>
          </div>
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex flex-col md:flex-row">
          {/* Form */}
          <form onSubmit={handleSubmit} className="p-6 space-y-4 md:w-1/2 border-b md:border-b-0 md:border-r border-slate-200">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Họ và tên học sinh / Đội thi
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: Nguyễn Văn An"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Lớp / Nhóm / Khối
              </label>
              <div className="relative">
                <School className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="Ví dụ: Lớp 12A1 hoặc Nhóm Sao Vàng"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm font-medium"
                />
              </div>
            </div>

            <div className="p-3 bg-blue-50 rounded-xl text-blue-800 text-xs flex items-start gap-2">
              <span className="text-base leading-none">ℹ️</span>
              <span>
                Thông tin này được dùng để ghi danh vào bảng điểm các bài thi thử, phản xạ nhanh và lịch sử học tập.
              </span>
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 text-sm font-semibold transition"
              >
                Hủy
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                <span>Lưu thông tin</span>
              </button>
            </div>
          </form>

          {/* Badges Section */}
          <div className="p-6 md:w-1/2 bg-slate-50">
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="w-5 h-5 text-amber-500" />
              <h4 className="font-bold text-slate-800">Bộ Sưu Tập Huy Hiệu</h4>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-slate-600">Tiến trình</span>
                <span className="font-bold text-blue-600">{badgeProgress.earned} / {badgeProgress.total}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all" 
                  style={{ width: `${badgeProgress.percentage}%` }}
                ></div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
              {Object.values(BADGE_CATALOG).map(badgeTpl => {
                const earned = earnedBadges.find(b => b.id === badgeTpl.id);
                return (
                  <BadgeDisplay key={badgeTpl.id} badge={earned || badgeTpl} earned={!!earned} />
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
