import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    const { width, height } = this.scale;

    // ローディング表示
    const loadingText = this.add.text(width / 2, height / 2, '胃袋要塞へ接続中...', {
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
    // 画像があれば使い、なければGraphicsで描画（GameScene側で対応）

    // 敵画像
    this.load.image('enemy-scout', '/assets/enemies/h-pylori.png');

    // 背景
    this.load.image('bg-stomach', '/assets/bg/stomach-lining.png');

    // タワー画像
    this.load.image('tower-antibiotic', '/assets/towers/antibiotic-pill.png');

    // 読み込みエラーを無視（ファイルがなくても続行）
    this.load.on('loaderror', () => {
      // 無視：GameSceneでGraphicsフォールバック
    });
  }

  create() {
    this.scene.start('MenuScene');
  }
}
