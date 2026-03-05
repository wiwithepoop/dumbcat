const KEYS = {
  catName: 'catName',
  lastFed: 'lastFed',
  foodInBowl: 'foodInBowl',
  apiKey: 'apiKey',
  totalFeeds: 'totalFeeds',
  totalPets: 'totalPets',
} as const;

export function getCatName(): string | null {
  return localStorage.getItem(KEYS.catName);
}
export function setCatName(name: string): void {
  localStorage.setItem(KEYS.catName, name);
}

export function getLastFed(): string {
  return localStorage.getItem(KEYS.lastFed) ?? new Date(Date.now() - 60 * 60 * 1000).toISOString();
}
export function setLastFed(iso: string): void {
  localStorage.setItem(KEYS.lastFed, iso);
}

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
