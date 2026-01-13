# Git Worktree TUI Manager - 仕様書

## 概要

React + OpenTUIを使用した、git worktreeのレビューをサポートするターミナルベースのインタラクティブツール。

- git worktreeで作成したディレクトリを監視し、ステージングされていないファイルを一覧表示する
- git worktreeで作成したディレクトリ上での作業が終了した場合、worktreeを削除
- tmux統合により、git worktreeのフォルダごとの監視画面を無制限に分割可能
- 特定ブランチからのdiff表示（シンタックスハイライト付き）
- 前回のコミットからのdiff表示
- gitの基本的な操作を実行可能
- `.vscode/tasks.json`読み込みによる動作確認コマンドの実行

---

## プロジェクト情報

- **プロジェクト名**: `worktree-code-review`
- **技術スタック**: TypeScript + React + OpenTUI + tmux
- **対象プラットフォーム**: macOS, Linux, WSL2 (Windows非対応)
- **前提条件**:
  - Bun 1.3.5+
  - Zig 0.14.1+
  - Git 2.22+
  - tmux 3.0+ (画面分割機能に必須)

---

## 主要機能

### 1. Worktree監視・管理

- `git worktree list --porcelain` による worktree 一覧取得
- ファイルシステム監視 (`fs.watch`) によるリアルタイム更新
- ステージングされていない変更ファイルの一覧表示
- worktree の作成・削除操作

### 2. tmux統合による画面分割

- tmux API経由での無制限ペイン分割
- 各ペインで異なるworktreeを監視
- ショートカットキーによるペイン単位での操作
  - `<定型キー> + <ターミナル番号>` でペイン切り替え

### 3. Diff表示

- 特定ブランチとの差分表示
- 前回コミットからの差分表示
- ANSIカラーコードによるシンタックスハイライト
- `simple-git.diff()` を利用

### 4. Git操作

- ステージング (add)
- コミット (commit)
- プッシュ (push)
- ブランチ切り替え
- その他基本的なgit操作を `simple-git` 経由で実行

### 5. タスク実行

- `.vscode/tasks.json` のパース
- 定義されたタスク（build, test等）の実行
- 環境変数・プリセット変数の解決 (`${workspaceFolder}` 等)
- 実行結果のリアルタイム表示

---

## 必須要件

### 設定ファイル管理

- JSON/YAML形式の設定ファイルによるアプリ内設定管理
- 多言語対応（日本語・英語）
- i18nライブラリの統合

### worktree情報表示

- worktree作成元のブランチ名
- 作成元のコミットハッシュ
- 実行したコマンドの履歴

### ターミナル分割

- tmux統合による無制限の横分割
- ペイン単位でのショートカット管理
- ペインごとに独立したworktree監視

### Diff表示

- developブランチとworktree内の差分表示
- シンタックスハイライト付き
- 大きなdiffのパフォーマンス最適化

---

## オプション要件（できれば実装）

### Linter/Formatter認識

- package.jsonや設定ファイルの解析
- 非対応部分のUI上でのアラート表示

### PR情報表示

- GitHub CLI (`gh pr view`) または GitHub API経由
- PR状態の表示（OPEN / DRAFT / Closed）
- worktreeとPRの関連付け

---

## 技術的実現可能性

### ✅ 実現可能

すべての主要機能・必須要件は技術的に実現可能です。

**実装可能な理由:**

- **Worktree監視**: `simple-git` + `fs.watch` で実現
- **画面分割**: tmux API (`tmux split-window`, `tmux send-keys`) で制御可能
- **Diff表示**: `simple-git.diff()` + ANSIカラーコード
- **Git操作**: `simple-git` ライブラリが全機能をサポート
- **Tasks実行**: JSONパース + `child_process.spawn()`
- **多言語対応**: i18nライブラリ（例: `i18next`）
- **PR情報取得**: GitHub CLI または REST API

---

## 技術的前提条件と注意点

### 1. tmux依存について

**前提条件:**

- tmuxのインストールが必須
- macOSの場合: `brew install tmux`
- Linuxの場合: ディストリビューションのパッケージマネージャ経由

**注意点:**

- Windows非対応（WSL2では動作可能）
- OpenTUIがtmuxセッション内で正しく動作するか要検証
- tmuxのバージョン互換性に注意（3.0+推奨）

### 2. シンタックスハイライト

**実装方針:**

- ターミナルでのdiffハイライトはANSIカラーコードで実現
- 推奨ライブラリ: `chalk`, `ansi-colors`, `diff-highlighter`

**注意点:**

- 大きなdiffはパフォーマンスに影響
- 行数制限やページング機能の実装を検討
- ターミナルカラーサポートの確認が必要

### 3. tasks.json実行

**実装要件:**

- VSCode tasks.jsonのフォーマット準拠
- 環境変数の解決 (`${workspaceFolder}`, `${file}` 等)
- タスク依存関係 (`dependsOn`) のサポート

**注意点:**

- VSCodeのタスクシステムの複雑な機能すべてはサポートしない
- 基本的なタスク実行のみを対象とする

### 4. パフォーマンス考慮事項

- 大量のファイル変更の監視
- リアルタイム更新頻度の調整
- diff表示の最適化
- tmuxペイン数の増加によるリソース消費

---

## 実装計画

実装フェーズの詳細な計画とタスクリストは [todo.md](./todo.md) を参照してください。

---

## 技術スタック詳細

### コア技術

- **Runtime**: Bun 1.3.5+
- **UI Framework**: React 19+ + OpenTUI
- **Git操作**: simple-git
- **ターミナル制御**: tmux API (shell commands)
- **型システム**: TypeScript (strict mode)

### 推奨ライブラリ

- **設定管理**: `js-yaml` または `dotenv`
- **多言語対応**: `i18next`, `i18next-fs-backend`
- **カラー表示**: `chalk`, `ansi-colors`
- **Diff処理**: `diff`, `diff-highlighter`
- **タスク実行**: Node.js `child_process`
- **GitHub API**: `@octokit/rest` または `gh` CLI

### 開発ツール

- **Linter**: oxlint
- **Formatter**: oxfmt, dprint
- **Type Checker**: TypeScript compiler
- **Task Runner**: mise
- **Git Hooks**: lefthook

---

## 参考リンク

- [OpenTUI Documentation](https://github.com/open-tui)
- [simple-git](https://github.com/steveukx/git-js)
- [tmux manual](https://man.openbsd.org/tmux)
