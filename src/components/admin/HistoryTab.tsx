import React, { useState, useMemo } from 'react';
import { PlayHistory, GameMode } from '../../types';
import {
  getPlayHistory,
  deletePlayHistory,
  clearAllPlayHistory,
  exportHistoryToCsv
} from '../../utils/storage';
import { exportHistoryToPptx } from '../../utils/pptxExporter';
import { soundFx } from '../../utils/sound';
import {
  Search,
  Filter,
  Trash2,
  FileDown,
  CheckSquare,
  Square,
  Award,
  Clock,
  User,
  GraduationCap
} from 'lucide-react';

interface HistoryTabProps {
  history: PlayHistory[];
  onHistoryChange: (updated: PlayHistory[]) => void;
}

export const HistoryTab: React.FC<HistoryTabProps> = ({ history, onHistoryChange }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMode, setFilterMode] = useState<GameMode | 'Tất cả'>('Tất cả');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter(item => {
      const matchSearch =
        searchTerm === '' ||
        item.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.details && item.details.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchMode = filterMode === 'Tất cả' || item.mode === filterMode;
      return matchSearch && matchMode;
    });
  }, [history, searchTerm, filterMode]);

  const toggleSelect = (id: string) => {
    soundFx.playClick();
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    soundFx.playClick();
    if (selectedIds.size === filteredHistory.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredHistory.map(h => h.id)));
    }
  };

  const handleDeleteSelected = () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Bạn có chắc muốn xóa ${selectedIds.size} lượt chơi đã chọn?`)) return;

    soundFx.playClick();
    const remaining = deletePlayHistory(Array.from(selectedIds));
    onHistoryChange(remaining);
    setSelectedIds(new Set());
  };

  const handleDeleteAll = () => {
    if (history.length === 0) return;
    if (!confirm('CẢNH BÁO: Bạn có chắc chắn muốn xóa TOÀN BỘ lịch sử chơi không? Thao tác này không thể hoàn tác!')) return;

    soundFx.playClick();
    clearAllPlayHistory();
    onHistoryChange([]);
    setSelectedIds(new Set());
  };

  const handleDeleteSingle = (id: string) => {
    soundFx.playClick();
    const remaining = deletePlayHistory([id]);
    onHistoryChange(remaining);
  };

  return (
    <div className="space-y-6">
      {/* Search & Actions Toolbar */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/90 flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative min-w-[200px] flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder="Tìm theo tên học sinh, lớp, ghi chú..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-xs font-medium"
          />
        </div>

        {/* Filter Mode */}
        <div className="flex items-center gap-2">
          <select
            value={filterMode}
            onChange={e => setFilterMode(e.target.value as any)}
            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="Tất cả">Tất cả chế độ</option>
            <option value="Tự học">Tự học</option>
            <option value="Thi thử">Thi thử</option>
            <option value="Phản xạ">Phản xạ nhanh</option>
            <option value="Đối kháng">Đối kháng 2 đội</option>
          </select>
        </div>

        {/* Export & Delete Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => exportHistoryToCsv(history)}
            disabled={history.length === 0}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
            title="Xuất bảng điểm ra file CSV mở bằng Excel"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Xuất CSV Báo Cáo</span>
          </button>

          <button
            onClick={() => exportHistoryToPptx(history)}
            disabled={history.length === 0}
            className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition flex items-center gap-1.5 shadow-2xs"
            title="Xuất báo cáo dưới dạng PowerPoint"
          >
            <FileDown className="w-3.5 h-3.5 text-orange-600" />
            <span>Xuất báo cáo PPTX</span>
          </button>

          {selectedIds.size > 0 && (
            <button
              onClick={handleDeleteSelected}
              className="px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition flex items-center gap-1 shadow-2xs"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Xóa đã chọn ({selectedIds.size})</span>
            </button>
          )}

          {history.length > 0 && (
            <button
              onClick={handleDeleteAll}
              className="px-3 py-2 rounded-xl bg-slate-200 hover:bg-rose-100 text-slate-700 hover:text-rose-700 font-semibold text-xs transition flex items-center gap-1"
            >
              <span>Xóa tất cả</span>
            </button>
          )}
        </div>
      </div>

      {/* History Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-6 w-10 text-center">
                  <button onClick={toggleSelectAll} className="p-1">
                    {selectedIds.size > 0 && selectedIds.size === filteredHistory.length ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                </th>
                <th className="p-3.5">Học sinh / Lớp</th>
                <th className="p-3.5">Chế độ chơi</th>
                <th className="p-3.5 text-center">Điểm / Số câu</th>
                <th className="p-3.5 text-center">Độ chính xác</th>
                <th className="p-3.5">Thời gian thực hiện</th>
                <th className="p-3.5 pr-6 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                    Chưa có lịch sử chơi hoặc bài thi nào được ghi nhận.
                  </td>
                </tr>
              ) : (
                filteredHistory.map((h) => {
                  const isSelected = selectedIds.has(h.id);
                  return (
                    <tr key={h.id} className="hover:bg-slate-50/70 transition">
                      <td className="p-3.5 pl-6 text-center">
                        <button onClick={() => toggleSelect(h.id)} className="p-1">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-slate-300" />
                          )}
                        </button>
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900 text-sm">
                          {h.studentName}
                        </div>
                        <div className="text-[11px] text-slate-400 font-medium">
                          {h.className}
                        </div>
                      </td>
                      <td className="p-3.5">
                        <span className={`inline-block px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          h.mode === 'Tự học' ? 'bg-blue-50 text-blue-700' :
                          h.mode === 'Thi thử' ? 'bg-purple-50 text-purple-700' :
                          h.mode === 'Phản xạ' ? 'bg-amber-50 text-amber-700' :
                          'bg-rose-50 text-rose-700'
                        }`}>
                          {h.mode}
                        </span>
                        {h.details && (
                          <div className="text-[10px] text-slate-500 mt-1 truncate max-w-xs">
                            {h.details}
                          </div>
                        )}
                      </td>
                      <td className="p-3.5 text-center font-black text-sm text-slate-800">
                        {h.score} <span className="text-[11px] font-normal text-slate-400">/ {h.total}</span>
                      </td>
                      <td className="p-3.5 text-center">
                        <span className="font-bold text-slate-700">
                          {h.accuracy}%
                        </span>
                      </td>
                      <td className="p-3.5 text-[11px] text-slate-500 font-medium">
                        {h.timestamp}
                      </td>
                      <td className="p-3.5 pr-6 text-right">
                        <button
                          onClick={() => handleDeleteSingle(h.id)}
                          className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 transition"
                          title="Xóa lượt này"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
