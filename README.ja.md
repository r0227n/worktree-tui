# worktree-tui

[English](./README.md) | 日本語

Git worktreeを管理するためのターミナルユーザーインターフェース（TUI）ツール

## 概要

worktree-tuiは、Gitのworktree機能を直感的に操作できるTUIアプリケーションです。複数のブランチで同時作業が必要な開発者のために、効率的なワークフロー管理を提供します。

## 特徴

- 📋 **Worktree一覧表示** - 既存のworktreeをビジュアルに表示
- ➕ **簡単な作成** - インタラクティブなworktree作成
- 🗑️ **安全な削除** - 確認プロンプト付きの削除機能
- 🔄 **素早い切り替え** - worktree間のシームレスな移動
- ⌨️ **キーボード操作** - 効率的なキーボードショートカット

## インストール

```bash
# Go言語を使用してインストール
go install github.com/r0227n/worktree-tui@latest
```

## 使い方

リポジトリのルートディレクトリで以下のコマンドを実行：

```bash
worktree-tui
```

### キーボードショートカット

| キー | 動作 |
|------|------|
| `j` / `k` または `↓` / `↑` | リスト内を移動 |
| `n` | 新しいworktreeを作成 |
| `d` | 選択したworktreeを削除 |
| `Enter` | 選択したworktreeに切り替え |
| `r` | 表示を更新 |
| `q` / `Esc` | アプリケーションを終了 |

## 必要要件

- Git 2.5以降
- Unix系OS（Linux、macOS）またはWindows
- ターミナルエミュレータ

## 開発

### ビルド

```bash
go build -o worktree-tui
```

### テスト

```bash
go test ./...
```

## ドキュメント

詳細な仕様については、[docs/spec.md](./docs/spec.md)を参照してください。

## ライセンス

MIT License - 詳細は[LICENSE](./LICENSE)ファイルを参照してください。

## コントリビューション

プルリクエストを歓迎します！大きな変更の場合は、まずissueを開いて変更内容を議論してください。

## 作者

Ryo24 ([@r0227n](https://github.com/r0227n))

## 謝辞

このプロジェクトは[Bubble Tea](https://github.com/charmbracelet/bubbletea)フレームワークを使用して構築されています。
