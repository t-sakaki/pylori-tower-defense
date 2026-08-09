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

    // タイトル
    this.add.text(width / 2, height * 0.2, '📜 服薬誓約書', {
      fontSize: '32px',
      color: '#ffd700',
      fontStyle: 'bold',
      fontFamily: 'serif',
    }).setOrigin(0.5).setDepth(10);

    // 本文
    const text = `私、ガストロ・コマンダーは、
7日間の除菌作戦を完遂し、
決して薬を飲み忘れないことを
ここに誓います。`;
    this.add.text(width / 2, height * 0.45, text, {
      fontSize: '22px',
      color: '#fefae0',
      fontFamily: 'serif',
      align: 'center',
      lineSpacing: 12,
    }).setOrigin(0.5).setDepth(10);

    // 署名エリア
    const sigY = height * 0.65;
    this.add.rectangle(width / 2, sigY, 300, 2, 0xffffff, 1).setDepth(10);
    const sigText = this.add.text(width / 2, sigY + 30, '＿＿＿＿＿＿＿＿＿＿＿＿＿＿＿', {
      fontSize: '16px',
      color: '#aaaaaa',
    }).setOrigin(0.5).setDepth(10);

    const signArea = this.add.rectangle(width / 2, sigY, 320, 60, 0x000000, 0)
      .setInteractive({ useHandCursor: true })
      .setDepth(11);

    let signed = false;
    signArea.on('pointerdown', () => {
      signed = true;
      sigText.setText('✍️ 署名完了').setColor('#00ff00');
      this.btnStart.setAlpha(1).setInteractive();
    });

    // ボタン: 胃の平和のために
    const btnW = 260;
    const btnH = 60;
    const btnY = height * 0.85;
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
}
