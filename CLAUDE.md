# CLAUDE.md

このファイルは、このリポジトリで作業する Claude Code (claude.ai/code) 向けのガイドです。

## プロジェクト概要

純粋な HTML/CSS/JavaScript で作られた個人用 PWA 習慣トラッカー。ビルドツール・依存パッケージ・トランスパイル不要。GitHub Pages (`https://ren9751.github.io/habit-tracker/`) にデプロイ済み。

## 開発方法

ビルド不要。`index.html` をブラウザで直接開くか、ローカルサーバーを起動する:

```bash
python3 -m http.server 8000
# または
npx serve .
```

リントやテストは未設定。

## アーキテクチャ

**単一ファイル JS アプリ** — すべてのロジックは `app.js`（約1040行）に集約され、3つのクラスで構成:

- **`Store`** — localStorage のラッパー。キー: `tasks`（タスク配列）、`log-YYYY-MM-DD`（日付ごとのログ）、`lastResetDate`
- **`DateUtils`** — 日付ユーティリティ。`getTodayDate()` は午前3時を日付切り替えの境界として使用（3時前は前日扱い）
- **`HabitTracker`** — メインクラス。`window.app` として生成され、すべての状態とレンダリングを管理

**データモデル:**
- `tasks[]` — 現在のタスク一覧 `{ id, name, order, done, memo }`
- `log-YYYY-MM-DD` — 日次スナップショット `{ date, entries: [{ taskId, taskName, done, memo }] }`

**主要ロジック:**
- **日次リセット** (`checkAndResetIfNeeded`): 起動時に今日 > `lastResetDate` なら、前日のログを保存してすべてのタスクを `done: false` にリセット
- **リワードシステム** (`calculateStreak`, `renderStreak`, `checkAndCelebrate`): 全タスク達成が続いた連続日数をストリークとしてカウント。全完了時に1日1回だけ紙吹雪＋トーストを表示
- **ログタブ**: インラインカレンダーで達成履歴を表示。過去の日付をクリックするとその日のログを遡って編集できる

**UI 構成** (`index.html`):
- 2タブ構成: 「今日」と「ログ」
- 設定モーダル: タスクの追加・削除・並び替えと JSON エクスポート／インポート

## Service Worker

`sw.js` は全静的ファイルをキャッシュキー `habit-tracker-v2` でキャッシュ。いずれかのファイルを編集した後は `sw.js` のバージョン文字列を更新し、ユーザーが新しいキャッシュを取得できるようにする。
