# Supabase マイグレーション手順

## テーブル構成（4テーブル）

```
ユーザー (users)
  ├── 単語 (words)
  ├── 例文 (sentences)
  └── 単語例文 (word_sentences) — 単語と例文の多対多
```

1回の保存は `save_batch_id`（UUID）でグループ化されます。

## ファイル一覧

| ファイル | 内容 |
|---------|------|
| `20260625_0002_drop_legacy.sql` | 旧テーブル削除（移行時のみ） |
| `20260625_0001_study_sessions.sql` | 4テーブル + RLS + Storage |
| `20260625_0003_fix_auth_trigger.sql` | 新規登録トリガー修正 |
| `20260626_0004_study_mode_and_word_japanese.sql` | study_mode + 単語日本語訳 |
| `20260613_0005_auth_sync.sql` | 新規登録時に users 行を自動作成 |

## 実行手順（Supabase Dashboard）

### 新規インストール

1. **SQL Editor** → `20260625_0001_study_sessions.sql` を **Run**
2. 続けて `20260613_0005_auth_sync.sql` を **Run**
3. **必須** `20260625_0003_fix_auth_trigger.sql` を **Run**（新規登録エラー防止）
4. `20260626_0004_study_mode_and_word_japanese.sql` を **Run**
5. `20260627_0005_user_themes_situations.sql` を **Run**

### 旧スキーマ（study_sessions 系）から移行

1. `20260625_0002_drop_legacy.sql` を **Run**
2. `20260625_0001_study_sessions.sql` を **Run**
3. `20260613_0005_auth_sync.sql` を **Run**（未実行の場合）
4. `20260625_0003_fix_auth_trigger.sql` を **Run**

## 環境変数

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

## Auth 設定

Dashboard → **Authentication** → **Providers** → Email を有効化

### 新規登録がすぐ使えない場合

Dashboard → **Authentication** → **Sign In / Providers** → Email  
→ **Confirm email** を **OFF** にすると、確認メールなしですぐログインできます（個人開発向け）

確認メールを ON にしている場合は、登録後にメールのリンクをクリックしてからログインしてください。
