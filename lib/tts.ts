import fs from "fs";
import path from "path";
import { TextToSpeechClient } from "@google-cloud/text-to-speech";

function parseCredentialsJson(value: string): object {
  const trimmed = value.trim();

  if (!trimmed || trimmed === "{") {
    throw new Error("認証情報 JSON が空、または不完全です");
  }

  const attempts: string[] = [trimmed];

  // .env に改行入り JSON を1行で入れた場合の \n エスケープを復元
  if (trimmed.includes("\\n")) {
    attempts.push(trimmed.replace(/\\n/g, "\n"));
  }

  for (const candidate of attempts) {
    if (candidate.startsWith("{")) {
      try {
        const parsed = JSON.parse(candidate);
        if (parsed && typeof parsed === "object" && parsed.type === "service_account") {
          return parsed;
        }
      } catch {
        // 次の形式を試す
      }
    }
  }

  try {
    const decoded = Buffer.from(trimmed, "base64").toString("utf-8");
    const parsed = JSON.parse(decoded);
    if (parsed && typeof parsed === "object" && parsed.type === "service_account") {
      return parsed;
    }
  } catch {
    // fall through
  }

  throw new Error(
    "GOOGLE_APPLICATION_CREDENTIALS_JSON の形式が不正です。" +
      "1行の JSON、Base64、または GOOGLE_APPLICATION_CREDENTIALS にファイルパスを指定してください。"
  );
}

function loadCredentialsFromJsonEnv(): object | null {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  if (!credentialsJson || credentialsJson === "{") {
    return null;
  }

  try {
    return parseCredentialsJson(credentialsJson);
  } catch {
    return null;
  }
}

function loadCredentialsFromFile(): object | null {
  const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (!credentialsPath) {
    return null;
  }

  const resolvedPath = path.isAbsolute(credentialsPath)
    ? credentialsPath
    : path.join(process.cwd(), credentialsPath);

  if (!fs.existsSync(resolvedPath)) {
    throw new Error(
      `GOOGLE_APPLICATION_CREDENTIALS のファイルが見つかりません: ${resolvedPath}`
    );
  }

  const raw = fs.readFileSync(resolvedPath, "utf-8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || parsed.type !== "service_account") {
    throw new Error("サービスアカウント JSON の形式が不正です");
  }
  return parsed;
}

const SILENCE_MS = 1000;
const SAMPLE_RATE = 24000;

// 文字起こし.py と同じ音声設定
const VOICE_ENGLISH = {
  languageCode: "en-US",
  name: "en-US-Neural2-F", // 英語（女性声）
} as const;

const VOICE_JAPANESE = {
  languageCode: "ja-JP",
  name: "ja-JP-Neural2-B", // 日本語（女性声）
} as const;

const AUDIO_CONFIG = {
  audioEncoding: "LINEAR16" as const,
  speakingRate: 1.0,
};

function getTtsClient(): TextToSpeechClient {
  const credentialsFromFile = loadCredentialsFromFile();
  if (credentialsFromFile) {
    return new TextToSpeechClient({
      credentials: credentialsFromFile,
    });
  }

  const credentialsFromJson = loadCredentialsFromJsonEnv();
  if (credentialsFromJson) {
    return new TextToSpeechClient({
      credentials: credentialsFromJson,
    });
  }

  const jsonEnv = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON?.trim();
  if (jsonEnv && jsonEnv !== "{" && jsonEnv.length > 10) {
    throw new Error(
      "GOOGLE_APPLICATION_CREDENTIALS_JSON を読み込めませんでした。" +
        "ローカル開発では GOOGLE_APPLICATION_CREDENTIALS=credentials/gcp-tts-service-account.json を使ってください。"
    );
  }

  return new TextToSpeechClient();
}

function isEnglish(text: string): boolean {
  // 文字起こし.py の is_english と同じ判定:
  // ASCII 文字（英数字・記号・空白）を除き、残りがなければ英語
  const clean = text.replace(/[\x00-\x7F]/g, "");
  return clean.length === 0;
}

function concatWavBuffers(buffers: Buffer[]): Buffer {
  if (buffers.length === 0) return Buffer.alloc(0);
  if (buffers.length === 1) return buffers[0];

  const dataChunks: Buffer[] = [];
  let totalDataLength = 0;

  for (const buf of buffers) {
    const data = buf.subarray(44);
    dataChunks.push(data);
    totalDataLength += data.length;
  }

  const header = Buffer.alloc(44);
  buffers[0].copy(header, 0, 0, 44);
  header.writeUInt32LE(36 + totalDataLength, 4);
  header.writeUInt32LE(totalDataLength, 40);

  return Buffer.concat([header, ...dataChunks]);
}

function createSilence(durationMs: number, sampleRate = SAMPLE_RATE): Buffer {
  const numSamples = Math.floor((sampleRate * durationMs) / 1000);
  const dataSize = numSamples * 2;
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);

  return buffer;
}

async function synthesizeLine(
  client: TextToSpeechClient,
  text: string,
  isEng: boolean
): Promise<Buffer> {
  // 英語と日本語で声と言語を切り替える（文字起こし.py と同等）
  const voice = isEng ? VOICE_ENGLISH : VOICE_JAPANESE;

  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice,
    audioConfig: AUDIO_CONFIG,
  });

  return Buffer.from(response.audioContent as Uint8Array);
}

export async function generateAudioFromTxt(txtContent: string): Promise<Buffer> {
  const client = getTtsClient();
  const lines = txtContent.trim().split("\n");
  const audioBuffers: Buffer[] = [];
  const silence = createSilence(SILENCE_MS);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (/^\d+$/.test(trimmed)) continue;

    // 英語か日本語かを自動判定（文字起こし.py と同等）
    const isEng = isEnglish(trimmed);
    const audio = await synthesizeLine(client, trimmed, isEng);
    audioBuffers.push(audio);
    audioBuffers.push(silence);
  }

  return concatWavBuffers(audioBuffers);
}
