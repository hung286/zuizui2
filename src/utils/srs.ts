/**
 * srs.ts — Spaced Repetition System (SRS) đơn giản
 * Mỗi câu hỏi có weight từ 1-5. Câu sai tăng weight, câu đúng liên tiếp giảm weight.
 * Câu weight cao sẽ được chọn ưu tiên hơn trong chế độ ôn tập.
 */

import { QuestionWeight, SRSData } from '../types';

const KEY_PREFIX = 'edu_srs_v31_';

function getStudentKey(name: string, className: string): string {
  return `${name.trim()}_${className.trim()}`.replace(/\s+/g, '_');
}

function getStorageKey(name: string, className: string): string {
  return KEY_PREFIX + getStudentKey(name, className);
}

/** Đọc SRS data của 1 học sinh */
export function getSRSData(name: string, className: string): SRSData {
  try {
    const key = getStorageKey(name, className);
    const raw = localStorage.getItem(key);
    if (!raw) return { studentKey: getStudentKey(name, className), weights: {} };
    return JSON.parse(raw);
  } catch {
    return { studentKey: getStudentKey(name, className), weights: {} };
  }
}

/** Lưu SRS data */
export function saveSRSData(data: SRSData): void {
  try {
    const key = KEY_PREFIX + data.studentKey;
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

/** Cập nhật weight khi trả lời 1 câu */
export function updateSRSWeight(
  srsData: SRSData,
  questionId: string,
  isCorrect: boolean
): SRSData {
  const existing = srsData.weights[questionId] ?? {
    questionId,
    weight: 2,
    correctStreak: 0,
    lastSeen: new Date().toISOString(),
  };

  let newWeight = existing.weight;
  let newStreak = existing.correctStreak;

  if (isCorrect) {
    newStreak += 1;
    // Giảm weight sau 2 lần đúng liên tiếp
    if (newStreak >= 2) {
      newWeight = Math.max(1, newWeight - 1);
    }
  } else {
    newStreak = 0;
    // Tăng weight khi sai, tối đa 5
    newWeight = Math.min(5, newWeight + 1);
  }

  const updated: QuestionWeight = {
    questionId,
    weight: newWeight,
    correctStreak: newStreak,
    lastSeen: new Date().toISOString(),
  };

  return {
    ...srsData,
    weights: {
      ...srsData.weights,
      [questionId]: updated,
    },
  };
}

/** Lấy danh sách questionId cần ôn tập (weight >= 3) */
export function getWeakQuestionIds(srsData: SRSData, threshold = 3): Set<string> {
  const ids = new Set<string>();
  for (const [id, w] of Object.entries(srsData.weights)) {
    if (w.weight >= threshold) ids.add(id);
  }
  return ids;
}

/** Số câu cần ôn tập */
export function getWeakCount(srsData: SRSData, threshold = 3): number {
  return getWeakQuestionIds(srsData, threshold).size;
}

/**
 * Sắp xếp câu hỏi theo SRS weight (cao trước).
 * Câu chưa có trong SRS sẽ được coi như weight = 2.
 */
export function sortBySRSWeight<T extends { id: string }>(
  questions: T[],
  srsData: SRSData
): T[] {
  return [...questions].sort((a, b) => {
    const wa = srsData.weights[a.id]?.weight ?? 2;
    const wb = srsData.weights[b.id]?.weight ?? 2;
    return wb - wa; // weight cao = ưu tiên cao
  });
}

/** Reset SRS data của học sinh */
export function resetSRSData(name: string, className: string): void {
  try {
    localStorage.removeItem(getStorageKey(name, className));
  } catch {}
}
