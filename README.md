# sp-ui-coding

**Sovereign OS — Coding Studio Micro-Frontend**

The integrated development environment module for the Sovereign OS platform. Provides a Monaco-based code editor, a real workspace file explorer backed by `sp-service`, and a full PTY terminal session via WebSocket.

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg)]()
[![Svelte](https://img.shields.io/badge/Svelte-5.x-red.svg)](https://svelte.dev/)
[![Monaco Editor](https://img.shields.io/badge/Monaco%20Editor-latest-blue.svg)](https://microsoft.github.io/monaco-editor/)

---

## Overview

`sp-ui-coding` provides a browser-based coding environment that operates directly on the local file system through `sp-service`. File reads, writes, and directory listing are handled by authenticated REST endpoints on the backend, with no filesystem access from the browser itself.

### Features

- Monaco Editor: full-featured code editor with syntax highlighting for all major languages
- Real workspace file tree: populated from `GET /v1/coding/fs/tree`, reflecting the actual directory on disk
- File operations: read, write, rename, delete via the backend file system API
- PTY terminal: full interactive shell session over WebSocket (`/v1/coding/terminal/ws`) using `portable-pty` on the server
- AI code completions: routed through the inference pipeline via `POST /v1/coding/completions`

---

## File System API

All file operations are proxied through `sp-service` with path traversal protection. The backend validates that all requested paths remain within the configured workspace root.

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /v1/coding/fs/tree | Workspace directory tree (depth 5) |
| GET | /v1/coding/fs/read | Read file contents |
| POST | /v1/coding/fs/write | Write file contents |
| DELETE | /v1/coding/fs/delete | Delete a file |
| PUT | /v1/coding/fs/rename | Rename or move a file |
| POST | /v1/coding/completions | AI code completion |
| GET | /v1/coding/terminal/ws | PTY terminal WebSocket |

---

## Terminal

The terminal connects to a PTY session on the server running the user's default shell (`$SHELL`, defaulting to `/bin/bash`). Communication is bidirectional over WebSocket: the client sends keystrokes as binary frames and receives terminal output as binary frames. Resize events are supported via JSON control frames.

The workspace directory is set as the terminal's initial working directory.

---

## AI Code Completions

`POST /v1/coding/completions` accepts a code context payload and streams back a completion from the configured local model. This can be integrated with Monaco's completion provider API for inline suggestions.

```typescript
// Example payload
{
  "language": "typescript",
  "prefix": "function calculateSum(",
  "suffix": "",
  "model": "qwen2.5-coder:7b"
}
```

---

## Development

```bash
# Type-check
npm run check -w sp-ui-coding

# Run in isolation (requires sp-service on port 38001)
npm run dev -w sp-ui-coding
```

---

## Project Structure

```
sp-ui-coding/
├── src/
│   ├── routes/
│   │   └── coding/
│   │       └── +page.svelte           # Coding studio layout
│   └── lib/
│       └── components/
│           ├── FileTree.svelte         # Workspace file explorer
│           ├── FileTreeItem.svelte     # Individual file/directory node
│           ├── CodeEditor.svelte       # Monaco Editor wrapper
│           └── Terminal.svelte         # xterm.js + WebSocket PTY client
```

---

## License

PolyForm Noncommercial 1.0.0. See [LICENSE](../LICENSE).

---

**Package:** `sp-ui-coding`  
**Version:** 0.1.0  
**Last updated:** 2026-05-24
