import * as Phaser from 'phaser';
import i18n from '@/lib/i18n';

export class DiagnosisScene extends Phaser.Scene {
  constructor() {
    super({ key: 'DiagnosisScene' });
  }

  create() {
    const { width, height } = this.scale;

    // 背景: 医療モニター風の暗い背景
    this.add.rectangle(width / 2, height / 2, width, height, 0x0a0a0a).setDepth(-20);

    // 上部タイトル: 赤いLED風
    const title = this.add.text(width / 2, 40, '🔴 生体モニタ - 胃カメラ診断', {
      fontSize: '24px',
      color: '#ff0000',
      fontStyle: 'bold',
      fontFamily: 'monospace',
    }).setOrigin(0.5).setDepth(10);

    // 中央: 診断写真風の画像（bg-battlefield）
    if (this.textures.exists('bg-battlefield')) {
      const diagImg = this.add.image(width / 2, height / 2 - 40, 'bg-battlefield');
      diagImg.setDisplaySize(width * 0.8, height * 0.5);
      diagImg.setAlpha(0.6);
      diagImg.setDepth(0);
    }

    // 診断テキスト表示エリア
    const textY = height * 0.75;
    const mainText = this.add.text(width / 2, textY, '', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      align: 'center',
    }).setOrigin(0.5).setDepth(10);

    // タイプライター風メッセージシーケンス
    const messages = [
      { text: '胃カメラ診断を実施中...', color: '#ffffff', duration: 2000, delay: 0 },
      { text: '診断結果：ピロリ菌 陽性', color: '#ff0000', duration: 2000, delay: 500 },
      { text: 'リスク評価：胃炎 → 胃潰瘍 → 胃がん', color: '#fbbf24', duration: 2000, delay: 500 },
      { text: '緊急作戦が必要です', color: '#ff0000', duration: 2000, delay: 500, blink: true },
    ];

    let currentDelay = 0;
    messages.forEach((msg, index) => {
      this.time.delayedCall(currentDelay, () => {
        mainText.setText(msg.text);
        mainText.setColor(msg.color);
        
        if (msg.blink) {
          this.tweens.add({
            targets: mainText,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1
          });
        }

        if (index < messages.length - 1) {
          this.time.delayedCall(msg.duration, () => {});
        }
      });
      currentDelay += msg.duration + msg.delay;
    });

    // 下部ボタン: 作戦会議へ
    const btnW = 240;
    const btnH = 60;
    const btnY = height * 0.8;
    const btnBg = this.add.rectangle(width / 2, btnY, btnW, btnH, 0xaa0000)
      .setInteractive({ useHandCursor: true })
      .setDepth(10);

    this.add.text(width / 2, btnY, '作戦会議へ', {
      fontSize: '22px',
      color: '#ffffff',
      fontFamily: 'sans-serif',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(11);

    btnBg.on('pointerdown', () => this.scene.start('BriefingScene'));

    // 心電図風ラインのアニメーション
    const lineGraphics = this.add.graphics();
    lineGraphics.setDepth(-10);
    
    this.time.addEvent({
      delay: 16,
      callback: () => {
        lineGraphics.clear();
        lineGraphics.lineStyle(2, 0x00ff00);
        const time = this.time.now / 1000;
        this.add.graphics(); // ダミー
        
        // シンプルなサイン波+ノイズで心電図風に
        lineGraphics.beginPath();
        for (let x = 0; x < width; x += 10) {
          const y = height - 20 + Math.sin(x * 0.05 + time * 5) * 5 + (Math.random() * 2);
          if (x === 0) lineGraphics.moveTo(x, y);
          else lineGraphics.lineTo(x, y);
        }
        lineGraphics.strokePath();
      },
      loop: true
    });
  }
}
