import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "みみたん",
  description: "耳で覚える、TOEIC英語 — 単語リストから例文を自動生成",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
