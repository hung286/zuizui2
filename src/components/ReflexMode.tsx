import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Question, StudentProfile } from '../types';
import { soundFx } from '../utils/sound';
import { addPlayHistory } from '../utils/storage';
import confetti from 'canvas-confetti';
import {
  Zap,
  Flame,
  Clock,
  RotateCcw,
  Award,
  Sparkles,
  Play,
  TrendingUp,
  XCircle,
  CheckCircle2
} from 'lucide-react';

interface ReflexModeProps {
  questions: Question[];
  student: StudentProfile;
}

type ReflexState = 'setup' | 'playing' | 'gameover';

export const ReflexMode: React.FC<ReflexModeProps> = ({ questions, student }) => {
  const publishedQuestions = useMemo(() => {
    return questions.filter(q => q.status === 'published');
  }, [questions]);

  // Setup options
  const [duration, setDuration] = useState<number>(60); // 60s, 90s, 120s

  // Runtime State
  const [gameState, setGameState] = useState<ReflexState>('setup');
  const [timeLeft, setTimeLeft] = useState<number>(duration);
  const [score, setScore] = useState<number>(0);
  const [correctAnswers, setCorrectAnswers] = useState<number>(0);
  const [wrongAnswers, setWrongAnswers] = useState<number>(0);
  const [currentCombo, setCurrentCombo] = useState<number>(0);
  const [maxCombo, setMaxCombo] = useState<number>(0);
  const [speedBonuses, setSpeedBonuses] = useState<number>(0);

  // Question rotation
  const [questionPool, setQuestionPool] = useState<Question[]>([]);
  const [poolIndex, setPoolIndex] = useState<number>(0);
  const questionStartTimeRef = useRef<number>(Date.now());

  // Refs to track live values in timer closures (stale closure fix)
  const correctAnswersRef = useRef(0);
  const wrongAnswersRef = useRef(0);
  const scoreRef = useRef(0);
  const maxComboRef = useRef(0);
  const speedBonusesRef = useRef(0);

  // Step 34: Timers cleanup
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearTimer();
    };
  }, []);

  // Timer loop
  useEffect(() => {
    if (gameState === 'playing') {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 5 && prev > 1) {
            soundFx.playTick();
          }
          if (prev <= 1) {
            endGame();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearTimer();
    }
    return () => clearTimer();
  }, [gameState]);

  // Start game
  const startGame = () => {
    soundFx.playClick();
    if (publishedQuestions.length === 0) return;

    // Shuffle infinite loop questions
    const shuffled = [...publishedQuestions].sort(() => Math.random() - 0.5);
    setQuestionPool(shuffled);
    setPoolIndex(0);
    setScore(0);
    setCorrectAnswers(0);
    setWrongAnswers(0);
    setCurrentCombo(0);
    setMaxCombo(0);
    setSpeedBonuses(0);
    
    correctAnswersRef.current = 0;
    wrongAnswersRef.current = 0;
    scoreRef.current = 0;
    maxComboRef.current = 0;
    speedBonusesRef.current = 0;

    setTimeLeft(duration);
    questionStartTimeRef.current = Date.now();
    setGameState('playing');
  };

  // Answer handler
  const handleAnswer = (choiceIdx: number) => {
    if (gameState !== 'playing' || !currentQ) return;

    const elapsedMs = Date.now() - questionStartTimeRef.current;
    const isCorrect = choiceIdx === currentQ.correctIndex;

    if (isCorrect) {
      // Calculate score with combo and speed bonus
      const newCombo = currentCombo + 1;
      setCurrentCombo(newCombo);
      if (newCombo > maxCombo) {
        setMaxCombo(newCombo);
        maxComboRef.current = newCombo;
      }

      soundFx.playCombo(newCombo);

      // Base points + combo points
      let points = 10 + (newCombo > 1 ? (newCombo - 1) * 5 : 0);

      // Speed bonus: answered in under 2.2 seconds!
      if (elapsedMs < 2200) {
        points += 5;
        setSpeedBonuses(prev => prev + 1);
        speedBonusesRef.current += 1;
      }

      setScore(prev => prev + points);
      scoreRef.current += points;
      setCorrectAnswers(prev => prev + 1);
      correctAnswersRef.current += 1;
    } else {
      // Broken combo!
      soundFx.playWrong();
      setCurrentCombo(0);
      setWrongAnswers(prev => prev + 1);
      wrongAnswersRef.current += 1;
    }

    // Advance to next question instantly!
    questionStartTimeRef.current = Date.now();
    setPoolIndex(prev => {
      if (prev + 1 >= questionPool.length) {
        // Re-shuffle when pool runs out
        setQuestionPool([...publishedQuestions].sort(() => Math.random() - 0.5));
        return 0;
      }
      return prev + 1;
    });
  };

  // End game
  const endGame = () => {
    clearTimer();
    setGameState('gameover');
    soundFx.playVictory();
    confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });

    const totalAnswered = correctAnswersRef.current + wrongAnswersRef.current;
    const accuracy = totalAnswered > 0 ? Math.round((correctAnswersRef.current / totalAnswered) * 100) : 0;

    addPlayHistory({
      studentName: student.name,
      className: student.className,
      mode: 'Phản xạ',
      score: scoreRef.current,
      total: totalAnswered,
      accuracy,
      timeSpentSeconds: duration,
      details: `Phản xạ ${duration}s: Điểm ${scoreRef.current}, Đúng ${correctAnswersRef.current}/${totalAnswered}, Max Combo: x${maxComboRef.current}`
    });
  };

  const currentQ = questionPool[poolIndex];

  // 1. SETUP
  if (gameState === 'setup') {
    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
        <div className="w-20 h-20 rounded-3xl bg-amber-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-300/40">
          <Zap className="w-10 h-10 fill-current" />
        </div>

        <h2 className="text-2xl font-extrabold text-slate-900 mb-2">Đấu Trường Phản Xạ Nhanh</h2>
        <p className="text-sm text-slate-500 mb-6">
          Trả lời liên tiếp trong thời gian giới hạn, tích lũy chuỗi Combo bất bại và giật điểm thưởng tốc độ!
        </p>

        {/* Duration picker */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 mb-6 text-left">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Chọn thời gian thử thách
          </label>
          <div className="grid grid-cols-3 gap-3">
            {[60, 90, 120].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => setDuration(sec)}
                className={`py-3 rounded-xl font-extrabold text-sm transition border ${
                  duration === sec
                    ? 'bg-amber-500 text-white border-amber-500 shadow-md shadow-amber-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {sec} Giây
              </button>
            ))}
          </div>
        </div>

        {/* Feature Highlights */}
        <div className="grid grid-cols-3 gap-2 text-xs font-medium text-slate-600 mb-8">
          <div className="p-3 bg-blue-50 rounded-xl text-blue-900">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-blue-600" />
            <span>Cộng dồn Combo</span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl text-amber-900">
            <Sparkles className="w-4 h-4 mx-auto mb-1 text-amber-600" />
            <span>Thưởng tốc độ &lt;2s</span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl text-rose-900">
            <XCircle className="w-4 h-4 mx-auto mb-1 text-rose-600" />
            <span>Sai mất Combo</span>
          </div>
        </div>

        <button
          onClick={startGame}
          disabled={publishedQuestions.length === 0}
          className="w-full py-4 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-base shadow-lg shadow-amber-400/30 transition flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Bắt đầu đo phản xạ!</span>
        </button>
      </div>
    );
  }

  // 2. GAMEOVER
  if (gameState === 'gameover') {
    const total = correctAnswers + wrongAnswers;
    const accuracy = total > 0 ? Math.round((correctAnswers / total) * 100) : 0;

    let badge = 'Tập sự';
    if (score >= 300) badge = '👑 Huyền thoại phản xạ';
    else if (score >= 200) badge = '⚡ Bậc thầy tốc độ';
    else if (score >= 100) badge = '🔥 Kiện tướng ghi nhớ';
    else if (score >= 50) badge = '🌟 Cao thủ tiềm năng';

    return (
      <div className="max-w-xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
        <div className="w-20 h-20 rounded-full bg-linear-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-300/40">
          <Award className="w-10 h-10" />
        </div>

        <div className="inline-block px-3 py-1 bg-amber-100 text-amber-800 text-xs font-bold rounded-full mb-2">
          {badge}
        </div>
        <h2 className="text-3xl font-black text-slate-900 mb-1">Hết Giờ!</h2>
        <p className="text-xs text-slate-500 font-medium mb-6">
          Thí sinh: {student.name} • {student.className}
        </p>

        {/* Big Score Card */}
        <div className="p-6 bg-linear-to-b from-amber-500 to-amber-600 text-white rounded-3xl mb-6 shadow-lg shadow-amber-400/30">
          <div className="text-5xl font-black mb-1">{score}</div>
          <div className="text-xs font-bold tracking-wider uppercase opacity-90">Tổng điểm phản xạ</div>
        </div>

        {/* Details grid */}
        <div className="grid grid-cols-4 gap-2 mb-8 text-center text-xs">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="font-extrabold text-base text-slate-900">{correctAnswers}</div>
            <div className="text-slate-500 text-[10px]">Đúng</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="font-extrabold text-base text-slate-900">{wrongAnswers}</div>
            <div className="text-slate-500 text-[10px]">Sai</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="font-extrabold text-base text-amber-600">x{maxCombo}</div>
            <div className="text-slate-500 text-[10px]">Max Combo</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
            <div className="font-extrabold text-base text-blue-600">+{speedBonuses * 5}</div>
            <div className="text-slate-500 text-[10px]">Điểm tốc độ</div>
          </div>
        </div>

        <button
          onClick={() => setGameState('setup')}
          className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Chơi lại lượt mới</span>
        </button>
      </div>
    );
  }

  // 3. PLAYING
  if (!currentQ) return null;

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Top HUD: Score, Timer, Combo Meter */}
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-4">
        {/* Score */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Điểm số</div>
          <div className="text-2xl font-black text-amber-400">{score}</div>
        </div>

        {/* Combo Indicator */}
        <div className="flex items-center gap-1.5">
          <Flame className={`w-6 h-6 ${currentCombo > 0 ? 'text-amber-400 animate-bounce' : 'text-slate-600'}`} />
          <div>
            <div className="text-xs font-black text-amber-300">
              {currentCombo > 1 ? `COMBO x${currentCombo}!` : 'COMBO'}
            </div>
            <div className="text-[10px] text-slate-400">
              {currentCombo > 0 ? `+${(currentCombo - 1) * 5} bonus` : 'Chuỗi đúng'}
            </div>
          </div>
        </div>

        {/* Timer */}
        <div className="text-right">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1 justify-end">
            <Clock className="w-3 h-3" /> Còn lại
          </div>
          <div className={`text-2xl font-black ${timeLeft <= 10 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
            {timeLeft}s
          </div>
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-4">
          <span className="font-semibold text-slate-600">Phản xạ câu hỏi:</span>
          <span>{currentQ.difficulty}</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 leading-relaxed">
          {currentQ.question}
        </h2>

        {/* Fast Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQ.options.map((opt, idx) => {
            const letter = ['A', 'B', 'C', 'D'][idx];
            return (
              <button
                key={idx}
                onClick={() => handleAnswer(idx)}
                className="p-4 rounded-2xl border border-slate-200 bg-slate-50 hover:bg-amber-50 hover:border-amber-400 text-left flex items-start gap-3 transition-all active:scale-95 text-sm font-medium text-slate-800"
              >
                <span className="w-7 h-7 rounded-xl bg-white border border-slate-300 flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
                  {letter}
                </span>
                <span className="pt-0.5 leading-snug flex-1">{opt}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
