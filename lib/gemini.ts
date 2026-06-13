import { GoogleGenerativeAI } from "@google/generative-ai";

const DEFAULT_MODEL = "gemini-2.5-flash-lite";
const MAX_RETRIES = 3;

function getApiKey(): string {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY が設定されていません");
  }
  return apiKey;
}

function getModel(): string {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

function parseRetryDelayMs(message: string): number {
  const match = message.match(/retry in (\d+(?:\.\d+)?)s/i);
  if (match) return Math.ceil(parseFloat(match[1]) * 1000) + 500;
  return 30000;
}

function isQuotaError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error);
  return msg.includes("429") || msg.includes("quota") || msg.includes("Quota exceeded");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function parseJsonText<T>(text: string): T {
  const trimmed = text.trim();
  const jsonText =
    trimmed.startsWith("{") || trimmed.startsWith("[")
      ? trimmed
      : trimmed.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  return JSON.parse(jsonText) as T;
}

export async function generateJson<T>(
  prompt: string,
  temperature: number
): Promise<T> {
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: getModel(),
    generationConfig: {
      responseMimeType: "application/json",
      temperature,
    },
  });

  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return parseJsonText<T>(result.response.text());
    } catch (error) {
      lastError = error;
      if (isQuotaError(error) && attempt < MAX_RETRIES) {
        const delay = parseRetryDelayMs(
          error instanceof Error ? error.message : String(error)
        );
        await sleep(delay);
        continue;
      }
      if (isQuotaError(error)) {
        throw new Error(
          `Gemini API の利用上限に達しました（モデル: ${getModel()}）。` +
            "しばらく待ってから再試行するか、GEMINI_MODEL=gemini-2.5-flash-lite を .env.local に設定してください。"
        );
      }
      throw error;
    }
  }

  throw lastError;
}
