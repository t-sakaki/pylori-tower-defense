import * as Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, INITIAL_MUCOSA_HP, INITIAL_ATP, ENEMY_CONFIGS, TOWER_CONFIGS } from '@pylori/shared';

interface Waypoint { x: number; y: number }

/** 敵クラス */
class Enemy extends Phaser.GameObjects.Sprite {
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  waypoints: Waypoint[];
  currentWp = 0;
  private hpBar: Phaser.GameObjects.Graphics;
  private readonly RADIUS = 12;

  constructor(scene: Phaser.Scene, waypoints: Waypoint[], config: typeof ENEMY_CONFIGS['scout']) {
    super(scene, waypoints[0].x, waypoints[0].y, 'h-pylori');
    this.setOrigin(0.5);
    this.setScale(0.5); // adjust size as needed
    this.waypoints = waypoints;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.speed = config.speed;
    this.reward = config.reward;

    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.drawHpBar();

    scene.add.existing(this);
  }

  private drawHpBar() {
    this.hpBar.clear();
    const ratio = this.hp / this.maxHp;
    const w = 24;
    const h = 4;
    this.hpBar.fillStyle(0x000000, 0.5);
    this.hpBar.fillRect(-w / 2, -20, w, h);
    this.hpBar.fillStyle(ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xeab308 : 0xef4444, 1);
    this.hpBar.fillRect(-w / 2, -20, w * ratio, h);
  }

  takeDamage(damage: number) {
    this.hp -= damage;
    this.drawHpBar();
    if (this.hp <= 0) {
      this.destroy();
      return true; // 死亡
    }
    return false;
  }

  preUpdate(time: number, delta: number) {
    if (this.currentWp >= this.waypoints.length) return;

    const target = this.waypoints[this.currentWp];
    const dx = target.x - this.x;
    const dy = target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const moveDist = (this.speed * delta) / 1000;

    if (dist <= moveDist) {
      this.x = target.x;
      this.y = target.y;
      this.currentWp++;
      if (this.currentWp >= this.waypoints.length) {
        this.destroy();
      }
    } else {
      this.x += (dx / dist) * moveDist;
      this.y += (dy / dist) * moveDist;
    }
  }
}/** 弾クラス */
class Projectile extends Phaser.GameObjects.Container {
  target: Enemy;
  damage: number;
  speed = 400;
  private graphics: Phaser.GameObjects.Graphics;
  private readonly RADIUS = 4;

  constructor(scene: Phaser.Scene, x: number, y: number, target: Enemy, damage: number, color: number) {
    super(scene, x, y);
    this.target = target;
    this.damage = damage;

    this.graphics = scene.add.graphics();
    this.graphics.fillStyle(color, 1);
    this.graphics.fillCircle(0, 0, this.RADIUS);
    this.add(this.graphics);

    scene.add.existing(this);
  }

  preUpdate(time: number, delta: number) {
    if (!this.target.active) {
      this.destroy();
      return;
    }

    const dx = this.target.x - this.x;
    const dy = this.target.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const moveDist = (this.speed * delta) / 1000;

    if (dist <= moveDist || dist < 10) {
      const died = this.target.takeDamage(this.damage);
      if (died) {
        (this.scene as GameScene).addAtp(this.target.reward);
      }
      this.destroy();
    } else {
      this.x += (dx / dist) * moveDist;
      this.y += (dy / dist) * moveDist;
    }
  }
}

