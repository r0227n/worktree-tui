# Git Worktree TUI Manager - 仕様書

## 概要

React + OpenTUIを使用した、git worktreeの操作をサポートするターミナルベースのインタラクティブツール。
[git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner)をベースに、TUIによる直感的な操作を提供する。

---

## プロジェクト情報

- **プロジェクト名**: `worktree-tui` (仮称)
- **技術スタック**: TypeScript + React + OpenTUI
- **対象プラットフォーム**: macOS, Linux, WSL2
- **前提条件**:
  - Bun 1.3.5
  - Zig 0.15.1

---

## 主要機能

### 1. Worktree一覧表示

#### 機能概要

リポジトリ内の全worktreeを一覧表示し、キーボードで選択可能にする。

#### 実装詳細

```typescript
// git worktree list --porcelain の出力をパース
interface Worktree {
  path: string;
  branch: string;
  head: string;
  isMain: boolean;
  isBare: boolean;
}

// OpenTUIのSelectコンポーネントで表示
<select
  options={worktrees.map(wt => ({
    value: wt.path,
    label: `${wt.branch} (${wt.path})`
  }))}
  onChange={handleWorktreeSelect}
/>
```

#### 表示情報

- ブランチ名
- パス
- HEADコミット（短縮SHA）
- ステータス（メインリポジトリ/ワークツリー）
- 変更状況（`git status --short`）

---

### 2. Worktree間の移動

#### 機能概要

選択したworktreeに作業ディレクトリを移動する。

#### 実装詳細

```typescript
const moveToWorktree = (worktreePath: string) => {
  process.chdir(worktreePath);
  // 移動後、現在のworktreeを状態に保存
  setCurrentWorktree(worktreePath);
};
```

#### キーバインド

- `Enter`: 選択したworktreeに移動
- `↑/↓`: リスト内を移動
- `Tab`: 次のworktreeに移動

---

### 3. Build/Runコマンドの実行

#### 機能概要

選択したworktree上でビルド、テスト、実行などのコマンドを実行する。

#### 実装詳細

```typescript
import { spawn } from 'child_process';

const runCommand = (command: string, cwd: string) => {
  const process = spawn(command, {
    cwd,
    shell: true,
    stdio: 'pipe'
  });

  process.stdout.on('data', (data) => {
    // リアルタイムで出力を表示
    appendOutput(data.toString());
  });

  process.stderr.on('data', (data) => {
    appendError(data.toString());
  });
};
```

#### サポートコマンド

- `npm install` / `npm run build` / `npm test`
- カスタムコマンド（ユーザー定義）
- git-worktree-runnerのhook実行

#### UI

```
┌─ Command Output ────────────────────────┐
│ $ npm run build                         │
│ > building...                           │
│ ✓ Build completed in 2.3s               │
│                                         │
│ [Ctrl+C] Stop  [Esc] Close              │
└─────────────────────────────────────────┘
```

---

### 4. Git操作のサポート

#### 機能概要

基本的なgit操作をTUI内で実行可能にする。

#### サポート操作

- `git status` - ワークツリーの状態表示
- `git add` - ステージング
- `git commit` - コミット（メッセージ入力UI）
- `git push` / `git pull` - リモート同期
- `git branch` - ブランチ一覧・作成・削除

#### 実装例（simple-git使用）

```typescript
import simpleGit from 'simple-git';

const git = simpleGit(worktreePath);

// ステータス取得
const status = await git.status();

// コミット
await git.add('.');
await git.commit('feat: add new feature');

// プッシュ
await git.push('origin', currentBranch);
```

#### インタラクティブコミットUI

```
┌─ Git Commit ────────────────────────────┐
│ Message:                                │
│ ┌─────────────────────────────────────┐ │
│ │ feat: implement worktree navigation │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Staged files (3):                       │
│   M  src/components/WorktreeList.tsx    │
│   M  src/hooks/useWorktree.ts           │
│   A  src/types/worktree.ts              │
│                                         │
│ [Enter] Commit  [Esc] Cancel            │
└─────────────────────────────────────────┘
```

---

### 5. git-worktree-runner連携

#### 機能概要

`gtr`コマンドをTUI内から実行し、worktree管理を簡易化する。

#### 連携コマンド

