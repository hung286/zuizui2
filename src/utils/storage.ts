import { AppConfig, Question, PlayHistory, StudentProfile, TeachingTool } from '../types';
import { DEFAULT_QUESTIONS_50 } from '../data/defaultQuestions';

const KEY_CONFIG = 'edu_app_config_v32';
const KEY_QUESTIONS = 'edu_question_bank_v32';
const KEY_HISTORY = 'edu_play_history_v32';
const KEY_STUDENT = 'edu_student_profile_v32';
const KEY_GEMINI_KEY = 'edu_gemini_session_key';

export const DEFAULT_CONFIG: AppConfig = {
  appName: 'TOÁN PRO',
  shortDesc: 'Nền tảng học toán tương tác và luyện thi thông minh',
  orgName: 'LỚP TOÁN THẦY HÙNG',
  topBadge: 'EDUCATION APP v3.1 STABLE',
  themeColor: 'blue',
  logoUrl: '',
  adminPin: '1234',
  showStudentInfoInHeader: true,
  soundEnabled: true,
  allowStudentReview: true,
  defaultTestCount: 20,
  defaultTestTimePerQuestion: 20,
};

export const DEFAULT_STUDENT: StudentProfile = {
  name: 'Học sinh',
  className: 'Lớp 12A1',
};

// --- APP CONFIG STORAGE WITH VERIFIED PERSISTENCE (Step 32) ---

export function getAppConfig(): AppConfig {
  try {
    const raw = localStorage.getItem(KEY_CONFIG);
    if (!raw) return DEFAULT_CONFIG;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_CONFIG, ...parsed };
  } catch (e) {
    console.error('Error reading app config:', e);
    return DEFAULT_CONFIG;
  }
}

/**
 * Step 32: Cơ chế lưu cấu hình ổn định
 * NHẬP CẤU HÌNH → LƯU → ĐỌC LẠI → XÁC MINH → CẬP NHẬT GIAO DIỆN → THÔNG BÁO KẾT QUẢ
 */
export function saveAppConfigVerified(newConfig: AppConfig): { success: boolean; message: string } {
  try {
    const jsonStr = JSON.stringify(newConfig);
    // 1. Lưu
    localStorage.setItem(KEY_CONFIG, jsonStr);

    // 2. Đọc lại
    const readBack = localStorage.getItem(KEY_CONFIG);
    if (!readBack) {
      throw new Error('Dữ liệu không tồn tại sau khi ghi vào LocalStorage.');
    }

    // 3. Xác minh
    const parsed = JSON.parse(readBack);
    if (parsed.appName !== newConfig.appName || parsed.adminPin !== newConfig.adminPin) {
      throw new Error('Cấu hình đọc lại không khớp với dữ liệu đã lưu.');
    }

    return { success: true, message: 'Đã lưu cấu hình và xác minh hệ thống thành công!' };
  } catch (error: any) {
    console.error('Lỗi lưu cấu hình:', error);
    return {
      success: false,
      message: `Lỗi lưu cấu hình: ${error?.message || 'Bộ nhớ trình duyệt có thể đã bị chặn hoặc đầy dung lượng.'}`
    };
  }
}

// --- LOGO OPTIMIZER (Step 33) ---
export function optimizeImage(file: File, maxWidth = 256, maxHeight = 256): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          return resolve(e.target?.result as string);
        }
        ctx.drawImage(img, 0, 0, width, height);
        // Nén sang JPEG chất lượng 0.82 để siêu nhẹ cho LocalStorage
        const optimizedDataUrl = canvas.toDataURL('image/jpeg', 0.82);
        resolve(optimizedDataUrl);
      };
      img.onerror = reject;
      img.src = e.target?.result as string;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// --- QUESTION BANK STORAGE ---

