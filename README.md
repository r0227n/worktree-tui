# worktree-tui

English | [日本語](./README.ja.md)

A Terminal User Interface (TUI) tool for managing Git worktrees

## Overview

worktree-tui is an intuitive TUI application that makes working with Git's worktree feature effortless. It provides efficient workflow management for developers who need to work on multiple branches simultaneously.

## Features

- 📋 **List Worktrees** - Visual display of existing worktrees
- ➕ **Easy Creation** - Interactive worktree creation
- 🗑️ **Safe Deletion** - Delete worktrees with confirmation prompts
- 🔄 **Quick Switching** - Seamless navigation between worktrees
- ⌨️ **Keyboard Driven** - Efficient keyboard shortcuts

## Installation

```bash
# Install using Go
go install github.com/r0227n/worktree-tui@latest
```

## Usage

Run the following command in the root directory of your repository:

```bash
worktree-tui
```

### Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `j` / `k` or `↓` / `↑` | Navigate list |
| `n` | Create new worktree |
| `d` | Delete selected worktree |
| `Enter` | Switch to selected worktree |
| `r` | Refresh display |
| `q` / `Esc` | Quit application |

## Requirements

- Git 2.5 or later
- Unix-like OS (Linux, macOS) or Windows
- Terminal emulator

## Development

### Build

```bash
go build -o worktree-tui
```

### Test

```bash
go test ./...
```

## Documentation

For detailed specifications, see [docs/spec.md](./docs/spec.md).

## License

MIT License - see the [LICENSE](./LICENSE) file for details.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## Author

Ryo24 ([@r0227n](https://github.com/r0227n))

## Acknowledgments

This project is built using the [Bubble Tea](https://github.com/charmbracelet/bubbletea) framework.