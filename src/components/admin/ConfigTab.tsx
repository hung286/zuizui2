import React, { useState } from 'react';
import { AppConfig, ThemeColor } from '../../types';
import { saveAppConfigVerified, optimizeImage } from '../../utils/storage';
import { soundFx } from '../../utils/sound';
import {
  Palette,
  Save,
  CheckCircle2,
  AlertCircle,
  Upload,
  Lock,
  Volume2,
  Sliders,
  Sparkles
} from 'lucide-react';

interface ConfigTabProps {
  currentConfig: AppConfig;
  onConfigUpdated: (newConfig: AppConfig) => void;
}

export const ConfigTab: React.FC<ConfigTabProps> = ({ currentConfig, onConfigUpdated }) => {
  const [formData, setFormData] = useState<AppConfig>({ ...currentConfig });
  const [saveStatus, setSaveStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [isProcessingLogo, setIsProcessingLogo] = useState(false);

  const presets = [
    { name: 'TOÁN PRO', org: 'LỚP TOÁN THẦY HÙNG', theme: 'blue' as ThemeColor },
    { name: 'RUNG CHUÔNG VÀNG – LỊCH SỬ VIỆT NAM', org: 'CLB Sử Học Tuổi Trẻ', theme: 'amber' as ThemeColor },
    { name: 'THỬ THÁCH TIẾNG ANH LỚP 9', org: 'Tổ Ngoại Ngữ Trường THCS', theme: 'indigo' as ThemeColor },
    { name: 'ÔN TẬP KHOA HỌC – CUỐI HỌC KỲ', org: 'Tổ Tự Nhiên & STEM', theme: 'emerald' as ThemeColor },
  ];

  const handleApplyPreset = (preset: typeof presets[0]) => {
    soundFx.playClick();
    setFormData(prev => ({
      ...prev,
      appName: preset.name,
      orgName: preset.org,
      themeColor: preset.theme,
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingLogo(true);
    try {
      // Step 33: Tối ưu và nén logo qua canvas trước khi lưu
      const optimizedUrl = await optimizeImage(file, 200, 200);
      setFormData(prev => ({ ...prev, logoUrl: optimizedUrl }));
      soundFx.playClick();
    } catch {
      alert('Không thể xử lý hình ảnh logo.');
    } finally {
      setIsProcessingLogo(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playClick();

    // Step 32: Lưu cấu hình ổn định
    const result = saveAppConfigVerified(formData);
    setSaveStatus(result);

    if (result.success) {
      soundFx.playCorrect();
      onConfigUpdated(formData);
    } else {
      soundFx.playWrong();
    }

    setTimeout(() => {
      setSaveStatus(null);
    }, 4500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Save Notification Banner */}
      {saveStatus && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold flex items-center gap-3 animate-in fade-in slide-in-from-top-2 duration-200 ${
            saveStatus.success
              ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
              : 'bg-rose-50 border-rose-300 text-rose-900'
          }`}
        >
          {saveStatus.success ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
          )}
          <span>{saveStatus.message}</span>
        </div>
      )}

      {/* Preset Quick switch (Step 37) */}
      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-amber-500" />
          Mẫu tiêu đề & nhận diện nhanh:
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {presets.map((preset, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleApplyPreset(preset)}
              className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-left transition flex items-center justify-between text-xs font-semibold text-slate-800"
            >
              <span className="truncate">{preset.name}</span>
              <span className="text-[10px] text-slate-400 shrink-0">Áp dụng</span>
            </button>
          ))}
        </div>
      </div>

      {/* Basic Identity */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Tên App / Tên Cuộc Thi
          </label>
          <input
            type="text"
            value={formData.appName}
            onChange={e => setFormData({ ...formData, appName: e.target.value })}
            placeholder="Ví dụ: RUNG CHUÔNG VÀNG – LỊCH SỬ VIỆT NAM"
            required
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Tên Trường / Đơn Vị Tổ Chức
          </label>
          <input
            type="text"
            value={formData.orgName}
            onChange={e => setFormData({ ...formData, orgName: e.target.value })}
            placeholder="Ví dụ: Trường THPT Chuyên Nguyễn Du"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Dòng Nhãn Phía Trên (Top Badge)
          </label>
          <input
            type="text"
            value={formData.topBadge}
            onChange={e => setFormData({ ...formData, topBadge: e.target.value })}
            placeholder="Ví dụ: EDUCATION APP v3.1 STABLE"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Mô Tả Ngắn
          </label>
          <input
            type="text"
            value={formData.shortDesc}
            onChange={e => setFormData({ ...formData, shortDesc: e.target.value })}
            placeholder="Mô tả mục tiêu cuộc thi hoặc bài học"
            className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
          />
        </div>
      </div>

      {/* Theme Color Picker */}
      <div>
        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
          <Palette className="w-4 h-4 text-purple-600" />
          Màu Sắc Giao Diện Chủ Đạo
        </label>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {(['blue', 'indigo', 'emerald', 'rose', 'amber', 'purple'] as ThemeColor[]).map(color => {
            const labels: Record<ThemeColor, string> = {
              blue: 'Xanh Lam',
              indigo: 'Xanh Chàm',
              emerald: 'Xanh Ngọc',
              rose: 'Hồng Đỏ',
              amber: 'Hổ Phách',
              purple: 'Tím Đậm',
            };
            const isSelected = formData.themeColor === color;
            return (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, themeColor: color })}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  isSelected
                    ? 'ring-2 ring-slate-800 bg-slate-100 font-extrabold border-slate-400'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span className={`w-3.5 h-3.5 rounded-full ${
                  color === 'blue' ? 'bg-blue-600' :
                  color === 'indigo' ? 'bg-indigo-600' :
                  color === 'emerald' ? 'bg-emerald-600' :
                  color === 'rose' ? 'bg-rose-600' :
                  color === 'amber' ? 'bg-amber-600' : 'bg-purple-600'
                }`} />
                <span>{labels[color]}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Logo & Security PIN */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
        {/* Logo Upload */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Logo Trường / Cuộc Thi (Tối ưu tự động)
          </label>
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-white border border-slate-300 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs">
              {formData.logoUrl ? (
                <img src={formData.logoUrl} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl">🎓</span>
              )}
            </div>
            <div className="flex-1">
              <label className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold text-slate-700 cursor-pointer shadow-2xs transition">
                <Upload className="w-3.5 h-3.5" />
                <span>{isProcessingLogo ? 'Đang nén logo...' : 'Chọn ảnh logo'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  disabled={isProcessingLogo}
                  className="hidden"
                />
              </label>
              {formData.logoUrl && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, logoUrl: '' })}
                  className="ml-2 text-xs text-rose-600 hover:underline"
                >
                  Gỡ bỏ
                </button>
              )}
              <p className="text-[10px] text-slate-500 mt-1">
                * Tự động resize/nén nhẹ để không quá tải LocalStorage (Step 33).
              </p>
            </div>
          </div>
        </div>

        {/* Admin PIN */}
        <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1">
            <Lock className="w-3.5 h-3.5 text-amber-600" />
            Mã PIN Bảo Vệ Admin Studio (Step 8)
          </label>
          <input
            type="password"
            maxLength={10}
            value={formData.adminPin}
            onChange={e => setFormData({ ...formData, adminPin: e.target.value })}
            placeholder="Mặc định: 1234"
            className="w-full px-3.5 py-2 rounded-xl border border-slate-300 bg-white focus:ring-2 focus:ring-blue-500 outline-none text-sm font-semibold"
          />
          <p className="text-[10px] text-slate-500 mt-1">
            * Khóa bảo vệ cục bộ trên trình duyệt ngăn học sinh tò mò truy cập.
          </p>
        </div>
      </div>

      {/* Display toggles */}
      <div className="flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-700 pt-2">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.showStudentInfoInHeader}
            onChange={e => setFormData({ ...formData, showStudentInfoInHeader: e.target.checked })}
            className="rounded text-blue-600"
          />
          <span>Hiển thị thông tin học sinh trên thanh tiêu đề</span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={formData.soundEnabled}
            onChange={e => setFormData({ ...formData, soundEnabled: e.target.checked })}
            className="rounded text-blue-600"
          />
          <span>Bật hiệu ứng âm thanh mặc định</span>
        </label>
      </div>

      {/* Submit Button */}
      <div className="pt-4 border-t border-slate-200 flex justify-end">
        <button
          type="submit"
          className="px-6 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition flex items-center gap-2"
        >
          <Save className="w-4 h-4" />
          <span>Lưu Cấu Hình & Xác Minh (Step 32)</span>
        </button>
      </div>
    </form>
  );
};