export function getQuestionBank(): Question[] {
  try {
    const raw = localStorage.getItem(KEY_QUESTIONS);
    if (!raw) {
      // Khởi tạo 50 câu mặc định lần đầu
      localStorage.setItem(KEY_QUESTIONS, JSON.stringify(DEFAULT_QUESTIONS_50));
      return DEFAULT_QUESTIONS_50;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(KEY_QUESTIONS, JSON.stringify(DEFAULT_QUESTIONS_50));
      return DEFAULT_QUESTIONS_50;
    }
    return parsed;
  } catch {
    return DEFAULT_QUESTIONS_50;
  }
}

export function saveQuestionBank(questions: Question[]): boolean {
  try {
    localStorage.setItem(KEY_QUESTIONS, JSON.stringify(questions));
    return true;
  } catch (e) {
    console.error('Error saving question bank:', e);
    return false;
  }
}

export function restore50DefaultQuestions(): Question[] {
  saveQuestionBank(DEFAULT_QUESTIONS_50);
  return DEFAULT_QUESTIONS_50;
}

// --- STUDENT PROFILE ---

export function getStudentProfile(): StudentProfile {
  try {
    const raw = localStorage.getItem(KEY_STUDENT);
    if (!raw) return DEFAULT_STUDENT;
    return { ...DEFAULT_STUDENT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_STUDENT;
  }
}

export function saveStudentProfile(profile: StudentProfile): void {
  try {
    localStorage.setItem(KEY_STUDENT, JSON.stringify(profile));
  } catch (e) {
    console.error('Error saving student profile:', e);
  }
}

// --- PLAY HISTORY ---

export function getPlayHistory(): PlayHistory[] {
  try {
    const raw = localStorage.getItem(KEY_HISTORY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function addPlayHistory(item: Omit<PlayHistory, 'id' | 'timestamp'>): PlayHistory {
  const history = getPlayHistory();
  const newItem: PlayHistory = {
    ...item,
    id: `play_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toLocaleString('vi-VN')
  };
  history.unshift(newItem);
  // Keep last 300 entries
  if (history.length > 300) history.pop();
  try {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(history));
  } catch {}
  return newItem;
}

export function deletePlayHistory(ids: string[]): PlayHistory[] {
  const idSet = new Set(ids);
  const remaining = getPlayHistory().filter(item => !idSet.has(item.id));
  try {
    localStorage.setItem(KEY_HISTORY, JSON.stringify(remaining));
  } catch {}
  return remaining;
}

export function clearAllPlayHistory(): void {
  try {
    localStorage.removeItem(KEY_HISTORY);
  } catch {}
}

// CSV Export for History with UTF-8 BOM for Excel
export function exportHistoryToCsv(history: PlayHistory[]): void {
  const headers = ['ID', 'Học sinh', 'Lớp', 'Chế độ', 'Điểm', 'Tổng số', 'Độ chính xác (%)', 'Thời gian (giây)', 'Ghi chú', 'Thời điểm'];
  const rows = history.map(h => [
    `"${h.id}"`,
    `"${h.studentName.replace(/"/g, '""')}"`,
    `"${h.className.replace(/"/g, '""')}"`,
    `"${h.mode}"`,
    h.score,
    h.total,
    `${h.accuracy}%`,
    h.timeSpentSeconds,
    `"${(h.details || '').replace(/"/g, '""')}"`,
    `"${h.timestamp}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Lich_su_hoc_tap_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// CSV Export for Question Bank
export function exportQuestionsToCsv(questions: Question[]): void {
  const headers = ['Câu hỏi', 'Phương án A', 'Phương án B', 'Phương án C', 'Phương án D', 'Đáp án đúng (A/B/C/D)', 'Giải thích', 'Độ khó', 'Chủ đề', 'Nguồn', 'Trạng thái'];
  const labels = ['A', 'B', 'C', 'D'];
  const rows = questions.map(q => [
    `"${q.question.replace(/"/g, '""')}"`,
    `"${(q.options[0] || '').replace(/"/g, '""')}"`,
    `"${(q.options[1] || '').replace(/"/g, '""')}"`,
    `"${(q.options[2] || '').replace(/"/g, '""')}"`,
    `"${(q.options[3] || '').replace(/"/g, '""')}"`,
    `"${labels[q.correctIndex] || 'A'}"`,
    `"${(q.explanation || '').replace(/"/g, '""')}"`,
    `"${q.difficulty}"`,
    `"${(q.topic || '').replace(/"/g, '""')}"`,
    `"${(q.source || '').replace(/"/g, '""')}"`,
    `"${q.status}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `Ngan_hang_cau_hoi_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// JSON Backup & Restore
export function createSystemBackup(): string {
  const config = getAppConfig();
  const questions = getQuestionBank();
  const history = getPlayHistory();

  const backupData = {
    version: '3.1-stable',
    exportedAt: new Date().toISOString(),
    config,
    questions,
    history
    // Note: Gemini API key is intentionally excluded for security
  };

  return JSON.stringify(backupData, null, 2);
}

export function restoreSystemBackup(jsonStr: string): { success: boolean; message: string } {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') {
      return { success: false, message: 'Tệp sao lưu không hợp lệ.' };
    }

    if (data.config) {
      saveAppConfigVerified(data.config);
    }
    if (Array.isArray(data.questions)) {
      saveQuestionBank(data.questions);
    }
    if (Array.isArray(data.history)) {
      localStorage.setItem(KEY_HISTORY, JSON.stringify(data.history));
    }

    return { success: true, message: 'Khôi phục toàn bộ hệ thống thành công!' };
  } catch (e: any) {
    return { success: false, message: `Lỗi khôi phục: ${e?.message || 'Tệp sao lưu bị hỏng'}` };
  }
}

