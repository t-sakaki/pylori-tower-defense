import Phaser from 'phaser';
import {
  GAME_WIDTH,
  GAME_HEIGHT,
  INITIAL_MUCOSA_HP,
  INITIAL_ATP,
  ENEMY_CONFIGS,
  TOWER_CONFIGS,
  WAVES,
} from '../config/constants';
import { EnemyConfig, TowerConfig, Waypoint, EnemyType } from '../config/types';
import { Enemy } from '../objects/Enemy';
import { Tower } from '../objects/Tower';
import { Projectile } from '../objects/Projectile';
import { AcidZone } from '../objects/AcidZone';
import { MucosaCell } from '../objects/MucosaCell';

interface SpawnEvent {
  time: number;
  config: EnemyConfig;
}

export class GameScene extends Phaser.Scene {
  day = 1;
  wave = 1;
  atp = INITIAL_ATP;
  mucosaHp = INITIAL_MUCOSA_HP;
  maxMucosaHp = INITIAL_MUCOSA_HP;
  acidPh = 2.0;
  score = 0;

  waypoints: Waypoint[] = [
    { x: -20, y: 320 },
    { x: 200, y: 320 },
    { x: 200, y: 150 },
    { x: 500, y: 150 },
    { x: 500, y: 480 },
    { x: 800, y: 480 },
    { x: 980, y: 320 },
  ];

  enemies: Enemy[] = [];
  towers: Tower[] = [];
  projectiles: Projectile[] = [];
  acidZones: AcidZone[] = [];
  mucosaCells: MucosaCell[] = [];
  cagAProjectiles: Phaser.GameObjects.Container[] = [];

  private uiText!: Phaser.GameObjects.Text;
  private dayText!: Phaser.GameObjects.Text;
  private selectedTower: string | null = null;
  private selectionGraphics!: Phaser.GameObjects.Graphics;
  private waveActive = false;
  private spawnEvents: SpawnEvent[] = [];
  private waveStartTime = 0;
  private waveBtn!: Phaser.GameObjects.Rectangle;
  private waveBtnText!: Phaser.GameObjects.Text;
  private bgImage?: Phaser.GameObjects.Image;

  constructor() {
    super({ key: 'GameScene' });
  }

  init(data: { day?: number }) {
    this.day = data.day || 1;
  }

  create() {
    this.drawBackground();
    this.drawPath();
    this.setupMucosaCells();
    this.setupUI();
    this.setupTowerPalette();
    this.setupInput();

    this.input.keyboard?.on('keydown-R', () => this.startWave());
    this.input.keyboard?.on('keydown-P', () => this.addAtp(100));
  }

  private drawBackground() {
    if (this.textures.exists('bg-stomach')) {
      this.bgImage = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-stomach');
      this.bgImage.setAlpha(0.4);
      this.bgImage.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
    } else {
      const g = this.add.graphics();
      g.fillGradientStyle(0x2a0a0a, 0x2a0a0a, 0x1a0505, 0x1a0505, 1);
      g.fillRect(0, 0, GAME_WIDTH, GAME_HEIGHT);
    }
  }

  private drawPath() {
    const g = this.add.graphics();
    g.lineStyle(28, 0x5c1818, 0.5);
    g.beginPath();
    g.moveTo(this.waypoints[0].x, this.waypoints[0].y);
    for (let i = 1; i < this.waypoints.length; i++) {
      g.lineTo(this.waypoints[i].x, this.waypoints[i].y);
    }
    g.strokePath();

    g.lineStyle(3, 0xfb7185, 0.25);
    g.beginPath();
    g.moveTo(this.waypoints[0].x, this.waypoints[0].y);
    for (let i = 1; i < this.waypoints.length; i++) {
      g.lineTo(this.waypoints[i].x, this.waypoints[i].y);
    }
    g.strokePath();

    for (const wp of this.waypoints) {
      g.fillStyle(0xfb7185, 0.3);
      g.fillCircle(wp.x, wp.y, 4);
    }
  }

