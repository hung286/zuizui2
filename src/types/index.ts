export type Difficulty = 'Dễ' | 'Trung bình' | 'Khó';
export type QuestionStatus = 'draft' | 'published';

export interface Question {
  id: string;
  question: string;
  options: [string, string, string, string];
  correctIndex: number; // 0, 1, 2, 3
  explanation: string;
  difficulty: Difficulty;
  topic: string;
  source: string;
  status: QuestionStatus;
  createdAt?: string;
}

export type ThemeColor = 'blue' | 'indigo' | 'emerald' | 'rose' | 'amber' | 'purple';

export interface AppConfig {
  appName: string;
  shortDesc: string;
  orgName: string;
  topBadge: string;
  themeColor: ThemeColor;
  logoUrl: string;
  adminPin: string;
  showStudentInfoInHeader: boolean;
  soundEnabled: boolean;
  allowStudentReview: boolean;
  defaultTestCount: number;
  defaultTestTimePerQuestion: number; // seconds
}

export interface StudentProfile {
  name: string;
  className: string;
  avatarSeed?: string;
}

export type MaterialType = 'txt' | 'markdown' | 'csv' | 'json' | 'pdf' | 'docx' | 'image' | 'url' | 'youtube';

export interface LearningMaterial {
  id: string;
  title: string;
  type: MaterialType;
  content: string; // text or url or data
  fileSize: number; // in bytes
  createdAt: string;
  analysis?: {
    summary?: string;
    keyPoints?: string[];
    suggestedTopics?: string[];
  };
}

export type GameMode = 'Tự học' | 'Thi thử' | 'Phản xạ' | 'Đối kháng';

export interface PlayHistory {
  id: string;
  studentName: string;
  className: string;
  mode: GameMode;
  score: number;
  total: number;
  accuracy: number;
  timeSpentSeconds: number;
  details?: string;
  timestamp: string;
}

export interface DiagnosticResult {
  localStorage: { ok: boolean; message: string };
  indexedDb: { ok: boolean; message: string };
  questionBank: { ok: boolean; count: number; published: number; draft: number };
  uiTheme: { ok: boolean; currentTheme: string };
  fileApi: { ok: boolean; supported: boolean };
  geminiApi: { ok: boolean; message: string; hasKey: boolean };
  configPersistence: { ok: boolean; message: string };
}

// --- SRS (Spaced Repetition System) ---
export interface QuestionWeight {
  questionId: string;
  weight: number;       // 1 (dễ) → 5 (rất khó/hay sai)
  correctStreak: number; // số lần đúng liên tiếp
  lastSeen: string;      // ISO timestamp
}

export interface SRSData {
  studentKey: string; // `${name}_${className}`
  weights: Record<string, QuestionWeight>;
}

// --- Badge / Achievement System ---
export type BadgeId =
  | 'first_correct'
  | 'streak_10'
  | 'streak_50'
  | 'accuracy_100'
  | 'speed_master'
  | 'exam_complete'
  | 'battle_winner'
  | 'combo_5'
  | 'combo_10'
  | 'total_100'
  | 'total_500';

export interface Badge {
  id: BadgeId;
  name: string;
  description: string;
  icon: string;          // emoji
  earnedAt?: string;     // ISO timestamp khi đạt được
}

// --- Leaderboard entry ---
export interface LeaderboardEntry {
  studentName: string;
  className: string;
  totalScore: number;
  totalGames: number;
  avgAccuracy: number;
  bestStreak?: number;
}
