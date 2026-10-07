/**
 * badges.ts — Hệ thống Huy hiệu thành tích (Badge/Achievement)
 * Huy hiệu được lưu vào localStorage theo từng học sinh.
 */

import { Badge, BadgeId, PlayHistory } from '../types';

const KEY_PREFIX = 'edu_badges_v31_';

// Catalog đầy đủ tất cả huy hiệu
export const BADGE_CATALOG: Record<BadgeId, Omit<Badge, 'earnedAt'>> = {
  first_correct: {
    id: 'first_correct',
    name: 'Bước Đầu Tiên',
    description: 'Trả lời đúng câu hỏi đầu tiên',
    icon: '🌱',
  },
  streak_10: {
    id: 'streak_10',
    name: 'Chiến Binh Mười Câu',
    description: 'Trả lời đúng 10 câu liên tiếp',
    icon: '🔥',
  },
  streak_50: {
    id: 'streak_50',
    name: 'Bất Bại Huyền Thoại',
    description: 'Trả lời đúng 50 câu liên tiếp',
    icon: '⚡',
  },
  accuracy_100: {
    id: 'accuracy_100',
    name: 'Hoàn Hảo Tuyệt Đối',
    description: 'Đạt 100% chính xác trong 1 bài thi thử',
    icon: '💯',
  },
  speed_master: {
    id: 'speed_master',
    name: 'Thần Tốc Độ',
    description: 'Đạt điểm tốc độ 10 lần trong Phản xạ',
    icon: '⚡',
  },
  exam_complete: {
    id: 'exam_complete',
    name: 'Chinh Phục Phòng Thi',
    description: 'Hoàn thành 5 bài thi thử',
    icon: '🎓',
  },
  battle_winner: {
    id: 'battle_winner',
    name: 'Vô Địch Đối Kháng',
    description: 'Đội thắng 3 trận đối kháng',
    icon: '🏆',
  },
  combo_5: {
    id: 'combo_5',
    name: 'Combo Khởi Đầu',
    description: 'Đạt combo x5 trong Phản xạ nhanh',
    icon: '🌟',
  },
  combo_10: {
    id: 'combo_10',
    name: 'Siêu Combo',
    description: 'Đạt combo x10 trong Phản xạ nhanh',
    icon: '👑',
  },
  total_100: {
    id: 'total_100',
    name: 'Trăm Câu Bách Chiến',
    description: 'Tổng cộng trả lời đúng 100 câu',
    icon: '💪',
  },
  total_500: {
    id: 'total_500',
    name: 'Đại Cao Thủ',
    description: 'Tổng cộng trả lời đúng 500 câu',
    icon: '🦁',
  },
};

function getStorageKey(name: string, className: string): string {
  const studentKey = `${name.trim()}_${className.trim()}`.replace(/\s+/g, '_');
  return KEY_PREFIX + studentKey;
}

/** Đọc badges đã earn của học sinh */
export function getEarnedBadges(name: string, className: string): Badge[] {
  try {
    const raw = localStorage.getItem(getStorageKey(name, className));
    if (!raw) return [];
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

/** Lưu badges */
function saveBadges(name: string, className: string, badges: Badge[]): void {
  try {
    localStorage.setItem(getStorageKey(name, className), JSON.stringify(badges));
  } catch {}
}

/** Thêm badge mới nếu chưa có. Trả về badge vừa earn (hoặc null nếu đã có rồi) */
export function awardBadge(
  name: string,
  className: string,
  badgeId: BadgeId
): Badge | null {
  const existing = getEarnedBadges(name, className);
  if (existing.find(b => b.id === badgeId)) return null; // đã có rồi

  const template = BADGE_CATALOG[badgeId];
  const newBadge: Badge = {
    ...template,
    earnedAt: new Date().toISOString(),
  };

  saveBadges(name, className, [...existing, newBadge]);
  return newBadge;
}

/**
 * Kiểm tra và trao tất cả badges dựa trên PlayHistory.
 * Gọi sau mỗi lần hoàn thành game session.
 * Trả về danh sách badges mới được trao (để hiển thị thông báo).
 */
export function checkAndAwardBadges(
  name: string,
  className: string,
  allHistory: PlayHistory[],
  sessionData?: {
    isCorrect?: boolean;
    accuracy?: number;
    mode?: string;
    maxCombo?: number;
    speedBonusCount?: number;
  }
): Badge[] {
  const newBadges: Badge[] = [];

  const myHistory = allHistory.filter(h => h.studentName === name && h.className === className);
  const totalCorrect = myHistory.reduce((sum, h) => sum + h.score, 0);
  const examHistory = myHistory.filter(h => h.mode === 'Thi thử');
  const battleHistory = myHistory.filter(h => h.mode === 'Đối kháng');

  // First correct
  if (totalCorrect >= 1) {
    const b = awardBadge(name, className, 'first_correct');
    if (b) newBadges.push(b);
  }

  // Total 100
  if (totalCorrect >= 100) {
    const b = awardBadge(name, className, 'total_100');
    if (b) newBadges.push(b);
  }

  // Total 500
  if (totalCorrect >= 500) {
    const b = awardBadge(name, className, 'total_500');
    if (b) newBadges.push(b);
  }

  // 5 exam complete
  if (examHistory.length >= 5) {
    const b = awardBadge(name, className, 'exam_complete');
    if (b) newBadges.push(b);
  }

  // Session-specific checks
  if (sessionData) {
    if (sessionData.accuracy === 100 && sessionData.mode === 'Thi thử') {
      const b = awardBadge(name, className, 'accuracy_100');
      if (b) newBadges.push(b);
    }

    if (sessionData.maxCombo && sessionData.maxCombo >= 5) {
      const b = awardBadge(name, className, 'combo_5');
      if (b) newBadges.push(b);
    }

    if (sessionData.maxCombo && sessionData.maxCombo >= 10) {
      const b = awardBadge(name, className, 'combo_10');
      if (b) newBadges.push(b);
    }

    if (sessionData.speedBonusCount && sessionData.speedBonusCount >= 10) {
      const b = awardBadge(name, className, 'speed_master');
      if (b) newBadges.push(b);
    }
  }

  return newBadges;
}

/** Tính % hoàn thành badges */
export function getBadgeProgress(name: string, className: string): {
  earned: number;
  total: number;
  percentage: number;
} {
  const earned = getEarnedBadges(name, className).length;
  const total = Object.keys(BADGE_CATALOG).length;
  return {
    earned,
    total,
    percentage: Math.round((earned / total) * 100),
  };
}