// Session Gemini Key
export function getSessionGeminiKey(): string {
  try {
    return sessionStorage.getItem(KEY_GEMINI_KEY) || localStorage.getItem(KEY_GEMINI_KEY) || '';
  } catch {
    return '';
  }
}

export function setSessionGeminiKey(key: string): void {
  try {
    sessionStorage.setItem(KEY_GEMINI_KEY, key);
    localStorage.setItem(KEY_GEMINI_KEY, key);
  } catch {}
}

export function clearSessionGeminiKey(): void {
  try {
    sessionStorage.removeItem(KEY_GEMINI_KEY);
    localStorage.removeItem(KEY_GEMINI_KEY);
  } catch {}
}

// Factory Reset (Step 29)
export function factoryResetSystem(): void {
  try {
    localStorage.removeItem(KEY_CONFIG);
    localStorage.removeItem(KEY_QUESTIONS);
    localStorage.removeItem(KEY_HISTORY);
    localStorage.removeItem(KEY_STUDENT);
    localStorage.removeItem(KEY_GEMINI_KEY);
    sessionStorage.removeItem(KEY_GEMINI_KEY);
  } catch {}
}
const KEY_TOOLS = 'edu_teaching_tools_v31';

export const DEFAULT_TOOLS: TeachingTool[] = [
  {
    id: 'tool_default_geogebra_1',
    name: 'Miền nghiệm hệ bất phương trình 2 ẩn',
    type: 'geogebra',
    category: 'thao-tac',
    url: 'https://www.geogebra.org/classic/xuzqeffb',
    description: 'Công cụ tính toán và vẽ miền nghiệm hệ bất phương trình',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

export function getTeachingTools(): TeachingTool[] {
  try {
    const raw = localStorage.getItem(KEY_TOOLS);
    if (!raw) {
      localStorage.setItem(KEY_TOOLS, JSON.stringify(DEFAULT_TOOLS));
      return DEFAULT_TOOLS;
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) {
      localStorage.setItem(KEY_TOOLS, JSON.stringify(DEFAULT_TOOLS));
      return DEFAULT_TOOLS;
    }
    return parsed;
  } catch {
    return DEFAULT_TOOLS;
  }
}

export function saveTeachingTools(tools: TeachingTool[]): boolean {
  try {
    localStorage.setItem(KEY_TOOLS, JSON.stringify(tools));
    return true;
  } catch (e) {
    console.error('Error saving tools:', e);
    return false;
  }
}