/** タワークラス */
class Tower extends Phaser.GameObjects.Container {
  config: typeof TOWER_CONFIGS['acid'];
  lastFireTime = 0;
  private body: Phaser.GameObjects.Image;
  private rangeGraphics: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, config: typeof TOWER_CONFIGS['acid']) {
    super(scene, x, y);
    this.config = config;

    let key = '';
    switch (this.config.type) {
      case 'acid':
        key = 'tower-acid';
        break;
      case 'amoxicillin':
        key = 'tower-amoxi';
        break;
      case 'clarithromycin':
        // fallback
        key = 'tower-acid';
        break;
      case 'barrier':
        key = 'tower-acid';
        break;
      case 'lacto':
        key = 'tower-acid';
        break;
      default:
        key = 'tower-acid';
    }

    this.body = scene.add.image(0, 0, key).setOrigin(0.5).setScale(0.4);
    this.add(this.body);

    this.rangeGraphics = scene.add.graphics();
    this.add(this.rangeGraphics);

    scene.add.existing(this);
  }

  private drawRange(active: boolean) {
    this.rangeGraphics.clear();
    if (!active) return;
    this.rangeGraphics.lineStyle(1, 0xffffff, 0.15);
    this.rangeGraphics.strokeCircle(0, 0, this.config.range);
  }

  setRangeVisible(v: boolean) {
    this.drawRange(v);
  }

  preUpdate(time: number, delta: number) {
    const scene = this.scene as GameScene;
    if (time - this.lastFireTime < 1000 / this.config.fireRate) return;

    // 射程内の最も経路が進んだ敵を検索
    let target: Enemy | null = null;
    let maxWp = -1;

    scene.enemies.forEach((e) => {
      if (!e.active) return;
      const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
      if (d <= this.config.range && e.currentWp > maxWp) {
        maxWp = e.currentWp;
        target = e;
      }
    });

    if (target) {
      this.lastFireTime = time;
      const projColor = this.config.type === 'acid' ? 0xf43f5e : 0x3b82f6;
      scene.projectiles.push(new Projectile(this.scene, this.x, this.y, target!, this.config.damage, projColor));
    }
  }
}export class GameScene extends Phaser.Scene {
  day = 1;
  wave = 1;
  atp = INITIAL_ATP;
  mucosaHp = INITIAL_MUCOSA_HP;
  acidPh = 2.0;

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

  private uiText!: Phaser.GameObjects.Text;
  private selectedTower: string | null = null;
  private selectionGraphics!: Phaser.GameObjects.Graphics;
  private waveActive = false;
  private spawnQueue: { delay: number; config: typeof ENEMY_CONFIGS['scout'] }[] = [];
  private nextSpawnTime = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    this.load.image('stomach-bg', '/assets/bg/stomach-lining.png');
    this.load.image('h-pylori', '/assets/enemies/h-pylori.png');
    this.load.image('tower-acid', '/assets/towers/antibiotic-pill.png');
    this.load.image('tower-amoxi', '/assets/towers/antibiotic-pill.png');
  }
  init(data: { day?: number }) {
    this.day = data.day || 1;
  }

  create() {
    this.drawBackground();
    this.drawPath();
    this.drawMucosa();
    this.setupUI();
    this.setupInput();
    this.setupTowerPalette();
  }

  private drawBackground() {
    this.add.image(0, 0, 'stomach-bg')
      .setOrigin(0, 0)
      .setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
  }

  private drawPath() {
    const g = this.add.graphics();
    g.lineStyle(24, 0x5c1818, 0.6);
    g.beginPath();
    g.moveTo(this.waypoints[0].x, this.waypoints[0].y);
    for (let i = 1; i < this.waypoints.length; i++) {
      g.lineTo(this.waypoints[i].x, this.waypoints[i].y);
    }
    g.strokePath();

    // 経路の境界線
    g.lineStyle(2, 0xfb7185, 0.3);
    g.beginPath();
    g.moveTo(this.waypoints[0].x, this.waypoints[0].y);
    for (let i = 1; i < this.waypoints.length; i++) {
      g.lineTo(this.waypoints[i].x, this.waypoints[i].y);
    }
    g.strokePath();
  }

  private drawMucosa() {
    // 最終防衛線（右端の上皮細胞）
    const g = this.add.graphics();
    g.fillStyle(0xfbcfe8, 0.8);
    for (let y = 200; y < 440; y += 40) {
      g.fillRoundedRect(920, y, 40, 32, 8);
      g.lineStyle(2, 0xf9a8d4, 1);
      g.strokeRoundedRect(920, y, 40, 32, 8);
    }
    this.add.text(940, 180, '粘膜', { fontSize: '12px', color: '#fbcfe8' }).setOrigin(0.5);
  }

  private setupUI() {
    // 上部ステータスバー背景
    const bar = this.add.rectangle(GAME_WIDTH / 2, 24, GAME_WIDTH, 48, 0x000000, 0.6);
    bar.setDepth(100);

    this.uiText = this.add.text(20, 16, '', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setDepth(101);

    this.updateUI();

    // WAVE開始ボタン
    const btn = this.add.rectangle(GAME_WIDTH - 80, 24, 120, 36, 0x881337)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
    const btnText = this.add.text(GAME_WIDTH - 80, 24, 'WAVE開始', {
      fontSize: '14px',
      color: '#fff',
    }).setOrigin(0.5).setDepth(101);

    btn.on('pointerover', () => btn.setFillStyle(0xbe123c));
    btn.on('pointerout', () => btn.setFillStyle(0x881337));
    btn.on('pointerdown', () => this.startWave());
  }

  private setupTowerPalette() {
    const paletteY = GAME_HEIGHT - 48;
    const towers = [
      { key: 'acid', label: '胃酸', cost: 50, color: 0xf43f5e },
      { key: 'amoxicillin', label: '抗生', cost: 80, color: 0x3b82f6 },
    ];

    towers.forEach((t, i) => {
      const x = 80 + i * 120;
      const bg = this.add.rectangle(x, paletteY, 100, 40, t.color, 0.8)
        .setInteractive({ useHandCursor: true })
        .setDepth(100);
      const label = this.add.text(x, paletteY, `${t.label} ${t.cost}ATP`, {
        fontSize: '12px',
        color: '#fff',
      }).setOrigin(0.5).setDepth(101);

      bg.on('pointerover', () => bg.setAlpha(1));
      bg.on('pointerout', () => bg.setAlpha(this.selectedTower === t.key ? 1 : 0.8));
      bg.on('pointerdown', () => {
        this.selectedTower = this.selectedTower === t.key ? null : t.key;
        this.updatePaletteSelection(towers);
      });
    });

    this.selectionGraphics = this.add.graphics().setDepth(99);
  }

  private updatePaletteSelection(towers: { key: string }[]) {
    this.selectionGraphics.clear();
    towers.forEach((t, i) => {
      const x = 80 + i * 120;
      const y = GAME_HEIGHT - 48;
      if (this.selectedTower === t.key) {
        this.selectionGraphics.lineStyle(3, 0xffffff, 1);
        this.selectionGraphics.strokeRect(x - 52, y - 22, 104, 44);
      }
    });
  }

  private setupInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y > GAME_HEIGHT - 80) return; // UIエリア除外
      if (!this.selectedTower) return;

      const config = TOWER_CONFIGS[this.selectedTower];
      if (!config || this.atp < config.cost) return;
      if (!this.canPlaceTower(pointer.x, pointer.y)) return;

      this.atp -= config.cost;
      const tower = new Tower(this, pointer.x, pointer.y, config);
      this.towers.push(tower);
      this.selectedTower = null;
      this.updatePaletteSelection([
        { key: 'acid' }, { key: 'amoxicillin' },
      ]);
      this.updateUI();
    });
  }

  private canPlaceTower(x: number, y: number): boolean {
    // 経路から一定距離離れているか簡易判定
    const PATH_RADIUS = 40;
    for (let i = 0; i < this.waypoints.length - 1; i++) {
      const p1 = this.waypoints[i];
      const p2 = this.waypoints[i + 1];
      const dist = this.distToSegment({ x, y }, p1, p2);
      if (dist < PATH_RADIUS) return false;
    }
    // 他のタワーと重ならない
    for (const t of this.towers) {
      if (Phaser.Math.Distance.Between(x, y, t.x, t.y) < 40) return false;
    }
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
    this.spawnQueue = [];

    const count = 3 + this.day * 2 + this.wave * 2;
    for (let i = 0; i < count; i++) {
      this.spawnQueue.push({
        delay: i * 1200,
        config: ENEMY_CONFIGS.scout,
      });
    }
    this.nextSpawnTime = this.time.now;
  }

  addAtp(amount: number) {
    this.atp += amount;
    this.updateUI();
  }

  private updateUI() {
    this.uiText.setText(
      `DAY ${this.day}  WAVE ${this.wave}  |  胃酸pH: ${this.acidPh.toFixed(1)}  |  粘膜HP: ${this.mucosaHp}  |  ATP: ${this.atp}`
    );
  }

  update(time: number, delta: number) {
    // スポーン処理
    if (this.waveActive && this.spawnQueue.length > 0) {
      if (time >= this.nextSpawnTime) {
        const spawn = this.spawnQueue.shift()!;
        const enemy = new Enemy(this, this.waypoints, spawn.config);
        this.enemies.push(enemy);
        this.nextSpawnTime = time + 1200;
      }
    }

    // 敵の最終到達判定
    this.enemies = this.enemies.filter((e) => {
      if (!e.active) {
        if (e.currentWp >= e.waypoints.length) {
          this.mucosaHp -= 10;
          this.updateUI();
          if (this.mucosaHp <= 0) this.gameOver();
        }
        return false;
      }
      return true;
    });

    // 弾のクリーンアップ
    this.projectiles = this.projectiles.filter((p) => p.active);

    // ウェーブ終了判定
    if (this.waveActive && this.spawnQueue.length === 0 && this.enemies.length === 0) {
      this.waveActive = false;
      this.wave++;
      this.acidPh = Math.max(1.0, this.acidPh - 0.2); // 除菌進行で胃酸回復
      this.updateUI();
    }
  }

  private gameOver() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.8).setDepth(200);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, '胃壁崩壊...', {
      fontSize: '48px',
      color: '#ef4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(201);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 20, '7日間の服薬を完遂する重要性を学んでください', {
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(201);

    const retry = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, 160, 40, 0x881337)
      .setInteractive({ useHandCursor: true })
      .setDepth(201);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 80, '再挑戦', {
      fontSize: '18px',
      color: '#fff',
    }).setOrigin(0.5).setDepth(202);
  }
}