- `gtr new <branch>` - 新規worktree作成
- `gtr rm <branch>` - worktree削除
- `gtr list` - worktree一覧（TUIの一覧表示に統合）
- `gtr editor <branch>` - エディタで開く
- `gtr ai <branch>` - AIツール起動

#### 実装例

```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

// 新規worktree作成
const createWorktree = async (branch: string) => {
  const { stdout, stderr } = await execAsync(`git gtr new ${branch}`);
  if (stderr) throw new Error(stderr);
  return stdout;
};

// worktree削除
const removeWorktree = async (branch: string) => {
  await execAsync(`git gtr rm ${branch} --yes`);
};
```

#### 設定読み込み

```typescript
// gtrの設定を読み込む
const getGtrConfig = async (key: string): Promise<string> => {
  const { stdout } = await execAsync(`git gtr config get ${key}`);
  return stdout.trim();
};

// 例: デフォルトエディタ取得
const defaultEditor = await getGtrConfig('gtr.editor.default');
```

---

### 6. 設定ファイル管理

#### 機能概要

JSON形式の設定ファイルでアプリケーションの動作をカスタマイズ可能にする。

#### 設定ファイルパス

- `~/.worktree-tui/config.json`

#### 設定項目

```typescript
interface Config {
  // 言語設定
  locale: "ja" | "en";

  // diff表示のベースブランチ
  baseBranch: string; // デフォルト: "develop"

  // ショートカットキーのカスタマイズ
  shortcuts: {
    terminalPrefix: string; // デフォルト: "Alt"
    splitHorizontal: string; // デフォルト: "Ctrl+Shift+H"
    splitVertical: string; // デフォルト: "Ctrl+Shift+V"
  };

  // 事前定義コマンド
  commands: {
    name: string;
    command: string;
    description?: string;
  }[];
}
```

#### デフォルト設定

```json
{
  "locale": "ja",
  "baseBranch": "develop",
  "shortcuts": {
    "terminalPrefix": "Alt",
    "splitHorizontal": "Ctrl+Shift+H",
    "splitVertical": "Ctrl+Shift+V"
  },
  "commands": [
    { "name": "build", "command": "npm run build", "description": "ビルド実行" },
    { "name": "test", "command": "npm test", "description": "テスト実行" },
    { "name": "dev", "command": "npm run dev", "description": "開発サーバー起動" }
  ]
}
```

---

### 7. 多言語対応 (i18n)

#### 機能概要

UI表示を日本語・英語で切り替え可能にする。

#### 対応言語

- 日本語 (`ja`)
- 英語 (`en`)

#### 言語ファイル構造

```
src/i18n/
├── index.ts         # i18n初期化
├── locales/
│   ├── ja.json      # 日本語
│   └── en.json      # 英語
└── useTranslation.ts # 翻訳フック
```

#### 言語ファイル例

```json
// ja.json
{
  "app": {
    "title": "Git Worktree Manager"
  },
  "worktree": {
    "list": "Worktree一覧",
    "create": "新規作成",
    "delete": "削除",
    "switch": "切り替え"
  },
  "actions": {
    "confirm": "確認",
    "cancel": "キャンセル"
  },
  "status": {
    "clean": "変更なし",
    "modified": "{count}件の変更"
  }
}
```

---

### 8. 履歴管理

#### 機能概要

`git gtr ai` 実行時のClaude Code入力履歴とworktree情報を保存・表示する。

#### データ保存先

- SQLite: `~/.worktree-tui/history.db`

#### データベーススキーマ

```sql
-- worktree作成履歴
CREATE TABLE worktree_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worktree_name TEXT NOT NULL,
  base_branch TEXT NOT NULL,
  base_commit TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Claude Code入力履歴
CREATE TABLE ai_prompt_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  worktree_id INTEGER REFERENCES worktree_history(id),
  prompt TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

#### 実装例

```typescript
import { Database } from "bun:sqlite";

const db = new Database("~/.worktree-tui/history.db");

// 履歴保存
const savePromptHistory = (worktreeId: number, prompt: string) => {
  db.run(
    "INSERT INTO ai_prompt_history (worktree_id, prompt) VALUES (?, ?)",
    [worktreeId, prompt]
  );
};

