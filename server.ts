import express from 'express';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '30mb' }));

// Helper to get GenAI client
function getGenAIClient(customApiKey?: string): GoogleGenAI | null {
  const apiKey = (customApiKey && customApiKey.trim().length > 5) ? customApiKey.trim() : process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// 1. API: Check Gemini Status
app.get('/api/gemini/status', (req, res) => {
  const hasServerKey = Boolean(process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY.length > 5);
  res.json({
    hasServerKey,
    defaultModel: 'gemini-3.8-flash',
    supportedModels: [
      { id: 'gemini-3.8-flash', name: 'Gemini 3.8 Flash (Khuyên dùng - Nhanh & Chính xác)' },
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite (Siêu nhanh)' },
      { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro Preview (Suy luận sâu)' }
    ]
  });
});

// 2. API: Test Gemini Connection
app.post('/api/gemini/test', async (req, res) => {
  try {
    const { customApiKey, model = 'gemini-3.8-flash' } = req.body;
    const ai = getGenAIClient(customApiKey);
    if (!ai) {
      return res.status(400).json({ success: false, error: 'Chưa cấu hình GEMINI_API_KEY trên máy chủ hoặc trong phiên làm việc.' });
    }

    const response = await ai.models.generateContent({
      model,
      contents: 'Trả về một chữ duy nhất: OK',
    });

    const text = response.text ? response.text.trim() : '';
    res.json({ success: true, message: 'Kết nối Gemini API thành công!', reply: text });
  } catch (error: any) {
    console.error('Gemini test error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Lỗi kiểm tra kết nối Gemini API' });
  }
});

// 3. API: Analyze Material
app.post('/api/gemini/analyze-material', async (req, res) => {
  try {
    const { materialText, title, customApiKey, model = 'gemini-3.8-flash' } = req.body;
    if (!materialText || materialText.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Nội dung học liệu trống' });
    }

    const ai = getGenAIClient(customApiKey);
    if (!ai) {
      return res.status(400).json({ success: false, error: 'Chưa có Gemini API Key' });
    }

    const prompt = `Bạn là chuyên gia giáo dục. Hãy phân tích tài liệu sau đây mang tiêu đề "${title || 'Học liệu'}":
"${materialText.slice(0, 15000)}"

Hãy trả về phân tích dạng JSON với cấu trúc:
{
  "summary": "Tóm tắt ngắn gọn nội dung trọng tâm (3-5 câu)",
  "keyPoints": ["Luận điểm 1", "Luận điểm 2", "Luận điểm 3", ...],
  "suggestedTopics": ["Chủ đề gợi ý 1", "Chủ đề gợi ý 2", ...],
  "estimatedQuestionCount": 15
}`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const outputText = response.text ? response.text.trim() : '{}';
    const parsed = JSON.parse(outputText);
    res.json({ success: true, analysis: parsed });
  } catch (error: any) {
    console.error('Gemini analyze error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Không thể phân tích học liệu' });
  }
});

