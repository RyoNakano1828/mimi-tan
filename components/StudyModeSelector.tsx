"use client";

import type { AppStudyMode } from "@/lib/types";
import { STUDY_MODE_LABELS } from "@/lib/types";

interface StudyModeSelectorProps {
  value: AppStudyMode;
  onChange: (mode: AppStudyMode) => void;
  disabled?: boolean;
}

export default function StudyModeSelector({
  value,
  onChange,
  disabled,
}: StudyModeSelectorProps) {
  const modes: AppStudyMode[] = ["toeic", "daily"];

  return (
    <div className="study-mode-selector">
      <span className="study-mode-selector__label">学習モード</span>
      <div className="study-mode-selector__tabs">
        {modes.map((mode) => (
          <button
            key={mode}
            type="button"
            disabled={disabled}
            onClick={() => onChange(mode)}
            className={`study-mode-selector__tab${
              value === mode ? " study-mode-selector__tab--active" : ""
            }`}
          >
            {STUDY_MODE_LABELS[mode]}
          </button>
        ))}
      </div>
    </div>
  );
}
