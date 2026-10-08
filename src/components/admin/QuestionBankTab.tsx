import React, { useState, useMemo } from 'react';
import { Question, Difficulty, QuestionStatus } from '../../types';
import {
  saveQuestionBank,
  restore50DefaultQuestions,
  exportQuestionsToCsv
} from '../../utils/storage';
import { exportQuestionsToDocx } from '../../utils/docxExporter';
import { soundFx } from '../../utils/sound';
import {
  Layers,
  Search,
  Filter,
  Plus,
  Edit2,
  Trash2,
  Copy,
  CheckCircle,
  FileDown,
  FileUp,
  RotateCcw,
  Check,
  X,
  HelpCircle,
  Tag
} from 'lucide-react';

interface QuestionBankTabProps {
  questions: Question[];
  onQuestionsChange: (newQuestions: Question[]) => void;
}

export const QuestionBankTab: React.FC<QuestionBankTabProps> = ({
  questions,
  onQuestionsChange,
}) => {
  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDifficulty, setFilterDifficulty] = useState<Difficulty | 'Tất cả'>('Tất cả');
  const [filterStatus, setFilterStatus] = useState<QuestionStatus | 'Tất cả'>('Tất cả');
  const [filterTopic, setFilterTopic] = useState<string>('Tất cả');

  // Modal editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Available topics
  const topics = useMemo(() => {
    const set = new Set<string>();
    questions.forEach(q => {
      if (q.topic) set.add(q.topic);
    });
    return Array.from(set);
  }, [questions]);

  // Filtered Questions
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchSearch =
        searchTerm === '' ||
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.options.some(opt => opt.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (q.explanation && q.explanation.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchDiff = filterDifficulty === 'Tất cả' || q.difficulty === filterDifficulty;
      const matchStatus = filterStatus === 'Tất cả' || q.status === filterStatus;
      const matchTopic = filterTopic === 'Tất cả' || q.topic === filterTopic;

      return matchSearch && matchDiff && matchStatus && matchTopic;
    });
  }, [questions, searchTerm, filterDifficulty, filterStatus, filterTopic]);

  // Statistics
  const totalCount = questions.length;
  const publishedCount = questions.filter(q => q.status === 'published').length;
  const draftCount = questions.filter(q => q.status === 'draft').length;

  // Actions
  const handleAddNew = () => {
    soundFx.playClick();
    setEditingQuestion({
      id: `q_${Date.now()}`,
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
      explanation: '',
      difficulty: 'Trung bình',
      topic: 'Chung',
      source: 'Giáo viên biên soạn',
      status: 'published',
      createdAt: new Date().toISOString()
    });
    setIsEditorOpen(true);
  };

  const handleEdit = (q: Question) => {
    soundFx.playClick();
    setEditingQuestion({ ...q });
    setIsEditorOpen(true);
  };

  const handleDuplicate = (q: Question) => {
    soundFx.playClick();
    const duplicated: Question = {
      ...q,
      id: `q_${Date.now()}_copy`,
      question: `${q.question} (Bản sao)`,
      status: 'draft',
      createdAt: new Date().toISOString()
    };
    const updated = [duplicated, ...questions];
    saveQuestionBank(updated);
    onQuestionsChange(updated);
  };

  const handleDelete = (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa câu hỏi này không?')) return;
    soundFx.playClick();
    const updated = questions.filter(q => q.id !== id);
    saveQuestionBank(updated);
    onQuestionsChange(updated);
  };

  const handleToggleStatus = (id: string) => {
    soundFx.playClick();
    const updated = questions.map(q => {
      if (q.id === id) {
        return {
          ...q,
          status: q.status === 'published' ? ('draft' as QuestionStatus) : ('published' as QuestionStatus)
        };
      }
      return q;
    });
    saveQuestionBank(updated);
    onQuestionsChange(updated);
  };

  const handleBatchPublish = () => {
    soundFx.playClick();
    const updated = questions.map(q => ({ ...q, status: 'published' as QuestionStatus }));
    saveQuestionBank(updated);
    onQuestionsChange(updated);
  };

  const handleRestoreDefault50 = () => {
    if (!confirm('Khôi phục 50 câu hỏi mặc định về Lớp Toán Thầy Hùng? Các câu hỏi đã tạo khác sẽ được giữ lại hoặc thay thế nếu trùng ID.')) return;
    soundFx.playClick();
    const restored = restore50DefaultQuestions();
    onQuestionsChange(restored);
  };

  const handleSaveEditor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingQuestion) return;

    soundFx.playClick();
    const index = questions.findIndex(q => q.id === editingQuestion.id);
    let updated: Question[];
    if (index >= 0) {
      updated = [...questions];
      updated[index] = editingQuestion;
    } else {
      updated = [editingQuestion, ...questions];
    }

    saveQuestionBank(updated);
    onQuestionsChange(updated);
    setIsEditorOpen(false);
    setEditingQuestion(null);
  };

  // CSV Import
  const handleImportCsv = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
        if (lines.length <= 1) throw new Error('File rỗng hoặc không có dữ liệu');

        const newQuestions: Question[] = [];
        // Skip header line
        for (let i = 1; i < lines.length; i++) {
          const row = lines[i];
          // Simple CSV splitter handling quotes
          const match = row.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || row.split(',');
          const clean = match.map(m => m.replace(/^"|"$/g, '').trim());

          if (clean.length >= 6) {
            const questionText = clean[0];
            const optA = clean[1] || 'A';
            const optB = clean[2] || 'B';
            const optC = clean[3] || 'C';
            const optD = clean[4] || 'D';
            const corStr = clean[5]?.toUpperCase();
            let correctIndex = 0;
            if (corStr === 'B' || corStr === '1') correctIndex = 1;
            else if (corStr === 'C' || corStr === '2') correctIndex = 2;
            else if (corStr === 'D' || corStr === '3') correctIndex = 3;

            const explanation = clean[6] || '';
            const difficulty: Difficulty = (clean[7] === 'Dễ' || clean[7] === 'Khó') ? clean[7] : 'Trung bình';
            const topic = clean[8] || 'Chung';
            const source = clean[9] || 'Import CSV';

            newQuestions.push({
              id: `csv_${Date.now()}_${i}`,
              question: questionText,
              options: [optA, optB, optC, optD],
              correctIndex,
              explanation,
              difficulty,
              topic,
              source,
              status: 'published',
              createdAt: new Date().toISOString()
            });
          }
        }

        if (newQuestions.length > 0) {
          const combined = [...newQuestions, ...questions];
          saveQuestionBank(combined);
          onQuestionsChange(combined);
          alert(`Đã nhập thành công ${newQuestions.length} câu hỏi từ CSV!`);
        } else {
          alert('Không tìm thấy câu hỏi hợp lệ trong file CSV.');
        }
      } catch (err: any) {
        alert(`Lỗi đọc file CSV: ${err?.message}`);
      }
    };
    reader.readAsText(file);
  };

  // JSON Import
  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const list = Array.isArray(parsed) ? parsed : parsed.questions;
        if (!Array.isArray(list)) throw new Error('Cấu trúc JSON không hợp lệ');

        const formatted = list.map((item, idx) => ({
          id: item.id || `json_${Date.now()}_${idx}`,
          question: item.question || 'Câu hỏi',
          options: item.options || ['A', 'B', 'C', 'D'],
          correctIndex: typeof item.correctIndex === 'number' ? item.correctIndex : 0,
          explanation: item.explanation || '',
          difficulty: item.difficulty || 'Trung bình',
          topic: item.topic || 'Chung',
          source: item.source || 'Import JSON',
          status: item.status || 'draft',
          createdAt: item.createdAt || new Date().toISOString()
        }));

        const combined = [...formatted, ...questions];
        saveQuestionBank(combined);
        onQuestionsChange(combined);
        alert(`Đã nhập thành công ${formatted.length} câu hỏi từ JSON!`);
      } catch (err: any) {
        alert(`Lỗi đọc JSON: ${err?.message}`);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Stats & Quick Action Bar */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 shadow-2xs">
            <Layers className="w-4 h-4 text-blue-600" />
            Tổng: <strong>{totalCount}</strong> câu
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            Đã xuất bản: <strong>{publishedCount}</strong>
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-800">
            <HelpCircle className="w-4 h-4 text-amber-600" />
            Bản nháp: <strong>{draftCount}</strong>
          </span>
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Add Question */}
          <button
            onClick={handleAddNew}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm câu hỏi mới</span>
          </button>

          {/* Batch publish */}
          {draftCount > 0 && (
            <button
              onClick={handleBatchPublish}
              className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1 shadow-xs"
              title="Xuất bản tất cả câu hỏi nháp"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Duyệt xuất bản hết ({draftCount})</span>
            </button>
          )}

          {/* Restore default 50 */}
          <button
            onClick={handleRestoreDefault50}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold transition flex items-center gap-1"
            title="Khôi phục 50 câu Lớp Toán Thầy Hùng"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Khôi phục 50 câu mặc định</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative min-w-[220px] flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo nội dung, đáp án, giải thích..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-medium"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium outline-none"
          >
            <option value="Tất cả">Trạng thái: Tất cả</option>
            <option value="published">Đã xuất bản</option>
            <option value="draft">Bản nháp</option>
          </select>

          <select
            value={filterDifficulty}
            onChange={e => setFilterDifficulty(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium outline-none"
          >
            <option value="Tất cả">Mọi mức độ</option>
            <option value="Dễ">Dễ</option>
            <option value="Trung bình">Trung bình</option>
            <option value="Khó">Khó</option>
          </select>

          <select
            value={filterTopic}
            onChange={e => setFilterTopic(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 font-medium outline-none max-w-[140px] truncate"
          >
            <option value="Tất cả">Mọi chủ đề</option>
            {topics.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Import & Export dropdowns */}
        <div className="flex items-center gap-2">
          {/* Export CSV */}
          <button
            onClick={() => exportQuestionsToCsv(questions)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
            title="Xuất ngân hàng câu hỏi ra file CSV"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Xuất CSV</span>
          </button>

          {/* Export DOCX */}
          <button
            onClick={() => exportQuestionsToDocx(questions)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5"
            title="Xuất ngân hàng câu hỏi ra file Word (DOCX)"
          >
            <FileDown className="w-3.5 h-3.5 text-blue-600" />
            <span>Xuất DOCX</span>
          </button>

          {/* Import CSV */}
          <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer">
            <FileUp className="w-3.5 h-3.5" />
            <span>Nhập CSV</span>
            <input type="file" accept=".csv" onChange={handleImportCsv} className="hidden" />
          </label>

          {/* Import JSON */}
          <label className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer">
            <FileUp className="w-3.5 h-3.5" />
            <span>Nhập JSON</span>
            <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
          </label>
        </div>
      </div>

      {/* Questions List Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-6 w-12 text-center">STT</th>
                <th className="p-3.5">Nội dung câu hỏi & Các phương án</th>
                <th className="p-3.5 w-28">Độ khó & Chủ đề</th>
                <th className="p-3.5 w-28 text-center">Trạng thái</th>
                <th className="p-3.5 pr-6 w-28 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredQuestions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400 font-medium">
                    Không tìm thấy câu hỏi nào phù hợp với điều kiện tìm kiếm.
                  </td>
                </tr>
              ) : (
                filteredQuestions.map((q, idx) => {
                  const isPublished = q.status === 'published';
                  return (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 pl-6 font-bold text-slate-400 text-center">
                        {idx + 1}
                      </td>
                      <td className="p-3.5 max-w-md">
                        <div className="font-bold text-slate-900 text-sm mb-1.5 leading-snug">
                          {q.question}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-600">
                          {q.options.map((opt, oIdx) => {
                            const isCorrect = oIdx === q.correctIndex;
                            const letter = ['A', 'B', 'C', 'D'][oIdx];
                            return (
                              <div
                                key={oIdx}
                                className={`px-2 py-1 rounded-md flex items-center gap-1.5 ${
                                  isCorrect ? 'bg-emerald-50 text-emerald-900 font-bold border border-emerald-200' : 'bg-slate-50'
                                }`}
                              >
                                <span className="w-4 h-4 rounded bg-white text-slate-700 flex items-center justify-center font-bold text-[9px] shadow-2xs">
                                  {letter}
                                </span>
                                <span className="truncate">{opt}</span>
                              </div>
                            );
                          })}
                        </div>
                        {q.explanation && (
                          <div className="text-[11px] text-amber-900/80 mt-1 italic line-clamp-1">
                            💡 {q.explanation}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1 ${
                          q.difficulty === 'Dễ'
                            ? 'bg-emerald-50 text-emerald-700'
                            : q.difficulty === 'Trung bình'
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {q.difficulty}
                        </span>
                        <div className="text-[11px] font-medium text-slate-500 truncate max-w-[120px]">
                          {q.topic}
                        </div>
                      </td>
                      <td className="p-3.5 text-center">
                        <button
                          onClick={() => handleToggleStatus(q.id)}
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 mx-auto ${
                            isPublished
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          title="Nhấn để đổi trạng thái"
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${isPublished ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <span>{isPublished ? 'Xuất bản' : 'Nháp'}</span>
                        </button>
                      </td>
                      <td className="p-3.5 pr-6 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleEdit(q)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition"
                            title="Chỉnh sửa câu hỏi"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDuplicate(q)}
                            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-200 transition"
                            title="Nhân bản câu hỏi"
                          >
                            <Copy className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(q.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-100 transition"
                            title="Xóa câu hỏi"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Question Editor Modal */}
      {isEditorOpen && editingQuestion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 bg-linear-to-r from-blue-600 to-indigo-700 text-white flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg">
                {editingQuestion.id.startsWith('q_') ? 'Thêm / Chỉnh Sửa Câu Hỏi' : 'Biên Tập Câu Hỏi'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditor} className="p-6 overflow-y-auto space-y-4 flex-1">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Nội dung câu hỏi
                </label>
                <textarea
                  value={editingQuestion.question}
                  onChange={e => setEditingQuestion({ ...editingQuestion, question: e.target.value })}
                  rows={3}
                  required
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
                />
              </div>

              {/* 4 Options */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-700 uppercase">
                  4 Phương án trả lời (Chọn nút tròn để chỉ định đáp án đúng)
                </label>
                {['A', 'B', 'C', 'D'].map((letter, idx) => {
                  const isCorrect = editingQuestion.correctIndex === idx;
                  return (
                    <div key={idx} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setEditingQuestion({ ...editingQuestion, correctIndex: idx })}
                        className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center transition shrink-0 ${
                          isCorrect
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                        title="Đặt làm đáp án đúng"
                      >
                        {letter}
                      </button>
                      <input
                        type="text"
                        value={editingQuestion.options[idx] || ''}
                        onChange={e => {
                          const newOpts = [...editingQuestion.options] as [string, string, string, string];
                          newOpts[idx] = e.target.value;
                          setEditingQuestion({ ...editingQuestion, options: newOpts });
                        }}
                        placeholder={`Nội dung phương án ${letter}`}
                        required
                        className={`w-full px-3 py-2 rounded-xl border text-sm font-medium outline-none ${
                          isCorrect ? 'border-emerald-500 bg-emerald-50/40 text-emerald-950 font-bold' : 'border-slate-300'
                        }`}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Explanation */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Lời giải thích chi tiết
                </label>
                <textarea
                  value={editingQuestion.explanation}
                  onChange={e => setEditingQuestion({ ...editingQuestion, explanation: e.target.value })}
                  rows={2}
                  placeholder="Giải thích vì sao đáp án đúng..."
                  className="w-full p-3 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-xs"
                />
              </div>

              {/* Difficulty, Topic, Source, Status */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Độ khó</label>
                  <select
                    value={editingQuestion.difficulty}
                    onChange={e => setEditingQuestion({ ...editingQuestion, difficulty: e.target.value as Difficulty })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs font-semibold"
                  >
                    <option value="Dễ">Dễ</option>
                    <option value="Trung bình">Trung bình</option>
                    <option value="Khó">Khó</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Chủ đề</label>
                  <input
                    type="text"
                    value={editingQuestion.topic}
                    onChange={e => setEditingQuestion({ ...editingQuestion, topic: e.target.value })}
                    placeholder="Chủ đề"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Nguồn</label>
                  <input
                    type="text"
                    value={editingQuestion.source}
                    onChange={e => setEditingQuestion({ ...editingQuestion, source: e.target.value })}
                    placeholder="Nguồn tài liệu"
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Trạng thái</label>
                  <select
                    value={editingQuestion.status}
                    onChange={e => setEditingQuestion({ ...editingQuestion, status: e.target.value as QuestionStatus })}
                    className="w-full p-2 rounded-xl border border-slate-300 text-xs font-bold"
                  >
                    <option value="published">Xuất bản</option>
                    <option value="draft">Bản nháp</option>
                  </select>
                </div>
              </div>

              <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-100"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md"
                >
                  Lưu Câu Hỏi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
