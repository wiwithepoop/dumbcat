import type { CatInstance } from './types';

const KEYS = {
  cats: 'cats',
  foodInBowl: 'foodInBowl',
  apiKey: 'apiKey',
  totalFeeds: 'totalFeeds',
  totalPets: 'totalPets',
} as const;

// ── Multi-cat storage ──────────────────────────────────────────────────────

export function getCats(): CatInstance[] {
  const raw = localStorage.getItem(KEYS.cats);
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as CatInstance[];
      // Back-fill variant for cats saved before variant was added
      return parsed.map((c) => c.variant ? c : { ...c, variant: 'orange' as const });
    } catch { /* fall through */ }
  }

  // Migrate from old single-cat keys
  const oldName = localStorage.getItem('catName');
  if (oldName) {
    const lastFed = localStorage.getItem('lastFed') ?? new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const cat: CatInstance = {
      id: crypto.randomUUID(),
      name: oldName,
      lastFed,
      x: window.innerWidth / 2,
      y: 0, // will be set to floorY on first render
      variant: 'orange',
    };
    const cats = [cat];
    saveCats(cats);
    localStorage.removeItem('catName');
    localStorage.removeItem('lastFed');
    return cats;
  }

  return [];
}

export function saveCats(cats: CatInstance[]): void {
  localStorage.setItem(KEYS.cats, JSON.stringify(cats));
}

export function updateCat(id: string, patch: Partial<CatInstance>): void {
  const cats = getCats();
  const idx = cats.findIndex((c) => c.id === id);
  if (idx >= 0) {
    cats[idx] = { ...cats[idx], ...patch };
    saveCats(cats);
  }
}

// ── Other state ────────────────────────────────────────────────────────────

export function getFoodInBowl(): number {
  return parseInt(localStorage.getItem(KEYS.foodInBowl) ?? '0', 10);
}
export function setFoodInBowl(n: number): void {
  localStorage.setItem(KEYS.foodInBowl, String(Math.max(0, Math.min(5, n))));
}

export function getApiKey(): string {
  return localStorage.getItem(KEYS.apiKey) ?? '';
}
export function setApiKey(key: string): void {
  localStorage.setItem(KEYS.apiKey, key);
}

export function getTotalFeeds(): number {
  return parseInt(localStorage.getItem(KEYS.totalFeeds) ?? '0', 10);
}
export function incrementFeeds(): void {
  localStorage.setItem(KEYS.totalFeeds, String(getTotalFeeds() + 1));
}

export function getTotalPets(): number {
  return parseInt(localStorage.getItem(KEYS.totalPets) ?? '0', 10);
}
export function incrementPets(): void {
  localStorage.setItem(KEYS.totalPets, String(getTotalPets() + 1));
}
