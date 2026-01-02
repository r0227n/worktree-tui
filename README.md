# worktree-tui

English | [日本語](./docs/README.ja.md)

A Terminal User Interface (TUI) tool for managing Git worktrees

## Overview

worktree-tui is a terminal-based interactive tool built with React + OpenTUI that supports git worktree operations. Based on [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner), it provides intuitive TUI-based operations.

## Features

- 📋 **Worktree List** - Visual display of all worktrees in the repository
- 🔄 **Worktree Navigation** - Seamless switching between worktrees
- 🛠️ **Build/Run Commands** - Execute build, test, and run commands on worktrees
- 📝 **Git Operations** - Basic operations like status, add, commit, push, pull
- 🔗 **git-worktree-runner Integration** - Integration with gtr commands

## Requirements

- Bun 1.3.5+
- Zig 0.15.1+ (for OpenTUI build)
- Git 2.22+
- [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner) (gtr) installed
- Supported OS: macOS, Linux, WSL2

## Installation

```bash
# Clone the repository
git clone https://github.com/r0227n/worktree-tui.git
cd worktree-tui

# Install dependencies
bun install
```

## Usage

Run the following command in the root directory of your repository:

```bash
bun run start
```

## Keyboard Shortcuts

### Global

| Key | Action |
|-----|--------|
| `↑` / `↓` | Navigate worktree selection |
| `Enter` | Move to selected worktree |
| `Tab` | Move to next worktree |
| `Esc` | Close menu/dialog |
| `Ctrl+C` | Quit application |
| `?` | Show help |

### Worktree Operations

| Key | Action |
|-----|--------|
| `n` | Create new worktree |
| `d` | Delete selected worktree |
| `r` | Refresh worktrees |

### Development Operations

| Key | Action |
|-----|--------|
| `b` | Run build |
| `t` | Run tests |
| `s` | Start dev server |
| `e` | Open in editor |

### Git Operations

| Key | Action |
|-----|--------|
| `g s` | git status |
| `g a` | git add (staging) |
| `g c` | git commit |
| `g p` | git push |
| `g l` | git log |

## UI Overview

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

## Development

### Build

```bash
bun run build
```

### Test

```bash
bun test
```

### Dev Server

```bash
bun run dev
```

## Tech Stack

- **Framework**: React + [OpenTUI](https://github.com/sst/opentui)
- **Language**: TypeScript
- **Git Operations**: [simple-git](https://github.com/steveukx/git-js)
- **Runtime**: Bun

## Documentation

For detailed specifications, see [docs/spec.md](./docs/spec.md).

## License

MIT License - see the [LICENSE](./LICENSE) file for details.

## Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you would like to change.

## Author

Ryo24 ([@r0227n](https://github.com/r0227n))

## Acknowledgments

- [OpenTUI](https://github.com/sst/opentui) - React-based TUI framework
- [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner) - Worktree management CLI
- [simple-git](https://github.com/steveukx/git-js) - Git operations library
