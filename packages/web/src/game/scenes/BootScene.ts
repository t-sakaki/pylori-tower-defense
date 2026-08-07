import Phaser from 'phaser';
import i18n from '@/lib/i18n';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const { width, height } = this.scale;

    // ローディング表示
    const loadingText = this.add.text(width / 2, height / 2, i18n.t('common:boot.connecting'), {
      fontSize: '24px',
      color: '#fb7185',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    const progressBar = this.add.rectangle(width / 2, height / 2 + 40, 0, 8, 0xfb7185).setOrigin(0, 0.5);
    const progressBg = this.add.rectangle(width / 2, height / 2 + 40, 300, 8, 0x333333).setOrigin(0.5);
    progressBar.setOrigin(0, 0.5);
    progressBar.x = width / 2 - 150;

    this.load.on('progress', (value: number) => {
      progressBar.width = 300 * value;
    });

    this.load.on('complete', () => {
      loadingText.destroy();
      progressBar.destroy();
      progressBg.destroy();
    });

    // === アセット読み込み ===
    // 画像アセット（Gemini生成画像を採用）
    this.load.image('bg-battlefield', '/assets/bg/stomach-battlefield.jpg');
    this.load.image('bg-lining', '/assets/bg/stomach-lining.jpg');
    this.load.image('enemy-real', '/assets/enemies/h-pylori-real.png');

    // 読み込みエラーを無視（ファイルがなくても続行）
    this.load.on('loaderror', () => {
      // 無視：GameSceneでGraphicsフォールバック
    });
  }

  create() {
    this.scene.start('MenuScene');
  }
}