  private setupMucosaCells() {
    const startY = 240;
    const gap = 48;
    for (let i = 0; i < 5; i++) {
      const cell = new MucosaCell(this, 940, startY + i * gap, 25);
      this.mucosaCells.push(cell);
    }
    this.add.text(940, 220, '胃粘膜', {
      fontSize: '11px',
      color: '#fbcfe8',
    }).setOrigin(0.5).setDepth(50);
  }

  private setupUI() {
    const bar = this.add.rectangle(GAME_WIDTH / 2, 26, GAME_WIDTH, 52, 0x000000, 0.7);
    bar.setDepth(100);
    bar.setStrokeStyle(1, 0x881337, 0.5);

    this.uiText = this.add.text(20, 14, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setDepth(101);

    this.dayText = this.add.text(GAME_WIDTH - 140, 14, '', {
      fontSize: '14px',
      color: '#fb7185',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setDepth(101);

    this.updateUI();

    this.waveBtn = this.add.rectangle(GAME_WIDTH - 220, 26, 110, 36, 0x881337)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
    this.waveBtnText = this.add.text(GAME_WIDTH - 220, 26, 'WAVE開始', {
      fontSize: '13px',
      color: '#fff',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(101);

    this.waveBtn.on('pointerover', () => this.waveBtn.setFillStyle(0xbe123c));
    this.waveBtn.on('pointerout', () => this.waveBtn.setFillStyle(0x881337));
    this.waveBtn.on('pointerdown', () => this.startWave());

    const drugBtn = this.add.rectangle(100, GAME_HEIGHT - 28, 90, 32, 0x059669)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
    this.add.text(100, GAME_HEIGHT - 28, '💊 服薬', {
      fontSize: '12px',
      color: '#fff',
    }).setOrigin(0.5).setDepth(101);
    drugBtn.on('pointerdown', () => this.onDrugTaken());
  }

  private setupTowerPalette() {
    const paletteY = GAME_HEIGHT - 28;
    const towerDefs = [
      { key: 'acid', label: '胃酸', cost: 50, color: 0xf43f5e },
      { key: 'amoxicillin', label: '抗生', cost: 80, color: 0x3b82f6 },
      { key: 'clarithromycin', label: 'クラリ', cost: 120, color: 0xa855f7 },
      { key: 'barrier', label: 'バリア', cost: 60, color: 0x6b7280 },
      { key: 'lacto', label: '乳酸菌', cost: 100, color: 0xfcd34d },
    ];

    towerDefs.forEach((t, i) => {
      const x = 220 + i * 110;
      const bg = this.add.rectangle(x, paletteY, 100, 36, t.color, 0.85)
        .setInteractive({ useHandCursor: true })
        .setDepth(100);
      this.add.text(x, paletteY, `${t.label} ${t.cost}ATP`, {
        fontSize: '11px',
        color: '#fff',
        fontFamily: 'sans-serif',
      }).setOrigin(0.5).setDepth(101);

      bg.on('pointerover', () => bg.setAlpha(1));
      bg.on('pointerout', () => bg.setAlpha(this.selectedTower === t.key ? 1 : 0.85));
      bg.on('pointerdown', () => {
        this.selectedTower = this.selectedTower === t.key ? null : t.key;
        this.updatePaletteSelection(towerDefs);
      });
    });

    this.selectionGraphics = this.add.graphics().setDepth(99);
  }

  private updatePaletteSelection(towerDefs: { key: string }[]) {
    this.selectionGraphics.clear();
    towerDefs.forEach((t, i) => {
      const x = 220 + i * 110;
      const y = GAME_HEIGHT - 28;
      if (this.selectedTower === t.key) {
        this.selectionGraphics.lineStyle(3, 0xffffff, 1);
        this.selectionGraphics.strokeRect(x - 52, y - 20, 104, 40);
      }
    });
  }

  private setupInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > GAME_HEIGHT - 60) return;
      if (!this.selectedTower) return;

      const config = TOWER_CONFIGS[this.selectedTower];
      if (!config || this.atp < config.cost) {
        this.showFloatingText(pointer.x, pointer.y - 20, 'ATP不足！', '#ef4444');
        return;
      }
      if (!this.canPlaceTower(pointer.x, pointer.y)) {
        this.showFloatingText(pointer.x, pointer.y - 20, 'ここには置けません', '#f59e0b');
        return;
      }

      this.atp -= config.cost;
      const tower = new Tower(this, pointer.x, pointer.y, config);
      this.towers.push(tower);
      this.selectedTower = null;
      this.updatePaletteSelection([
        { key: 'acid' }, { key: 'amoxicillin' }, { key: 'clarithromycin' }, { key: 'barrier' }, { key: 'lacto' },
      ]);
      this.updateUI();
    });
  }

  private canPlaceTower(x: number, y: number): boolean {
    const PATH_RADIUS = 42;
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const p1 = this.waypoints[i];
      const p2 = this.waypoints[i + 1];
      const dist = this.distToSegment({ x, y }, p1, p2);
      if (dist < PATH_RADIUS) return false;
    }
    for (const t of this.towers) {
      if (!t.active) continue;
      if (Phaser.Math.Distance.Between(x, y, t.x, t.y) < 40) return false;
    }
    if (x < 20 || x > GAME_WIDTH - 20 || y < 60 || y > GAME_HEIGHT - 70) return false;
    return true;
  }

