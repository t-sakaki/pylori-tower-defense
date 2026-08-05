import Phaser from 'phaser';
import { EnemyConfig, Waypoint } from '../config/types';
import { AcidZone } from './AcidZone';

export class Enemy extends Phaser.GameObjects.Container {
  config: EnemyConfig;
  hp: number;
  maxHp: number;
  speed: number;
  reward: number;
  waypoints: Waypoint[];
  currentWp = 0;
  private bodyGraphics: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;
  private readonly RADIUS = 12;

  // 特殊能力用
  private lastUreaseTime = 0;
  private attackCooldown = 0;

  constructor(scene: Phaser.Scene, waypoints: Waypoint[], config: EnemyConfig) {
    super(scene, waypoints[0].x, waypoints[0].y);
    this.waypoints = waypoints;
    this.config = config;
    this.hp = config.hp;
    this.maxHp = config.hp;
    this.speed = config.speed;
    this.reward = config.reward;

    this.bodyGraphics = scene.add.graphics();
    this.drawBody();
    this.add(this.bodyGraphics);

    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.drawHpBar();

    scene.add.existing(this);
  }

  private drawBody() {
    this.bodyGraphics.clear();

    const colors: Record<string, number> = {
      scout: 0x22c55e,
      urease: 0x3b82f6,
      cagA: 0xa855f7,
      vacA: 0xf97316,
    };
    const c = colors[this.config.type] || 0x22c55e;

    // 本体（螺旋バクテリア風）
    this.bodyGraphics.fillStyle(c, 1);
    this.bodyGraphics.fillCircle(0, 0, this.RADIUS);

    // 螺旋線
    this.bodyGraphics.lineStyle(2, 0xffffff, 0.6);
    this.bodyGraphics.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 * i) / 3;
      const r = this.RADIUS * 0.7;
      const x = Math.cos(angle) * r;
      const y = Math.sin(angle) * r;
      if (i === 0) this.bodyGraphics.moveTo(x, y);
      else this.bodyGraphics.lineTo(x, y);
    }
    this.bodyGraphics.strokePath();

    // 鞭毛（スカウトは2本、他は特徴的な形状）
    this.bodyGraphics.lineStyle(1.5, c, 0.8);
    if (this.config.type === 'urease') {
      // タンク型：背中に泡
      this.bodyGraphics.fillStyle(0x86efac, 0.8);
      this.bodyGraphics.fillCircle(0, -10, 6);
      this.bodyGraphics.fillCircle(-5, -8, 4);
      this.bodyGraphics.fillCircle(5, -8, 4);
    } else if (this.config.type === 'cagA') {
      // スナイパー：針
      this.bodyGraphics.fillStyle(0xffffff, 1);
      this.bodyGraphics.fillTriangle(0, -14, -3, -22, 3, -22);
    } else if (this.config.type === 'vacA') {
      // ボマー：膨らんだ体
      this.bodyGraphics.fillStyle(0xf97316, 0.6);
      this.bodyGraphics.fillCircle(0, 0, this.RADIUS + 4);
      this.bodyGraphics.lineStyle(2, 0xfca5a5, 0.8);
      this.bodyGraphics.strokeCircle(0, 0, this.RADIUS + 4);
    }
  }

  private drawHpBar() {
    this.hpBar.clear();
    const ratio = Math.max(0, this.hp / this.maxHp);
    const w = 24;
    const h = 4;
    this.hpBar.fillStyle(0x000000, 0.5);
    this.hpBar.fillRect(-w / 2, -20, w, h);
    this.hpBar.fillStyle(ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xeab308 : 0xef4444, 1);
    this.hpBar.fillRect(-w / 2, -20, w * ratio, h);
  }

  takeDamage(damage: number): boolean {
    this.hp -= damage;
    this.drawHpBar();
    if (this.hp <= 0) {
      this.onDeath();
      this.destroy();
      return true;
    }
    return false;
  }

  /**
   * 死亡時の特殊効果
   */
  private onDeath() {
    if (this.config.type === 'vacA' && this.config.explodeRadius) {
      // VacA：死亡時に範囲ダメージ（潰瘍化）
      const scene = this.scene as any;
      scene.showExplosion?.(this.x, this.y, this.config.explodeRadius, 0xf97316);

      // 範囲内のタワー・細胞にダメージ
      const towers = scene.towers || [];
      for (const t of towers) {
        if (!t.active) continue;
        const d = Phaser.Math.Distance.Between(this.x, this.y, t.x, t.y);
        if (d <= this.config.explodeRadius) {
          t.takeDamage?.(30);
        }
      }
    }
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
        // 最終到達：粘膜にダメージ
        const scene = this.scene as any;
        scene.onEnemyReachEnd?.(this);
        this.destroy();
      }
    } else {
      this.x += (dx / dist) * moveDist;
      this.y += (dy / dist) * moveDist;
    }

    // ウレアーゼ：一定間隔で中和ゾーン生成
    if (this.config.type === 'urease' && this.config.ureaseInterval) {
      if (time - this.lastUreaseTime > this.config.ureaseInterval) {
        this.lastUreaseTime = time;
        const scene = this.scene as any;
        scene.spawnAcidZone?.(this.x, this.y);
      }
    }

    // CagA：遠距離攻撃（上皮細胞を狙う）
    if (this.config.type === 'cagA' && this.config.attackRange) {
      this.attackCooldown -= delta;
      if (this.attackCooldown <= 0) {
        this.attackCooldown = 2000; // 2秒間隔
        const scene = this.scene as any;
        const mucosaCells = scene.mucosaCells || [];
        for (const cell of mucosaCells) {
          if (!cell.active) continue;
          const d = Phaser.Math.Distance.Between(this.x, this.y, cell.x, cell.y);
          if (d <= this.config.attackRange) {
            scene.spawnCagAProjectile?.(this.x, this.y, cell);
            break;
          }
        }
      }
    }
  }
}
