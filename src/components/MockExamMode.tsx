import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Question, StudentProfile, AppConfig } from '../types';
import { soundFx } from '../utils/sound';
import { addPlayHistory } from '../utils/storage';
import confetti from 'canvas-confetti';
import {
  FileCheck,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Award,
  ChevronRight,
  ListOrdered,
  Eye,
  Sliders,
  Play
} from 'lucide-react';

interface MockExamModeProps {
  questions: Question[];
  student: StudentProfile;
  config: AppConfig;
}

type ExamState = 'setup' | 'in_progress' | 'completed';

export const MockExamMode: React.FC<MockExamModeProps> = ({ questions, student, config }) => {
  const publishedQuestions = useMemo(() => {
    return questions.filter(q => q.status === 'published');
  }, [questions]);

  // Setup options
  const [questionCount, setQuestionCount] = useState<number>(Math.min(20, publishedQuestions.length || 10));
  const [timePerQuestion, setTimePerQuestion] = useState<number>(config.defaultTestTimePerQuestion || 20); // seconds, 0 = unlimited

  // Exam runtime state
  const [examState, setExamState] = useState<ExamState>('setup');
  const [examQuestions, setExamQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({}); // index -> choice (0..3)
  const [timeLeft, setTimeLeft] = useState<number>(timePerQuestion);
  const [totalTimeSpent, setTotalTimeSpent] = useState<number>(0);
  const [showReview, setShowReview] = useState<boolean>(false);

  // Step 34: Robust Timer Management (Clean up intervals and timeouts)
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);

  const userAnswersRef = useRef<Record<number, number>>({});
  const totalTimeSpentRef = useRef(0);

  const clearTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (totalTimerRef.current) {
      clearInterval(totalTimerRef.current);
      totalTimerRef.current = null;
    }
  };

  // Always clear timers on unmount (Step 34)
  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, []);

  // Total time accumulator
  useEffect(() => {
    if (examState === 'in_progress') {
      totalTimerRef.current = setInterval(() => {
        setTotalTimeSpent(prev => {
          totalTimeSpentRef.current = prev + 1;
          return prev + 1;
        });
      }, 1000);
    } else {
      if (totalTimerRef.current) {
        clearInterval(totalTimerRef.current);
        totalTimerRef.current = null;
      }
    }
    return () => {
      if (totalTimerRef.current) clearInterval(totalTimerRef.current);
    };
  }, [examState]);

  // Question countdown timer
  useEffect(() => {
    if (examState !== 'in_progress' || timePerQuestion <= 0) return;

    setTimeLeft(timePerQuestion);

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 4 && prev > 1) {
          soundFx.playTick();
        }
        if (prev <= 1) {
          // Timeout! Auto next question (Step 34)
          soundFx.playWrong();
          handleAutoNext();
          return timePerQuestion;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentIndex, examState, timePerQuestion]);

  // Start exam
  const handleStartExam = () => {
    soundFx.playClick();
    if (publishedQuestions.length === 0) return;

    // Pick randomized subset of questions
    const shuffled = [...publishedQuestions].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, Math.min(questionCount, shuffled.length));

    setExamQuestions(selected);
    setCurrentIndex(0);
    setUserAnswers({});
    userAnswersRef.current = {};
    setTotalTimeSpent(0);
    totalTimeSpentRef.current = 0;
    setTimeLeft(timePerQuestion);
    setShowReview(false);
    setExamState('in_progress');
  };

  // Auto advance on timeout
  const handleAutoNext = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setCurrentIndex(curr => {
      if (curr < examQuestions.length - 1) {
        return curr + 1;
      } else {
        // Last question reached
        finishExam();
        return curr;
      }
    });
  };

  // User manually chooses answer
  const handleSelectOption = (choiceIdx: number) => {
    soundFx.playClick();
    setUserAnswers(prev => {
      const next = { ...prev, [currentIndex]: choiceIdx };
      userAnswersRef.current = next;
      return next;
    });
  };

  // Next or submit
  const handleNextOrSubmit = () => {
    soundFx.playClick();
    if (currentIndex < examQuestions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      finishExam();
    }
  };

  // Finish exam
  const finishExam = () => {
    clearTimers();
    setExamState('completed');
    soundFx.playVictory();
    confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });

    // Compute final score
    let correct = 0;
    examQuestions.forEach((q, idx) => {
      if (userAnswersRef.current[idx] === q.correctIndex) {
        correct++;
      }
    });

    const total = examQuestions.length;
    const accuracy = Math.round((correct / total) * 100);
    const timeSpent = totalTimeSpentRef.current;

    addPlayHistory({
      studentName: student.name,
      className: student.className,
      mode: 'Thi thử',
      score: correct,
      total,
      accuracy,
      timeSpentSeconds: timeSpent,
      details: `Thi thử ${total} câu: Đúng ${correct}/${total} (${accuracy}%), thời gian: ${formatTime(timeSpent)}`
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Current Question
  const currentQ = examQuestions[currentIndex];

  // 1. SETUP SCREEN
  if (examState === 'setup') {
    return (
      <div className="max-w-2xl mx-auto bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <FileCheck className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900">Phòng Thi Thử</h2>
          <p className="text-sm text-slate-500 mt-1">
            Kiểm tra năng lực thực chiến, giới hạn thời gian và tổng kết xếp hạng
          </p>
        </div>

        <div className="space-y-5 mb-8">
          {/* Question count selector */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span>Số lượng câu hỏi thi</span>
              <span className="text-blue-600 font-extrabold text-sm">{questionCount} câu</span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[10, 20, 30, publishedQuestions.length].map((cnt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setQuestionCount(cnt)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    questionCount === cnt
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cnt === publishedQuestions.length ? `Tất cả (${cnt})` : `${cnt} câu`}
                </button>
              ))}
            </div>
          </div>

          {/* Time per question selector */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Thời gian mỗi câu
              </span>
              <span className="text-blue-600 font-extrabold text-sm">
                {timePerQuestion === 0 ? 'Không giới hạn' : `${timePerQuestion} giây/câu`}
              </span>
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[15, 20, 30, 0].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => setTimePerQuestion(sec)}
                  className={`py-2 rounded-xl text-xs font-bold transition border ${
                    timePerQuestion === sec
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {sec === 0 ? 'Tự do' : `${sec}s`}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2">
              * Khi hết thời gian mỗi câu, hệ thống sẽ tự động chuyển sang câu tiếp theo.
            </p>
          </div>

          {/* Student Info preview */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-base">🎓</span>
              <span>
                Thí sinh: <strong>{student.name}</strong> ({student.className})
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartExam}
          disabled={publishedQuestions.length === 0}
          className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-base shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
        >
          <Play className="w-5 h-5 fill-current" />
          <span>Bắt đầu làm bài thi</span>
        </button>
      </div>
    );
  }

  // 2. COMPLETED SCREEN & REVIEW
  if (examState === 'completed') {
    let correctCount = 0;
    examQuestions.forEach((q, idx) => {
      if (userAnswers[idx] === q.correctIndex) correctCount++;
    });
    const totalCount = examQuestions.length;
    const score10 = ((correctCount / totalCount) * 10).toFixed(1);
    const accuracy = Math.round((correctCount / totalCount) * 100);

    return (
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Certificate / Result Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-20 h-20 rounded-full bg-linear-to-tr from-amber-400 to-amber-500 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-300/40">
            <Award className="w-10 h-10" />
          </div>

          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">
            Kết Quả Bài Thi Thử
          </h2>
          <p className="text-xs text-slate-500 font-medium mb-6">
            Thí sinh: {student.name} • {student.className} • Thời gian: {formatTime(totalTimeSpent)}
          </p>

          {/* Score badges */}
          <div className="grid grid-cols-3 gap-3 max-w-md mx-auto mb-6">
            <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 text-blue-900">
              <div className="text-2xl sm:text-3xl font-black">{score10}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-blue-700 mt-1">Thang điểm 10</div>
            </div>
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900">
              <div className="text-2xl sm:text-3xl font-black">{correctCount}/{totalCount}</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 mt-1">Số câu đúng</div>
            </div>
            <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 text-purple-900">
              <div className="text-2xl sm:text-3xl font-black">{accuracy}%</div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-purple-700 mt-1">Độ chính xác</div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => {
                soundFx.playClick();
                setShowReview(!showReview);
              }}
              className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-semibold text-sm transition flex items-center gap-2 shadow-xs"
            >
              <Eye className="w-4 h-4" />
              <span>{showReview ? 'Ẩn chi tiết bài làm' : 'Xem lại đáp án & câu sai'}</span>
            </button>

            <button
              onClick={() => {
                soundFx.playClick();
                setExamState('setup');
              }}
              className="px-5 py-2.5 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-semibold text-sm transition flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Thi lại đề khác</span>
            </button>
          </div>
        </div>

        {/* Detailed Review Section */}
        {showReview && (
          <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
            <h3 className="text-lg font-bold text-slate-800 px-1 flex items-center gap-2">
              <ListOrdered className="w-5 h-5 text-blue-600" />
              Chi tiết từng câu hỏi:
            </h3>

            {examQuestions.map((q, idx) => {
              const userChoice = userAnswers[idx];
              const isCorrect = userChoice === q.correctIndex;
              const isSkipped = userChoice === undefined;

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl p-5 border shadow-2xs ${
                    isCorrect
                      ? 'border-emerald-300'
                      : 'border-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="font-extrabold text-xs text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md">
                      Câu {idx + 1}
                    </span>
                    {isCorrect ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Đúng
                      </span>
                    ) : (
                      <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full flex items-center gap-1 border border-rose-200">
                        <XCircle className="w-3.5 h-3.5" /> {isSkipped ? 'Hết giờ / Bỏ qua' : 'Sai'}
                      </span>
                    )}
                  </div>

                  <p className="font-bold text-slate-900 text-sm mb-4 leading-relaxed">
                    {q.question}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
                    {q.options.map((opt, optIdx) => {
                      const letter = ['A', 'B', 'C', 'D'][optIdx];
                      let style = 'bg-slate-50 border-slate-200 text-slate-600';
                      if (optIdx === q.correctIndex) {
                        style = 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-1 ring-emerald-500';
                      } else if (optIdx === userChoice) {
                        style = 'bg-rose-50 border-rose-500 text-rose-950 font-bold ring-1 ring-rose-500';
                      }
                      return (
                        <div key={optIdx} className={`p-2.5 rounded-xl border flex items-center gap-2 ${style}`}>
                          <span className="font-bold w-5 h-5 rounded-md bg-white/80 flex items-center justify-center shrink-0">
                            {letter}
                          </span>
                          <span>{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {q.explanation && (
                    <div className="p-3 bg-amber-50/80 rounded-xl text-amber-950 text-xs border border-amber-200">
                      <strong>💡 Giải thích:</strong> {q.explanation}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // 3. IN PROGRESS SCREEN
  if (!currentQ) return null;

  const currentSelection = userAnswers[currentIndex];
  const timerPercentage = timePerQuestion > 0 ? (timeLeft / timePerQuestion) * 100 : 100;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Timer Bar & Progress */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
            Câu {currentIndex + 1} / {examQuestions.length}
          </span>
          <span className="text-xs text-slate-400 font-medium">
            (Đã trả lời: {Object.keys(userAnswers).length}/{examQuestions.length})
          </span>
        </div>

        {/* Circular or pill countdown */}
        {timePerQuestion > 0 && (
          <div className="flex items-center gap-2">
            <Clock className={`w-4 h-4 ${timeLeft <= 5 ? 'text-rose-500 animate-pulse' : 'text-slate-500'}`} />
            <span className={`text-base font-black ${timeLeft <= 5 ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>
              {timeLeft}s
            </span>
          </div>
        )}
      </div>

      {/* Countdown Progress line */}
      {timePerQuestion > 0 && (
        <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-1000 ${
              timeLeft <= 5 ? 'bg-rose-500' : 'bg-blue-600'
            }`}
            style={{ width: `${timerPercentage}%` }}
          />
        </div>
      )}

      {/* Overall Progress Bar */}
      <div className="flex items-center gap-3">
        <span className="text-xs text-slate-500 font-medium shrink-0">
          Tiến độ: {Object.keys(userAnswers).length}/{examQuestions.length} câu
        </span>
        <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(Object.keys(userAnswers).length / examQuestions.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm relative">
        <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-6 leading-relaxed">
          {currentQ.question}
        </h2>

        {/* Options */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {currentQ.options.map((optText, idx) => {
            const letter = ['A', 'B', 'C', 'D'][idx];
            const isSelected = currentSelection === idx;

            return (
              <button
                key={idx}
                onClick={() => handleSelectOption(idx)}
                className={`p-4 rounded-2xl border text-left flex items-start gap-3.5 transition-all text-sm ${
                  isSelected
                    ? 'bg-blue-50 border-blue-600 text-blue-950 font-bold ring-2 ring-blue-500/30'
                    : 'bg-slate-50/70 border-slate-200 hover:bg-slate-100/90 text-slate-800'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-xl border flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'bg-white border-slate-300 text-slate-700'
                  }`}
                >
                  {letter}
                </span>
                <span className="pt-0.5 leading-snug flex-1">{optText}</span>
              </button>
            );
          })}
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-100">
          <div className="text-xs text-slate-400 italic">
            * Đáp án và giải thích được ẩn trong suốt bài thi
          </div>

          <button
            onClick={handleNextOrSubmit}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-md transition"
          >
            <span>{currentIndex < examQuestions.length - 1 ? 'Câu tiếp theo' : 'Nộp bài thi'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
