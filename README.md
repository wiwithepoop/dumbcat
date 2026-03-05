# MyCat

A desktop pet cat game built with React + TypeScript + Vite. A pixel art cat lives on screen, reacts to care with AI-generated dialogue, and keeps you company.

## Features

- Pixel art cat with 7 animated states: idle, happy, hungry, starving, eating, sleeping, held
- Click and drag the cat anywhere on screen (clamped to viewport)
- Hunger drains over 6 hours — Happy, Neutral, Hungry, Starving states
- Add food to the bowl, then drag the cat onto it to feed
- Click the cat to pet it
- Cat auto-sleeps between 10pm-6am or after 5 minutes of inactivity
- AI dialogue via Claude (claude-haiku) using your own Anthropic API key
- Fully playable without an API key using built-in fallback dialogue
- All state persisted in localStorage

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS v4
- Anthropic SDK (`@anthropic-ai/sdk`)
- localStorage only, no backend

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173, name your cat, and start playing.

## API Key Setup (Optional)

1. Click the gear icon (top-right corner)
2. Paste your Anthropic API key (starts with `sk-ant-`)
3. Click Save

Without a key, the cat uses built-in fallback lines. The key is stored in localStorage only.

Note: This app uses `dangerouslyAllowBrowser: true` in the Anthropic SDK. This is appropriate for a personal app where users provide their own key. Never use a shared API key in a production browser app.

## Build

```bash
npm run build
```

Output in `dist/` — deploy to any static host (Netlify, Vercel, GitHub Pages).

## Project Structure

```
src/
  types.ts            CatState, DialogueTrigger, Position types
  storage.ts          localStorage read/write helpers
  api.ts              Claude API calls + fallback dialogue
  App.tsx             Main game world: drag, hunger, sleep, behavior timers
  components/
    CatSprite.tsx     Pixel art SVG cat, all 7 states + animations
    SpeechBubble.tsx  Dialogue bubble with fade in/out
    HungerBar.tsx     Hunger meter HUD (top-left)
    FoodBowl.tsx      Bowl SVG with empty/filled states
    NameModal.tsx     First-launch name input
    SettingsPanel.tsx API key management
```

## localStorage Keys

| Key | Description |
|-----|-------------|
| `catName` | Cat's name |
| `lastFed` | ISO timestamp of last feeding |
| `foodInBowl` | Food portions in bowl (0-5) |
| `apiKey` | Anthropic API key |
| `totalFeeds` | Lifetime feed count |
| `totalPets` | Lifetime pet count |
