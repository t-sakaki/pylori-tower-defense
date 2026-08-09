import * as Phaser from 'phaser';
import i18n from '@/lib/i18n';

export class BriefingScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BriefingScene' });
  }

  create() {
    const { width, height } = this.scale;

    // 背景: 軍事作戦会議風（暗い青緑）
    this.add.rectangle(width / 2, height / 2, width, height, 0x0f2027).setDepth(-20);

    // タイトル
    this.add.text(width / 2, 50, '🛡️ 胃袋要塞司令部 作戦指令書', {
      fontSize: '32px',
      color: '#fbbf24',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
    }).setOrigin(0.5).setDepth(10);

    // 左側: 敵情報パネル
    const leftPanelW = width * 0.4;
    const leftPanelH = height * 0.6;
    const leftPanelX = width * 0.25;
    this.add.rectangle(leftPanelX, height / 2, leftPanelW, leftPanelH, 0x1e293b, 0.8).setDepth(0);
    
    const leftTextX = leftPanelX - leftPanelW / 2 + 20;
    this.add.text(leftTextX, height * 0.3, '【敵情報】', {
      fontSize: '24px',
      color: '#ff4444',
      fontStyle: 'bold',
    }).setDepth(10);

    this.add.text(leftTextX, height * 0.4, `敵：Helicobacter pylori\n推定数：約1億個体\n武器：ウレアーゼ / CagA / VacA`, {
      fontSize: '18px',
      color: '#ffffff',
      align: 'left',
      wordWrap: { width: leftPanelW - 40 },
    }).setDepth(10);

    // Pylori Bacterium Effect
    const pylori = this.add.image(leftPanelX + leftPanelW / 2 - 40, height / 2, 'enemy-real').setDepth(5);
    pylori.setScale(0.2); // Adjust scale as needed for the image size

    // Animation state
    const animState = {
      startTime: this.time.now,
      vibrationTimer: 0,
    };

    this.events.on('update', () => {
      const time = (this.time.now - animState.startTime) / 1000;
      
      // 1. Floating Effect
      // Y-axis: Sine wave +/- 10px, 3s period
      const offsetY = Math.sin(time * (2 * Math.PI / 3)) * 10;
      // X-axis: Sine wave +/- 5px, 4s period
      const offsetX = Math.sin(time * (2 * Math.PI / 4)) * 5;
      // Rotation: Slight oscillation +/- 5 degrees
      const rotation = Math.sin(time * (2 * Math.PI / 2)) * Phaser.Math.DegToRad(5);

      // 2. Micro-vibration effect
      let vibX = 0;
      let vibY = 0;
      
      animState.vibrationTimer -= 16.67; // approx 60fps
      if (animState.vibrationTimer <= 0) {
        // Occurs every 2-5s
        animState.vibrationTimer = 2000 + Math.random() * 3000;
        
        // Apply a very fast shake for a short duration
        this.tweens.add({
          targets: pylori,
          x: pylori.x + (Math.random() - 0.5) * 2,
          y: pylori.y + (Math.random() - 0.5) * 2,
          duration: 50,
          yoyo: true,
          repeat: 3,
          onComplete: () => {
            // Return to base position managed by the update loop
          }
        });
      }

      pylori.setPosition(
        (leftPanelX + leftPanelW / 2 - 40) + offsetX + vibX,
        (height / 2) + offsetY + vibY
      );
      pylori.setRotation(rotation);
    });

    // 右側: 味方戦力パネル
    const rightPanelW = width * 0.4;
    const rightPanelH = height * 0.6;
    const rightPanelX = width * 0.75;
    this.add.rectangle(rightPanelX, height / 2, rightPanelW, rightPanelH, 0x1e293b, 0.8).setDepth(0);
    
    const rightTextX = rightPanelX - rightPanelW / 2 + 20;
    this.add.text(rightTextX, height * 0.3, '【味方戦力】', {
      fontSize: '24px',
      color: '#44ff44',
      fontStyle: 'bold',
    }).setDepth(10);

    this.add.text(rightTextX, height * 0.4, `第1部隊：胃酸キャノン(PPI)\n第2部隊：アモキシシリン\n第3部隊：クラリスロマイシン`, {
      fontSize: '18px',
      color: '#ffffff',
      align: 'left',
      wordWrap: { width: rightPanelW - 40 },
    }).setDepth(10);

    // 中央下部: 警告パネル
    const warnW = width * 0.6;
    const warnH = 100;
    const warnY = height * 0.65;
    this.add.rectangle(width / 2, warnY, warnW, warnH, 0x330000).setStrokeStyle(4, 0xff0000).setDepth(5);
    this.add.text(width / 2, warnY - 10, '⚠️ 作戦期間：7日間', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(10);
    this.add.text(width / 2, warnY + 20, '途中撤退は敵の進化（耐性化）を招きます', {
      fontSize: '18px',
      color: '#ffcccc',
    }).setOrigin(0.5).setDepth(10);

    // ボタン: 服薬誓約へ
    const btnW = 240;
    const btnH = 60;
    const btnY = height * 0.82;
    const btnBg = this.add.rectangle(width / 2, btnY, btnW, btnH, 0x1e293b)
      .setInteractive({ useHandCursor: true })
      .setDepth(20);

    this.add.text(width / 2, btnY, '服薬誓約へ', {
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(21);

    btnBg.on('pointerdown', () => this.scene.start('OathScene'));
  }
}
