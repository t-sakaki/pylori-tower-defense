import * as Phaser from 'phaser';
import i18n from '@/lib/i18n';

export class OathScene extends Phaser.Scene {
  private btnStart!: Phaser.GameObjects.Rectangle;

  constructor() {
    super({ key: 'OathScene' });
  }

  create() {
    const { width, height } = this.scale;

    // 背景: 羊皮紙風
    this.add.rectangle(width / 2, height / 2, width, height, 0x2a1f1f).setDepth(-20);
    const border = this.add.rectangle(width / 2, height / 2, width * 0.8, height * 0.7, 0x3d2b2b)
      .setStrokeStyle(6, 0xffd700)
      .setDepth(1);

    // --- Atmospheric Dust Particles ---
    this.createDustParticles(width, height);

    // タイトル
    this.add.text(width / 2, height * 0.2, '📜 服薬誓約書', {
      fontSize: '32px',
      color: '#ffd700',
      fontStyle: 'bold',
      fontFamily: 'serif',
    }).setOrigin(0.5).setDepth(10);

    // 本文
    const text = `私、ガストロ・コマンダーは、\n7日間の除菌作戦を完遂し、\n決して薬を飲み忘れないことを\nここに誓います。`;
    this.add.text(width / 2, height * 0.4, text, {
      fontSize: '22px',
      color: '#fefae0',
      fontFamily: 'serif',
      align: 'center',
      lineSpacing: 12,
    }).setOrigin(0.5).setDepth(10);

    // 署名エリア
    const sigY = height * 0.6;
    const sigLine = this.add.rectangle(width / 2, sigY, 300, 2, 0xffffff, 1).setDepth(10);
    const sigText = this.add.text(width / 2, sigY + 30, '＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿', {
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(10);

    const signArea = this.add.rectangle(width / 2, sigY, 320, 60, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(11);

    let signed = false;
    signArea.on('pointerdown', () => {
      if (signed) return;
      signed = true;
      sigText.setText('✍️ 署名完了').setColor('#00ff00');
      this.btnStart.setAlpha(1).setInteractive();
      
      // --- Signature Glow Effect ---
      this.triggerSignatureGlow(sigLine);
    });

    // ボタン: 胃の平和のために
    const btnW = 260;
    const btnH = 60;
    const btnY = height * 0.82;
    const btnBg = this.add.rectangle(width / 2, btnY, btnW, btnH, 0x881337, 0.5)
      .setDepth(100);
    
    this.btnStart = btnBg;
    btnBg.setAlpha(0.5).setInteractive({ useHandCursor: true });
    btnBg.setInteractive(false);
    
    this.add.text(width / 2, btnY, '胃の平和のために', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(100);

    btnBg.on('pointerdown', () => this.scene.start('MenuScene'));
  }

  private createDustParticles(width: number, height: number) {
    const particleCount = 40;
    for (let i = 0; i < particleCount; i++) {
      const x = Phaser.Math.Between(0, width);
      const y = Phaser.Math.Between(0, height);
      const size = Phaser.Math.Between(1, 3);
      const alpha = Phaser.Math.FloatBetween(0.1, 0.4);
      const speed = Phaser.Math.FloatBetween(0.2, 0.6);

      const particle = this.add.circle(x, y, size, 0xffffff, alpha).setDepth(-10);

      this.tweens.add({
        targets: particle,
        y: y - Phaser.Math.Between(100, 300),
        x: x + Phaser.Math.Between(-20, 20),
        alpha: 0,
        duration: Phaser.Math.Between(4000, 8000),
        repeat: -1,
        delay: Phaser.Math.Between(0, 4000),
        onComplete: () => {
          particle.setPosition(Phaser.Math.Between(0, width), height + 10);
          particle.setAlpha(alpha);
        }
      });
    }
  }

  private triggerSignatureGlow(line: Phaser.GameObjects.Rectangle) {
    // Golden glow overlay
    const glow = this.add.rectangle(line.x, line.y, line.width, line.height, 0xffd700, 0)
      .setDepth(line.depth + 1);

    this.tweens.add({
      targets: glow,
      alpha: 0.8,
      scale: 1.2,
      duration: 300,
      yoyo: true,
      repeat: 2,
      onComplete: () => {
        this.tweens.add({
          targets: glow,
          alpha: 0,
          duration: 500,
          onComplete: () => glow.destroy()
        });
      }
    });

    // Flash the main line to gold
    this.tweens.add({
      targets: line,
      fillColor: 0xffd700,
      duration: 300,
      yoyo: true,
      repeat: 2
    });
  }
}