// 4. API: AI Question Generator
app.post('/api/gemini/generate-questions', async (req, res) => {
  try {
    const {
      materialText,
      topic = 'Chung',
      source = 'Học liệu AI',
      count = 10,
      difficultyRatio = { easy: 40, medium: 40, hard: 20 },
      additionalPrompt = '',
      customApiKey,
      model = 'gemini-3.8-flash',
    } = req.body;

    const ai = getGenAIClient(customApiKey);
    if (!ai) {
      return res.status(400).json({ success: false, error: 'Chưa có Gemini API Key. Vui lòng thiết lập biến môi trường GEMINI_API_KEY hoặc nhập key trong phiên làm việc.' });
    }

    const targetCount = Math.max(1, Math.min(50, Number(count) || 10));

    const prompt = `Bạn là một chuyên gia khảo thí và sư phạm xuất sắc. Nhiệm vụ của bạn là tạo ${targetCount} câu hỏi trắc nghiệm khách quan 4 lựa chọn (A, B, C, D) dựa trên học liệu sau:

HỌC LIỆU:
${materialText ? materialText.slice(0, 20000) : 'Kiến thức tổng hợp về chủ đề ' + topic}

YÊU CẦU:
1. Số lượng câu hỏi: Đúng ${targetCount} câu hỏi.
2. Tỷ lệ độ khó: Khoảng ${difficultyRatio.easy}% Dễ, ${difficultyRatio.medium}% Trung bình, ${difficultyRatio.hard}% Khó.
3. Độ khó chỉ nhận một trong 3 giá trị: "Dễ", "Trung bình", "Khó".
4. Chủ đề: "${topic}". Nguồn: "${source}".
5. Mỗi câu hỏi phải có 4 phương án rõ ràng (A, B, C, D). Chỉ CÓ ĐÚNG 1 phương án chính xác.
6. Giá trị "correctIndex" là chỉ số đáp án đúng từ 0 đến 3 (0 tương ứng phương án thứ nhất, 1 thứ hai, 2 thứ ba, 3 thứ tư).
7. Có lời giải thích ngắn gọn, sư phạm, chuẩn xác tại trường "explanation".
${additionalPrompt ? `YÊU CẦU BỔ SUNG TỪ GIÁO VIÊN: ${additionalPrompt}` : ''}

Trả về một danh sách các câu hỏi theo đúng định dạng JSON Array.`;

    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              question: { type: Type.STRING, description: 'Nội dung câu hỏi trắc nghiệm' },
              options: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: 'Danh sách 4 phương án lựa chọn A, B, C, D'
              },
              correctIndex: { type: Type.INTEGER, description: 'Chỉ số của đáp án đúng (0, 1, 2 hoặc 3)' },
              explanation: { type: Type.STRING, description: 'Giải thích chi tiết vì sao đáp án đúng' },
              difficulty: { type: Type.STRING, description: 'Dễ, Trung bình hoặc Khó' },
              topic: { type: Type.STRING, description: 'Chủ đề của câu hỏi' }
            },
            required: ['question', 'options', 'correctIndex', 'explanation', 'difficulty']
          }
        }
      }
    });

    const rawText = response.text ? response.text.trim() : '[]';
    let questionsRaw: any[] = [];
    try {
      questionsRaw = JSON.parse(rawText);
    } catch {
      // Fallback regex extraction if needed
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        questionsRaw = JSON.parse(jsonMatch[0]);
      }
    }

    // Format questions into unified Question model with DRAFT status
    const now = Date.now();
    const formattedQuestions = questionsRaw.map((q: any, idx: number) => {
      const options = Array.isArray(q.options) && q.options.length >= 4
        ? q.options.slice(0, 4)
        : [
            q.options?.[0] || 'Phương án A',
            q.options?.[1] || 'Phương án B',
            q.options?.[2] || 'Phương án C',
            q.options?.[3] || 'Phương án D'
          ];
      const correctIndex = (typeof q.correctIndex === 'number' && q.correctIndex >= 0 && q.correctIndex <= 3)
        ? q.correctIndex
        : 0;

      let difficulty: 'Dễ' | 'Trung bình' | 'Khó' = 'Trung bình';
      if (q.difficulty === 'Dễ' || q.difficulty === 'Dễ / Nhận biết') difficulty = 'Dễ';
      else if (q.difficulty === 'Khó' || q.difficulty === 'Vận dụng cao') difficulty = 'Khó';

      return {
        id: `ai_${now}_${idx + 1}`,
        question: q.question || `Câu hỏi số ${idx + 1}`,
        options,
        correctIndex,
        explanation: q.explanation || 'Chưa có giải thích chi tiết.',
        difficulty,
        topic: q.topic || topic || 'Chung',
        source: source || 'AI Question Generator',
        status: 'draft', // DRAFT: giáo viên phải duyệt trước khi xuất bản cho học sinh
        createdAt: new Date().toISOString()
      };
    });

    res.json({
      success: true,
      questions: formattedQuestions,
      count: formattedQuestions.length
    });
  } catch (error: any) {
    console.error('Gemini generate questions error:', error);
    res.status(500).json({ success: false, error: error?.message || 'Lỗi sinh câu hỏi từ Gemini AI' });
  }
});

// Setup Vite or Static
async function start() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EDUCATION APP v3.1 STABLE server running on http://0.0.0.0:${PORT}`);
  });
}

start();
