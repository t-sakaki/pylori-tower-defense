import * as Phaser from 'phaser';
import i18n from '@/lib/i18n';

export class MenuScene extends Phaser.Scene {
  private titleText?: Phaser.GameObjects.Text;
  private subtitleText?: Phaser.GameObjects.Text;
  private btnText?: Phaser.GameObjects.Text;
  private tagline1Text?: Phaser.GameObjects.Text;
  private tagline2Text?: Phaser.GameObjects.Text;

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
    this.titleText = this.add.text(width / 2, height * 0.25, '', {
      fontSize: '48px',
      color: '#fb7185',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.subtitleText = this.add.text(width / 2, height * 0.35, '', {
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

    this.btnText = this.add.text(width / 2, btnY + btnH / 2, '', {
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
    this.tagline1Text = this.add.text(width / 2, height * 0.75, '', {
      fontSize: '16px',
      color: '#aaaaaa',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    this.tagline2Text = this.add.text(width / 2, height * 0.82, '', {
      fontSize: '14px',
      color: '#888888',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5);

    // 初期テキスト反映
    this.refreshTexts();

    // 言語切替イベントを購読
    this.refreshHandler = () => this.refreshTexts();
    i18n.on('languageChanged', this.refreshHandler);

    // シーン終了時にリスナーを解除（メモリリーク防止）
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      if (this.refreshHandler) {
        i18n.off('languageChanged', this.refreshHandler);
        this.refreshHandler = undefined;
      }
    });
  }

  private refreshHandler?: () => void;

  private refreshTexts() {
    if (!this.titleText || !this.subtitleText || !this.btnText || !this.tagline1Text || !this.tagline2Text) {
      return;
    }
    this.titleText.setText(i18n.t('common:menu.title'));
    this.subtitleText.setText(i18n.t('common:menu.subtitle'));
    this.btnText.setText(i18n.t('common:menu.startButton'));
    this.tagline1Text.setText(i18n.t('common:menu.tagline1'));
    this.tagline2Text.setText(i18n.t('common:menu.tagline2'));
  }
}
