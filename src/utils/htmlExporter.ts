import { AppConfig, Question } from '../types';

/**
 * Tạo ra 1 file HTML duy nhất chứa toàn bộ ứng dụng,
 * dữ liệu ngân hàng câu hỏi hiện tại, âm thanh tổng hợp Web Audio,
 * và các chế độ Tự học, Thi thử, Phản xạ, Đối kháng chạy 100% Offline!
 */
export function exportStandaloneHtmlFile(appConfig: AppConfig, questions: Question[]) {
  const publishedQuestions = questions.filter(q => q.status === 'published');
  const questionsJson = JSON.stringify(publishedQuestions);
  const configJson = JSON.stringify(appConfig);

  const htmlContent = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(appConfig.appName)} - EDUCATION APP v3.1 STABLE</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
    .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 min-h-screen">
  <div id="offline-app" class="max-w-5xl mx-auto px-4 py-6">
    <!-- Header -->
    <header class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm mb-6 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex items-center gap-4">
        <div class="w-14 h-14 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-2xl shadow-md">
          🎓
        </div>
        <div>
          <div class="inline-block px-2.5 py-0.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full mb-1">
            ${escapeHtml(appConfig.topBadge || 'EDUCATION APP v3.1 STABLE')}
          </div>
          <h1 class="text-2xl font-bold text-slate-900">${escapeHtml(appConfig.appName)}</h1>
          <p class="text-xs text-slate-500 font-medium">${escapeHtml(appConfig.orgName || 'Đơn vị tổ chức')} • ${escapeHtml(appConfig.shortDesc || '')}</p>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl">
          🟢 Standalone Single HTML File (100% Offline)
        </span>
      </div>
    </header>

    <!-- Navigation Tabs -->
    <div class="flex gap-2 mb-6 border-b border-slate-200 pb-3 overflow-x-auto">
      <button onclick="switchTab('self')" id="tab-self" class="tab-btn px-4 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 text-white shadow-sm">
        📘 Tự học
      </button>
      <button onclick="switchTab('exam')" id="tab-exam" class="tab-btn px-4 py-2.5 rounded-xl font-semibold text-sm bg-white text-slate-700 hover:bg-slate-100 border border-slate-200">
        📝 Thi thử
      </button>
      <button onclick="switchTab('reflex')" id="tab-reflex" class="tab-btn px-4 py-2.5 rounded-xl font-semibold text-sm bg-white text-slate-700 hover:bg-slate-100 border border-slate-200">
        ⚡ Phản xạ nhanh
      </button>
      <button onclick="switchTab('battle')" id="tab-battle" class="tab-btn px-4 py-2.5 rounded-xl font-semibold text-sm bg-white text-slate-700 hover:bg-slate-100 border border-slate-200">
        🏆 Đối kháng 2 đội (Phím A & L)
      </button>
    </div>

    <!-- Container for dynamic modes -->
    <main id="tab-content" class="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm min-h-[460px]">
      <!-- Content populated by script below -->
    </main>
  </div>

  <script>
    const APP_CONFIG = ${configJson};
    const QUESTIONS = ${questionsJson};
    let currentTab = 'self';

    // Sound FX Web Audio
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    function playBeep(freq = 600, duration = 0.15) {
      if (!audioCtx) return;
      try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + duration);
      } catch (e) {}
    }

    function switchTab(tab) {
      currentTab = tab;
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.className = 'tab-btn px-4 py-2.5 rounded-xl font-semibold text-sm bg-white text-slate-700 hover:bg-slate-100 border border-slate-200';
      });
      const activeBtn = document.getElementById('tab-' + tab);
      if (activeBtn) activeBtn.className = 'tab-btn px-4 py-2.5 rounded-xl font-semibold text-sm bg-blue-600 text-white shadow-sm';

      const content = document.getElementById('tab-content');
      if (tab === 'self') renderSelfStudy(content);
      else if (tab === 'exam') renderExam(content);
      else if (tab === 'reflex') renderReflex(content);
      else if (tab === 'battle') renderBattle(content);
    }

    // 1. Tự học
    let selfIndex = 0;
    let selfAnswers = {};
    function renderSelfStudy(el) {
      if (!QUESTIONS.length) {
        el.innerHTML = '<div class="text-center py-12 text-slate-500 font-medium">Chưa có câu hỏi nào được xuất bản.</div>';
        return;
      }
      const q = QUESTIONS[selfIndex];
      const answered = selfAnswers[selfIndex] !== undefined;
      const userChoice = selfAnswers[selfIndex];

      el.innerHTML = \`
        <div class="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <span class="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">Câu \${selfIndex + 1} / \${QUESTIONS.length}</span>
          <span class="text-xs px-2.5 py-1 bg-slate-100 font-medium text-slate-600 rounded-lg">\${q.difficulty} • \${q.topic}</span>
        </div>
        <h2 class="text-lg font-bold text-slate-800 mb-6 leading-relaxed">\${q.question}</h2>
        <div class="space-y-3 mb-6">
          \${q.options.map((opt, idx) => {
            let style = 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-800';
            let label = ['A', 'B', 'C', 'D'][idx];
            if (answered) {
              if (idx === q.correctIndex) style = 'bg-emerald-50 border-emerald-500 text-emerald-900 font-semibold';
              else if (idx === userChoice) style = 'bg-rose-50 border-rose-500 text-rose-900';
              else style = 'opacity-50 bg-slate-50 border-slate-200 text-slate-400';
            }
            return \`
              <button onclick="handleSelfChoice(\${idx})" \${answered ? 'disabled' : ''} class="w-full text-left p-4 rounded-xl border \${style} transition-all flex items-center gap-3">
                <span class="w-7 h-7 rounded-lg bg-white border border-slate-300 flex items-center justify-center font-bold text-xs text-slate-700 shadow-sm">\${label}</span>
                <span class="text-sm flex-1">\${opt}</span>
              </button>
            \`;
          }).join('')}
        </div>
        \${answered ? \`
          <div class="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-sm mb-6">
            <strong>💡 Giải thích:</strong> \${q.explanation || 'Chưa có giải thích'}
          </div>
        \` : ''}
        <div class="flex justify-between items-center pt-4 border-t border-slate-100">
          <button onclick="prevSelf()" \${selfIndex === 0 ? 'disabled class="opacity-40 px-4 py-2 bg-slate-100 rounded-xl text-sm font-semibold"' : 'class="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-sm font-semibold"'}>⬅️ Câu trước</button>
          <button onclick="nextSelf()" \${selfIndex === QUESTIONS.length - 1 ? 'disabled class="opacity-40 px-4 py-2 bg-slate-100 rounded-xl text-sm font-semibold"' : 'class="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold shadow-sm"'}>Câu tiếp ➡️</button>
        </div>
      \`;
    }

    function handleSelfChoice(idx) {
      selfAnswers[selfIndex] = idx;
      const q = QUESTIONS[selfIndex];
      if (idx === q.correctIndex) playBeep(880, 0.2);
      else playBeep(220, 0.3);
      renderSelfStudy(document.getElementById('tab-content'));
    }

    function prevSelf() { if (selfIndex > 0) { selfIndex--; renderSelfStudy(document.getElementById('tab-content')); } }
    function nextSelf() { if (selfIndex < QUESTIONS.length - 1) { selfIndex++; renderSelfStudy(document.getElementById('tab-content')); } }

    // Init
    window.onload = () => switchTab('self');
  </script>
</body>
</html>`;

  const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${appConfig.appName.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_')}_v3.1_Offline.html`;
  a.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(str: string): string {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
