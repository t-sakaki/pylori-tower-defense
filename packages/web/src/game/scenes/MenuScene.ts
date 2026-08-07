import * as Phaser from 'phaser';
import i18n from '@/lib/i18n';

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
    this.add.text(width / 2, height * 0.25, i18n.t('common:menu.title'), {
      fontSize: '48px',
      color: '#fb7185',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.35, i18n.t('common:menu.subtitle'), {
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

    const btnText = this.add.text(width / 2, btnY + btnH / 2, i18n.t('common:menu.startButton'), {
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
    this.add.text(width / 2, height * 0.75, i18n.t('common:menu.tagline1'), {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.82, i18n.t('common:menu.tagline2'), {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);
  }
}
