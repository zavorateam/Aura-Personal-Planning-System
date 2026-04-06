<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Aura Personal OS - Electron Build

Desktop application for Aura Personal OS using Electron.

**Author:** zavorateam

## About

This is the Electron desktop implementation of Aura Personal OS. It provides a native desktop experience on Windows and Linux with all the features of the web application.

## Features

- ✅ Native desktop application (Windows & Linux)
- ✅ Local file system integration
- ✅ Offline-first architecture
- ✅ Encrypted data storage
- ✅ Git-based synchronization
- ✅ AI-driven workload analysis

## Prerequisites

- **Node.js** >= 18.0
- **npm** >= 9.0
- **GEMINI_API_KEY** - Get from [Google AI Studio](https://ai.google.dev/)

## Installation

```bash
# Navigate to electron directory
cd electron

# Install dependencies (includes Electron and Electron Builder)
npm install

# Create .env file with your Gemini API key
echo "GEMINI_API_KEY=your_key_here" > .env
```

## Development

### Run in Development Mode

**Terminal 1 - Renderer Process:**
```bash
npm run dev:renderer
```

This starts the Vite dev server on `http://localhost:3000`

**Terminal 2 - Electron Process:**
```bash
npm run dev:electron
```

Electron will automatically connect to the dev server.

### Run Both Together (Advanced)

```bash
npm run dev:electron &
npm run dev:renderer
```

## Building

### Windows Portable EXE

```bash
npm run build:win-portable
```

Output: `./build/Aura Personal OS X.X.X.exe`

**Size:** ~200-250 MB (includes Chromium)
**Installation:** No installer needed - just run the EXE
**Requirements:** Windows 7 or later

### Linux AppImage

```bash
npm run build:linux-appimage
```

Output: `./build/Aura Personal OS-X.X.X.AppImage`

**Size:** ~250-300 MB
**Installation:** Make executable and run: `chmod +x *.AppImage && ./*.AppImage`
**Requirements:** Linux (Ubuntu 18.04+, Fedora 28+, etc.)

### All Platforms

```bash
# Build renderer + package with electron-builder
npm run build:app
```

## Project Structure

```
electron/
├── src/
│   ├── components/     # React UI components
│   ├── hooks/         # Custom React hooks
│   ├── services/      # API and service layer
│   ├── lib/          # Utilities and helpers
│   ├── App.tsx       # Main React app
│   └── main.tsx      # React entry point
├── main.js           # Electron main process
├── res/              # Icons and assets
├── dist/             # Build output (generated)
├── build/            # Final packages (generated)
├── package.json      # Dependencies & build config
├── vite.config.ts    # Vite configuration
└── tsconfig.json     # TypeScript configuration
```

## Configuration

### Electron Builder

Edit `package.json` → `build` section to customize:

- `productName` - Application name
- `appId` - Unique app identifier
- `icon` - Path to icon files
- `win.target` - Windows target formats
- `linux.target` - Linux target formats

### Environment Variables

- `GEMINI_API_KEY` - Google Gemini API key (required)
- `NODE_ENV` - Set to `production` for optimized builds
- `DISABLE_HMR` - Set to `true` to disable hot reload

## Troubleshooting

### Empty Window on Launch

Check that:
1. `.env` file contains valid `GEMINI_API_KEY`
2. Dev server is running on port 3000 (for dev mode)
3. `dist/` folder exists and contains `index.html` (for production)

### Build Fails with Icon Error

Icons are auto-generated. If missing:
```bash
node scripts/generate-icons.js
```

### Port 3000 Already in Use

Edit `.env.development` or change in `vite.config.ts`

## Available Scripts

```bash
npm run dev:renderer       # Start Vite dev server
npm run dev:electron       # Start Electron in dev mode
npm run build:renderer     # Build React app
npm run build:win-portable # Package for Windows
npm run build:linux-appimage # Package for Linux
npm run build:app          # Full build with electron-builder
npm run lint              # Check for TypeScript errors
npm run clean             # Remove dist and build folders
```

## Performance

Initial bundle size:
- HTML: 0.4 KB
- CSS: 40.6 KB (gzip: 7 KB)
- JavaScript: 1.3 MB (gzip: 357 KB)

## Technologies

- **React** 19
- **TypeScript** 5.8
- **Tailwind CSS** 4
- **Vite** 6
- **Electron** 30
- **Electron Builder** 24
- **Zustand** 5 (State management)
- **Recharts** 3 (Charting)
- **Lucide React** (Icons)

## License

MIT

## Support

For issues, check:
1. Electron documentation: https://www.electronjs.org/docs
2. Electron Builder: https://www.electron.build/
3. Project repository for updates
