import React, { useState } from 'react';
import { AppConfig, Question } from '../../types';
import {
  createSystemBackup,
  restoreSystemBackup,
  factoryResetSystem
} from '../../utils/storage';
import { exportStandaloneHtmlFile } from '../../utils/htmlExporter';
import { soundFx } from '../../utils/sound';
import {
  Download,
  Upload,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  FileCode,
  ShieldAlert,
  Save,
  Package
} from 'lucide-react';

interface BackupTabProps {
  config: AppConfig;
  questions: Question[];
  onSystemReset: () => void;
  onSystemRestored: () => void;
}

export const BackupTab: React.FC<BackupTabProps> = ({
  config,
  questions,
  onSystemReset,
  onSystemRestored,
}) => {
  const [restoreStatus, setRestoreStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [showConfirmReset, setShowConfirmReset] = useState(false);

  // Download System JSON Backup (Step 26)
  const handleDownloadBackup = () => {
    soundFx.playClick();
    const jsonStr = createSystemBackup();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Backup_Education_App_${config.appName.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    soundFx.playCorrect();
  };

  // Upload System JSON Restore (Step 27)
  const handleRestoreFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playClick();
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = (event.target?.result as string) || '';
      const result = restoreSystemBackup(text);
      setRestoreStatus(result);

      if (result.success) {
        soundFx.playVictory();
        onSystemRestored();
      } else {
        soundFx.playWrong();
      }
    };
    reader.readAsText(file);
  };

  // Standalone Single HTML File Export (Step 35)
  const handleExportSingleHtml = () => {
    soundFx.playClick();
    exportStandaloneHtmlFile(config, questions);
    soundFx.playVictory();
  };

  // Factory Reset (Step 29)
  const handleExecuteFactoryReset = () => {
    soundFx.playClick();
    factoryResetSystem();
    setShowConfirmReset(false);
    onSystemReset();
  };

  return (
    <div className="space-y-6">
      {/* Restore Status banner */}
      {restoreStatus && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 animate-in fade-in duration-200 ${
            restoreStatus.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {restoreStatus.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{restoreStatus.message}</span>
        </div>
      )}

      {/* Grid of Main Backup Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 1. JSON Backup */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
              <Download className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Sao Lưu Toàn Bộ Dữ Liệu (Backup JSON)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Xuất tệp JSON bao gồm: Cấu hình nhận diện, Ngân hàng câu hỏi (đã xuất bản và nháp), và Lịch sử kết quả. 
              (API Key được loại trừ an toàn).
            </p>
          </div>

          <button
            onClick={handleDownloadBackup}
            className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            <span>Tải Tệp Sao Lưu (.JSON)</span>
          </button>
        </div>

        {/* 2. JSON Restore */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
              <Upload className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">
              Khôi Phục Hệ Thống (Restore JSON)
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Khôi phục lại toàn bộ cấu hình và ngân hàng câu hỏi từ một tệp sao lưu trước đó hoặc chuyển đổi từ máy tính khác.
            </p>
          </div>

          <label className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition flex items-center justify-center gap-2 cursor-pointer">
            <Upload className="w-4 h-4" />
            <span>Chọn Tệp Khôi Phục (.JSON)</span>
            <input type="file" accept=".json" onChange={handleRestoreFile} className="hidden" />
          </label>
        </div>
      </div>

      {/* 3. Export Standalone Single HTML File (Highlight Step 35) */}
      <div className="bg-linear-to-r from-emerald-50 to-teal-50 rounded-3xl p-6 border border-emerald-200 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <Package className="w-6 h-6" />
            </div>
            <div>
              <div className="inline-block px-2 py-0.5 bg-emerald-200 text-emerald-900 font-bold text-[10px] rounded uppercase mb-1">
                Step 35: Hoạt Động Cục Bộ Không Cần Máy Chủ
              </div>
              <h3 className="text-base font-extrabold text-emerald-950">
                Xuất Gói 1 File HTML Duy Nhất (Single File HTML)
              </h3>
              <p className="text-xs text-emerald-800 leading-relaxed mt-0.5 max-w-xl">
                Đóng gói toàn bộ ứng dụng cùng ngân hàng câu hỏi và âm thanh thành <strong>1 file HTML độc lập</strong>. 
                Có thể chép vào USB, gửi qua Zalo/Email để mở trực tiếp trên máy chiếu lớp học mà không cần kết nối Internet!
              </p>
            </div>
          </div>

          <button
            onClick={handleExportSingleHtml}
            className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Tải File HTML Độc Lập</span>
          </button>
        </div>
      </div>

      {/* 4. Factory Reset (Step 29) */}
      <div className="bg-rose-50/60 rounded-3xl p-6 border border-rose-200 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-950">
                Khôi Phục Cài Đặt Gốc (Factory Reset - Step 29)
              </h4>
              <p className="text-xs text-rose-800/80 mt-0.5 max-w-lg leading-relaxed">
                Xóa toàn bộ cấu hình tùy chỉnh, câu hỏi đã chỉnh sửa, lịch sử học tập và học liệu để đưa ứng dụng về trạng thái nguyên bản.
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowConfirmReset(true)}
            className="px-4 py-2.5 rounded-xl bg-white border border-rose-300 text-rose-600 hover:bg-rose-600 hover:text-white font-bold text-xs transition shrink-0 shadow-2xs"
          >
            Khôi Phục Cài Đặt Gốc
          </button>
        </div>
      </div>

      {/* Confirm Factory Reset Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl border border-slate-200 p-6 text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-extrabold text-slate-900">
              Xác Nhận Khôi Phục Cài Đặt Gốc?
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Thao tác này sẽ xóa toàn bộ câu hỏi tùy chỉnh, bảng điểm và thiết lập nhận diện. 
              Bạn nên tải một bản <strong>Backup JSON</strong> trước khi tiếp tục.
            </p>

            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100"
              >
                Hủy bỏ
              </button>
              <button
                onClick={handleExecuteFactoryReset}
                className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md"
              >
                Đồng ý xóa & làm mới
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
