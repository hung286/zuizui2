import React, { useState, useEffect } from 'react';
import {
  AppConfig,
  Question,
  StudentProfile,
  PlayHistory,
  GameMode,
} from './types';
import {
  getAppConfig,
  getQuestionBank,
  getPlayHistory,
  getStudentProfile,
  saveStudentProfile,
  saveAppConfigVerified,
} from './utils/storage';
import { soundFx } from './utils/sound';
import { Header } from './components/Header';
import { StudentProfileModal } from './components/StudentProfileModal';
import { DiagnosticsModal } from './components/DiagnosticsModal';
import { SelfStudyMode } from './components/SelfStudyMode';
import { MockExamMode } from './components/MockExamMode';
import { ReflexMode } from './components/ReflexMode';
import { BattleMode } from './components/BattleMode';
import { AdminStudio } from './components/admin/AdminStudio';
import { LeaderboardPanel } from './components/LeaderboardPanel';
import { ProgressDashboard } from './components/ProgressDashboard';
import { ApiKeyModal } from './components/ApiKeyModal';
import {
  GraduationCap,
  Sparkles,
  ShieldCheck,
  Stethoscope,
  Heart
} from 'lucide-react';

export default function App() {
  // Core Application State
  const [config, setConfig] = useState<AppConfig>(getAppConfig());
  const [questions, setQuestions] = useState<Question[]>(getQuestionBank());
  const [history, setHistory] = useState<PlayHistory[]>(getPlayHistory());
  const [student, setStudent] = useState<StudentProfile>(getStudentProfile());

  // UI Navigation
  const [activeMode, setActiveMode] = useState<GameMode | 'admin' | 'dashboard'>('Tự học');
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  // Sync sound FX state with config
  useEffect(() => {
    soundFx.setEnabled(config.soundEnabled);
  }, [config.soundEnabled]);

  const handleToggleSound = () => {
    const newVal = !config.soundEnabled;
    soundFx.setEnabled(newVal);
    const updated = { ...config, soundEnabled: newVal };
    setConfig(updated);
    saveAppConfigVerified(updated);
    if (newVal) soundFx.playClick();
  };

  const handleSaveStudent = (newProfile: StudentProfile) => {
    setStudent(newProfile);
    saveStudentProfile(newProfile);
  };

  const handleConfigUpdated = (newConfig: AppConfig) => {
    setConfig(newConfig);
  };

  const handleQuestionsUpdated = (newQuestions: Question[]) => {
    setQuestions(newQuestions);
  };

  const handleHistoryUpdated = (newHistory: PlayHistory[]) => {
    setHistory(newHistory);
  };

  const handleSystemReset = () => {
    setConfig(getAppConfig());
    setQuestions(getQuestionBank());
    setHistory(getPlayHistory());
    setStudent(getStudentProfile());
    setActiveMode('Tự học');
  };

  const handleSystemRestored = () => {
    setConfig(getAppConfig());
    setQuestions(getQuestionBank());
    setHistory(getPlayHistory());
    setStudent(getStudentProfile());
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* Top Header */}
      <Header
        config={config}
        student={student}
        activeMode={activeMode}
        onSelectMode={(mode) => {
          soundFx.playClick();
          setActiveMode(mode as any);
        }}
        onOpenProfile={() => {
          soundFx.playClick();
          setIsProfileOpen(true);
        }}
        onOpenDiagnostics={() => {
          soundFx.playClick();
          setIsDiagnosticsOpen(true);
        }}
        onToggleSound={handleToggleSound}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6 sm:py-8">
        {activeMode === 'Tự học' && (
          <SelfStudyMode questions={questions} student={student} />
        )}

        {activeMode === 'Thi thử' && (
          <MockExamMode
            questions={questions}
            student={student}
            config={config}
          />
        )}

        {activeMode === 'Phản xạ' && (
          <ReflexMode questions={questions} student={student} />
        )}

        {activeMode === 'Đối kháng' && (
          <BattleMode questions={questions} student={student} />
        )}

        {activeMode === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
            <ProgressDashboard student={student} history={history} />
            <LeaderboardPanel history={history} />
          </div>
        )}

        {activeMode === 'admin' && (
          <AdminStudio
            config={config}
            questions={questions}
            history={history}
            onConfigUpdated={handleConfigUpdated}
            onQuestionsUpdated={handleQuestionsUpdated}
            onHistoryUpdated={handleHistoryUpdated}
            onSystemReset={handleSystemReset}
            onSystemRestored={handleSystemRestored}
            onExitAdmin={() => {
              soundFx.playClick();
              setActiveMode('Tự học');
            }}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/80 backdrop-blur-xs py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-slate-800">
              {config.appName}
            </span>
            <span>•</span>
            <span className="font-medium">{config.topBadge || 'EDUCATION APP v3.1 STABLE'}</span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                soundFx.playClick();
                setIsDiagnosticsOpen(true);
              }}
              className="hover:text-blue-600 transition flex items-center gap-1 font-semibold"
            >
              <Stethoscope className="w-3.5 h-3.5 text-emerald-600" />
              <span>🩺 Kiểm tra hệ thống</span>
            </button>
            <span>•</span>
            <span className="flex items-center gap-1 text-slate-400">
              Độc lập 100% Offline Single-File Architecture
            </span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <StudentProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentProfile={student}
        onSave={handleSaveStudent}
      />

      <DiagnosticsModal
        isOpen={isDiagnosticsOpen}
        onClose={() => setIsDiagnosticsOpen(false)}
      />
      
      <ApiKeyModal />
    </div>
  );
}