  private distToSegment(p: Waypoint, v: Waypoint, w: Waypoint): number {
    const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
    if (l2 === 0) return Math.sqrt((p.x - v.x) ** 2 + (p.y - v.y) ** 2);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return Math.sqrt((p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2);
  }

  private startWave() {
    if (this.waveActive) return;
    this.waveActive = true;
    this.spawnEvents = [];
    this.waveStartTime = this.time.now;

    const baseCount = 3 + this.day + this.wave;
    const types: EnemyType[] = ['scout'];
    if (this.day >= 2) types.push('urease');
    if (this.day >= 3) types.push('cagA');
    if (this.day >= 4) types.push('vacA');

    for (let i = 0; i < baseCount; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const config = ENEMY_CONFIGS[type];
      const scaledConfig: EnemyConfig = {
        ...config,
        hp: Math.floor(config.hp * (1 + (this.day - 1) * 0.15)),
        speed: config.speed * (1 + (this.day - 1) * 0.05),
      };
      this.spawnEvents.push({
        time: i * Math.max(400, 1200 - this.day * 80),
        config: scaledConfig,
      });
    }

    this.waveBtnText.setText('WAVE進行中');
    this.waveBtn.setFillStyle(0x4b5563);
    this.waveBtn.disableInteractive();
  }

  addAtp(amount: number) {
    this.atp += amount;
    this.score += amount;
    this.updateUI();
  }

  onEnemyReachEnd(enemy: Enemy) {
    this.mucosaHp -= 10;
    for (const cell of this.mucosaCells) {
      if (cell.active) {
        cell.takeDamage(5);
        break;
      }
    }
    this.updateUI();
    if (this.mucosaHp <= 0) {
      this.gameOver();
    }
  }

  spawnAcidZone(x: number, y: number) {
    const zone = new AcidZone(this, x, y, 60, 6000);
    this.acidZones.push(zone);
  }

  spawnCagAProjectile(x: number, y: number, target: MucosaCell) {
    const proj = this.add.container(x, y);
    const g = this.add.graphics();
    g.fillStyle(0xa855f7, 1);
    g.fillCircle(0, 0, 5);
    proj.add(g);

    this.tweens.add({
      targets: proj,
      x: target.x,
      y: target.y,
      duration: 600,
      ease: 'Power2',
      onComplete: () => {
        target.takeDamage(8);
        proj.destroy();
        this.showExplosion(target.x, target.y, 20, 0xa855f7);
      },
    });

    this.cagAProjectiles.push(proj);
  }

  showExplosion(x: number, y: number, radius: number, color: number) {
    const g = this.add.graphics();
    g.fillStyle(color, 0.5);
    g.fillCircle(x, y, radius);
    g.setDepth(90);

    this.tweens.add({
      targets: g,
      alpha: 0,
      scaleX: 1.5,
      scaleY: 1.5,
      duration: 400,
      ease: 'Power2',
      onComplete: () => g.destroy(),
    });
  }

  onDrugTaken() {
    for (const t of this.towers) {
      if (!t.active) continue;
      const originalRate = t.config.fireRate;
      t.config.fireRate *= 2;
      this.time.delayedCall(10000, () => {
        if (t.active) t.config.fireRate = originalRate;
      });
    }
    this.acidPh = Math.max(1.0, this.acidPh - 0.3);
    for (const cell of this.mucosaCells) {
      if (cell.active) cell.heal(10);
    }
    this.showFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2, '💊 服薬ボーナス発動！', '#22c55e');
    this.updateUI();
  }

