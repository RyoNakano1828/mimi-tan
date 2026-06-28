import "server-only";

const TTS_ENDPOINT =
  "https://texttospeech.googleapis.com/v1/text:synthesize";

const SILENCE_MS = 1000;
const SAMPLE_RATE = 24000;

const VOICE_ENGLISH = {
  languageCode: "en-US",
  name: "en-US-Neural2-F",
} as const;

const VOICE_JAPANESE = {
  languageCode: "ja-JP",
  name: "ja-JP-Neural2-B",
} as const;

const AUDIO_CONFIG = {
  audioEncoding: "LINEAR16" as const,
  speakingRate: 1.0,
};

function getApiKey(): string {
  const key = process.env.GOOGLE_TTS_API_KEY?.trim();
  if (!key) {
    throw new Error(
      "GOOGLE_TTS_API_KEY が設定されていません。.env または Vercel の環境変数に API キーを追加してください。"
    );
  }
  return key;
}

function isEnglish(text: string): boolean {
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

async function synthesizeLine(text: string, isEng: boolean): Promise<Buffer> {
  const apiKey = getApiKey();
  const voice = isEng ? VOICE_ENGLISH : VOICE_JAPANESE;

  const res = await fetch(`${TTS_ENDPOINT}?key=${encodeURIComponent(apiKey)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      input: { text },
      voice,
      audioConfig: AUDIO_CONFIG,
    }),
  });

  if (!res.ok) {
    const errBody = await res.text().catch(() => "");
    throw new Error(
      `TTS API エラー (${res.status}): ${errBody.slice(0, 200) || res.statusText}`
    );
  }

  const data = (await res.json()) as { audioContent?: string };
  if (!data.audioContent) {
    throw new Error("TTS API から音声データが返されませんでした");
  }

  return Buffer.from(data.audioContent, "base64");
}

export async function generateAudioFromTxt(txtContent: string): Promise<Buffer> {
  const lines = txtContent.trim().split("\n");
  const audioBuffers: Buffer[] = [];
  const silence = createSilence(SILENCE_MS);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (/^\d+$/.test(trimmed)) continue;

    const isEng = isEnglish(trimmed);
    const audio = await synthesizeLine(trimmed, isEng);
    audioBuffers.push(audio);
    audioBuffers.push(silence);
  }

  return concatWavBuffers(audioBuffers);
}
