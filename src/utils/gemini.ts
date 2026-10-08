export const FALLBACK_MODELS = [
  'gemini-3-flash-preview',
  'gemini-3-pro-preview',
  'gemini-2.5-flash'
];

export async function callGeminiApiWithFallback(
  promptText: string,
  systemInstruction?: string,
  preferredModel?: string
): Promise<string> {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('edu_gemini_api_key');
  if (!apiKey) {
    throw new Error('API Key chưa được cài đặt. Vui lòng thiết lập API Key.');
  }

  const modelList = [...FALLBACK_MODELS];
  const startModel = preferredModel || localStorage.getItem('edu_gemini_model') || modelList[0];
  
  // Bring the preferred model to the front if it exists in the list
  const orderedModels = [
    startModel,
    ...modelList.filter(m => m !== startModel)
  ];

  let lastError: Error | null = null;

  for (const model of orderedModels) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const payload: any = {
        contents: [
          {
            role: "user",
            parts: [{ text: promptText }]
          }
        ],
        generationConfig: {
          temperature: 0.2,
          responseMimeType: "application/json",
        }
      };

      if (systemInstruction) {
        payload.systemInstruction = {
          parts: [{ text: systemInstruction }]
        };
      }

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || `Lỗi API (${res.status})`);
      }

      const textOutput = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!textOutput) {
        throw new Error('Định dạng phản hồi từ API không hợp lệ');
      }

      return textOutput;
    } catch (error: any) {
      console.warn(`Lỗi khi gọi model ${model}:`, error);
      lastError = error;
      // Continue to next model in loop
    }
  }

  throw new Error(`Đã thử tất cả model dự phòng nhưng đều thất bại. Lỗi cuối cùng: ${lastError?.message}`);
}
