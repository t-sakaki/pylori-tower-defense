import Phaser from 'phaser';

/**
 * ウレアーゼ中和ゾーン
 * このエリア内では胃酸タワーの攻撃力が大幅に低下する
 */
export class AcidZone extends Phaser.GameObjects.Container {
  radius: number;
  lifespan: number; // ms
  private graphics: Phaser.GameObjects.Graphics;
  private pulseTween: Phaser.Tweens.Tween | null = null;

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    radius: number = 60,
    lifespan: number = 5000
  ) {
    super(scene, x, y);
    this.radius = radius;
    this.lifespan = lifespan;

    this.graphics = scene.add.graphics();
    this.drawZone();
    this.add(this.graphics);

    // 脈動アニメーション
    this.pulseTween = scene.tweens.add({
      targets: this,
      scaleX: 1.1,
      scaleY: 1.1,
      duration: 800,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    scene.add.existing(this);
  }

  private drawZone() {
    this.graphics.clear();
    // 泡っぽい外観
    this.graphics.fillStyle(0x86efac, 0.25);
    this.graphics.fillCircle(0, 0, this.radius);
    this.graphics.lineStyle(2, 0x4ade80, 0.5);
    this.graphics.strokeCircle(0, 0, this.radius);

    // 内側の泡
    for (let i = 0; i < 3; i++) {
      const angle = (Math.PI * 2 * i) / 3;
      const bx = Math.cos(angle) * (this.radius * 0.4);
      const by = Math.sin(angle) * (this.radius * 0.4);
      this.graphics.fillStyle(0xbbf7d0, 0.4);
      this.graphics.fillCircle(bx, by, 8);
    }
  }

  /**
   * 指定座標がこのゾーン内にあるか
   */
  contains(x: number, y: number): boolean {
    const dx = x - this.x;
    const dy = y - this.y;
    return Math.sqrt(dx * dx + dy * dy) <= this.radius;
  }

  preUpdate(time: number, delta: number) {
    this.lifespan -= delta;
    if (this.lifespan <= 0) {
      this.pulseTween?.stop();
      this.destroy();
    }
  }
}
