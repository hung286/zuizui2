import React, { useState, useEffect } from 'react';
import { X, Key, CheckCircle, ExternalLink, Cpu } from 'lucide-react';
import { soundFx } from '../utils/sound';

export const MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash Preview', desc: 'Nhanh, mặc định' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro Preview', desc: 'Chính xác cao' },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', desc: 'Dự phòng' }
];

export const ApiKeyModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [selectedModel, setSelectedModel] = useState('gemini-3-flash-preview');

  useEffect(() => {
    // Check if key exists on mount
    const savedKey = localStorage.getItem('edu_gemini_api_key');
    const savedModel = localStorage.getItem('edu_gemini_model');
    if (savedKey) {
      setApiKey(savedKey);
      if (savedModel) setSelectedModel(savedModel);
    }

    const openHandler = () => setIsOpen(true);
    document.addEventListener('OPEN_API_KEY_MODAL', openHandler);
    return () => document.removeEventListener('OPEN_API_KEY_MODAL', openHandler);
  }, []);

  const handleSave = () => {
    soundFx.playClick();
    if (!apiKey.trim()) return;
    localStorage.setItem('edu_gemini_api_key', apiKey.trim());
    localStorage.setItem('edu_gemini_model', selectedModel);
    setIsOpen(false);
  };

  const handleClose = () => {
    soundFx.playClick();
    setIsOpen(false);
  };

  if (!isOpen) return null;

  const hasKey = !!localStorage.getItem('edu_gemini_api_key');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Cài đặt API Key & Model AI</h2>
              <p className="text-sm text-slate-500">Cấu hình Gemini AI để sinh câu hỏi tự động</p>
            </div>
          </div>
          {true && (
            <button onClick={handleClose} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="p-6 overflow-y-auto">
          {!hasKey && (
            <div className="mb-6 p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-sm">
              <p className="font-semibold mb-1">Chào mừng bạn đến với Education App!</p>
              <p>Để bắt đầu, bạn cần cung cấp một API Key của Google Gemini. API Key này được lưu trữ <strong>an toàn trên trình duyệt của bạn (localStorage)</strong> và không được gửi đi đâu khác.</p>
            </div>
          )}

          <div className="mb-6">
            <label className="block text-sm font-semibold text-slate-700 mb-2">1. Nhập Google Gemini API Key</label>
            <div className="relative">
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition outline-none font-mono"
              />
            </div>
            <div className="mt-2 text-sm text-slate-500 flex items-start gap-1.5">
              <ExternalLink className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                Lấy API key miễn phí tại:{' '}
                <a href="https://aistudio.google.com/api-keys" target="_blank" rel="noreferrer" className="text-blue-600 font-semibold hover:underline">
                  Google AI Studio
                </a>
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-3">2. Chọn Model AI</label>
            <div className="grid gap-3">
              {MODELS.map((model) => (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model.id)}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between ${
                    selectedModel === model.id
                      ? 'border-blue-600 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Cpu className={`w-5 h-5 ${selectedModel === model.id ? 'text-blue-600' : 'text-slate-400'}`} />
                    <div>
                      <h4 className={`font-semibold ${selectedModel === model.id ? 'text-blue-700' : 'text-slate-700'}`}>
                        {model.name}
                      </h4>
                      <p className="text-xs text-slate-500 mt-0.5 font-mono">{model.id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-medium text-slate-500 block mb-1">{model.desc}</span>
                    {selectedModel === model.id && <CheckCircle className="w-5 h-5 text-blue-600 inline-block" />}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
          {true && (
            <button
              onClick={handleClose}
              className="px-5 py-2.5 rounded-xl font-semibold text-slate-600 hover:bg-slate-200 transition"
            > Bỏ qua </button>
          )}
          <button
            onClick={handleSave}
            disabled={!apiKey.trim()}
            className="px-6 py-2.5 rounded-xl font-semibold bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md"
          >
            Lưu Cấu Hình
          </button>
        </div>
      </div>
    </div>
  );
};
