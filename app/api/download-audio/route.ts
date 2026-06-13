import { NextRequest, NextResponse } from "next/server";
import { generateAudioFromTxt } from "@/lib/tts";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const { txtContent } = await request.json();

    if (!txtContent || typeof txtContent !== "string") {
      return NextResponse.json(
        { error: "テキストコンテンツがありません" },
        { status: 400 }
      );
    }

    const audioBuffer = await generateAudioFromTxt(txtContent);

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        "Content-Type": "audio/wav",
        "Content-Disposition": 'attachment; filename="toeic_sentences.wav"',
      },
    });
  } catch (error) {
    console.error("Audio generation error:", error);
    const message =
      error instanceof Error ? error.message : "音声生成中にエラーが発生しました";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
