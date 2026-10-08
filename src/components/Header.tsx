import React, { useState } from 'react';
import { AppConfig, StudentProfile, GameMode } from '../types';
import { soundFx } from '../utils/sound';
import {
  GraduationCap,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  User,
  Settings,
  BookOpen,
  FileCheck,
  Zap,
  Swords,
  Stethoscope,
  BarChart2,
  MonitorPlay
} from 'lucide-react';

interface HeaderProps {
  config: AppConfig;
  student: StudentProfile;
  activeMode: GameMode | 'admin' | 'dashboard';
  onSelectMode: (mode: GameMode | 'admin' | 'dashboard') => void;
  onOpenProfile: () => void;
  onOpenDiagnostics: () => void;
  onToggleSound: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  config,
  student,
  activeMode,
  onSelectMode,
  onOpenProfile,
  onOpenDiagnostics,
  onToggleSound,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    soundFx.playClick();
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  const themeClasses: Record<string, { bg: string; text: string; badge: string; tabActive: string }> = {
    blue: {
      bg: 'bg-blue-600',
      text: 'text-blue-600',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      tabActive: 'bg-blue-600 text-white shadow-md shadow-blue-200',
    },
    indigo: {
      bg: 'bg-indigo-600',
      text: 'text-indigo-600',
      badge: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      tabActive: 'bg-indigo-600 text-white shadow-md shadow-indigo-200',
    },
    emerald: {
      bg: 'bg-emerald-600',
      text: 'text-emerald-600',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      tabActive: 'bg-emerald-600 text-white shadow-md shadow-emerald-200',
    },
    rose: {
      bg: 'bg-rose-600',
      text: 'text-rose-600',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      tabActive: 'bg-rose-600 text-white shadow-md shadow-rose-200',
    },
    amber: {
      bg: 'bg-amber-600',
      text: 'text-amber-600',
      badge: 'bg-amber-50 text-amber-700 border-amber-200',
      tabActive: 'bg-amber-600 text-white shadow-md shadow-amber-200',
    },
    purple: {
      bg: 'bg-purple-600',
      text: 'text-purple-600',
      badge: 'bg-purple-50 text-purple-700 border-purple-200',
      tabActive: 'bg-purple-600 text-white shadow-md shadow-purple-200',
    },
  };

  const theme = themeClasses[config.themeColor] || themeClasses.blue;

  return (
    <header className="bg-white/95 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Top Banner & Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5">
        <div className="flex flex-col md:flex-row items-center justify-between gap-3">
          {/* Brand & Title */}
          <div className="flex items-center gap-3.5 w-full md:w-auto">
            <div
              onClick={() => onSelectMode('Tự học')}
              className={`w-12 h-12 rounded-2xl ${theme.bg} text-white flex items-center justify-center font-bold text-xl shadow-md cursor-pointer transition-transform hover:scale-105 shrink-0 overflow-hidden`}
            >
              {config.logoUrl ? (
                <img src={config.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <GraduationCap className="w-7 h-7" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${theme.badge}`}>
                  {config.topBadge || 'EDUCATION APP v3.1 STABLE'}
                </span>
                {config.orgName && (
                  <span className="text-xs text-slate-500 font-medium truncate hidden sm:inline">
                    • {config.orgName}
                  </span>
                )}
              </div>
              <h1 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight truncate">
                {config.appName}
              </h1>
            </div>
          </div>

          {/* Quick Controls: Student info, Sound, Fullscreen, Diagnostics, Admin */}
          <div className="flex items-center gap-2 self-end md:self-auto flex-wrap">
            {/* Student Profile Pill */}
            {config.showStudentInfoInHeader && (
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-700 text-xs font-semibold transition border border-slate-200/60 shadow-2xs"
                title="Thay đổi hồ sơ học sinh"
              >
                <div className="w-5 h-5 rounded-full bg-blue-500 text-white flex items-center justify-center text-[10px]">
                  <User className="w-3 h-3" />
                </div>
                <div className="text-left hidden xs:block">
                  <span className="truncate max-w-[120px] block">{student.name}</span>
                </div>
                <span className="text-[10px] text-slate-400">({student.className})</span>
              </button>
            )}

            {/* Sound Toggle */}
            <button
              onClick={onToggleSound}
              className={`p-2 rounded-xl text-xs font-medium border transition ${
                config.soundEnabled
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
              }`}
              title={config.soundEnabled ? 'Âm thanh: Đang BẬT' : 'Âm thanh: Đang TẮT'}
            >
              {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl text-slate-600 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-xs transition"
              title="Toàn màn hình (F11/Fullscreen)"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* System Diagnostics (Step 9) */}
            <button
              onClick={onOpenDiagnostics}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition"
              title="Kiểm tra hệ thống (LocalStorage, IndexedDB, Question Bank, Gemini)"
            >
              <Stethoscope className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Kiểm tra</span>
            </button>
            
            {/* API Key Settings Button */}
            <button
              onClick={() => document.dispatchEvent(new CustomEvent('OPEN_API_KEY_MODAL'))}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition whitespace-nowrap"
              title="Cài đặt API Key để sử dụng app"
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Lấy API key để sử dụng app</span>
            </button>

            {/* Admin Studio Button */}
            <button
              onClick={() => onSelectMode('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
                activeMode === 'admin'
                  ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              <span>Admin Studio</span>
            </button>
          </div>
        </div>

        {/* Student Navigation Modes Bar */}
        <nav className="mt-3 pt-2.5 border-t border-slate-100 flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-0.5 custom-scrollbar">
          <button
            onClick={() => onSelectMode('Tự học')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
              activeMode === 'Tự học'
                ? theme.tabActive
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>1. Tự học</span>
          </button>

          <button
            onClick={() => onSelectMode('Thi thử')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
              activeMode === 'Thi thử'
                ? theme.tabActive
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileCheck className="w-4 h-4" />
            <span>2. Thi thử</span>
          </button>

          <button
            onClick={() => onSelectMode('Phản xạ')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
              activeMode === 'Phản xạ'
                ? theme.tabActive
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4" />
            <span>3. Phản xạ nhanh</span>
          </button>

          <button
            onClick={() => onSelectMode('Đối kháng')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
              activeMode === 'Đối kháng'
                ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Swords className="w-4 h-4 text-amber-300" />
            <span>4. Đối kháng 2 đội (Phím A & L)</span>
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1 shrink-0 hidden sm:block"></div>

          <button
            onClick={() => onSelectMode('Giáo viên')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
              activeMode === 'Giáo viên'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-200'
                : 'text-slate-600 hover:bg-purple-50 hover:text-purple-700'
            }`}
          >
            <MonitorPlay className="w-4 h-4" />
            <span>Giáo viên</span>
          </button>

          <div className="w-px h-5 bg-slate-200 mx-1 shrink-0 hidden sm:block"></div>

          <button
            onClick={() => onSelectMode('dashboard')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition shrink-0 ${
              activeMode === 'dashboard'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                : 'text-slate-600 hover:bg-amber-50 hover:text-amber-700'
            }`}
          >
            <BarChart2 className="w-4 h-4" />
            <span>Thành tích</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
