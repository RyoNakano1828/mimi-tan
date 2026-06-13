"use client";

interface WordInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const PLACEHOLDER = `Accept
Advance
Agency
Budget
Conference
Contract

または

Accept, Advance, Agency, Budget, Conference, Contract`;

export default function WordInput({ value, onChange, disabled }: WordInputProps) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={PLACEHOLDER}
      disabled={disabled}
      rows={10}
      style={{
        width: "100%",
        padding: "16px 20px",
        fontSize: "15px",
        lineHeight: 1.7,
        background: "var(--bg-input)",
        color: "var(--text-primary)",
        border: "2px solid var(--border)",
        borderRadius: "var(--radius)",
        resize: "vertical",
        minHeight: "200px",
        transition: "border-color 0.2s",
      }}
      onFocus={(e) => {
        e.target.style.borderColor = "var(--accent)";
      }}
      onBlur={(e) => {
        e.target.style.borderColor = "var(--border)";
      }}
    />
  );
}
