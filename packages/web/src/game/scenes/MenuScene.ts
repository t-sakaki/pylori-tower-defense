import * as Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    const { width, height } = this.scale;

    // 背景グラデーション風
    const graphics = this.add.graphics();
    graphics.fillGradientStyle(0x1a0505, 0x1a0505, 0x3a1010, 0x3a1010, 1);
    graphics.fillRect(0, 0, width, height);

    // タイトル
    this.add.text(width / 2, height * 0.25, 'ピロリ菌除菌', {
      fontSize: '48px',
      color: '#fb7185',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.35, 'タワーディフェンス', {
      fontSize: '32px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // 開始ボタン
    const btnW = 280;
    const btnH = 60;
    const btnX = width / 2 - btnW / 2;
    const btnY = height * 0.55;

    const btnBg = this.add.rectangle(width / 2, btnY + btnH / 2, btnW, btnH, 0x881337)
      .setInteractive({ useHandCursor: true });

    const btnText = this.add.text(width / 2, btnY + btnH / 2, 'DAY 1 作戦開始', {
      fontSize: '24px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    btnBg.on('pointerover', () => btnBg.setFillStyle(0xbe123c));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x881337));
    btnBg.on('pointerdown', () => {
      this.scene.start('GameScene', { day: 1 });
    });

    // 説明文
    this.add.text(width / 2, height * 0.75, '胃粘膜を防衛線に、ピロリ菌から胃を守れ！', {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.82, '7日間の服薬を完遂し、除菌を目指せ', {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
  }
}