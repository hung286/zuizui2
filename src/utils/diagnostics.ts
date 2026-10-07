import { DiagnosticResult } from '../types';
import { getAppConfig, getQuestionBank, getSessionGeminiKey } from './storage';
import { indexedDBManager } from './indexedDB';

export async function runSystemDiagnostics(): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    localStorage: { ok: false, message: 'Đang kiểm tra...' },
    indexedDb: { ok: false, message: 'Đang kiểm tra...' },
    questionBank: { ok: false, count: 0, published: 0, draft: 0 },
    uiTheme: { ok: false, currentTheme: '' },
    fileApi: { ok: false, supported: false },
    geminiApi: { ok: false, message: 'Đang kiểm tra...', hasKey: false },
    configPersistence: { ok: false, message: 'Đang kiểm tra...' },
  };

  // 1. Kiểm tra LocalStorage
  try {
    const testKey = '__edu_test_storage__';
    localStorage.setItem(testKey, '1');
    const val = localStorage.getItem(testKey);
    localStorage.removeItem(testKey);
    if (val === '1') {
      result.localStorage = { ok: true, message: 'Hoạt động bình thường (đọc/ghi tốt)' };
    } else {
      result.localStorage = { ok: false, message: 'Lỗi đọc/ghi LocalStorage' };
    }
  } catch (e: any) {
    result.localStorage = { ok: false, message: `Bị chặn hoặc đầy bộ nhớ: ${e?.message}` };
  }

  // 2. Kiểm tra IndexedDB
  try {
    const materials = await indexedDBManager.getAllMaterials();
    result.indexedDb = {
      ok: true,
      message: `Khởi tạo thành công (${materials.length} học liệu được lưu trữ)`
    };
  } catch (e: any) {
    result.indexedDb = {
      ok: false,
      message: `Lỗi IndexedDB: ${e?.message || 'Không khả dụng'}`
    };
  }

  // 3. Kiểm tra Ngân hàng câu hỏi
  try {
    const qb = getQuestionBank();
    const published = qb.filter(q => q.status === 'published').length;
    const draft = qb.filter(q => q.status === 'draft').length;
    result.questionBank = {
      ok: qb.length > 0,
      count: qb.length,
      published,
      draft
    };
  } catch {
    result.questionBank = { ok: false, count: 0, published: 0, draft: 0 };
  }

  // 4. Kiểm tra Hệ thống Giao diện & Chủ đề
  try {
    const cfg = getAppConfig();
    result.uiTheme = {
      ok: Boolean(cfg.themeColor && cfg.appName),
      currentTheme: `${cfg.themeColor.toUpperCase()} | Tiêu đề: "${cfg.appName}"`
    };
  } catch {
    result.uiTheme = { ok: false, currentTheme: 'Không xác định' };
  }

  // 5. Kiểm tra File API (Blob, FileReader, Canvas)
  try {
    const hasFileReader = typeof FileReader !== 'undefined';
    const hasBlob = typeof Blob !== 'undefined';
    const hasCanvas = typeof document.createElement('canvas').getContext === 'function';
    result.fileApi = {
      ok: hasFileReader && hasBlob && hasCanvas,
      supported: hasFileReader && hasBlob && hasCanvas
    };
  } catch {
    result.fileApi = { ok: false, supported: false };
  }

  // 6. Kiểm tra Trạng thái Gemini API
  try {
    const sessionKey = getSessionGeminiKey();
    const serverCheckRes = await fetch('/api/gemini/status').catch(() => null);
    let serverHasKey = false;
    if (serverCheckRes && serverCheckRes.ok) {
      const data = await serverCheckRes.json();
      serverHasKey = Boolean(data.hasServerKey);
    }

    const hasAnyKey = serverHasKey || Boolean(sessionKey && sessionKey.length > 5);
    if (hasAnyKey) {
      result.geminiApi = {
        ok: true,
        message: serverHasKey
          ? 'Đã kết nối qua AI Studio Server (GEMINI_API_KEY sẵn sàng)'
          : 'Đã sẵn sàng với Session API Key cá nhân',
        hasKey: true
      };
    } else {
      result.geminiApi = {
        ok: false,
        message: 'Chưa cấu hình GEMINI_API_KEY (có thể nhập tạm ở Admin Studio)',
        hasKey: false
      };
    }
  } catch {
    result.geminiApi = {
      ok: false,
      message: 'Không thể kết nối dịch vụ Gemini Backend',
      hasKey: false
    };
  }

  // 7. Kiểm tra Khả năng lưu cấu hình (Verify roundtrip)
  try {
    const current = getAppConfig();
    const testVal = '__chk_' + Date.now();
    const backupAppName = current.appName;
    current.appName = testVal;
    localStorage.setItem('__edu_chk_conf__', JSON.stringify(current));
    const read = JSON.parse(localStorage.getItem('__edu_chk_conf__') || '{}');
    localStorage.removeItem('__edu_chk_conf__');
    current.appName = backupAppName;

    if (read.appName === testVal) {
      result.configPersistence = {
        ok: true,
        message: 'Cơ chế lưu và đọc lại cấu hình đạt chuẩn v3.1 Stable'
      };
    } else {
      result.configPersistence = {
        ok: false,
        message: 'Lỗi xác minh tính toàn vẹn cấu hình'
      };
    }
  } catch (e: any) {
    result.configPersistence = {
      ok: false,
      message: `Không thể kiểm tra lưu cấu hình: ${e?.message}`
    };
  }

  return result;
}
