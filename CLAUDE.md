# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

worktree-code-review is a terminal-based interactive tool for managing Git worktrees, built with React + OpenTUI. It's based on [git-worktree-runner](https://github.com/coderabbitai/git-worktree-runner) and provides intuitive TUI-based operations for Git worktree management.

If you are unsure about the user's intent, execute AskUserQuestion.

**Tech Stack:**

- Framework: React + OpenTUI
- Language: TypeScript
- Runtime: Bun
- Git Operations: simple-git

**Requirements:**

- Bun 1.3.5+
- Zig 0.14.1+ (for OpenTUI build)
- Git 2.22+
- git-worktree-runner (gtr) installed

## Common Commands

All commands use `mise` task runner. Run `mise run <task>` or just `mise <task>`.

### Code Quality

```bash
mise run lint           # Run oxlint
mise run lint:fix       # Auto-fix linting issues

mise run format         # Format all files (oxfmt + dprint)
mise run typecheck      # Run TypeScript type checking

mise run check          # Run all checks (lint + format:check + typecheck)
mise run fix            # Auto-fix all issues (lint:fix + format)
```

### Testing

```bash
mise run ci           # Run all tests
```

### TypeScript Path Aliases

The project uses TypeScript path aliases configured in `tsconfig.json`:

- `@/*` → `./src/*`
- `@/components/*` → `./src/components/*`
- `@/hooks/*` → `./src/hooks/*`
- `@/services/*` → `./src/services/*`
- `@/types/*` → `./src/types/*`
- `@/utils/*` → `./src/utils/*`

### Core Functionality

1. **Worktree Management**: Uses `git worktree list --porcelain` parsed into structured data
2. **Git Operations**: Wrapped through `simple-git` library for type-safe async operations
3. **TUI Rendering**: OpenTUI React components handle keyboard input and terminal rendering

## Code Style & Quality

### Linting & Formatting

- **Linter**: oxlint (Rust-based, fast linter)
- **Formatters**:
  - oxfmt for TypeScript/JavaScript (100 char line width, 2 spaces, semicolons, double quotes)
  - dprint for markdown, YAML, TOML, CSS (100 char line width)

### TypeScript Configuration

- Strict mode enabled with enhanced checks
- `noUncheckedIndexedAccess`, `noImplicitReturns`, `exactOptionalPropertyTypes` all enabled
- Target: ES2024
- Module resolution: bundler (Bun-specific)

## Development Workflow

1. **Development**: `mise run dev` (watch mode)
2. **Before Commit**: Changes auto-formatted by pre-commit hook
3. **Commit**: Use conventional commit format
4. **Before Push**: All checks run automatically via pre-push hook
