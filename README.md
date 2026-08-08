# AI Chat Frontend (React + TypeScript + Vite + Tailwind CSS)

Apple/iOS inspired glassmorphism web interface for the AI Workspace Chat application built with React 18, TypeScript, Vite, Tailwind CSS v4, Zustand, Framer Motion, and TanStack Query.

## Features
- **Apple Glassmorphism UI**: Translucent panels, smooth backdrop blur, fluid animations.
- **Theme & Preset System**: Light/Dark/System modes, Theme presets (Aurora, Sunset, Ocean, Midnight, Forest), Accent color selector.
- **Custom Background Engine**: Gradient canvases and user custom wallpaper image uploads.
- **Real-time SSE Streaming**: Live typing stream of AI responses with code block syntax highlighting & copy buttons.
- **Responsive Layout**: Desktop persistent glass sidebar and mobile drawer navigation.

---

## Local Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Start Development Server
```bash
npm run dev
```
Open `http://localhost:5173` in your browser.

---

## Testing & Production Build

### Run Unit Tests
```bash
npm test
```

### Build Production Bundle
```bash
npm run build
```
Output files will be generated in `dist/`.
