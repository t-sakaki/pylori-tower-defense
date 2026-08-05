import Phaser from 'phaser';
import { Enemy } from './Enemy';

export class Projectile extends Phaser.GameObjects.Container {
  target: Enemy;
  damage: number;
  speed = 400;
  private graphics: Phaser.GameObjects.Graphics;
  private readonly RADIUS = 5;
  private trail: { x: number; y: number }[] = [];

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    target: Enemy,
    damage: number,
    color: number
  ) {
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

    // 軌跡を記録
    this.trail.push({ x: this.x, y: this.y });
    if (this.trail.length > 5) this.trail.shift();

    if (dist <= moveDist || dist < 12) {
      const died = this.target.takeDamage(this.damage);
      if (died) {
        (this.scene as any).addAtp?.(this.target.reward);
      }
      this.destroy();
    } else {
      this.x += (dx / dist) * moveDist;
      this.y += (dy / dist) * moveDist;
    }
  }

  destroy(fromScene?: boolean) {
    this.trail = [];
    super.destroy(fromScene);
  }
}
