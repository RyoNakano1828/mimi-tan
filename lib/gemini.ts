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
  return process.env.GEMINI_MODEL?.trim() || DEFAULT_MODEL;
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isOverloadedError(error: unknown): boolean {
  const msg = errorMessage(error);
  return (
    msg.includes("503") ||
    msg.includes("high demand") ||
    msg.includes("Service Unavailable") ||
    msg.includes("UNAVAILABLE")
  );
}

function isQuotaError(error: unknown): boolean {
  const msg = errorMessage(error);
  return msg.includes("429") || msg.includes("quota") || msg.includes("Quota exceeded");
}

function isTransientError(error: unknown): boolean {
  return isOverloadedError(error) || isQuotaError(error);
}

function getRetryDelayMs(error: unknown, attempt: number): number {
  if (isOverloadedError(error)) {
    return Math.min(2000 * 2 ** attempt, 8000);
  }
  const match = errorMessage(error).match(/retry in (\d+(?:\.\d+)?)s/i);
  if (match) return Math.ceil(parseFloat(match[1]) * 1000) + 500;
  return 30000;
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
  const modelName = getModel();
  const genAI = new GoogleGenerativeAI(getApiKey());
  const model = genAI.getGenerativeModel({
    model: modelName,
    generationConfig: {
      responseMimeType: "application/json",
      temperature,
    },
  });

  let sawOverload = false;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      return parseJsonText<T>(result.response.text());
    } catch (error) {
      if (!isTransientError(error)) {
        throw error;
      }

      if (isOverloadedError(error)) sawOverload = true;

      if (attempt < MAX_RETRIES) {
        await sleep(getRetryDelayMs(error, attempt));
        continue;
      }
    }
  }

  if (sawOverload) {
    throw new Error(
      `Gemini API が混雑しています（503）。30秒〜1分待ってから再実行してください。（モデル: ${modelName}）`
    );
  }

  throw new Error(
    `Gemini API の利用上限に達しました。1〜2分待ってから再実行してください。（モデル: ${modelName}）`
  );
}
