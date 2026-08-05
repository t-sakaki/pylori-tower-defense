import * as Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // ハッカソンMVPでは画像アセットなし
    // 全てGraphicsで描画
    // 必要に応じてここでjsonやaudioを読み込む

    const { width, height } = this.scale;
    const loadingText = this.add.text(width / 2, height / 2, '胃袋要塞へ接続中...', {
      fontSize: '24px',
      color: '#fb7185',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.load.on('complete', () => {
      loadingText.destroy();
    });
  }

  create() {
    this.scene.start('MenuScene');
  }
}