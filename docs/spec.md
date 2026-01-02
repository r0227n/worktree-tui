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
  - Node.js 18+
  - Git 2.22+
  - Zig (OpenTUIビルド用)
  - git-worktree-runner (gtr) インストール済み

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
│    hotfix-123    ~/project-worktrees/hotf..  [uncommitted]      │
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
| キー | 動作 |
|------|------|
| `↑/↓` | worktree選択移動 |
| `Enter` | 選択したworktreeに移動 |
| `Esc` | メニュー/ダイアログを閉じる |
| `Ctrl+C` | アプリケーション終了 |
| `?` | ヘルプ表示 |

### Worktree操作
| キー | 動作 |
|------|------|
| `n` | 新規worktree作成 |
| `d` | 選択worktreeを削除 |
| `r` | worktreeリフレッシュ |

### 開発操作
| キー | 動作 |
|------|------|
| `b` | ビルド実行 |
| `t` | テスト実行 |
| `s` | 開発サーバー起動 |
| `e` | エディタで開く |

### Git操作
| キー | 動作 |
|------|------|
| `g s` | git status |
| `g a` | git add (ステージング) |
| `g c` | git commit |
| `g p` | git push |
| `g l` | git log |

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
│   │   └── HelpModal.tsx         # ヘルプ画面
│   ├── hooks/
│   │   ├── useWorktree.ts        # worktree操作フック
│   │   ├── useGit.ts             # git操作フック
│   │   ├── useCommand.ts         # コマンド実行フック
│   │   └── useKeyboard.ts        # キーボード操作フック
│   ├── lib/
│   │   ├── worktree.ts           # worktree関連ユーティリティ
│   │   ├── gtr.ts                # gtr連携
│   │   └── git.ts                # git操作
│   └── types/
│       ├── worktree.ts           # 型定義
│       └── command.ts
└── README.md
```

---

## 技術仕様

### 依存パッケージ

```json
{
  "dependencies": {
    "@opentui/react": "^0.1.65",
    "@opentui/core": "^0.1.65",
    "react": "^18.3.1",
    "simple-git": "^3.25.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/node": "^20.11.0",
    "typescript": "^5.3.3",
    "bun-types": "^1.0.0"
  }
}
```

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

### Phase 1: 基本機能（2週間）
- [x] プロジェクトセットアップ
- [ ] worktree一覧表示
- [ ] worktree選択・移動
- [ ] 基本的なキーボードナビゲーション

### Phase 2: Git連携（1週間）
- [ ] git status表示
- [ ] simple-git統合
- [ ] 基本的なgit操作（add, commit, push）

### Phase 3: gtr連携（1週間）
- [ ] gtr new/rm コマンド実行
- [ ] gtr設定読み込み
- [ ] エディタ・AIツール起動

### Phase 4: コマンド実行（1週間）
- [ ] ビルド・テスト実行
- [ ] リアルタイム出力表示
- [ ] エラーハンドリング

### Phase 5: UI改善（1週間）
- [ ] カラースキーマ実装
- [ ] ステータスバー実装
- [ ] ヘルプモーダル
- [ ] 確認ダイアログ

---

## リスク管理

### 技術リスク

| リスク | 対策 |
|--------|------|
| OpenTUIの不安定性 | Inkへの移行パスを確保 |
| ターミナル互換性問題 | 主要ターミナル(iTerm2, Terminal.app)で検証 |
| git操作の失敗 | エラーハンドリングとロールバック機能 |

### 開発リスク

| リスク | 対策 |
|--------|------|
| TypeScript初心者 | 小さい単位で段階的に実装 |
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