// 履歴取得
const getPromptHistory = (worktreeName: string) => {
  return db.query(`
    SELECT p.prompt, p.created_at, w.base_branch, w.base_commit
    FROM ai_prompt_history p
    JOIN worktree_history w ON p.worktree_id = w.id
    WHERE w.worktree_name = ?
    ORDER BY p.created_at DESC
  `).all(worktreeName);
};
```

#### 表示UI

```
┌─ AI Prompt History ─────────────────────────────────┐
│ Worktree: feature-auth                              │
│ Base: develop (abc1234)                             │
│                                                     │
│ ● 2024-01-15 10:30                                  │
│   「認証機能のログインフォームを実装して」           │
│                                                     │
│ ● 2024-01-15 11:45                                  │
│   「バリデーションを追加して」                       │
│                                                     │
│ [↑/↓] 選択  [Enter] 詳細  [Esc] 閉じる             │
└─────────────────────────────────────────────────────┘
```

---

### 9. Diff表示（シンタックスハイライト）

#### 機能概要

ベースブランチとworktree間の差分をシンタックスハイライト付きで表示する。

#### 比較対象

- 設定ファイルで指定されたベースブランチ（デフォルト: `develop`）
- ユーザーが任意に変更可能

#### 実装例

```typescript
import simpleGit from "simple-git";

