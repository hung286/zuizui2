import React, { useState, useEffect, useMemo } from 'react';
import { Question, StudentProfile, Difficulty, SRSData } from '../types';
import { soundFx } from '../utils/sound';
import { addPlayHistory } from '../utils/storage';
import { getSRSData, saveSRSData, updateSRSWeight, getWeakCount, sortBySRSWeight } from '../utils/srs';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Shuffle,
  RotateCcw,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Flame,
  Award,
  Layers,
  BrainCircuit
} from 'lucide-react';

interface SelfStudyModeProps {
  questions: Question[];
  student: StudentProfile;
}

export const SelfStudyMode: React.FC<SelfStudyModeProps> = ({ questions, student }) => {
  // Published questions only
  const publishedQuestions = useMemo(() => {
    return questions.filter(q => q.status === 'published');
  }, [questions]);

  // Filters
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | 'Tất cả'>('Tất cả');
  const [selectedTopic, setSelectedTopic] = useState<string>('Tất cả');
  const [shuffleQuestions, setShuffleQuestions] = useState(false);
  const [shuffleOptions, setShuffleOptions] = useState(false);
  const [onlyWrongMode, setOnlyWrongMode] = useState(false);
  const [focusWeakMode, setFocusWeakMode] = useState(false);

  // SRS State
  const [srsData, setSrsData] = useState<SRSData>(getSRSData(student.name, student.className));

  useEffect(() => {
    setSrsData(getSRSData(student.name, student.className));
  }, [student]);

  const weakCount = useMemo(() => getWeakCount(srsData), [srsData]);

  // Topics available
  const availableTopics = useMemo(() => {
    const set = new Set<string>();
    publishedQuestions.forEach(q => {
      if (q.topic) set.add(q.topic);
    });
    return Array.from(set);
  }, [publishedQuestions]);

  // Wrong questions IDs set (session based)
  const [wrongQuestionIds, setWrongQuestionIds] = useState<Set<string>>(new Set());

  // Active question set based on filters
  const filteredQuestions = useMemo(() => {
    let list = publishedQuestions.filter(q => {
      if (onlyWrongMode && !wrongQuestionIds.has(q.id)) return false;
      if (focusWeakMode && (srsData.weights[q.id]?.weight ?? 2) < 3) return false;
      if (selectedDifficulty !== 'Tất cả' && q.difficulty !== selectedDifficulty) return false;
      if (selectedTopic !== 'Tất cả' && q.topic !== selectedTopic) return false;
      return true;
    });

    if (shuffleQuestions) {
      list = [...list].sort(() => Math.random() - 0.5);
    } else if (focusWeakMode) {
      list = sortBySRSWeight(list, srsData);
    }
    return list;
  }, [publishedQuestions, selectedDifficulty, selectedTopic, shuffleQuestions, onlyWrongMode, wrongQuestionIds, focusWeakMode, srsData]);

  // Study session state
  const SESSION_KEY = 'edu_selfstudy_session_v31';
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    try {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(userAnswers));
    } catch {}
  }, [userAnswers]);

  const [shuffledOptionsMap, setShuffledOptionsMap] = useState<Record<string, { options: string[]; correctIdx: number }>>({});

  // Reset index when filter changes
  useEffect(() => {
    setCurrentIndex(0);
  }, [selectedDifficulty, selectedTopic, onlyWrongMode, focusWeakMode]);

  const currentQ = filteredQuestions[currentIndex];

  // Prepare shuffled options for current question if enabled
  useEffect(() => {
    if (!currentQ) return;
    if (shuffleOptions && !shuffledOptionsMap[currentQ.id]) {
      const originalOptions = currentQ.options.map((opt, i) => ({ opt, isCorrect: i === currentQ.correctIndex }));
      const shuffled = [...originalOptions].sort(() => Math.random() - 0.5);
      const newCorrectIdx = shuffled.findIndex(item => item.isCorrect);
      setShuffledOptionsMap(prev => ({
        ...prev,
        [currentQ.id]: {
          options: shuffled.map(s => s.opt),
          correctIdx: newCorrectIdx
        }
      }));
    }
  }, [currentQ, shuffleOptions, shuffledOptionsMap]);

  const displayOptions = currentQ
    ? (shuffleOptions && shuffledOptionsMap[currentQ.id]
        ? shuffledOptionsMap[currentQ.id].options
        : currentQ.options)
    : [];

  const displayCorrectIndex = currentQ
    ? (shuffleOptions && shuffledOptionsMap[currentQ.id]
        ? shuffledOptionsMap[currentQ.id].correctIdx
        : currentQ.correctIndex)
    : 0;

  const currentAnswer = currentQ ? userAnswers[currentQ.id] : undefined;
  const isAnswered = currentAnswer !== undefined;

  // Handle choice
  const handleSelectOption = (idx: number) => {
    if (!currentQ || isAnswered) return;

    setUserAnswers(prev => ({ ...prev, [currentQ.id]: idx }));

    const isCorrect = idx === displayCorrectIndex;
    
    // SRS Update
    const newSrs = updateSRSWeight(srsData, currentQ.id, isCorrect);
    setSrsData(newSrs);
    saveSRSData(newSrs);

    if (isCorrect) {
      soundFx.playCorrect();
      // Remove from wrong set if answered correctly
      if (wrongQuestionIds.has(currentQ.id)) {
        setWrongQuestionIds(prev => {
          const next = new Set(prev);
          next.delete(currentQ.id);
          return next;
        });
      }
    } else {
      soundFx.playWrong();
      setWrongQuestionIds(prev => new Set(prev).add(currentQ.id));
    }
  };

  // Stats
  const answeredCount = Object.keys(userAnswers).length;
  const correctCount = Object.entries(userAnswers).filter(([qid, choice]) => {
    const q = publishedQuestions.find(item => item.id === qid);
    if (!q) return false;
    const cor = shuffleOptions && shuffledOptionsMap[qid] ? shuffledOptionsMap[qid].correctIdx : q.correctIndex;
    return choice === cor;
  }).length;

  const handleFinishReview = () => {
    soundFx.playVictory();
    confetti({ particleCount: 70, spread: 60, origin: { y: 0.7 } });
    addPlayHistory({
      studentName: student.name,
      className: student.className,
      mode: 'Tự học',
      score: correctCount,
      total: answeredCount || 1,
      accuracy: answeredCount ? Math.round((correctCount / answeredCount) * 100) : 0,
      timeSpentSeconds: 0,
      details: `Đã tự ôn tập ${answeredCount} câu (${correctCount} câu đúng, ${wrongQuestionIds.size} câu sai trong phiên)`
    });
  };

  const handleRestart = () => {
    soundFx.playClick();
    sessionStorage.removeItem(SESSION_KEY);
    setUserAnswers({});
    setCurrentIndex(0);
  };

  if (publishedQuestions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm">
        <BookOpen className="w-16 h-16 text-slate-300 mx-auto mb-4" />
        <h3 className="text-xl font-bold text-slate-800 mb-2">Chưa có câu hỏi nào được xuất bản</h3>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Vào mục <strong>Admin Studio &gt; Ngân hàng câu hỏi</strong> để duyệt hoặc xuất bản câu hỏi cho học sinh.
        </p>
      </div>
    );
  }

  if (filteredQuestions.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">
        <Layers className="w-14 h-14 text-blue-400 mx-auto mb-3" />
        <h3 className="text-lg font-bold text-slate-800 mb-2">Không tìm thấy câu hỏi phù hợp với bộ lọc</h3>
        <p className="text-sm text-slate-500 mb-5">
          Hãy thử chọn mức độ hoặc chủ đề khác, hoặc tắt chế độ ôn câu sai.
        </p>
        <button
          onClick={() => {
            setSelectedDifficulty('Tất cả');
            setSelectedTopic('Tất cả');
            setOnlyWrongMode(false);
            setFocusWeakMode(false);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
        >
          Xóa tất cả bộ lọc
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Control Bar: Filters & Shuffles */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-bold text-slate-600 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" /> Lọc:
          </span>

          {/* Difficulty filter */}
          <select
            value={selectedDifficulty}
            onChange={e => setSelectedDifficulty(e.target.value as any)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="Tất cả">Mọi mức độ</option>
            <option value="Dễ">Mức: Dễ</option>
            <option value="Trung bình">Mức: Trung bình</option>
            <option value="Khó">Mức: Khó</option>
          </select>

          {/* Topic filter */}
          <select
            value={selectedTopic}
            onChange={e => setSelectedTopic(e.target.value)}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:ring-2 focus:ring-blue-500 outline-none max-w-[160px] truncate"
          >
            <option value="Tất cả">Mọi chủ đề ({availableTopics.length})</option>
            {availableTopics.map(t => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          {/* Review weak mode (SRS) */}
          <button
            onClick={() => {
              soundFx.playClick();
              setFocusWeakMode(!focusWeakMode);
              if (!focusWeakMode) setOnlyWrongMode(false);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              focusWeakMode
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <BrainCircuit className="w-3 h-3" />
            <span>Câu yếu ({weakCount})</span>
          </button>

          {/* Review wrong only mode (Session) */}
          <button
            onClick={() => {
              soundFx.playClick();
              setOnlyWrongMode(!onlyWrongMode);
              if (!onlyWrongMode) setFocusWeakMode(false);
            }}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition ${
              onlyWrongMode
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
            <span>Sai phiên này ({wrongQuestionIds.size})</span>
          </button>
        </div>

        {/* Shuffle toggles */}
        <div className="flex items-center gap-3 text-xs">
          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-600">
            <input
              type="checkbox"
              checked={shuffleQuestions}
              onChange={e => {
                soundFx.playClick();
                setShuffleQuestions(e.target.checked);
              }}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <Shuffle className="w-3 h-3" />
            <span>Trộn câu</span>
          </label>

          <label className="flex items-center gap-1.5 cursor-pointer font-medium text-slate-600">
            <input
              type="checkbox"
              checked={shuffleOptions}
              onChange={e => {
                soundFx.playClick();
                setShuffleOptions(e.target.checked);
              }}
              className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Trộn đáp án</span>
          </label>

          <button
            onClick={handleRestart}
            className="px-2.5 py-1 text-slate-500 hover:text-slate-800 transition"
            title="Làm lại từ đầu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative overflow-hidden">
        {/* Top Badges & Progress */}
        <div className="flex items-center justify-between gap-3 mb-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 bg-blue-50 text-blue-700 font-extrabold text-xs rounded-full">
              Câu {currentIndex + 1} / {filteredQuestions.length}
            </span>
            <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-md ${
              currentQ.difficulty === 'Dễ'
                ? 'bg-emerald-50 text-emerald-700'
                : currentQ.difficulty === 'Trung bình'
                ? 'bg-amber-50 text-amber-700'
                : 'bg-rose-50 text-rose-700'
            }`}>
              {currentQ.difficulty}
            </span>
            {currentQ.topic && (
              <span className="text-xs text-slate-400 font-medium hidden sm:inline">
                • {currentQ.topic}
              </span>
            )}
            {srsData.weights[currentQ.id]?.weight >= 3 && (
              <span className="px-2.5 py-0.5 text-xs font-semibold rounded-md bg-amber-100 text-amber-700 flex items-center gap-1">
                <Flame className="w-3 h-3" /> Yếu
              </span>
            )}
          </div>

          {/* Mini score badge */}
          <div className="flex items-center gap-3 text-xs font-semibold">
            <span className="text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {correctCount} đúng
            </span>
            <span className="text-rose-500 flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> {wrongQuestionIds.size} sai
            </span>
          </div>
        </div>

        {/* Question Text */}
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 leading-relaxed">
          {currentQ.question}
        </h2>

        {/* Options Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {displayOptions.map((optText, idx) => {
            const letter = ['A', 'B', 'C', 'D'][idx];
            let cardStyle = 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100 text-slate-800';
            let badgeStyle = 'bg-white border-slate-300 text-slate-700';

            if (isAnswered) {
              if (idx === displayCorrectIndex) {
                // Correct answer is always highlighted in green
                cardStyle = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-semibold ring-2 ring-emerald-400/40';
                badgeStyle = 'bg-emerald-600 border-emerald-600 text-white';
              } else if (idx === currentAnswer) {
                // Wrong answer selected by user
                cardStyle = 'bg-rose-50 border-rose-400 text-rose-950 font-semibold ring-2 ring-rose-400/30';
                badgeStyle = 'bg-rose-600 border-rose-600 text-white';
              } else {
                cardStyle = 'opacity-45 bg-slate-50 border-slate-200 text-slate-400';
                badgeStyle = 'bg-slate-200 border-slate-200 text-slate-400';
              }
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                disabled={isAnswered}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all text-sm ${cardStyle}`}
              >
                <span className={`w-7 h-7 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${badgeStyle}`}>
                  {letter}
                </span>
                <span className="pt-0.5 leading-snug flex-1">{optText}</span>
              </button>
            );
          })}
        </div>

        {/* Explanation Box (Visible immediately after answering) */}
        {isAnswered && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 text-sm mb-6 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 font-bold mb-1.5 text-amber-900">
              <HelpCircle className="w-4 h-4 text-amber-600" />
              <span>Giải thích đáp án:</span>
            </div>
            <p className="leading-relaxed text-amber-900/90 font-medium">
              {currentQ.explanation || 'Đáp án chính xác được bảo chứng bởi dữ liệu học liệu đã kiểm duyệt.'}
            </p>
          </div>
        )}

        {/* Navigation bottom */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100 gap-3">
          <button
            onClick={() => {
              soundFx.playClick();
              if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
            }}
            disabled={currentIndex === 0}
            className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition ${
              currentIndex === 0
                ? 'opacity-40 text-slate-400 bg-slate-100 cursor-not-allowed'
                : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Câu trước</span>
          </button>

          {/* Quick jump numbers mini drawer */}
          <div className="flex items-center gap-1 overflow-x-auto max-w-[200px] sm:max-w-xs px-2 py-1 custom-scrollbar">
            {filteredQuestions.map((q, idx) => {
              const ans = userAnswers[q.id];
              let dotColor = 'bg-slate-200 text-slate-600';
              if (ans !== undefined) {
                const cor = shuffleOptions && shuffledOptionsMap[q.id] ? shuffledOptionsMap[q.id].correctIdx : q.correctIndex;
                dotColor = ans === cor ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white';
              }
              const isCurr = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => {
                    soundFx.playClick();
                    setCurrentIndex(idx);
                  }}
                  className={`w-7 h-7 rounded-lg text-xs font-bold shrink-0 transition flex items-center justify-center ${dotColor} ${
                    isCurr ? 'ring-2 ring-blue-600 scale-110 z-10' : ''
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {currentIndex < filteredQuestions.length - 1 ? (
            <button
              onClick={() => {
                soundFx.playClick();
                setCurrentIndex(currentIndex + 1);
              }}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold shadow-md transition"
            >
              <span>Câu tiếp</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinishReview}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md transition"
            >
              <Award className="w-4 h-4" />
              <span>Hoàn thành ôn tập</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
