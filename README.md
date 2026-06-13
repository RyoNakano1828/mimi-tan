# TOEIC Sentence Builder

英単語リストからTOEIC 600点レベルのビジネス英語例文を自動生成するWebアプリです。

## 機能

- 英単語の重複除去・正規化
- テーマ別自動分類（採用・人事、会議、契約など8テーマ）
- TOEIC中級レベルの例文＋日本語訳をAI生成
- TXTファイル・音声ファイル（WAV）のダウンロード
- アプリ内学習モード（フラッシュカード形式）

## 技術スタック

- **Frontend / API**: Next.js 15 (App Router)
- **AI**: Google Gemini（デフォルト: gemini-2.5-flash-lite）
- **TTS**: Google Cloud Text-to-Speech（既存Pythonスクリプトと同じ音声設定）
- **Deploy**: Vercel

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数

`.env.local` を作成:

```env
GEMINI_API_KEY=your-gemini-api-key
```

音声生成を使う場合は Google Cloud のサービスアカウントが必要です。

**ローカル開発** — JSONキーファイルのパスを指定:

```env
GOOGLE_APPLICATION_CREDENTIALS=C:\path\to\service-account.json
```

**Vercel デプロイ** — 環境変数 `GOOGLE_APPLICATION_CREDENTIALS_JSON` に JSON の中身をそのまま貼り付け:

```
{"type":"service_account","project_id":"your-project",...}
```

Vercel ダッシュボード → Project → Settings → Environment Variables で設定できます。
Production / Preview / Development すべてにチェックを入れてください。

Base64 エンコードした JSON でも動作します（どちらか一方だけ設定）。

### 3. 開発サーバー起動

```bash
npm run dev
```

http://localhost:3000 でアクセス

## Vercel デプロイ

1. GitHub にリポジトリをプッシュ
2. [Vercel](https://vercel.com) でインポート
3. 環境変数を設定:
   - `GEMINI_API_KEY` — 例文生成（必須）
   - `GOOGLE_APPLICATION_CREDENTIALS_JSON` — 音声生成（JSONをそのまま貼り付け）
4. デプロイ

## 既存の Python スクリプト

`文字起こし.py` は Google Cloud TTS でTXTから音声WAVを生成するスクリプトです。
本アプリの `lib/tts.ts` に同じロジック（英語: en-US-Neural2-F、日本語: ja-JP-Neural2-B）を移植しています。
