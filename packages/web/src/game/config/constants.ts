import { EnemyConfig, TowerConfig } from './types';

export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 640;

export const INITIAL_MUCOSA_HP = 100;
export const INITIAL_ATP = 150;

export const ENEMY_CONFIGS: Record<string, EnemyConfig> = {
  scout: {
    id: 'scout',
    name: 'game:enemies.scout.name',
    type: 'scout',
    hp: 30,
    speed: 80,
    reward: 10,
  },
  urease: {
    id: 'urease',
    name: 'game:enemies.urease.name',
    type: 'urease',
    hp: 80,
    speed: 40,
    reward: 25,
    skill: 'neutralize',
    ureaseInterval: 2000,
  },
  cagA: {
    id: 'cagA',
    name: 'game:enemies.cagA.name',
    type: 'cagA',
    hp: 50,
    speed: 50,
    reward: 20,
    skill: 'toxin_ranged',
    attackRange: 200,
  },
  vacA: {
    id: 'vacA',
    name: 'game:enemies.vacA.name',
    type: 'vacA',
    hp: 60,
    speed: 35,
    reward: 30,
    skill: 'explode_on_death',
    explodeRadius: 80,
  },
};

export const TOWER_CONFIGS: Record<string, TowerConfig> = {
  acid: {
    id: 'acid',
    name: 'game:towers.acid.name',
    type: 'acid',
    cost: 50,
    range: 150,
    damage: 15,
    fireRate: 1.5,
    description: 'game:towers.acid.description',
  },
  amoxicillin: {
    id: 'amoxicillin',
    name: 'game:towers.amoxicillin.name',
    type: 'amoxicillin',
    cost: 80,
    range: 180,
    damage: 10,
    fireRate: 2.0,
    description: 'game:towers.amoxicillin.description',
  },
  clarithromycin: {
    id: 'clarithromycin',
    name: 'game:towers.clarithromycin.name',
    type: 'clarithromycin',
    cost: 120,
    range: 220,
    damage: 25,
    fireRate: 0.8,
    description: 'game:towers.clarithromycin.description',
  },
  barrier: {
    id: 'barrier',
    name: 'game:towers.barrier.name',
    type: 'barrier',
    cost: 60,
    range: 0,
    damage: 0,
    fireRate: 0,
    description: 'game:towers.barrier.description',
  },
  lacto: {
    id: 'lacto',
    name: 'game:towers.lacto.name',
    type: 'lacto',
    cost: 100,
    range: 120,
    damage: 5,
    fireRate: 1.0,
    description: 'game:towers.lacto.description',
  },
};

export const WAVES: { day: number; waves: number }[] = [
  { day: 1, waves: 3 },
  { day: 2, waves: 4 },
  { day: 3, waves: 4 },
  { day: 4, waves: 5 },
  { day: 5, waves: 5 },
  { day: 6, waves: 6 },
  { day: 7, waves: 8 },
];
