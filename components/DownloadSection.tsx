"use client";

interface DownloadSectionProps {
  txtContent: string;
  audioUrl?: string | null;
  disabled?: boolean;
}

export default function DownloadSection({
  txtContent,
  audioUrl,
  disabled,
}: DownloadSectionProps) {
  const downloadTxt = () => {
    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sentences.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAudio = async () => {
    if (audioUrl) {
      const a = document.createElement("a");
      a.href = audioUrl;
      a.download = "sentences.wav";
      a.target = "_blank";
      a.click();
      return;
    }

    const btn = document.getElementById("audio-download-btn");
    if (btn) btn.textContent = "音声生成中...";

    try {
      const res = await fetch("/api/download-audio", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txtContent }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "音声生成に失敗しました");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "sentences.wav";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "音声生成に失敗しました");
    } finally {
      if (btn) btn.textContent = "音声をダウンロード";
    }
  };

  return (
    <div className="download-section">
      <button
        type="button"
        onClick={downloadTxt}
        disabled={disabled || !txtContent}
        className="download-section__btn download-section__btn--txt"
      >
        テキストをダウンロード
      </button>

      <button
        id="audio-download-btn"
        type="button"
        onClick={downloadAudio}
        disabled={disabled || !txtContent}
        className="download-section__btn download-section__btn--audio"
      >
        音声をダウンロード
      </button>
    </div>
  );
}
