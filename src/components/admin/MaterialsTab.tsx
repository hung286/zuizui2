import React, { useState, useEffect } from 'react';
import { LearningMaterial, MaterialType } from '../../types';
import { indexedDBManager } from '../../utils/indexedDB';
import { getSessionGeminiKey } from '../../utils/storage';
import { soundFx } from '../../utils/sound';
import {
  FileText,
  Upload,
  Link,
  Trash2,
  Sparkles,
  Plus,
  ArrowRight,
  Database,
  CheckCircle2,
  AlertCircle,
  Eye,
  FileCode,
  Youtube,
  BookOpen
} from 'lucide-react';

interface MaterialsTabProps {
  onSelectForGenerator: (material: LearningMaterial) => void;
}

export const MaterialsTab: React.FC<MaterialsTabProps> = ({ onSelectForGenerator }) => {
  const [materials, setMaterials] = useState<LearningMaterial[]>([]);
  const [loading, setLoading] = useState(true);

  // New Material modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newType, setNewType] = useState<MaterialType>('txt');
  const [newContent, setNewContent] = useState('');

  // Analyzing state
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);

  // View modal
  const [viewingMaterial, setViewingMaterial] = useState<LearningMaterial | null>(null);

  // Load materials from IndexedDB (Step 11)
  const loadMaterials = async () => {
    setLoading(true);
    try {
      const items = await indexedDBManager.getAllMaterials();
      // Default material if empty
      if (items.length === 0) {
        const defaultMaterial: LearningMaterial = {
          id: 'mat_default_nvt',
          title: 'Hồ sơ lịch sử: Anh hùng Liệt sĩ Nguyễn Văn Trỗi',
          type: 'markdown',
          content: `# TIỂU SỬ VÀ SỰ NGHIỆP CÁCH MẠNG ANH HÙNG NGUYỄN VĂN TRỖI

1. TIỂU SỬ:
- Sinh ngày: 01/02/1940 tại làng Thanh Quýt, xã Điện Thắng (nay là Điện Thắng Trung, thị xã Điện Bàn, tỉnh Quảng Nam).
- Gia đình bần nông giàu truyền thống yêu nước. Năm 1954, anh rời quê hương vào Sài Gòn sinh sống và làm việc.
- Từng làm thợ điện tại nhà máy điện Chợ Quán, giác ngộ cách mạng qua phong trào đấu tranh của công nhân.

2. HOẠT ĐỘNG CÁCH MẠNG:
- Gia nhập Đoàn Thanh niên Giải phóng năm 1963, trở thành chiến sĩ Đội biệt động 65 (Quân khu Sài Gòn - Gia Định).
- Ngày 21/4/1964, kết hôn với chị Phan Thị Quyên.
- Tháng 5/1964, nhận nhiệm vụ bí mật đặt mìn tại cầu Công Lý để tiêu diệt phái đoàn quân sự cấp cao của Mỹ do Bộ trưởng Quốc phòng Robert McNamara dẫn đầu.
- Đêm 9/5/1964: Việc gài mìn bị bại lộ, anh bị địch bắt tại trận địa.

3. 9 PHÚT BẤT TỬ TRƯỚC HỌNG SÚNG GIẶC:
- Dù bị tra tấn bằng cực hình dã man trong Khám Chí Hòa, anh Trỗi kiên quyết không khai báo, bảo vệ trọn vẹn an toàn cho cơ sở cách mạng.
- Phong trào du kích FALN Venezuela từng bắt cóc trung tá không quân Mỹ Michael Smolen để yêu cầu trả tự do cho anh Trỗi. Nhưng kẻ thù đã tráo trở, đưa anh ra trường bắn vườn chuối sau khám Chí Hòa xử bắn vào 9 giờ 50 phút sáng ngày 15/10/1964.
- Lời hô vang bất hủ trước họng súng: "Hãy nhớ lấy lời tôi! Đả đảo đế quốc Mỹ! Hồ Chí Minh muôn năm! Việt Nam muôn năm!".`,
          fileSize: 1850,
          createdAt: new Date().toISOString()
        };
        await indexedDBManager.saveMaterial(defaultMaterial);
        setMaterials([defaultMaterial]);
      } else {
        setMaterials(items);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMaterials();
  }, []);

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    soundFx.playClick();
    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = (event.target?.result as string) || '';
      const ext = file.name.split('.').pop()?.toLowerCase();
      let detectedType: MaterialType = 'txt';
      if (ext === 'md' || ext === 'markdown') detectedType = 'markdown';
      else if (ext === 'csv') detectedType = 'csv';
      else if (ext === 'json') detectedType = 'json';
      else if (ext === 'pdf') detectedType = 'pdf';
      else if (ext === 'docx') detectedType = 'docx';

      const newMat: LearningMaterial = {
        id: `mat_${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ''),
        type: detectedType,
        content: text,
        fileSize: file.size,
        createdAt: new Date().toISOString()
      };

      await indexedDBManager.saveMaterial(newMat);
      setMaterials(prev => [newMat, ...prev]);
      alert(`Đã thêm học liệu "${newMat.title}" vào IndexedDB thành công!`);
    };
    reader.readAsText(file);
  };

  // Handle manual submit (URL or custom text)
  const handleCreateManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    soundFx.playClick();
    const newMat: LearningMaterial = {
      id: `mat_${Date.now()}`,
      title: newTitle.trim(),
      type: newType,
      content: newContent.trim(),
      fileSize: new Blob([newContent]).size,
      createdAt: new Date().toISOString()
    };

    await indexedDBManager.saveMaterial(newMat);
    setMaterials(prev => [newMat, ...prev]);
    setIsAddOpen(false);
    setNewTitle('');
    setNewContent('');
  };

  // Delete
  const handleDelete = async (id: string) => {
    if (!confirm('Xóa học liệu này khỏi IndexedDB?')) return;
    soundFx.playClick();
    await indexedDBManager.deleteMaterial(id);
    setMaterials(prev => prev.filter(m => m.id !== id));
  };

  // Analyze with Gemini AI
  const handleAnalyzeWithGemini = async (mat: LearningMaterial) => {
    soundFx.playClick();
    setAnalyzingId(mat.id);
    setAnalyzeError(null);

    try {
      const sessionKey = getSessionGeminiKey();
      const res = await fetch('/api/gemini/analyze-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialText: mat.content,
          title: mat.title,
          customApiKey: sessionKey,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Lỗi phân tích học liệu từ Gemini');
      }

      // Update material with analysis
      const updated = {
        ...mat,
        analysis: data.analysis,
      };

      await indexedDBManager.saveMaterial(updated);
      setMaterials(prev => prev.map(m => (m.id === mat.id ? updated : m)));
      soundFx.playCorrect();
    } catch (err: any) {
      soundFx.playWrong();
      setAnalyzeError(err?.message || 'Không thể phân tích tài liệu.');
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">Trung Tâm Học Liệu (IndexedDB)</h4>
            <p className="text-xs text-slate-500">
              Lưu trữ tài liệu kích thước lớn cục bộ trong trình duyệt để AI phân tích và sinh câu hỏi
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* File Picker */}
          <label className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-2xs">
            <Upload className="w-3.5 h-3.5" />
            <span>Tải lên tệp (TXT, MD, CSV, JSON...)</span>
            <input
              type="file"
              accept=".txt,.md,.markdown,.csv,.json,.pdf,.docx"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>

          {/* Add custom text/link */}
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm văn bản / Link</span>
          </button>
        </div>
      </div>

      {analyzeError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-300 text-rose-900 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{analyzeError}</span>
        </div>
      )}

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-400 text-sm">
            Đang tải học liệu từ IndexedDB...
          </div>
        ) : materials.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-400 text-sm">
            Chưa có tài liệu học liệu nào. Hãy tải lên tệp văn bản hoặc tài liệu!
          </div>
        ) : (
          materials.map(mat => {
            const isAnalyzing = analyzingId === mat.id;
            return (
              <div
                key={mat.id}
                className="bg-white rounded-3xl p-5 border border-slate-200 shadow-2xs hover:shadow-xs transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 font-bold text-[10px] rounded uppercase tracking-wider">
                      {mat.type} • {(mat.fileSize / 1024).toFixed(1)} KB
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(mat.createdAt).toLocaleDateString('vi-VN')}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mb-2 line-clamp-1">
                    {mat.title}
                  </h3>

                  <p className="text-xs text-slate-500 line-clamp-3 leading-relaxed mb-4">
                    {mat.content.slice(0, 250)}...
                  </p>

                  {/* AI Analysis Preview if available */}
                  {mat.analysis && (
                    <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl text-[11px] text-amber-950 mb-4 space-y-1">
                      <div className="font-bold flex items-center gap-1 text-amber-900">
                        <Sparkles className="w-3 h-3 text-amber-600" /> Tóm tắt trọng tâm AI:
                      </div>
                      <p className="line-clamp-2 leading-relaxed opacity-90">{mat.analysis.summary}</p>
                    </div>
                  )}
                </div>

                {/* Card footer actions */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setViewingMaterial(mat)}
                      className="px-2.5 py-1.5 rounded-lg text-slate-600 bg-slate-100 hover:bg-slate-200 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Eye className="w-3 h-3" />
                      <span>Xem nội dung</span>
                    </button>

                    <button
                      onClick={() => handleAnalyzeWithGemini(mat)}
                      disabled={isAnalyzing}
                      className="px-2.5 py-1.5 rounded-lg text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-xs font-semibold flex items-center gap-1 transition"
                    >
                      <Sparkles className={`w-3 h-3 ${isAnalyzing ? 'animate-spin' : ''}`} />
                      <span>{isAnalyzing ? 'Đang phân tích...' : 'Phân tích AI'}</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => onSelectForGenerator(mat)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1 transition shadow-2xs"
                    >
                      <span>Sinh câu hỏi</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>

                    <button
                      onClick={() => handleDelete(mat.id)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 transition"
                      title="Xóa học liệu"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* View Material Modal */}
      {viewingMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[85vh] flex flex-col">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base truncate pr-4">{viewingMaterial.title}</h3>
              <button
                onClick={() => setViewingMaterial(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-6 overflow-y-auto flex-1 font-mono text-xs whitespace-pre-wrap leading-relaxed text-slate-800 bg-slate-50">
              {viewingMaterial.content}
            </div>
            <div className="p-4 bg-white border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setViewingMaterial(null)}
                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Custom Material Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-indigo-600 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-base">Thêm Học Liệu Mới</h3>
              <button
                onClick={() => setIsAddOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateManual} className="p-6 space-y-4 overflow-y-auto flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Tiêu đề học liệu
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="Ví dụ: Bài giảng Lịch sử Kháng chiến"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm font-semibold outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Loại định dạng
                </label>
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as MaterialType)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold outline-none"
                >
                  <option value="txt">Văn bản thô (TXT)</option>
                  <option value="markdown">Markdown</option>
                  <option value="url">Đường link Website</option>
                  <option value="youtube">Video YouTube</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nội dung tài liệu / Đường dẫn
                </label>
                <textarea
                  value={newContent}
                  onChange={e => setNewContent(e.target.value)}
                  rows={8}
                  placeholder="Dán nội dung văn bản học liệu tại đây..."
                  required
                  className="w-full p-3 rounded-xl border border-slate-300 text-xs leading-relaxed outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-bold rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-md"
                >
                  Lưu vào IndexedDB
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