const getDiff = async (worktreePath: string, baseBranch: string) => {
  const git = simpleGit(worktreePath);
  const diff = await git.diff([baseBranch, "HEAD"]);
  return diff;
};
```

#### 表示UI

```
┌─ Diff: develop...feature-auth ──────────────────────┐
│ src/auth/login.tsx                                  │
│ ─────────────────────────────────────────────────── │
│   10 │ import { useState } from 'react';            │
│ + 11 │ import { validateEmail } from './utils';     │
│   12 │                                              │
│ - 15 │ const handleSubmit = () => {                 │
│ + 15 │ const handleSubmit = async () => {           │
│ + 16 │   if (!validateEmail(email)) {               │
│ + 17 │     setError('Invalid email');               │
│ + 18 │     return;                                  │
│ + 19 │   }                                          │
│                                                     │
│ [←/→] ファイル切替  [b] ベース変更  [Esc] 閉じる   │
└─────────────────────────────────────────────────────┘
```

---

### 10. ターミナル分割機能

#### 機能概要

画面を水平・垂直に分割し、複数のターミナルペインを同時に表示・操作可能にする。

#### 分割方式

- **水平分割**: 左右に並べる
- **垂直分割**: 上下に並べる
- **無制限分割**: 分割数に制限なし

#### ペイン管理

```typescript
interface TerminalPane {
  id: number;
  command?: string;
  cwd: string;
  output: string[];
  isActive: boolean;
}

interface PaneLayout {
  type: "horizontal" | "vertical" | "leaf";
  children?: PaneLayout[];
  pane?: TerminalPane;
  ratio: number; // 0-1の比率
}
```

#### キーバインド

| キー                          | 動作                               |
| ----------------------------- | ---------------------------------- |
| `Ctrl+Shift+H`                | 水平分割（設定でカスタマイズ可能） |
| `Ctrl+Shift+V`                | 垂直分割（設定でカスタマイズ可能） |
| `<prefix>+1`, `<prefix>+2`... | 指定番号のペインにフォーカス移動   |
| `Ctrl+Shift+W`                | 現在のペインを閉じる               |
| `Ctrl+Shift+←/→/↑/↓`          | 隣接ペインにフォーカス移動         |

#### 表示UI

```
┌─ Terminal 1 ────────────┬─ Terminal 2 ────────────┐
│ $ npm run dev           │ $ npm test              │
│ > dev server running... │ > running tests...      │
│ > localhost:3000        │ ✓ 15 tests passed       │
│                         │                         │
├─────────────────────────┴─────────────────────────┤
│ Terminal 3                                        │
│ $ git status                                      │
│ On branch feature-auth                            │
│ Changes not staged for commit:                    │
│   modified: src/auth/login.tsx                    │
└───────────────────────────────────────────────────┘
[Alt+1] T1  [Alt+2] T2  [Alt+3] T3  [Ctrl+Shift+H] 水平分割
```

---

### 11. 動作確認コマンド実行

#### 機能概要

worktree内で動作確認コマンドを実行可能にする。事前定義コマンドの選択と任意コマンドの入力に対応。

#### コマンド種別

1. **事前定義コマンド**: 設定ファイルまたは`package.json`のscriptsから選択
2. **任意コマンド**: ユーザーが自由にシェルコマンドを入力

#### 実装例

```typescript
// package.jsonからscriptsを読み込み
const loadPackageScripts = async (worktreePath: string) => {
  const pkg = await Bun.file(`${worktreePath}/package.json`).json();
  return Object.entries(pkg.scripts || {}).map(([name, command]) => ({
    name,
    command: `npm run ${name}`,
    description: command as string,
  }));
};
```

#### 表示UI

```
┌─ Run Command ───────────────────────────────────────┐
│ Select command or enter custom:                     │
│                                                     │
│ ▶ npm run build       - Build the project          │
│   npm run test        - Run tests                   │
│   npm run dev         - Start dev server            │
│   npm run lint        - Run linter                  │
│   ────────────────────────────────────────────────  │
│   [Custom command...]                               │
│                                                     │
│ [↑/↓] 選択  [Enter] 実行  [/] カスタム入力  [Esc] 閉じる │
└─────────────────────────────────────────────────────┘
```

---

### 12. オプション機能

#### Linter/Formatter検知・アラート（できれば）

プロジェクトのlinter/formatter設定を検知し、非対応部分があればUIでアラートを表示する。

```typescript
// 検知対象
const detectLinterConfig = async (path: string) => {
  const configs = [
    ".eslintrc",
    ".eslintrc.js",
    "eslint.config.js",
    ".prettierrc",
    "biome.json",
    "oxlint.json",
  ];
  // 設定ファイルの存在確認とパース
};
```

#### PR状態表示（できれば）

GitHub PRの状態（OPEN, DRAFT, CLOSED）を表示する。

```typescript
// gh CLI連携
const getPRStatus = async (branch: string) => {
  const { stdout } = await execAsync(
    `gh pr view ${branch} --json state,isDraft`
  );
  return JSON.parse(stdout);
};
```

表示例:

```
│  ▶ feature-auth  ~/project-worktrees/feat..  [PR: OPEN]      │
│    hotfix-123    ~/project-worktrees/fix..  [PR: DRAFT]     │
```

---

## UI/UXデザイン

### 全体レイアウト

```
┌─ Git Worktree Manager ──────────────────────────────────────────┐
│                                                                  │
│  Current: ~/project/main (main) ✓                                │
│                                                                  │
├─ Worktrees ─────────────────────────────────────────────────────┤
│  ▶ main          ~/project/main              [clean]            │
│    feature-auth  ~/project-worktrees/feat..  [2 changes]        │
│    hotfix-123    ~/project-worktrees/fix..  [uncommitted]      │
│                                                                  │
├─ Actions ───────────────────────────────────────────────────────┤
│  [n] New  [d] Delete  [e] Editor  [g] Git  [b] Build  [?] Help  │
│                                                                  │
├─ Status ────────────────────────────────────────────────────────┤
│  Branch: main | Ahead: 0 | Behind: 0 | Modified: 0 files        │
└──────────────────────────────────────────────────────────────────┘
```

### カラースキーマ

```typescript
const theme = {
  primary: '#61dafb',    // React blue
  success: '#00ff00',    // Green
  warning: '#ffff00',    // Yellow
  error: '#ff0000',      // Red
  info: '#00ffff',       // Cyan
  dimmed: '#808080',     // Gray
};
```

---

## キーボードショートカット

### グローバル

| キー     | 動作                        |
| -------- | --------------------------- |
| `↑/↓`    | worktree選択移動            |
| `Enter`  | 選択したworktreeに移動      |
| `Esc`    | メニュー/ダイアログを閉じる |
| `Ctrl+C` | アプリケーション終了        |
| `?`      | ヘルプ表示                  |

### Worktree操作

| キー | 動作                 |
| ---- | -------------------- |
| `n`  | 新規worktree作成     |
| `d`  | 選択worktreeを削除   |
| `r`  | worktreeリフレッシュ |

### 開発操作

| キー | 動作             |
| ---- | ---------------- |
| `b`  | ビルド実行       |
| `t`  | テスト実行       |
| `s`  | 開発サーバー起動 |
| `e`  | エディタで開く   |

### Git操作

| キー  | 動作                   |
| ----- | ---------------------- |
| `g s` | git status             |
| `g a` | git add (ステージング) |
| `g c` | git commit             |
| `g p` | git push               |
| `g l` | git log                |

### ターミナルペイン操作

| キー                 | 動作                                   |
| -------------------- | -------------------------------------- |
| `Ctrl+Shift+H`       | 水平分割（設定でカスタマイズ可能）     |
| `Ctrl+Shift+V`       | 垂直分割（設定でカスタマイズ可能）     |
| `Alt+1`, `Alt+2`...  | ペイン切り替え（プレフィックス設定可） |
| `Ctrl+Shift+W`       | 現在のペインを閉じる                   |
| `Ctrl+Shift+←/→/↑/↓` | 隣接ペインにフォーカス移動             |

### 表示操作

| キー | 動作                 |
| ---- | -------------------- |
| `D`  | Diff表示             |
| `H`  | AI履歴表示           |
| `C`  | コマンドパレット表示 |

---

## ファイル構成

```
worktree-tui/
├── package.json
├── tsconfig.json
├── bun.lockb
├── src/
│   ├── index.tsx                 # エントリーポイント
│   ├── App.tsx                   # メインコンポーネント
│   ├── components/
│   │   ├── WorktreeList.tsx      # worktree一覧
│   │   ├── CommandOutput.tsx     # コマンド出力表示
│   │   ├── GitStatus.tsx         # gitステータス表示
│   │   ├── ConfirmDialog.tsx     # 確認ダイアログ
│   │   ├── HelpModal.tsx         # ヘルプ画面
│   │   ├── TerminalPane.tsx      # ターミナルペイン
│   │   ├── PaneLayout.tsx        # ペイン分割レイアウト
│   │   ├── DiffViewer.tsx        # diff表示（シンタックスハイライト）
│   │   ├── PromptHistory.tsx     # AI履歴表示
│   │   └── CommandPalette.tsx    # コマンド選択・実行
│   ├── hooks/
│   │   ├── useWorktree.ts        # worktree操作フック
│   │   ├── useGit.ts             # git操作フック
│   │   ├── useCommand.ts         # コマンド実行フック
│   │   ├── useKeyboard.ts        # キーボード操作フック
│   │   ├── usePanes.ts           # ペイン管理フック
│   │   └── useConfig.ts          # 設定読み込みフック
│   ├── lib/
│   │   ├── worktree.ts           # worktree関連ユーティリティ
│   │   ├── gtr.ts                # gtr連携
│   │   ├── git.ts                # git操作
│   │   └── config.ts             # 設定ファイル読み書き
│   ├── db/
│   │   ├── index.ts              # データベース初期化
│   │   ├── schema.ts             # スキーマ定義
│   │   └── history.ts            # 履歴操作
│   ├── i18n/
│   │   ├── index.ts              # i18n初期化
│   │   ├── useTranslation.ts     # 翻訳フック
│   │   └── locales/
│   │       ├── ja.json           # 日本語
│   │       └── en.json           # 英語
│   └── types/
│       ├── worktree.ts           # 型定義
│       ├── command.ts
│       ├── config.ts             # 設定型定義
│       └── pane.ts               # ペイン型定義
└── README.md
```

---

## 技術仕様

### 依存パッケージ

```json
{
  "dependencies": {
    "@opentui/react": "^0.1.67",
    "@opentui/core": "^0.1.67",
    "react": "^19.2.3",
    "simple-git": "^3.30.0"
  },
  "devDependencies": {
    "@types/react": "^19.2.7",
    "typescript": "^5.9.3",
    "bun-types": "^1.3.5"
  }
}
```

#### 追加依存パッケージ（新機能用）

```json
{
  "dependencies": {
    "diff": "^7.0.0",
    "diff2html": "^3.4.0"
  }
}
```

**注記:**

- SQLite: Bunの組み込み `bun:sqlite` を使用（追加パッケージ不要）
- i18n: 軽量な独自実装（追加パッケージ不要）

### TypeScript設定

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "jsxImportSource": "@opentui/react",
    "lib": ["ESNext", "DOM"],
    "strict": true,
    "skipLibCheck": true,
    "esModuleInterop": true,
    "resolveJsonModule": true
  }
}
```

---

## データフロー

```
┌─────────────┐
│   User      │
└──────┬──────┘
       │ Keyboard Input
       ▼
┌─────────────────┐
│  OpenTUI React  │
│   Components    │
└────────┬────────┘
         │ Actions
         ▼
┌─────────────────┐      ┌──────────────┐
│  Custom Hooks   │◀────▶│ Git Commands │
│  (useWorktree)  │      │  (simple-git)│
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────┐
│  State Manager  │◀────▶│ gtr CLI      │
│  (React State)  │      │  (child proc)│
└────────┬────────┘      └──────────────┘
         │
         ▼
┌─────────────────┐
│  UI Re-render   │
└─────────────────┘
```

---

## 実装フェーズ

### Phase 1: 基本機能

- [x] プロジェクトセットアップ
- [ ] worktree一覧表示
- [ ] worktree選択・移動
- [ ] 基本的なキーボードナビゲーション

### Phase 2: 設定・多言語対応

- [ ] 設定ファイル（JSON）の読み書き
- [ ] i18n基盤実装
- [ ] 日本語・英語の言語ファイル作成

### Phase 3: Git連携

- [ ] git status表示
- [ ] simple-git統合
- [ ] 基本的なgit操作（add, commit, push）

### Phase 4: gtr連携

- [ ] gtr new/rm コマンド実行
- [ ] gtr設定読み込み
- [ ] エディタ・AIツール起動

### Phase 5: 履歴管理

- [ ] SQLiteデータベース初期化
- [ ] worktree作成履歴の保存
- [ ] AI入力履歴の保存・表示

### Phase 6: Diff表示

- [ ] ベースブランチとの差分取得
- [ ] シンタックスハイライト実装
- [ ] ファイル切り替えUI

### Phase 7: ターミナル分割

- [ ] ペインレイアウト管理
- [ ] 水平・垂直分割
- [ ] ペイン間フォーカス移動
- [ ] カスタマイズ可能なショートカット

### Phase 8: コマンド実行

- [ ] 事前定義コマンド選択UI
- [ ] 任意コマンド入力
- [ ] リアルタイム出力表示
- [ ] エラーハンドリング

### Phase 9: UI改善

- [ ] カラースキーマ実装
- [ ] ステータスバー実装
- [ ] ヘルプモーダル
- [ ] 確認ダイアログ

### Phase 10: オプション機能（できれば）

- [ ] Linter/Formatter検知・アラート
- [ ] PR状態表示（gh CLI連携）

---

## リスク管理

### 技術リスク

| リスク               | 対策                                       |
| -------------------- | ------------------------------------------ |
| OpenTUIの不安定性    | Inkへの移行パスを確保                      |
| ターミナル互換性問題 | 主要ターミナル(iTerm2, Terminal.app)で検証 |
| git操作の失敗        | エラーハンドリングとロールバック機能       |

### 開発リスク

| リスク                  | 対策                                  |
| ----------------------- | ------------------------------------- |
| TypeScript初心者        | 小さい単位で段階的に実装              |
| OpenTUIドキュメント不足 | 公式exampleとコミュニティコードを参考 |

---

## テスト戦略

### 単体テスト

- worktreeパース処理
- gitコマンド実行
- 状態管理ロジック

### 統合テスト

- worktree作成・削除フロー
- git操作の一連の流れ
- gtr連携

### E2Eテスト（手動）

- 実際のリポジトリでの動作確認
- キーボード操作の検証
- エラーケースの確認

---

## パフォーマンス要件

- worktree一覧取得: < 100ms
- 画面描画: 60fps (16.6ms/frame)
- gitコマンド実行: 非同期処理（UIブロックなし）
- メモリ使用量: < 100MB

---

## セキュリティ考慮事項

- gitコマンドインジェクション対策（入力サニタイズ）
- credential情報の非表示化
- 設定ファイルのパーミッション確認

---

## 参考資料

- [OpenTUI GitHub](https://github.com/sst/opentui)
- [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner)
- [simple-git](https://github.com/steveukx/git-js)
- [Git Worktree公式ドキュメント](https://git-scm.com/docs/git-worktree)
