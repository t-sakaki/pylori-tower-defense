import Phaser from 'phaser';

/**
 * 上皮細胞（胃粘膜の最終防衛線）
 * 敵が到達するか、CagA毒素を受けるとダメージ
 */
export class MucosaCell extends Phaser.GameObjects.Container {
  maxHp: number;
  currentHp: number;
  private bodyGraphics: Phaser.GameObjects.Graphics;
  private hpBar: Phaser.GameObjects.Graphics;
  private damageFlash: Phaser.GameObjects.Graphics;

  constructor(scene: Phaser.Scene, x: number, y: number, maxHp: number = 25) {
    super(scene, x, y);
    this.maxHp = maxHp;
    this.currentHp = maxHp;

    this.bodyGraphics = scene.add.graphics();
    this.drawBody();
    this.add(this.bodyGraphics);

    this.hpBar = scene.add.graphics();
    this.add(this.hpBar);
    this.drawHpBar();

    this.damageFlash = scene.add.graphics();
    this.damageFlash.fillStyle(0xff0000, 0);
    this.damageFlash.fillRoundedRect(-18, -18, 36, 36, 8);
    this.add(this.damageFlash);

    scene.add.existing(this);
  }

  private drawBody() {
    // 画像アセット（上皮細胞テクスチャ）がある場合は表示、ない場合はフォールバックのGraphics描画
    if (this.scene.textures.exists('bg-lining')) {
      const lining = this.scene.add.image(0, 0, 'bg-lining');
      lining.setDisplaySize(40, 40);
      lining.setAlpha(0.6);
      this.add(lining);
    } else {
      this.bodyGraphics.clear();
      // ピンク色の上皮細胞
      this.bodyGraphics.fillStyle(0xfbcfe8, 0.9);
      this.bodyGraphics.fillRoundedRect(-16, -16, 32, 32, 8);
      this.bodyGraphics.lineStyle(2, 0xf9a8d4, 1);
      this.bodyGraphics.strokeRoundedRect(-16, -16, 32, 32, 8);

      // 核っぽい丸
      this.bodyGraphics.fillStyle(0xf472b6, 0.6);
      this.bodyGraphics.fillCircle(0, 0, 6);
    }
  }

  private drawHpBar() {
    this.hpBar.clear();
    const ratio = Math.max(0, this.currentHp / this.maxHp);
    const w = 32;
    const h = 3;
    this.hpBar.fillStyle(0x000000, 0.5);
    this.hpBar.fillRect(-w / 2, -24, w, h);
    this.hpBar.fillStyle(ratio > 0.5 ? 0x22c55e : ratio > 0.25 ? 0xeab308 : 0xef4444, 1);
    this.hpBar.fillRect(-w / 2, -24, w * ratio, h);
  }

  takeDamage(amount: number): boolean {
    this.currentHp -= amount;
    this.drawHpBar();

    // ダメージフラッシュ
    this.scene.tweens.add({
      targets: this.damageFlash,
      alpha: 0.6,
      duration: 100,
      yoyo: true,
      ease: 'Power1',
    });

    if (this.currentHp <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  heal(amount: number) {
    this.currentHp = Math.min(this.maxHp, this.currentHp + amount);
    this.drawHpBar();
  }
}
