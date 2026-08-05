// ゲームバランス定数

import { EnemyConfig, TowerConfig } from './types';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

export const INITIAL_MUCOSA_HP = 100;
export const INITIAL_ATP = 150;

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  scout: {
    id: 'scout',
    name: 'ピロリ・スカウト',
    type: 'scout',
    hp: 30,
    speed: 80,
    reward: 10,
  },
  urease: {
    id: 'urease',
    name: 'ウレアーゼ・タンク',
    type: 'urease',
    hp: 80,
    speed: 40,
    reward: 25,
    skill: 'neutralize',
    ureaseInterval: 2000,
  },
  cagA: {
    id: 'cagA',
    name: 'CagA・スナイパー',
    type: 'cagA',
    hp: 50,
    speed: 50,
    reward: 20,
    skill: 'toxin_ranged',
    attackRange: 200,
  },
  vacA: {
    id: 'vacA',
    name: 'VacA・ボマー',
    type: 'vacA',
    hp: 60,
    speed: 35,
    reward: 30,
    skill: 'explode_on_death',
  },
};

export const TOWER_CONFIGS: Record<string, TowerConfig> = {
  acid: {
    id: 'acid',
    name: '胃酸キャノン',
    type: 'acid',
    cost: 50,
    range: 150,
    damage: 15,
    fireRate: 1.5,
    description: '胃酸の塊を発射。ウレアーゼ未使用の敵に大ダメージ。',
  },
  amoxicillin: {
    id: 'amoxicillin',
    name: 'アモキシシリン・ガンナー',
    type: 'amoxicillin',
    cost: 80,
    range: 180,
    damage: 10,
    fireRate: 2.0,
    description: '抗生物質を連射。継続ダメージを与える。',
  },
  clarithromycin: {
    id: 'clarithromycin',
    name: 'クラリスロマイシン・レーザー',
    type: 'clarithromycin',
    cost: 120,
    range: 220,
    damage: 25,
    fireRate: 0.8,
    description: '貫通ビーム。CagA菌に特効。',
  },
  barrier: {
    id: 'barrier',
    name: '粘膜バリア・シールド',
    type: 'barrier',
    cost: 60,
    range: 0,
    damage: 0,
    fireRate: 0,
    description: '上皮細胞を守る防衛壁。耐久値あり。',
  },
  lacto: {
    id: 'lacto',
    name: '乳酸菌・サポートドローン',
    type: 'lacto',
    cost: 100,
    range: 120,
    damage: 5,
    fireRate: 1.0,
    description: '周囲を回復＆バイオフィルム溶解。',
  },
};

/** 7日間の簡易ウェーブ定義（ハッカソンMVP用） */
export const WAVES: { day: number; waves: number }[] = [
  { day: 1, waves: 3 },
  { day: 2, waves: 4 },
  { day: 3, waves: 4 },
  { day: 4, waves: 5 },
  { day: 5, waves: 5 },
  { day: 6, waves: 6 },
  { day: 7, waves: 8 },
];
