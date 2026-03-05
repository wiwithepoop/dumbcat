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
