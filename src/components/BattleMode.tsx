import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Question, StudentProfile } from '../types';
import { soundFx } from '../utils/sound';
import { addPlayHistory } from '../utils/storage';
import confetti from 'canvas-confetti';
import {
  Swords,
  Trophy,
  RotateCcw,
  Shield,
  Clock,
  Play,
  Volume2
} from 'lucide-react';

interface BattleModeProps {
  questions: Question[];
  student: StudentProfile;
}

type Team = 1 | 2;
type BattleState = 'setup' | 'battle' | 'gameover';

export const BattleMode: React.FC<BattleModeProps> = ({ questions, student }) => {
  const publishedQuestions = useMemo(() => {
    return questions.filter(q => q.status === 'published');
  }, [questions]);

  // Settings
  const [targetRounds, setTargetRounds] = useState<number>(10);
  const [team1Name, setTeam1Name] = useState<string>('Đội Đỏ (Phím A)');
  const [team2Name, setTeam2Name] = useState<string>('Đội Xanh (Phím L)');

  // Runtime State
  const [gameState, setGameState] = useState<BattleState>('setup');
  const [team1Score, setTeam1Score] = useState<number>(0);
  const [team2Score, setTeam2Score] = useState<number>(0);
  const [battleQuestions, setBattleQuestions] = useState<Question[]>([]);
  const [currentRound, setCurrentRound] = useState<number>(0);

  // Active Buzzer State
  const [buzzedTeam, setBuzzedTeam] = useState<Team | null>(null);
  const [buzzerSecondsLeft, setBuzzerSecondsLeft] = useState<number>(5);
  const [eliminatedOptions, setEliminatedOptions] = useState<Set<number>>(new Set());
  const [hasTriedTeams, setHasTriedTeams] = useState<Set<Team>>(new Set());

  const buzzedTeamRef = useRef<Team | null>(null);
  const hasTriedTeamsRef = useRef<Set<Team>>(new Set());

  // Step 34: Timer management
  const buzzerTimerRef = useRef<NodeJS.Timeout | null>(null);

  const clearBuzzerTimer = () => {
    if (buzzerTimerRef.current) {
      clearInterval(buzzerTimerRef.current);
      buzzerTimerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      clearBuzzerTimer();
    };
  }, []);

  // Buzzer 5-second countdown timer
  useEffect(() => {
    if (buzzedTeam !== null) {
      setBuzzerSecondsLeft(5);
      clearBuzzerTimer();

      buzzerTimerRef.current = setInterval(() => {
        setBuzzerSecondsLeft(prev => {
          if (prev <= 1) {
            // Buzzer time expired! Penalty for buzzed team!
            clearBuzzerTimer();
            handleBuzzerTimeout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearBuzzerTimer();
    }

    return () => clearBuzzerTimer();
  }, [buzzedTeam]);

  // Global Keyboard Listener for A, L and 1-4
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameState !== 'battle') return;

      const key = e.key.toLowerCase();

      // If NO team has buzzed yet:
      if (buzzedTeam === null) {
        if (key === 'a' && !hasTriedTeams.has(1)) {
          e.preventDefault();
          soundFx.playBuzz(1);
          setBuzzedTeam(1);
          buzzedTeamRef.current = 1;
          setHasTriedTeams(prev => { const n = new Set(prev).add(1); hasTriedTeamsRef.current = n; return n; });
        } else if (key === 'l' && !hasTriedTeams.has(2)) {
          e.preventDefault();
          soundFx.playBuzz(2);
          setBuzzedTeam(2);
          buzzedTeamRef.current = 2;
          setHasTriedTeams(prev => { const n = new Set(prev).add(2); hasTriedTeamsRef.current = n; return n; });
        }
      }
      // If a team HAS buzzed, they must answer with 1, 2, 3, or 4:
      else {
        if (['1', '2', '3', '4'].includes(key)) {
          e.preventDefault();
          const optionIndex = parseInt(key, 10) - 1;
          if (!eliminatedOptions.has(optionIndex)) {
            handleAnswerSubmission(optionIndex);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameState, buzzedTeam, hasTriedTeams, eliminatedOptions]);

  // Start battle
  const startBattle = () => {
    soundFx.playClick();
    if (publishedQuestions.length === 0) return;

    const shuffled = [...publishedQuestions].sort(() => Math.random() - 0.5);
    const chosen = shuffled.slice(0, Math.min(targetRounds, shuffled.length));

    setBattleQuestions(chosen);
    setCurrentRound(0);
    setTeam1Score(0);
    setTeam2Score(0);
    resetRoundState();
    setGameState('battle');
  };

  const resetRoundState = () => {
    clearBuzzerTimer();
    setBuzzedTeam(null);
    buzzedTeamRef.current = null;
    setBuzzerSecondsLeft(5);
    setEliminatedOptions(new Set());
    setHasTriedTeams(new Set());
    hasTriedTeamsRef.current = new Set();
  };

  // When buzzer time runs out (team buzzed but failed to pick in 5s)
  const handleBuzzerTimeout = () => {
    const currentBuzzedTeam = buzzedTeamRef.current;
    if (!currentBuzzedTeam) return;
    soundFx.playWrong();

    // Deduct 5 points for stalling
    if (currentBuzzedTeam === 1) setTeam1Score(prev => prev - 5);
    else setTeam2Score(prev => prev - 5);

    // Pass turn to other team if they haven't tried yet
    const otherTeam: Team = currentBuzzedTeam === 1 ? 2 : 1;
    if (!hasTriedTeamsRef.current.has(otherTeam)) {
      setBuzzedTeam(null); // Open up buzzer for other team!
      buzzedTeamRef.current = null;
    } else {
      // Both teams failed
      nextQuestion();
    }
  };

  // Answer chosen by current buzzed team
  const handleAnswerSubmission = (choiceIdx: number) => {
    if (!buzzedTeam || !currentQ) return;
    clearBuzzerTimer();

    const isCorrect = choiceIdx === currentQ.correctIndex;

    if (isCorrect) {
      soundFx.playCorrect();
      // +10 points to buzzing team!
      if (buzzedTeam === 1) setTeam1Score(prev => prev + 10);
      else setTeam2Score(prev => prev + 10);

      // Advance to next round
      setTimeout(() => {
        nextQuestion();
      }, 1200);
    } else {
      soundFx.playWrong();
      // -5 points penalty for wrong answer
      if (buzzedTeam === 1) setTeam1Score(prev => prev - 5);
      else setTeam2Score(prev => prev - 5);

      // Eliminate this wrong option!
      setEliminatedOptions(prev => new Set(prev).add(choiceIdx));

      // Check if other team still has a chance to steal
      const otherTeam: Team = buzzedTeam === 1 ? 2 : 1;
      if (!hasTriedTeams.has(otherTeam)) {
        // Reset buzzer so other team can press their key to steal!
        setBuzzedTeam(null);
        buzzedTeamRef.current = null;
      } else {
        // Both teams tried and failed
        setTimeout(() => {
          nextQuestion();
        }, 1200);
      }
    }
  };

  // Advance question or finish
  const nextQuestion = () => {
    if (currentRound < battleQuestions.length - 1) {
      setCurrentRound(prev => prev + 1);
      resetRoundState();
    } else {
      endBattle();
    }
  };

  // End battle
  const endBattle = () => {
    clearBuzzerTimer();
    setGameState('gameover');
    soundFx.playVictory();
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 } });

    const winner = team1Score > team2Score ? team1Name : team2Score > team1Score ? team2Name : 'Hòa';

    addPlayHistory({
      studentName: `${team1Name} vs ${team2Name}`,
      className: student.className,
      mode: 'Đối kháng',
      score: Math.max(team1Score, team2Score),
      total: battleQuestions.length,
      accuracy: 0,
      timeSpentSeconds: 0,
      details: `Đối kháng: ${team1Name} (${team1Score} điểm) - ${team2Name} (${team2Score} điểm). Thắng: ${winner}`
    });
  };

  const currentQ = battleQuestions[currentRound];

  // 1. SETUP SCREEN
  if (gameState === 'setup') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <Swords className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Đấu Trường Đối Kháng 2 Đội</h2>
          <p className="text-sm text-slate-500 mt-1">
            Thi đấu trực tiếp trên cùng một bàn phím: Bấm chuông giành quyền và cướp điểm!
          </p>
        </div>

        {/* Instructions Graphic */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="p-4 rounded-2xl bg-rose-50/80 border border-rose-200 text-center">
            <div className="inline-block px-3 py-1 bg-rose-600 text-white font-extrabold text-lg rounded-xl mb-2 shadow-xs">
              Phím A
            </div>
            <h4 className="font-bold text-rose-950 text-sm">Đội 1 (Bên Trái)</h4>
            <p className="text-xs text-rose-800/80 mt-1">
              Bấm <strong>A</strong> để bấm chuông giành quyền!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/80 border border-blue-200 text-center">
            <div className="inline-block px-3 py-1 bg-blue-600 text-white font-extrabold text-lg rounded-xl mb-2 shadow-xs">
              Phím L
            </div>
            <h4 className="font-bold text-blue-950 text-sm">Đội 2 (Bên Phải)</h4>
            <p className="text-xs text-blue-800/80 mt-1">
              Bấm <strong>L</strong> để bấm chuông giành quyền!
            </p>
          </div>
        </div>

        {/* Scoring Rules */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 mb-6 space-y-1.5">
          <div className="font-bold text-slate-800 mb-1">⚖️ Luật thi đấu đối kháng:</div>
          <div>• Đội bấm chuông trước có <strong>5 giây</strong> để chọn phương án (dùng phím <strong>1, 2, 3, 4</strong> hoặc bấm chuột).</div>
          <div>• <strong>Đúng:</strong> Được cộng <strong>+10 điểm</strong>.</div>
          <div>• <strong>Sai:</strong> Bị trừ <strong>-5 điểm</strong>, phương án sai bị loại, đội còn lại được quyền bấm chuông trả lời cướp điểm!</div>
        </div>

        {/* Rounds selector */}
        <div className="mb-8">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Số câu hỏi thi đấu
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[5, 10, 15].map(cnt => (
              <button
                key={cnt}
                type="button"
                onClick={() => setTargetRounds(cnt)}
                className={`py-2.5 rounded-xl font-bold text-sm transition border ${
                  targetRounds === cnt
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cnt} Câu
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startBattle}
          disabled={publishedQuestions.length === 0}
          className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-base shadow-lg shadow-rose-500/25 transition flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Vào trận đối kháng!</span>
        </button>
      </div>
    );
  }

  // 2. GAMEOVER SCREEN
  if (gameState === 'gameover') {
    const isTeam1Winner = team1Score > team2Score;
    const isTeam2Winner = team2Score > team1Score;
    const isDraw = team1Score === team2Score;

    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
        <div className="w-20 h-20 rounded-full bg-linear-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-amber-300/40">
          <Trophy className="w-10 h-10" />
        </div>

        <h2 className="text-3xl font-black text-slate-900 mb-1">
          {isDraw ? 'Trận Đấu Hòa!' : isTeam1Winner ? `🏆 ${team1Name} Chiến Thắng!` : `🏆 ${team2Name} Chiến Thắng!`}
        </h2>
        <p className="text-xs text-slate-500 mb-8 font-medium">
          Đã hoàn thành {battleQuestions.length} câu hỏi đối kháng nảy lửa
        </p>

        {/* Dual Final Score Cards */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className={`p-6 rounded-3xl border-2 transition ${
            isTeam1Winner ? 'bg-rose-50 border-rose-500 text-rose-950 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="text-sm font-bold mb-1">{team1Name}</div>
            <div className="text-4xl sm:text-5xl font-black">{team1Score}</div>
            <div className="text-[11px] font-semibold mt-2">điểm</div>
          </div>

          <div className={`p-6 rounded-3xl border-2 transition ${
            isTeam2Winner ? 'bg-blue-50 border-blue-500 text-blue-950 shadow-md' : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            <div className="text-sm font-bold mb-1">{team2Name}</div>
            <div className="text-4xl sm:text-5xl font-black">{team2Score}</div>
            <div className="text-[11px] font-semibold mt-2">điểm</div>
          </div>
        </div>

        <button
          onClick={() => setGameState('setup')}
          className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Tổ chức hiệp đấu mới</span>
        </button>
      </div>
    );
  }

  // 3. BATTLE IN PROGRESS
  if (!currentQ) return null;

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Dual Live Scoreboard */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4">
        {/* Team 1 Score Card */}
        <div className={`p-4 sm:p-5 rounded-3xl border-2 transition-all duration-200 ${
          buzzedTeam === 1
            ? 'bg-rose-600 text-white border-rose-600 shadow-lg shadow-rose-300 scale-102 ring-4 ring-rose-300'
            : 'bg-white border-rose-200 text-rose-950'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {team1Name}
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              buzzedTeam === 1 ? 'bg-white text-rose-700' : 'bg-rose-100 text-rose-800'
            }`}>
              Phím A
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black">{team1Score} <span className="text-xs font-normal opacity-80">điểm</span></div>
          {buzzedTeam === 1 && (
            <div className="text-xs font-bold mt-2 flex items-center gap-1 text-white animate-pulse">
              <Clock className="w-3.5 h-3.5" /> Đang trả lời ({buzzerSecondsLeft}s)
            </div>
          )}
        </div>

        {/* Team 2 Score Card */}
        <div className={`p-4 sm:p-5 rounded-3xl border-2 transition-all duration-200 ${
          buzzedTeam === 2
            ? 'bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-300 scale-102 ring-4 ring-blue-300'
            : 'bg-white border-blue-200 text-blue-950'
        }`}>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">
              {team2Name}
            </span>
            <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
              buzzedTeam === 2 ? 'bg-white text-blue-700' : 'bg-blue-100 text-blue-800'
            }`}>
              Phím L
            </span>
          </div>
          <div className="text-3xl sm:text-4xl font-black">{team2Score} <span className="text-xs font-normal opacity-80">điểm</span></div>
          {buzzedTeam === 2 && (
            <div className="text-xs font-bold mt-2 flex items-center gap-1 text-white animate-pulse">
              <Clock className="w-3.5 h-3.5" /> Đang trả lời ({buzzerSecondsLeft}s)
            </div>
          )}
        </div>
      </div>

      {/* Buzzer Prompt Banner */}
      <div className={`p-3.5 rounded-2xl text-center font-bold text-sm transition-all border ${
        buzzedTeam === null
          ? 'bg-amber-50 border-amber-300 text-amber-900 animate-pulse'
          : buzzedTeam === 1
          ? 'bg-rose-100 border-rose-300 text-rose-950'
          : 'bg-blue-100 border-blue-300 text-blue-950'
      }`}>
        {buzzedTeam === null ? (
          <span className="flex items-center justify-center gap-2">
            🔔 <strong>BẤM CHUÔNG NGAY:</strong> Đội 1 bấm <strong>[A]</strong> — Đội 2 bấm <strong>[L]</strong> để giành quyền!
          </span>
        ) : (
          <span>
            👉 <strong>{buzzedTeam === 1 ? team1Name : team2Name}</strong> ĐÃ GIÀNH QUYỀN! Hãy bấm phím <strong>[1, 2, 3, 4]</strong> để chốt đáp án! ({buzzerSecondsLeft}s)
          </span>
        )}
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative">
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4 pb-2 border-b border-slate-100">
          <span className="font-bold text-slate-700">Câu hỏi {currentRound + 1} / {battleQuestions.length}</span>
          <span className="px-2 py-0.5 bg-slate-100 rounded text-slate-600">{currentQ.difficulty}</span>
        </div>

        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 leading-relaxed">
          {currentQ.question}
        </h2>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {currentQ.options.map((opt, idx) => {
            const letter = ['A', 'B', 'C', 'D'][idx];
            const numKey = idx + 1;
            const isEliminated = eliminatedOptions.has(idx);

            return (
              <button
                key={idx}
                onClick={() => {
                  if (buzzedTeam !== null && !isEliminated) {
                    handleAnswerSubmission(idx);
                  }
                }}
                disabled={buzzedTeam === null || isEliminated}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3 transition-all text-sm font-medium ${
                  isEliminated
                    ? 'opacity-30 bg-rose-50 border-rose-300 line-through text-rose-400 cursor-not-allowed'
                    : buzzedTeam !== null
                    ? 'bg-slate-50 border-slate-300 hover:bg-blue-50 hover:border-blue-500 hover:shadow-xs cursor-pointer text-slate-900'
                    : 'opacity-70 bg-slate-50 border-slate-200 text-slate-700 cursor-not-allowed'
                }`}
              >
                <span className="w-7 h-7 rounded-xl bg-white border border-slate-300 flex items-center justify-center font-black text-xs shrink-0 shadow-2xs">
                  {letter} ({numKey})
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
