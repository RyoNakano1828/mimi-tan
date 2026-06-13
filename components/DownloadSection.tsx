"use client";

interface DownloadSectionProps {
  txtContent: string;
  disabled?: boolean;
}

export default function DownloadSection({
  txtContent,
  disabled,
}: DownloadSectionProps) {
  const downloadTxt = () => {
    const blob = new Blob([txtContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "toeic_sentences.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAudio = async () => {
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
      a.download = "toeic_sentences.wav";
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(error instanceof Error ? error.message : "音声生成に失敗しました");
    } finally {
      if (btn) btn.textContent = "Download Audio";
    }
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "12px",
        justifyContent: "center",
        flexWrap: "wrap",
        padding: "32px 0",
      }}
    >
      <button
        onClick={downloadTxt}
        disabled={disabled}
        style={{
          padding: "14px 32px",
          fontSize: "15px",
          fontWeight: 600,
          background: disabled ? "var(--border)" : "var(--accent)",
          color: "#fff",
          borderRadius: "var(--radius)",
          transition: "background 0.2s, transform 0.1s",
          opacity: disabled ? 0.5 : 1,
        }}
        onMouseEnter={(e) => {
          if (!disabled)
            (e.target as HTMLButtonElement).style.background =
              "var(--accent-hover)";
        }}
        onMouseLeave={(e) => {
          if (!disabled)
            (e.target as HTMLButtonElement).style.background = "var(--accent)";
        }}
      >
        Download TXT
      </button>

      <button
        id="audio-download-btn"
        onClick={downloadAudio}
        disabled={disabled}
        style={{
          padding: "14px 32px",
          fontSize: "15px",
          fontWeight: 600,
          background: disabled ? "var(--border)" : "var(--success)",
          color: "#fff",
          borderRadius: "var(--radius)",
          transition: "background 0.2s",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        Download Audio
      </button>
    </div>
  );
}