  showFloatingText(x: number, y: number, text: string, color: string) {
    const t = this.add.text(x, y, text, {
      fontSize: '16px',
      color: color,
      fontStyle: 'bold',
      stroke: '#000000',
      strokeThickness: 3,
    }).setOrigin(0.5).setDepth(200);

    this.tweens.add({
      targets: t,
      y: y - 40,
      alpha: 0,
      duration: 1500,
      ease: 'Power1',
      onComplete: () => t.destroy(),
    });
  }

  private updateUI() {
    const dayInfo = WAVES.find((w) => w.day === this.day);
    const maxWave = dayInfo?.waves || 3;
    this.uiText.setText(
      `胃酸pH:${this.acidPh.toFixed(1)}  粘膜HP:${Math.max(0, this.mucosaHp)}  ATP:${this.atp}  SCORE:${this.score}`
    );
    this.dayText.setText(`DAY ${this.day} / 7  WAVE ${this.wave}/${maxWave}`);
  }

  private gameOver() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85).setDepth(200);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '胃壁崩壊...', {
      fontSize: '52px',
      color: '#ef4444',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(201);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, 'ピロリ菌が定着し、慢性胃炎へと進行しました。', {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(201);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, '7日間の服薬を完遂する重要性を学んでください。', {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(201);

    const retry = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 180, 44, 0x881337)
      .setInteractive({ useHandCursor: true })
      .setDepth(201);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, '再挑戦する', {
      fontSize: '18px',
      color: '#fff',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(202);
    retry.on('pointerdown', () => this.scene.restart({ day: 1 }));

    this.scene.pause();
  }

  update(time: number, delta: number) {
    if (this.waveActive && this.spawnEvents.length > 0) {
      const elapsed = time - this.waveStartTime;
      while (this.spawnEvents.length > 0 && this.spawnEvents[0].time <= elapsed) {
        const spawn = this.spawnEvents.shift()!;
        const enemy = new Enemy(this, this.waypoints, spawn.config);
        this.enemies.push(enemy);
      }
    }

    this.enemies = this.enemies.filter((e) => e.active);
    this.projectiles = this.projectiles.filter((p) => p.active);
    this.acidZones = this.acidZones.filter((z) => z.active);
    this.mucosaCells = this.mucosaCells.filter((c) => c.active);

    if (this.waveActive && this.spawnEvents.length === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      this.wave++;
      this.acidPh = Math.max(1.0, this.acidPh - 0.15);
      this.atp += 30;
      this.showFloatingText(GAME_WIDTH / 2, 80, `WAVE ${this.wave - 1} クリア！`, '#22c55e');

      const dayInfo = WAVES.find((w) => w.day === this.day);
      if (dayInfo && this.wave > dayInfo.waves) {
        if (this.day >= 7) {
          this.gameClear();
        } else {
          this.day++;
          this.wave = 1;
          this.showFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2, `DAY ${this.day} 開始！`, '#3b82f6');
        }
      }

      this.waveBtnText.setText('WAVE開始');
      this.waveBtn.setFillStyle(0x881337);
      this.waveBtn.setInteractive({ useHandCursor: true });
      this.updateUI();
    }
  }

  private gameClear() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85).setDepth(200);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, '除菌完了！', {
      fontSize: '52px',
      color: '#22c55e',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(201);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 10, '胃は平和を取り戻しました。', {
      fontSize: '18px',
      color: '#ffffff',
    }).setOrigin(0.5).setDepth(201);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 50, '7日間の服薬を完遂できましたか？', {
      fontSize: '14px',
      color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(201);
    this.scene.pause();
  }
}
