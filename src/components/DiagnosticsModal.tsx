import React, { useState, useEffect } from 'react';
import { DiagnosticResult } from '../types';
import { runSystemDiagnostics } from '../utils/diagnostics';
import { soundFx } from '../utils/sound';
import {
  Stethoscope,
  X,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Database,
  Layers,
  Palette,
  FileCode,
  Sparkles,
  Save
} from 'lucide-react';

interface DiagnosticsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DiagnosticsModal: React.FC<DiagnosticsModalProps> = ({ isOpen, onClose }) => {
  const [result, setResult] = useState<DiagnosticResult | null>(null);
  const [loading, setLoading] = useState(false);

  const executeCheck = async () => {
    setLoading(true);
    soundFx.playClick();
    try {
      const res = await runSystemDiagnostics();
      setResult(res);
      if (res.localStorage.ok && res.configPersistence.ok) {
        soundFx.playCorrect();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      executeCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 bg-linear-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-xs">
              <Stethoscope className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg">🩺 Kiểm Tra Hệ Thống (System Health)</h3>
              <p className="text-xs text-emerald-100">EDUCATION APP v3.1 STABLE Diagnostic Suite</p>
            </div>
          </div>
          <button
            onClick={() => { soundFx.playClick(); onClose(); }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 overflow-y-auto space-y-4 flex-1">
          {loading && (
            <div className="py-12 text-center text-slate-500 font-medium">
              <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              Đang phân tích các thành phần cốt lõi của ứng dụng...
            </div>
          )}

          {!loading && result && (
            <div className="space-y-3">
              {/* 1. LocalStorage */}
              <div className="p-4 rounded-2xl border bg-slate-50 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-slate-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">1. Bộ nhớ LocalStorage</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{result.localStorage.message}</p>
                  </div>
                </div>
                {result.localStorage.ok ? (
                  <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4" /> Đạt
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1 text-xs font-bold shrink-0">
                    <XCircle className="w-4 h-4" /> Lỗi
                  </span>
                )}
              </div>

              {/* 2. IndexedDB */}
              <div className="p-4 rounded-2xl border bg-slate-50 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Database className="w-5 h-5 text-indigo-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">2. Cơ sở dữ liệu IndexedDB</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{result.indexedDb.message}</p>
                  </div>
                </div>
                {result.indexedDb.ok ? (
                  <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4" /> Đạt
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1 text-xs font-bold shrink-0">
                    <XCircle className="w-4 h-4" /> Lỗi
                  </span>
                )}
              </div>

              {/* 3. Question Bank */}
              <div className="p-4 rounded-2xl border bg-slate-50 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Layers className="w-5 h-5 text-blue-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">3. Ngân hàng câu hỏi</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tổng số: <strong>{result.questionBank.count}</strong> câu • Đã xuất bản: <strong>{result.questionBank.published}</strong> • Bản nháp: <strong>{result.questionBank.draft}</strong>
                    </p>
                  </div>
                </div>
                {result.questionBank.ok ? (
                  <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4" /> Đạt
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1 text-xs font-bold shrink-0">
                    <XCircle className="w-4 h-4" /> Trống
                  </span>
                )}
              </div>

              {/* 4. UI Theme */}
              <div className="p-4 rounded-2xl border bg-slate-50 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Palette className="w-5 h-5 text-purple-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">4. Hệ thống Giao diện & Chủ đề</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{result.uiTheme.currentTheme}</p>
                  </div>
                </div>
                {result.uiTheme.ok ? (
                  <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4" /> Đạt
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1 text-xs font-bold shrink-0">
                    <XCircle className="w-4 h-4" /> Lỗi
                  </span>
                )}
              </div>

              {/* 5. File API */}
              <div className="p-4 rounded-2xl border bg-slate-50 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <FileCode className="w-5 h-5 text-amber-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">5. File API & Tối ưu hình ảnh</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      FileReader, Blob, Canvas Compressor sẵn sàng cho xuất bản và tối ưu logo.
                    </p>
                  </div>
                </div>
                {result.fileApi.ok ? (
                  <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4" /> Đạt
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1 text-xs font-bold shrink-0">
                    <XCircle className="w-4 h-4" /> Lỗi
                  </span>
                )}
              </div>

              {/* 6. Gemini API */}
              <div className="p-4 rounded-2xl border bg-slate-50 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Sparkles className="w-5 h-5 text-teal-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">6. Trạng thái Gemini API AI</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{result.geminiApi.message}</p>
                  </div>
                </div>
                {result.geminiApi.ok ? (
                  <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4" /> Đã kết nối
                  </span>
                ) : (
                  <span className="text-amber-600 flex items-center gap-1 text-xs font-bold shrink-0">
                    <XCircle className="w-4 h-4" /> Chưa bật
                  </span>
                )}
              </div>

              {/* 7. Config Persistence Step 32 */}
              <div className="p-4 rounded-2xl border bg-slate-50 flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <Save className="w-5 h-5 text-emerald-500 mt-0.5 shrink-0" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-800">7. Khả năng lưu cấu hình v3.1</h4>
                    <p className="text-xs text-slate-500 mt-0.5">{result.configPersistence.message}</p>
                  </div>
                </div>
                {result.configPersistence.ok ? (
                  <span className="text-emerald-600 flex items-center gap-1 text-xs font-bold shrink-0">
                    <CheckCircle2 className="w-4 h-4" /> Ổn định
                  </span>
                ) : (
                  <span className="text-rose-600 flex items-center gap-1 text-xs font-bold shrink-0">
                    <XCircle className="w-4 h-4" /> Thất bại
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center shrink-0">
          <button
            onClick={executeCheck}
            disabled={loading}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Chạy kiểm tra lại</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
