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

音声生成を使う場合は Google Cloud Text-to-Speech API の **API キー** が必要です（取得方法は下記）。

```env
GOOGLE_TTS_API_KEY=your-google-cloud-api-key
```

**Vercel デプロイ** — Vercel ダッシュボード → Project → Settings → Environment Variables に `GOOGLE_TTS_API_KEY` を設定してください。Production / Preview / Development すべてにチェックを入れてください。

### Google Cloud TTS API キーの取得手順

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクトを選択（または新規作成）
2. **API とサービス** → **ライブラリ** → 「Cloud Text-to-Speech API」を検索 → **有効化**
3. **API とサービス** → **認証情報** → **認証情報を作成** → **API キー**
4. 作成されたキーをコピーし、`.env` の `GOOGLE_TTS_API_KEY` に設定
5. （推奨）作成した API キーの **編集** → **API の制限** → 「Cloud Text-to-Speech API」のみに限定

請求先アカウントのリンクが必要な場合があります（無料枠あり）。Neural2 音声は従量課金です。

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
   - `GOOGLE_TTS_API_KEY` — 音声生成
4. デプロイ

## 既存の Python スクリプト

`文字起こし.py` は Google Cloud TTS でTXTから音声WAVを生成するスクリプトです。
本アプリの `lib/tts.ts` に同じロジック（英語: en-US-Neural2-F、日本語: ja-JP-Neural2-B）を移植しています。
