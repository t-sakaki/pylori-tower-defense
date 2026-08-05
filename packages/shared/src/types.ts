// ゲーム内で使う共通型定義

export interface Position {
  x: number;
  y: number;
}

export interface Waypoint {
  x: number;
  y: number;
}

/** 敵の種類 */
export type EnemyType = 'scout' | 'urease' | 'cagA' | 'vacA' | 'biofilm' | 'boss';

export interface EnemyConfig {
  id: string;
  name: string;
  type: EnemyType;
  hp: number;
  speed: number; // px per second
  reward: number; // ATP
  skill?: string;
  /** ウレアーゼ型: 中和ゾーンを生成する間隔(ms) */
  ureaseInterval?: number;
  /** CagA型: 遠距離攻撃の射程 */
  attackRange?: number;
}

/** タワーの種類 */
export type TowerType = 'acid' | 'amoxicillin' | 'clarithromycin' | 'metronidazole' | 'barrier' | 'lacto';

export interface TowerConfig {
  id: string;
  name: string;
  type: TowerType;
  cost: number; // ATPコスト
  range: number; // px
  damage: number;
  fireRate: number; // shots per second
  description: string;
}

/** ウェーブ内の敵出現定義 */
export interface WaveEnemySpawn {
  type: EnemyType;
  count: number;
  interval: number; // ms between spawns
  delay: number; // ms from wave start
}

export interface WaveConfig {
  day: number;
  wave: number;
  duration: number; // ms
  spawns: WaveEnemySpawn[];
}

/** 服薬スロット */
export type DrugSlot = 'morning' | 'noon' | 'evening' | 'night';

export interface DrugLog {
  userId: string;
  day: number;
  slot: DrugSlot;
  takenAt: string; // ISO 8601
}

export interface DrugStatus {
  day: number;
  slots: Record<DrugSlot, boolean>;
  comboCount: number; // consecutive days fully compliant
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
