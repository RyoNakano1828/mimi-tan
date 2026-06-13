import { TextToSpeechClient } from "@google-cloud/text-to-speech";

function parseCredentialsJson(value: string): object {
  const trimmed = value.trim();
  if (trimmed.startsWith("{")) {
    return JSON.parse(trimmed);
  }
  return JSON.parse(Buffer.from(trimmed, "base64").toString("utf-8"));
}

function getTtsClient(): TextToSpeechClient {
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  if (credentialsJson) {
    return new TextToSpeechClient({
      credentials: parseCredentialsJson(credentialsJson),
    });
  }
  // GOOGLE_APPLICATION_CREDENTIALS（ファイルパス）はローカル開発向け。
  // SDK が環境変数から自動で読み込む。
  return new TextToSpeechClient();
}

function isEnglish(text: string): boolean {
  const clean = text.replace(/[0-9\s.,\-\"':;?!()]/g, "");
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

function createSilence(durationMs: number, sampleRate = 24000): Buffer {
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
  const [response] = await client.synthesizeSpeech({
    input: { text },
    voice: isEng
      ? { languageCode: "en-US", name: "en-US-Neural2-F" }
      : { languageCode: "ja-JP", name: "ja-JP-Neural2-B" },
    audioConfig: {
      audioEncoding: "LINEAR16" as const,
      speakingRate: 1.0,
    },
  });

  return Buffer.from(response.audioContent as Uint8Array);
}

export async function generateAudioFromTxt(txtContent: string): Promise<Buffer> {
  const client = getTtsClient();
  const lines = txtContent.trim().split("\n");
  const audioBuffers: Buffer[] = [];
  const silence = createSilence(1000);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    if (/^\d+$/.test(trimmed)) continue;

    const eng = isEnglish(trimmed);
    const audio = await synthesizeLine(client, trimmed, eng);
    audioBuffers.push(audio);
    audioBuffers.push(silence);
  }

  return concatWavBuffers(audioBuffers);
}
