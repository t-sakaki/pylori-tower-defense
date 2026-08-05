export interface Position {
  x: number;
  y: number;
}

export interface Waypoint {
  x: number;
  y: number;
}

export type EnemyType = 'scout' | 'urease' | 'cagA' | 'vacA' | 'biofilm' | 'boss';

export interface EnemyConfig {
  id: string;
  name: string;
  type: EnemyType;
  hp: number;
  speed: number;
  reward: number;
  skill?: string;
  ureaseInterval?: number;
  attackRange?: number;
  explodeRadius?: number;
}

export type TowerType = 'acid' | 'amoxicillin' | 'clarithromycin' | 'metronidazole' | 'barrier' | 'lacto';

export interface TowerConfig {
  id: string;
  name: string;
  type: TowerType;
  cost: number;
  range: number;
  damage: number;
  fireRate: number;
  description: string;
}

export interface WaveEnemySpawn {
  type: EnemyType;
  count: number;
  interval: number;
  delay: number;
}

export interface WaveConfig {
  day: number;
  wave: number;
  duration: number;
  spawns: WaveEnemySpawn[];
}

export type DrugSlot = 'morning' | 'noon' | 'evening' | 'night';

export interface DrugLog {
  userId: string;
  day: number;
  slot: DrugSlot;
  takenAt: string;
}

export interface DrugStatus {
  day: number;
  slots: Record<DrugSlot, boolean>;
  comboCount: number;
}

export interface GameProgress {
  userId: string;
  currentDay: number;
  currentWave: number;
  score: number;
  mucosaHp: number;
  atp: number;
}

export interface ScoreEntry {
  userId: string;
  day: number;
  wave: number;
  score: number;
  cleared: boolean;
  createdAt: string;
}
