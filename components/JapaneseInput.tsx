"use client";

interface JapaneseInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const PLACEHOLDER = `英語でなんていうんだろう？と思った日本語を入力してください。

例：
パスポートを見せていただけますか？
荷物を預ける場所はどこですか？
来週の会議の議題を確認したいのですが。

複数の文や段落でもOKです。`;

export default function JapaneseInput({
  value,
  onChange,
  disabled,
}: JapaneseInputProps) {
  return (
    <div className="japanese-input">
      <label className="japanese-input__label">
        日本語の文章
        <span className="japanese-input__hint">
          入力した内容に近い英語例文を生成します
        </span>
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={PLACEHOLDER}
        disabled={disabled}
        rows={8}
        className="japanese-input__area"
      />
    </div>
  );
}
