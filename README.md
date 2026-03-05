# MyCat

A desktop pixel-art cat game built with React + TypeScript + Vite. Multiple cats live on screen, roam around, react to care with AI-generated dialogue, and keep you company.

## Features

- **Multiple cats** — adopt up to 8 cats, each with a unique name and color
- **7 cat color variants** — orange, gray, white, black, brown, calico, tuxedo
- **Pixel art cats** — SVG-based with 8 animated states: idle, happy, hungry, starving, eating, sleeping, held, walk
- **Click and drag** — pick up any cat and place it anywhere in the room
- **Platforms** — cats can stand on the left shelf, bookshelf shelves, or the floor
- **Hunger system** — hunger drains over 6 hours; cats show Happy → Hungry → Starving states
- **Feeding** — add food to the bowl, drag a cat onto it to feed
- **Petting** — click a cat to pet it
- **Sleep** — cats auto-sleep between 10pm–6am or after 5 minutes of inactivity, sleeping in place
- **Release** — drag a cat to the trash bin (or use the HUD button) to release it
- **AI dialogue** — cats speak via Claude (claude-haiku) using your own Anthropic API key; hunger state affects personality
- **Fallback dialogue** — fully playable without an API key
- **Diary** — chat history panel shows recent cat quotes
- **Persistent state** — cats, positions, hunger, and food saved via localStorage

## Tech Stack

- React 19 + TypeScript
- Vite 7
- Tailwind CSS v4
- Anthropic SDK (`@anthropic-ai/sdk`)
- localStorage only — no backend required

## Getting Started

```bash
npm install
npm run dev
```

Open http://localhost:5173, name your first cat, and start playing.

## API Key Setup (Optional)

1. Click the ⚙️ gear icon (top-right corner)
2. Paste your Anthropic API key (starts with `sk-ant-`)
3. Click Save

Without a key, cats use built-in fallback lines. The key is stored in localStorage only and never sent anywhere except the Anthropic API.

> This app uses `dangerouslyAllowBrowser: true` in the Anthropic SDK. This is appropriate for a personal app where each user provides their own key.

## Build

```bash
npm run build
```

Output in `dist/` — deploy to any static host (Netlify, Vercel, GitHub Pages).

## Project Structure

```
src/
  types.ts              CatState, CatVariant, CatInstance, Platform types
  storage.ts            localStorage helpers (multi-cat array)
  api.ts                Claude API calls + hunger-aware prompts + fallback dialogue
  App.tsx               Main game: drag, hunger, sleep, platforms, adopt, release
  components/
    CatSprite.tsx       Pixel art SVG cat — 7 color variants, 8 animated states
    SpeechBubble.tsx    Dialogue bubble with fade in/out
    FoodBowl.tsx        Bowl SVG with filled/empty states
    NameModal.tsx       First-launch cat naming
    AdoptModal.tsx      Adopt new cat — name + color variant picker
    SettingsPanel.tsx   API key management
```

## localStorage Keys

| Key | Description |
|-----|-------------|
| `cats` | JSON array of all cat instances (name, lastFed, position, variant) |
| `foodInBowl` | Food portions in bowl (0–5) |
| `apiKey` | Anthropic API key |
| `totalFeeds` | Lifetime feed count |
| `totalPets` | Lifetime pet count |
