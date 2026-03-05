export type CatState =
  | 'idle'
  | 'happy'
  | 'hungry'
  | 'starving'
  | 'eating'
  | 'sleeping'
  | 'held'
  | 'walk';

export type DialogueTrigger =
  | 'eaten'
  | 'bowl_empty'
  | 'petted'
  | 'picked_up'
  | 'put_down'
  | 'very_hungry'
  | 'waking_up';

export interface Position {
  x: number;
  y: number;
}

export type CatVariant = 'orange' | 'gray' | 'white' | 'black' | 'brown' | 'calico' | 'tuxedo';

export const CAT_VARIANTS: CatVariant[] = ['orange', 'gray', 'white', 'black', 'brown', 'calico', 'tuxedo'];

export function randomVariant(): CatVariant {
  return CAT_VARIANTS[Math.floor(Math.random() * CAT_VARIANTS.length)];
}

export interface CatInstance {
  id: string;
  name: string;
  lastFed: string;
  x: number;
  y: number;
  variant: CatVariant;
}

export interface Platform {
  id: string;
  xLeft: number;
  xRight: number;
  catY: number;
}
