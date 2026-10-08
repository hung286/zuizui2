import React, { useState, useEffect } from 'react';
import { AppConfig, Question, LearningMaterial, PlayHistory } from '../../types';
import { ConfigTab } from './ConfigTab';
import { QuestionBankTab } from './QuestionBankTab';
import { MaterialsTab } from './MaterialsTab';
import { AIGeneratorTab } from './AIGeneratorTab';
import { HistoryTab } from './HistoryTab';
import { BackupTab } from './BackupTab';
import { DashboardTab } from './DashboardTab';
import { ToolsTab } from './ToolsTab';
import { soundFx } from '../../utils/sound';
import {
  Settings,
  Layers,
  BookOpen,
  PieChart,
  Sparkles,
  History,
  HardDrive,
  Lock,
  Unlock,
  KeyRound,
  ShieldCheck,
  Check,
  X
} from 'lucide-react';

interface AdminStudioProps {
  config: AppConfig;
  questions: Question[];
  history: PlayHistory[];
  onConfigUpdated: (newConfig: AppConfig) => void;
  onQuestionsUpdated: (newQuestions: Question[]) => void;
  onHistoryUpdated: (newHistory: PlayHistory[]) => void;
  onSystemReset: () => void;
  onSystemRestored: () => void;
  onExitAdmin: () => void;
}

type AdminTab = 'dashboard' | 'config' | 'questions' | 'materials' | 'ai' | 'history' | 'backup' | 'tools';

export const AdminStudio: React.FC<AdminStudioProps> = ({
  config,
  questions,
  history,
  onConfigUpdated,
  onQuestionsUpdated,
  onHistoryUpdated,
  onSystemReset,
  onSystemRestored,
  onExitAdmin,
}) => {
  // PIN lock state (Step 8)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);

  // Active Tab
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');

  // Materials list for AI generator
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);

  useEffect(() => {
    import('../../utils/indexedDB').then(m => {
      m.indexedDBManager.getAllMaterials().then(items => setMaterials(items)).catch(() => {});
    });
  }, [activeTab]);

  // Passing material to AI generator
  const [materialForAI, setMaterialForAI] = useState<LearningMaterial | null>(null);

  // Check PIN
  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    const correctPin = config.adminPin || '1234';
    if (pinInput === correctPin) {
      soundFx.playCorrect();
      setIsUnlocked(true);
      setPinError(false);
    } else {
      soundFx.playWrong();
      setPinError(true);
      setPinInput('');
    }
  };

  // Lock admin
  const handleLock = () => {
    soundFx.playClick();
    setIsUnlocked(false);
    setPinInput('');
  };

  // Navigate to AI tab with selected material
  const handleSelectMaterialForAI = (mat: LearningMaterial) => {
    setMaterialForAI(mat);
    setActiveTab('ai');
    soundFx.playClick();
  };

  // 1. PIN Lock Screen (Step 8)
  if (!isUnlocked) {
    return (
      <div className="max-w-md mx-auto my-12 bg-white rounded-3xl p-8 border border-slate-200 shadow-xl text-center animate-in fade-in duration-200">
        <div className="w-16 h-16 rounded-3xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
          <KeyRound className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-extrabold text-slate-900 mb-1">
          Admin Studio Bảo Mật (PIN)
        </h2>
        <p className="text-xs text-slate-500 mb-6 leading-relaxed">
          Khu vực quản trị học liệu, ngân hàng câu hỏi và cấu hình cuộc thi dành riêng cho giáo viên.
        </p>

        <form onSubmit={handleUnlock} className="space-y-4">
          <div className="relative">
            <input
              type="password"
              maxLength={10}
              autoFocus
              value={pinInput}
              onChange={e => {
                setPinInput(e.target.value);
                setPinError(false);
              }}
              placeholder="Nhập mã PIN (Mặc định: 1234)"
              className="w-full text-center text-lg font-black tracking-widest py-3 rounded-2xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          {pinError && (
            <p className="text-xs text-rose-600 font-semibold animate-shake">
              Mã PIN không chính xác. Vui lòng thử lại!
            </p>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onExitAdmin}
              className="flex-1 py-3 rounded-2xl border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold transition"
            >
              Quay lại chế độ học
            </button>
            <button
              type="submit"
              className="flex-1 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-4 h-4" />
              <span>Mở khóa Studio</span>
            </button>
          </div>
        </form>
      </div>
    );
  }

  // 2. Main Admin Studio Workspace
  return (
    <div className="space-y-6">
      {/* Studio Header Bar */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-md flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-white shrink-0 backdrop-blur-xs">
            <Settings className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="inline-block px-2 py-0.5 bg-amber-400/20 text-amber-300 text-[10px] font-bold rounded-full uppercase tracking-wider mb-0.5">
              Admin Studio v3.1
            </div>
            <h2 className="text-xl font-extrabold text-white">Quản Trị Hệ Thống & Nội Dung</h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleLock}
            className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/10"
            title="Khóa lại"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Khóa Admin</span>
          </button>
          <button
            onClick={onExitAdmin}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-xs transition"
          >
            Trở về màn hình học sinh ➡️
          </button>
        </div>
      </div>

      {/* Admin Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'dashboard'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <PieChart className="w-4 h-4" />
          <span>Thống kê & Tổng quan</span>
        </button>

        <button
          onClick={() => setActiveTab('questions')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'questions'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Ngân hàng câu hỏi ({questions.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('materials')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'materials'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Học liệu (IndexedDB)</span>
        </button>

        <button
          onClick={() => setActiveTab('ai')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'ai'
              ? 'bg-purple-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span>AI Question Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'config'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Settings className="w-4 h-4" />
          <span>Cấu hình & Nhận diện</span>
        </button>

        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'tools'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Công cụ & Geogebra</span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'history'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Lịch sử & Báo cáo ({history.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('backup')}
          className={`px-4 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition flex items-center gap-2 shrink-0 ${
            activeTab === 'backup'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Sao lưu, Khôi phục & HTML</span>
        </button>
      </div>

      {/* Active Tab Panel */}
      <main className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm min-h-[500px]">
        {activeTab === 'dashboard' && (
          <DashboardTab questions={questions} history={history} />
        )}

        {activeTab === 'config' && (
          <ConfigTab currentConfig={config} onConfigUpdated={onConfigUpdated} />
        )}

        {activeTab === 'questions' && (
          <QuestionBankTab
            questions={questions}
            onQuestionsChange={onQuestionsUpdated}
          />
        )}

        {activeTab === 'materials' && (
          <MaterialsTab onSelectForGenerator={handleSelectMaterialForAI} />
        )}

        {activeTab === 'ai' && (
          <AIGeneratorTab
            materials={materials}
            preselectedMaterial={materialForAI}
            onPublishQuestions={(newOnes) => {
              const updated = [...newOnes, ...questions];
              onQuestionsUpdated(updated);
            }}
          />
        )}

        {activeTab === 'history' && (
          <HistoryTab history={history} onHistoryChange={onHistoryUpdated} />
        )}

        {activeTab === 'tools' && (
          <ToolsTab />
        )}

        {activeTab === 'backup' && (
          <BackupTab
            config={config}
            questions={questions}
            onSystemReset={onSystemReset}
            onSystemRestored={onSystemRestored}
          />
        )}
      </main>
    </div>
  );
};
