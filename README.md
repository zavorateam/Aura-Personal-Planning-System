# Aura Personal OS

A local-first, encrypted personal management system with AI-driven workload analysis and Git-based synchronization.

**Author:** zavorateam

## About

Aura Personal OS is a comprehensive personal management application built with React and TypeScript. It provides:

- **Dashboard** - Overview of all tasks, projects, and analytics
- **Tasks & Projects** - Organize work with priority tracking
- **Calendar** - Schedule and plan your time
- **Lessons** - Track learning and development
- **Notes** - Quick capture and organization
- **Analytics** - AI-driven workload analysis
- **Inbox** - Centralized communication hub
- **Settings** - Configuration and preferences

## Architecture

This monorepo contains multiple implementations:

- **`electron/`** - Desktop application (Windows portable EXE, Linux AppImage)
- **`tauri/`** - Tauri-based desktop application
- **`src/`** - Shared React components (web-first)

## Prerequisites

- **Node.js** >= 18.0
- **npm** >= 9.0
- **GEMINI_API_KEY** - Get from [Google AI Studio](https://ai.google.dev/)

## Quick Start (Web Dev)

```bash
# Install dependencies
npm install

# Set environment variables
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Run web version
npm run dev
```

Access at `http://localhost:3000`

## Desktop Builds

### Electron (Recommended)

See [electron/README.md](electron/README.md) for:
- Development setup
- Windows portable EXE build (`npm run build:win-portable`)
- Linux AppImage build (`npm run build:linux-appimage`)

### Tauri

See [tauri/README.md](tauri/README.md) for:
- Tauri desktop application setup
- Platform-specific builds

## Environment Variables

### Required

- `GEMINI_API_KEY` - Google Gemini API key for AI features

### Optional

- `GITHUB_TOKEN` - For Git-based synchronization
- `NODE_ENV` - Development mode (`dev` for development, omit for production)

## Development

### Web

```bash
cd .
npm run dev
```

### Electron

```bash
cd electron
npm install
npm run dev:renderer        # Renderer process
npm run dev:electron        # Electron main process (separate terminal)
```

### TypeScript Linting

```bash
npm run lint
```

## Building

### Web

```bash
npm run build
```

### Electron

```bash
cd electron
npm run build:win-portable  # Windows portable EXE
npm run build:linux-appimage # Linux AppImage
```

## Technologies

- **React** 19 - UI framework
- **TypeScript** 5.8 - Type safety
- **Tailwind CSS** 4 - Styling
- **Zustand** 5 - State management
- **Vite** 6 - Build tool
- **Electron** 30 - Desktop framework
- **Google Gemini API** - AI capabilities
- **Recharts** 3 - Data visualization

## Project Structure

```
aura_personal_os/
├── electron/           # Electron desktop app
│   ├── src/           # React components (shared)
│   ├── main.js        # Electron main process
│   ├── package.json   # Electron deps & build config
│   └── vite.config.ts # Vite configuration
├── tauri/             # Tauri desktop app
├── src/               # Web app + shared components
├── package.json       # Root dependencies
└── vite.config.ts     # Web Vite configuration
```

## License

MIT

## Support

For issues and questions, please refer to the repository documentation.
