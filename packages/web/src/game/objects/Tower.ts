import Phaser from 'phaser';
import { TowerConfig, TowerType } from '../config/types';
import { Enemy } from './Enemy';
import { Projectile } from './Projectile';
import { AcidZone } from './AcidZone';

export class Tower extends Phaser.GameObjects.Container {
  config: TowerConfig;
  lastFireTime = 0;
  private bodyGraphics: Phaser.GameObjects.Graphics;
  private rangeGraphics: Phaser.GameObjects.Graphics;
  private hpBar?: Phaser.GameObjects.Graphics;
  private currentHp = 0;
  private maxHp = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, config: TowerConfig) {
    super(scene, x, y);
    this.config = config;

    this.bodyGraphics = scene.add.graphics();
    this.drawBody();
    this.add(this.bodyGraphics);

    this.rangeGraphics = scene.add.graphics();
    this.add(this.rangeGraphics);

    // バリアタワーは耐久値あり
    if (config.type === 'barrier') {
      this.maxHp = 200;
      this.currentHp = 200;
      this.hpBar = scene.add.graphics();
      this.add(this.hpBar);
      this.drawHpBar();
    }

    scene.add.existing(this);
  }

  private drawBody() {
    this.bodyGraphics.clear();
    const colors: Record<TowerType, number> = {
      acid: 0xf43f5e,
      amoxicillin: 0x3b82f6,
      clarithromycin: 0xa855f7,
      barrier: 0x6b7280,
      lacto: 0xfcd34d,
      metronidazole: 0xf97316,
    };
    const c = colors[this.config.type] || 0xffffff;

    if (this.config.type === 'barrier') {
      // シールド型
      this.bodyGraphics.fillStyle(c, 0.6);
      this.bodyGraphics.fillRoundedRect(-20, -20, 40, 40, 8);
      this.bodyGraphics.lineStyle(3, 0xffffff, 0.9);
      this.bodyGraphics.strokeRoundedRect(-20, -20, 40, 40, 8);
      // 十字
      this.bodyGraphics.lineStyle(2, 0xffffff, 0.7);
      this.bodyGraphics.moveTo(0, -12);
      this.bodyGraphics.lineTo(0, 12);
      this.bodyGraphics.moveTo(-12, 0);
      this.bodyGraphics.lineTo(12, 0);
      this.bodyGraphics.strokePath();
    } else if (this.config.type === 'lacto') {
      // ドローン型（円）
      this.bodyGraphics.fillStyle(c, 0.9);
      this.bodyGraphics.fillCircle(0, 0, 14);
      this.bodyGraphics.lineStyle(2, 0xffffff, 0.8);
      this.bodyGraphics.strokeCircle(0, 0, 14);
      // 回復マーク
      this.bodyGraphics.fillStyle(0xffffff, 1);
      this.bodyGraphics.fillRect(-2, -6, 4, 12);
      this.bodyGraphics.fillRect(-6, -2, 12, 4);
    } else {
      // 通常タワー（四角）
      this.bodyGraphics.fillStyle(c, 0.9);
      this.bodyGraphics.fillRect(-16, -16, 32, 32);
      this.bodyGraphics.lineStyle(2, 0xffffff, 0.8);
      this.bodyGraphics.strokeRect(-16, -16, 32, 32);

      // 中央シンボル
      this.bodyGraphics.fillStyle(0xffffff, 1);
      if (this.config.type === 'acid') {
        this.bodyGraphics.fillCircle(0, 0, 6);
      } else if (this.config.type === 'amoxicillin') {
        this.bodyGraphics.fillTriangle(-5, 5, 5, 5, 0, -5);
      } else if (this.config.type === 'clarithromycin') {
        // レーザーアイコン（横線）
        this.bodyGraphics.fillRect(-8, -2, 16, 4);
      }
    }
  }

  private drawHpBar() {
    if (!this.hpBar) return;
    this.hpBar.clear();
    const ratio = this.currentHp / this.maxHp;
    const w = 36;
    const h = 4;
    this.hpBar.fillStyle(0x000000, 0.5);
    this.hpBar.fillRect(-w / 2, -28, w, h);
    this.hpBar.fillStyle(ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xeab308 : 0xef4444, 1);
    this.hpBar.fillRect(-w / 2, -28, w * ratio, h);
  }

  setRangeVisible(v: boolean) {
    this.rangeGraphics.clear();
    if (!v) return;
    this.rangeGraphics.lineStyle(1, 0xffffff, 0.12);
    this.rangeGraphics.strokeCircle(0, 0, this.config.range);
  }

  /**
   * 中和ゾーン内にあるか判定
   */
  isInAcidZone(zones: AcidZone[]): boolean {
    return zones.some((z) => z.contains(this.x, this.y));
  }

  takeDamage(amount: number) {
    if (this.config.type !== 'barrier') return;
    this.currentHp -= amount;
    this.drawHpBar();
    if (this.currentHp <= 0) {
      this.destroy();
    }
  }

  preUpdate(time: number, delta: number) {
    // バリアは攻撃しない
    if (this.config.type === 'barrier') return;

    const fireInterval = 1000 / this.config.fireRate;
    if (time - this.lastFireTime < fireInterval) return;

    const scene = this.scene as any;
    const enemies: Enemy[] = scene.enemies || [];
    const acidZones: AcidZone[] = scene.acidZones || [];

    // 射程内の敵を検索（最も経路が進んだ敵を優先）
    let target: Enemy | null = null;
    let maxWp = -1;

    for (const e of enemies) {
      if (!e.active) continue;
      const d = Phaser.Math.Distance.Between(this.x, this.y, e.x, e.y);
      if (d <= this.config.range && e.currentWp > maxWp) {
        maxWp = e.currentWp;
        target = e;
      }
    }

    if (target) {
      this.lastFireTime = time;
      const colors: Record<TowerType, number> = {
        acid: 0xf43f5e,
        amoxicillin: 0x3b82f6,
        clarithromycin: 0xa855f7,
        barrier: 0x6b7280,
        lacto: 0xfcd34d,
        metronidazole: 0xf97316,
      };

      let damage = this.config.damage;

      // 胃酸タワーは中和ゾーン内でダメージ激減
      if (this.config.type === 'acid' && this.isInAcidZone(acidZones)) {
        damage = Math.floor(damage * 0.2);
      }

      // クラリスロマイシンはCagAに特効
      if (this.config.type === 'clarithromycin' && target.config.type === 'cagA') {
        damage *= 2;
      }

      scene.projectiles.push(
        new Projectile(this.scene, this.x, this.y, target, damage, colors[this.config.type])
      );
    }
  }
}
