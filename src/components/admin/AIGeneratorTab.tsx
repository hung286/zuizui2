import React, { useState, useEffect } from 'react';
import { Question, LearningMaterial, Difficulty, QuestionStatus } from '../../types';
import { callGeminiApiWithFallback } from '../../utils/gemini';
import { getSessionGeminiKey, setSessionGeminiKey, clearSessionGeminiKey } from '../../utils/storage';
import { soundFx } from '../../utils/sound';
import {
  Sparkles,
  Sliders,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Send,
  Eye,
  Check,
  X,
  Layers,
  RotateCcw,
  BookOpen
} from 'lucide-react';

interface AIGeneratorTabProps {
  materials: LearningMaterial[];
  preselectedMaterial: LearningMaterial | null;
  onPublishQuestions: (newQuestions: Question[]) => void;
}

export const AIGeneratorTab: React.FC<AIGeneratorTabProps> = ({
  materials,
  preselectedMaterial,
  onPublishQuestions,
}) => {
  // Model selection
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.8-flash');
  const [serverKeyStatus, setServerKeyStatus] = useState<boolean>(false);
  const [sessionKey, setSessionKey] = useState<string>(getSessionGeminiKey());
  const [isTestingKey, setIsTestingKey] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  // Generator inputs
  const [inputType, setInputType] = useState<'material' | 'text'>('material');
  const [pastedText, setPastedText] = useState<string>('');
  const [selectedMatId, setSelectedMatId] = useState<string>(
    preselectedMaterial?.id || (materials[0]?.id || '')
  );
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [easyRatio, setEasyRatio] = useState<number>(40);
  const [medRatio, setMedRatio] = useState<number>(40);
  const [hardRatio, setHardRatio] = useState<number>(20);
  const [customTopic, setCustomTopic] = useState<string>('Lịch sử & Bài học');
  const [additionalPrompt, setAdditionalPrompt] = useState<string>('');

  // Generation process state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generatedDrafts, setGeneratedDrafts] = useState<Question[]>([]);
  const [generateError, setGenerateError] = useState<string | null>(null);

  // Check server key on mount
  useEffect(() => {
    fetch('/api/gemini/status')
      .then(r => r.json())
      .then(d => {
        setServerKeyStatus(Boolean(d.hasServerKey));
      })
      .catch(() => {});
  }, []);

  // Update selected material if prop changes
  useEffect(() => {
    if (preselectedMaterial) {
      setSelectedMatId(preselectedMaterial.id);
      if (preselectedMaterial.analysis?.suggestedTopics?.[0]) {
        setCustomTopic(preselectedMaterial.analysis.suggestedTopics[0]);
      }
    }
  }, [preselectedMaterial]);

  // Test Gemini connection
  const handleTestConnection = async () => {
    setIsTestingKey(true);
    soundFx.playClick();
    setTestResult(null);

    try {
      await callGeminiApiWithFallback('Hello', undefined, selectedModel);
      setTestResult({ success: true, message: 'Kết nối Gemini API thành công! Mô hình đã sẵn sàng.' });
      soundFx.playCorrect();
    } catch (e: any) {
      setTestResult({ success: false, message: e?.message || 'Lỗi kết nối Gemini API' });
      soundFx.playWrong();
    } finally {
      setIsTestingKey(false);
    }
  };

  // Generate Questions
  const handleGenerateQuestions = async () => {
    setIsGenerating(true);
    setGenerateError(null);
    soundFx.playClick();

    try {
      const currentMat = materials.find(m => m.id === selectedMatId);
      const textToUse = inputType === 'text' ? pastedText : (currentMat ? currentMat.content : '');
      const sourceName = inputType === 'text' ? 'Văn bản dán trực tiếp' : (currentMat ? currentMat.title : 'AI Generator');

      if (!textToUse.trim()) {
        throw new Error('Không có nội dung để sinh câu hỏi. Vui lòng nhập văn bản hoặc chọn tài liệu.');
      }

      const promptText = `Hãy đóng vai một giáo viên xuất sắc. Dựa vào nội dung tài liệu sau đây, hãy sinh ra ${questionCount} câu hỏi trắc nghiệm.
Yêu cầu:
- Chủ đề ưu tiên: ${customTopic}
- Phân bổ độ khó: Dễ (${easyRatio}%), Trung bình (${medRatio}%), Khó (${hardRatio}%)
- Yêu cầu thêm: ${additionalPrompt || 'Không có'}
- Định dạng trả về bắt buộc là JSON ARRAY chứa các object Question với cấu trúc:
[
  {
    "id": "q1",
    "question": "Nội dung câu hỏi?",
    "options": ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"],
    "correctIndex": 0,
    "explanation": "Giải thích chi tiết",
    "difficulty": "Dễ" | "Trung bình" | "Khó",
    "topic": "Chủ đề",
    "source": "${sourceName}",
    "status": "draft"
  }
]

VĂN BẢN TÀI LIỆU:
${textToUse.substring(0, 30000)} // Giới hạn token`;

      const responseText = await callGeminiApiWithFallback(promptText, undefined, selectedModel);
      
      let parsedQuestions = [];
      try {
        const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
        parsedQuestions = JSON.parse(jsonStr);
      } catch (parseErr) {
        throw new Error('Gemini trả về dữ liệu không đúng định dạng JSON.');
      }

      setGeneratedDrafts(parsedQuestions.map((q: any) => ({
        ...q,
        id: 'ai_' + Math.random().toString(36).substr(2, 9),
        createdAt: new Date().toISOString()
      })));
      
      soundFx.playVictory();
    } catch (err: any) {
      setGenerateError(err?.message || 'Không thể tạo câu hỏi.');
      soundFx.playWrong();
    } finally {
      setIsGenerating(false);
    }
  };

  // Step 14: Teacher Review & Approval actions
  const handleApproveAll = () => {
    soundFx.playClick();
    const approved = generatedDrafts.map(q => ({ ...q, status: 'published' as QuestionStatus }));
    onPublishQuestions(approved);
    alert(`Đã xuất bản thành công ${approved.length} câu hỏi vào Ngân hàng câu hỏi!`);
    setGeneratedDrafts([]);
  };

  const handleApproveSingle = (id: string) => {
    soundFx.playClick();
    const q = generatedDrafts.find(item => item.id === id);
    if (!q) return;

    onPublishQuestions([{ ...q, status: 'published' as QuestionStatus }]);
    setGeneratedDrafts(prev => prev.filter(item => item.id !== id));
  };

  const handleDiscardSingle = (id: string) => {
    soundFx.playClick();
    setGeneratedDrafts(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="space-y-6">
      {/* 1. Gemini AI Status & Model Config Box (Step 12) */}
      <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/90 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-800">Cấu Hình Kết Nối Gemini AI</h4>
              <p className="text-xs text-slate-500">
                {serverKeyStatus
                  ? '🟢 Đã gắn kết nối Server qua AI Studio (GEMINI_API_KEY sẵn sàng)'
                  : '🟡 Chưa có GEMINI_API_KEY trên Server (có thể nhập Session Key tạm thời)'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-300 bg-white text-xs font-bold text-slate-700 outline-none"
            >
              <option value="gemini-3.8-flash">Gemini 3.8 Flash (Mặc định - Nhanh & Chuẩn)</option>
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Siêu nhanh)</option>
              <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro Preview (Suy luận sâu)</option>
            </select>

            <button
              onClick={handleTestConnection}
              disabled={isTestingKey}
              className="px-3 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition flex items-center gap-1 shadow-2xs"
            >
              <Sparkles className={`w-3.5 h-3.5 ${isTestingKey ? 'animate-spin' : ''}`} />
              <span>{isTestingKey ? 'Đang thử...' : 'Kiểm tra API'}</span>
            </button>
          </div>
        </div>

        {/* Optional Session Key input */}
        <div className="pt-2 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600 shrink-0">API Key phiên làm việc:</span>
          <input
            type="password"
            value={sessionKey}
            onChange={e => {
              setSessionKey(e.target.value);
              setSessionGeminiKey(e.target.value);
            }}
            placeholder="Để trống nếu đã có server key hoặc nhập AI Studio key..."
            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 bg-white font-mono text-xs outline-none"
          />
          {sessionKey && (
            <button
              type="button"
              onClick={() => {
                setSessionKey('');
                clearSessionGeminiKey();
              }}
              className="text-slate-400 hover:text-rose-600 font-bold shrink-0"
            >
              Xóa key
            </button>
          )}
        </div>

        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2 ${
              testResult.success
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* 2. Generator Form (Step 13) */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
            1
          </div>
          <h3 className="font-bold text-slate-800 text-base">Thiết Lập Sinh Câu Hỏi Từ Học Liệu</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Material Picker / Text Area */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-4 mb-2">
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase cursor-pointer">
                <input
                  type="radio"
                  name="inputType"
                  checked={inputType === 'material'}
                  onChange={() => setInputType('material')}
                  className="accent-blue-600"
                />
                Chọn từ Học liệu
              </label>
              <label className="flex items-center gap-2 text-xs font-bold text-slate-700 uppercase cursor-pointer">
                <input
                  type="radio"
                  name="inputType"
                  checked={inputType === 'text'}
                  onChange={() => setInputType('text')}
                  className="accent-blue-600"
                />
                Sinh từ văn bản dán thẳng
              </label>
            </div>
            
            {inputType === 'material' ? (
              <select
                value={selectedMatId}
                onChange={e => {
                  setSelectedMatId(e.target.value);
                  const chosen = materials.find(m => m.id === e.target.value);
                  if (chosen) setCustomTopic(chosen.title);
                }}
                className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
              >
                {materials.map(m => (
                  <option key={m.id} value={m.id}>
                    {m.title} ({m.type.toUpperCase()})
                  </option>
                ))}
              </select>
            ) : (
              <textarea
                value={pastedText}
                onChange={e => setPastedText(e.target.value)}
                rows={4}
                placeholder="Dán nội dung văn bản vào đây để AI phân tích và sinh câu hỏi..."
                className="w-full p-3 rounded-xl border border-slate-300 text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>

          {/* Topic */}
          <div className="col-span-1 md:col-span-2">
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Tên Chủ Đề Gắn Cho Bộ Câu Hỏi
            </label>
            <input
              type="text"
              value={customTopic}
              onChange={e => setCustomTopic(e.target.value)}
              placeholder="Ví dụ: Chiến dịch Biệt động Sài Gòn"
              className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
            />
          </div>
        </div>

        {/* Question Count selector */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-2 flex items-center justify-between">
            <span>Số Lượng Câu Hỏi Cần Sinh</span>
            <span className="text-blue-600 font-extrabold">{questionCount} câu</span>
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[5, 10, 20, 30, 50].map(cnt => (
              <button
                key={cnt}
                type="button"
                onClick={() => setQuestionCount(cnt)}
                className={`py-2 rounded-xl text-xs font-bold transition border ${
                  questionCount === cnt
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cnt} Câu
              </button>
            ))}
          </div>
        </div>

        {/* Difficulty Ratios */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
          <label className="block text-xs font-bold text-slate-700 uppercase mb-3 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-slate-500" />
              Tỷ Lệ Độ Khó (Tổng {easyRatio + medRatio + hardRatio}%)
            </span>
            <span className="text-xs text-slate-500 font-medium">
              {easyRatio}% Dễ • {medRatio}% Trung bình • {hardRatio}% Khó
            </span>
          </label>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <span className="text-[11px] font-bold text-emerald-700 block mb-1">Dễ ({easyRatio}%)</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={easyRatio}
                onChange={e => setEasyRatio(Number(e.target.value))}
                className="w-full accent-emerald-600"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-amber-700 block mb-1">Trung bình ({medRatio}%)</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={medRatio}
                onChange={e => setMedRatio(Number(e.target.value))}
                className="w-full accent-amber-600"
              />
            </div>
            <div>
              <span className="text-[11px] font-bold text-rose-700 block mb-1">Khó ({hardRatio}%)</span>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={hardRatio}
                onChange={e => setHardRatio(Number(e.target.value))}
                className="w-full accent-rose-600"
              />
            </div>
          </div>
        </div>

        {/* Additional instructions */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
            Yêu Cầu Bổ Sung Của Giáo Viên (Prompt ghi chú)
          </label>
          <input
            type="text"
            value={additionalPrompt}
            onChange={e => setAdditionalPrompt(e.target.value)}
            placeholder="Ví dụ: Tập trung vào mốc lịch sử năm 1964, không hỏi lặp lại câu hỏi cũ..."
            className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-medium outline-none"
          />
        </div>

        {generateError && (
          <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{generateError}</span>
          </div>
        )}

        <button
          onClick={handleGenerateQuestions}
          disabled={isGenerating || materials.length === 0}
          className="w-full py-4 rounded-2xl bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm shadow-md transition flex items-center justify-center gap-2"
        >
          <Sparkles className={`w-4 h-4 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Gemini AI đang phân tích và sinh câu hỏi...' : `Tạo ${questionCount} Câu Hỏi Với AI`}</span>
        </button>
      </div>

      {/* 3. Teacher Inspection & Moderation Workflow (Step 14) */}
      {generatedDrafts.length > 0 && (
        <div className="bg-amber-50/70 rounded-3xl p-6 border-2 border-amber-300 shadow-md space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200">
            <div>
              <div className="inline-block px-2.5 py-0.5 bg-amber-200 text-amber-900 font-extrabold text-[11px] rounded-full uppercase mb-1">
                Step 14: Bản Nháp Chờ Kiểm Duyệt
              </div>
              <h3 className="text-base font-extrabold text-amber-950">
                AI Đã Tạo {generatedDrafts.length} Câu Hỏi (Chưa xuất bản cho học sinh)
              </h3>
              <p className="text-xs text-amber-800">
                Hãy kiểm tra độ chính xác, sửa đổi nếu cần và duyệt xuất bản.
              </p>
            </div>

            <button
              onClick={handleApproveAll}
              className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md transition flex items-center gap-2 shrink-0"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Duyệt & Xuất Bản Tất Cả ({generatedDrafts.length})</span>
            </button>
          </div>

          {/* Drafts List */}
          <div className="space-y-3">
            {generatedDrafts.map((draft, idx) => (
              <div
                key={draft.id}
                className="bg-white rounded-2xl p-4 border border-amber-200 shadow-2xs space-y-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-extrabold text-xs text-amber-900 bg-amber-100 px-2.5 py-1 rounded-md">
                    Bản nháp #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-slate-100 font-semibold text-slate-700">
                      {draft.difficulty}
                    </span>
                    <button
                      onClick={() => handleApproveSingle(draft.id)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs"
                    >
                      <Check className="w-3 h-3" />
                      <span>Duyệt câu này</span>
                    </button>
                    <button
                      onClick={() => handleDiscardSingle(draft.id)}
                      className="px-2 py-1 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-semibold"
                    >
                      Bỏ qua
                    </button>
                  </div>
                </div>

                <p className="font-bold text-slate-900 text-sm">{draft.question}</p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {draft.options.map((opt, oIdx) => {
                    const isCorrect = oIdx === draft.correctIndex;
                    const letter = ['A', 'B', 'C', 'D'][oIdx];
                    return (
                      <div
                        key={oIdx}
                        className={`p-2.5 rounded-xl border flex items-center gap-2 ${
                          isCorrect
                            ? 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold ring-1 ring-emerald-400'
                            : 'bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="w-5 h-5 rounded-md bg-white flex items-center justify-center font-bold shrink-0">
                          {letter}
                        </span>
                        <span>{opt}</span>
                      </div>
                    );
                  })}
                </div>

                {draft.explanation && (
                  <div className="p-2.5 bg-amber-50 rounded-xl text-amber-900 text-xs border border-amber-200">
                    <strong>💡 Giải thích:</strong> {draft.explanation}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
