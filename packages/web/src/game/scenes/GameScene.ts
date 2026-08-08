import Phaser from 'phaser';
import i18n from '@/lib/i18n';
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
  private drugBtnText!: Phaser.GameObjects.Text;
  private mucosaLabelText!: Phaser.GameObjects.Text;
  private bgImage?: Phaser.GameObjects.Image;

  // Progress bars for resources
  private acidBarBg!: Phaser.GameObjects.Rectangle;
  private acidBarFg!: Phaser.GameObjects.Rectangle;
  private mucosaBarBg!: Phaser.GameObjects.Rectangle;
  private mucosaBarFg!: Phaser.GameObjects.Rectangle;
  private atpBarBg!: Phaser.GameObjects.Rectangle;
  private atpBarFg!: Phaser.GameObjects.Rectangle;
  private acidLabelText!: Phaser.GameObjects.Text;
  private mucosaLabelTextBar!: Phaser.GameObjects.Text;
  private atpLabelText!: Phaser.GameObjects.Text;

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

    const handleLanguageChange = () => {
      this.updateUI();
    };
    i18n.on('languageChanged', handleLanguageChange);

    this.events.once(Phaser.Scenes.Events.DESTROY, () => {
      i18n.off('languageChanged', handleLanguageChange);
    });
  }

  private drawBackground() {
    if (this.textures.exists('bg-battlefield')) {
      // メイン背景（胃内戦場）
      this.bgImage = this.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, 'bg-battlefield');
      this.bgImage.setDisplaySize(GAME_WIDTH, GAME_HEIGHT);
      this.bgImage.setAlpha(0.9); // 少し透過してゲーム要素を浮かせる
      this.bgImage.setDepth(-1);

      // 暗いオーバーレイ（コントラスト確保）
      const overlay = this.add.rectangle(
        GAME_WIDTH / 2, GAME_HEIGHT / 2,
        GAME_WIDTH, GAME_HEIGHT,
        0x000000, 0.15
      );
      overlay.setDepth(-1);
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
    this.mucosaLabelText = this.add.text(940, 220, i18n.t('game:ui.mucosaHp').replace(':', ''), {
      fontSize: '11px',
      color: '#fbcfe8',
    }).setOrigin(0.5).setDepth(50);
  }

  private setupUI() {
    const bar = this.add.rectangle(GAME_WIDTH / 2, 26, GAME_WIDTH, 52, 0x000000, 0.7);
    bar.setDepth(100);
    bar.setStrokeStyle(1, 0x881337, 0.5);

    // Acid pH bar (left)
    const acidBarWidth = 200;
    const acidBarHeight = 20;
    const acidBarX = 40;
    const acidBarY = 20;
    this.acidBarBg = this.add.rectangle(acidBarX, acidBarY, acidBarWidth, acidBarHeight, 0x222222)
      .setOrigin(0)
      .setDepth(101);
    this.acidBarFg = this.add.rectangle(acidBarX, acidBarY, 0, acidBarHeight, 0xf43f5e) // pink/red for acid
      .setOrigin(0)
      .setDepth(102);
    this.acidLabelText = this.add.text(acidBarX + acidBarWidth + 10, acidBarY, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5)
      .setDepth(103);

    // Mucosa HP bar (center-left)
    const mucosaBarWidth = 200;
    const mucosaBarHeight = 20;
    const mucosaBarX = acidBarX + acidBarWidth + 120;
    const mucosaBarY = acidBarY;
    this.mucosaBarBg = this.add.rectangle(mucosaBarX, mucosaBarY, mucosaBarWidth, mucosaBarHeight, 0x222222)
      .setOrigin(0)
      .setDepth(101);
    this.mucosaBarFg = this.add.rectangle(mucosaBarX, mucosaBarY, 0, mucosaBarHeight, 0xfb7185) // pink for mucosa
      .setOrigin(0)
      .setDepth(102);
    this.mucosaLabelTextBar = this.add.text(mucosaBarX + mucosaBarWidth + 10, mucosaBarY, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5)
      .setDepth(103);

    // ATP bar (center-right)
    const atpBarWidth = 200;
    const atpBarHeight = 20;
    const atpBarX = mucosaBarX + mucosaBarWidth + 120;
    const atpBarY = acidBarY;
    this.atpBarBg = this.add.rectangle(atpBarX, atpBarY, atpBarWidth, atpBarHeight, 0x222222)
      .setOrigin(0)
      .setDepth(101);
    this.atpBarFg = this.add.rectangle(atpBarX, atpBarY, 0, atpBarHeight, 0x3b82f6) // blue for ATP
      .setOrigin(0)
      .setDepth(102);
    this.atpLabelText = this.add.text(atpBarX + atpBarWidth + 10, atpBarY, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setOrigin(0, 0.5)
      .setDepth(103);

    // Existing UI texts (score, day, wave button, drug button) repositioned to the right
    this.uiText = this.add.text(atpBarX + atpBarWidth + 150, 14, '', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'monospace',
    }).setDepth(101);

    this.dayText = this.add.text(atpBarX + atpBarWidth + 250, 14, '', {
      fontSize: '14px',
      color: '#fb7185',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setDepth(101);

    this.waveBtn = this.add.rectangle(GAME_WIDTH - 220, 26, 110, 36, 0x881337)
      .setInteractive({ useHandCursor: true })
      .setDepth(100);
    this.waveBtnText = this.add.text(GAME_WIDTH - 220, 26, i18n.t('game:buttons.waveStart'), {
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
    this.drugBtnText = this.add.text(100, GAME_HEIGHT - 28, i18n.t('game:buttons.takeDrug'), {
      fontSize: '12px',
      color: '#fff',
    }).setOrigin(0.5).setDepth(101);
    drugBtn.on('pointerdown', () => this.onDrugTaken());

    this.updateUI();
  }

  private setupTowerPalette() {
    const paletteY = GAME_HEIGHT - 28;
    const towerDefs = [
      { key: 'acid', label: i18n.t('game:towers.acid.label'), cost: 50, color: 0xf43f5e },
      { key: 'amoxicillin', label: i18n.t('game:towers.amoxicillin.label'), cost: 80, color: 0x3b82f6 },
      { key: 'clarithromycin', label: i18n.t('game:towers.clarithromycin.label'), cost: 120, color: 0xa855f7 },
      { key: 'barrier', label: i18n.t('game:towers.barrier.label'), cost: 60, color: 0x6b7280 },
      { key: 'lacto', label: i18n.t('game:towers.lacto.label'), cost: 100, color: 0xfcd34d },
    ];

    towerDefs.forEach((t, i) => {
      const x = 220 + i * 110;
      const bg = this.add.rectangle(x, paletteY, 100, 36, t.color, 0.85)
        .setInteractive({ useHandCursor: true })
        .setDepth(100);
      this.add.text(x, paletteY, `${t.label} ${t.cost}ATP`, {
        fontSize: '11px',
        color: '#fff',
      }).setOrigin(0.5).setDepth(101);
      bg.on('pointerover', () => bg.setAlpha(1));
      bg.on('pointerout', () => bg.setAlpha(this.selectedTower === t.key ? 1 : 0.85));
      bg.on('pointerdown', () => {
        if (this.selectedTower === t.key) {
          this.selectedTower = null;
        } else {
          this.selectedTower = t.key;
        }
        this.updateTowerPalette();
      });
    });
  }

  private setupInput() {
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.y < 100) return; // Ignore clicks on UI area
      if (this.selectedTower && this.atp >= TOWER_CONFIGS[this.selectedTower].cost) {
        if (this.canPlaceTower(pointer.x, pointer.y)) {
          this.placeTower(pointer.x, pointer.y);
        } else {
          this.showFloatingText(pointer.x, pointer.y - 20, i18n.t('game:alerts.invalidPlacement'), '#f59e0b');
        }
      } else if (!this.selectedTower) {
        // Show tooltip about selecting a tower first
        this.showFloatingText(pointer.x, pointer.y - 20, i18n.t('game:alerts.selectTower'), '#6b7280');
      } else {
        this.showFloatingText(pointer.x, pointer.y - 20, i18n.t('game:alerts.insufficientAtp'), '#ef4444');
      }
    });
  }

  private updateUI() {
    // Update progress bars
    // Acid pH: map from 1.0 (min) to 7.0 (max) to 0-100% (but we invert because lower pH = more acid)
    const minPh = 1.0;
    const maxPh = 7.0;
    const phClamped = Phaser.Math.Clamp(this.acidPh, minPh, maxPh);
    // We want acidity level: (maxPh - phClamped) / (maxPh - minPh) so that higher acidity (lower pH) fills more
    const acidity = (maxPh - phClamped) / (maxPh - minPh);
    this.acidBarFg.width = Math.round(acidity * this.acidBarBg.width);
    this.acidLabelText.setText(`${i18n.t('game:ui.acidPh')} ${this.acidPh.toFixed(1)}`);

    // Mucosa HP: 0 to maxMucosaHp
    const mucosaRatio = this.mucosaHp / this.maxMucosaHp;
    this.mucosaBarFg.width = Math.round(mucosaRatio * this.mucosaBarBg.width);
    this.mucosaLabelTextBar.setText(`${i18n.t('game:ui.mucosaHp')} ${Math.max(0, this.mucosaHp)}`);

    // ATP: we need a max ATP for display; let's use a reasonable cap like 300
    const maxAtpDisplay = 300;
    const atpRatio = Math.min(this.atp / maxAtpDisplay, 1); // cap at 1
    this.atpBarFg.width = Math.round(atpRatio * this.atpBarBg.width);
    this.atpLabelText.setText(`${i18n.t('game:ui.atp')} ${this.atp}`);

    // Score text (keep existing)
    const acidLabel = i18n.t('game:ui.acidPh');
    const mucosaLabel = i18n.t('game:ui.mucosaHp');
    const atpLabel = i18n.t('game:ui.atp');
    const scoreLabel = i18n.t('game:ui.score');
    const dayLabel = i18n.t('game:ui.day', { day: this.day });
    const waveLabel = i18n.t('game:ui.wave', { wave: this.wave });

    this.uiText.setText(
      `${acidLabel}${this.acidPh.toFixed(1)}  ${mucosaLabel}${Math.max(0, this.mucosaHp)}  ${atpLabel}${this.atp}  ${scoreLabel}${this.score}`
    );
    this.dayText.setText(`${dayLabel} / 7  ${waveLabel}/${this.getMaxWaveForDay()}`);

    // Update button texts (already done in other methods, but ensure)
    if (this.waveBtnText) {
      this.waveBtnText.setText(i18n.t('game:buttons.waveStart'));
    }
    if (this.drugBtnText) {
      this.drugBtnText.setText(i18n.t('game:buttons.takeDrug'));
    }
    if (this.mucosaLabelText) {
      this.mucosaLabelText.setText(i18n.t('game:ui.mucosaHp').replace(':', ''));
    }
  }

  private getMaxWaveForDay(): number {
    const dayInfo = WAVES.find((w) => w.day === this.day);
    return dayInfo ? dayInfo.waves : 3;
  }

  // Wave system (original logic with i18n updates)
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

    this.waveBtnText.setText(i18n.t('game:buttons.waveStart')); // Actually should be "WAVE進行中"? but we keep i18n key? There is no key for "WAVE進行中". We'll keep as is for now.
    this.waveBtn.setFillStyle(0x4b5563);
    this.waveBtn.disableInteractive();
  }

  private waveComplete() {
    this.waveActive = false;
    this.showFloatingText(GAME_WIDTH / 2, 80, i18n.t('game:alerts.waveCleared', { wave: this.wave - 1 }), '#22c55e');
    this.waveBtn.setFillStyle(0x881337);
    this.waveBtn.setInteractive({ useHandCursor: true });

    const dayInfo = WAVES.find((w) => w.day === this.day);
    if (dayInfo && this.wave > dayInfo.waves) {
      this.day++;
      this.wave = 1;
      this.showFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2, i18n.t('game:alerts.dayStarted', { day: this.day }), '#3b82f6');
    } else {
      this.wave++;
    }
    this.updateUI();
    this.acidPh = Math.max(1.0, this.acidPh - 0.15);
    this.atp += 30;
  }

  private addAtp(amount: number) {
    this.atp += amount;
    this.updateUI();
  }

  private onDrugTaken() {
    if (this.atp < 100) {
      this.showFloatingText(GAME_WIDTH / 2, 80, i18n.t('game:alerts.insufficientAtp'), '#ef4444');
      return;
    }
    this.atp -= 100;
    for (const cell of this.mucosaCells) {
      if (cell.active) cell.heal(10);
    }
    this.showFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2, i18n.t('game:buttons.takeDrug'), '#22c55e');
    this.updateUI();
  }

  private canPlaceTower(x: number, y: number): boolean {
    // Check if position is on the path
    for (const wp of this.waypoints) {
      const dist = Phaser.Math.Distance.Between(x, y, wp.x, wp.y);
      if (dist < 30) return false;
    }
    // Check if position is too close to existing towers
    for (const tower of this.towers) {
      const dist = Phaser.Math.Distance.Between(x, y, tower.x, tower.y);
      if (dist < 60) return false;
    }
    return true;
  }

  private placeTower(x: number, y: number) {
    if (!this.selectedTower) return;
    const config = TOWER_CONFIGS[this.selectedTower];
    if (!config || this.atp < config.cost) return;
    this.atp -= config.cost;
    const tower = new Tower(this, x, y, config);
    this.towers.push(tower);
    this.selectedTower = null;
    this.updateTowerPalette();
    this.updateUI();
  }

  private updateTowerPalette() {
    // This method would update the palette UI to reflect selected tower
    // For simplicity, we rely on the alpha changes in setupInput
  }

  private showFloatingText(x: number, y: number, text: string, color: string) {
    const padding = 12;
    const label = this.add.text(x, y, text, {
      fontSize: '20px',
      color: color,
      fontStyle: 'bold',
      align: 'center',
      wordWrap: { width: 480 },
    }).setOrigin(0.5).setDepth(200);

    // 背景矩形を追加して可読性を確保
    const bg = this.add.rectangle(
      x,
      y,
      label.width + padding * 2,
      label.height + padding,
      0x000000,
      0.7
    ).setDepth(199);
    bg.setStrokeStyle(2, 0xffffff, 0.3);

    // 初期は透明 → フェードイン → 維持 → フェードアウト
    label.setAlpha(0);
    bg.setAlpha(0);
    this.tweens.add({
      targets: [label, bg],
      alpha: { from: 0, to: 1 },
      duration: 200,
      ease: 'Power2',
      onComplete: () => {
        this.tweens.add({
          targets: [label, bg],
          alpha: 0,
          y: '-=20',
          delay: 1400,
          duration: 400,
          ease: 'Power2',
          onComplete: () => {
            label.destroy();
            bg.destroy();
          },
        });
      },
    });
  }

  private gameOver() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85).setDepth(200);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, i18n.t('game:alerts.mucosaDestroyed'), {
      fontSize: '52px',
      color: '#ef4444',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(201);
    const retry = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 180, 44, 0x881337)
      .setInteractive({ useHandCursor: true })
      .setDepth(201);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, i18n.t('game:buttons.retry'), {
      fontSize: '18px',
      color: '#fff',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(202);
    retry.on('pointerdown', () => this.scene.restart());
  }

  private gameClear() {
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.85).setDepth(200);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, i18n.t('game:alerts.sterilizationComplete'), {
      fontSize: '52px',
      color: '#22c55e',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(201);
    const retry = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, 180, 44, 0x881337)
      .setInteractive({ useHandCursor: true })
      .setDepth(201);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 100, i18n.t('game:buttons.retry'), {
      fontSize: '18px',
      color: '#fff',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(202);
    retry.on('pointerdown', () => this.scene.restart());
  }

  // The update method from original
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
      this.showFloatingText(GAME_WIDTH / 2, 80, i18n.t('game:alerts.waveCleared', { wave: this.wave - 1 }), '#22c55e');

      const dayInfo = WAVES.find((w) => w.day === this.day);
      if (dayInfo && this.wave > dayInfo.waves) {
        if (this.day >= 7) {
          this.gameClear();
        } else {
          this.day++;
          this.wave = 1;
          this.showFloatingText(GAME_WIDTH / 2, GAME_HEIGHT / 2, i18n.t('game:alerts.dayStarted', { day: this.day }), '#3b82f6');
        }
      } else {
        this.wave++;
      }
      this.waveBtnText.setText(i18n.t('game:buttons.waveStart'));
      this.waveBtn.setFillStyle(0x881337);
      this.waveBtn.setInteractive({ useHandCursor: true });
      this.updateUI();
    }
  }
}