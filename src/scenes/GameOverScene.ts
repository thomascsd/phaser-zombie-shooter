import Phaser from 'phaser';

export interface GameOverData {
  isVictory: boolean;
  score: number;
  kills: number;
  level: number;
}

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  public create(data: GameOverData): void {
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background color
    this.cameras.main.setBackgroundColor('#0c0a0f');

    const titleColor = data.isVictory ? '#3bf1a9' : '#ff3b3b';
    const titleText = data.isVictory ? 'MISSION ACCOMPLISHED' : 'SOLDIER DEFEATED';
    const shadowColor = data.isVictory ? '#aa3bff' : '#5e1212';

    // 1. Result Title
    const title = this.add.text(width / 2, height / 4, titleText, {
      font: '24px "Press Start 2P"',
      color: titleColor
    });
    title.setOrigin(0.5);
    title.setShadow(3, 3, shadowColor, 0, true, true);

    // 2. Stats Panel
    const panelY = height / 2 - 10;
    
    this.add.text(width / 2, panelY - 40, `TOTAL SCORE: ${data.score}`, {
      font: '12px "Press Start 2P"',
      color: '#e5e4e7'
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY - 10, `ZOMBIES KILLED: ${data.kills}`, {
      font: '12px "Press Start 2P"',
      color: '#e5e4e7'
    }).setOrigin(0.5);

    this.add.text(width / 2, panelY + 20, `STAGE REACHED: ${data.level}/5`, {
      font: '12px "Press Start 2P"',
      color: '#e5e4e7'
    }).setOrigin(0.5);

    // 3. Prompt
    const restartPrompt = this.add.text(width / 2, height / 2 + 90, 'CLICK TO RESTART MISSION', {
      font: '10px "Press Start 2P"',
      color: '#8b80a5'
    });
    restartPrompt.setOrigin(0.5);

    // Blinking
    this.tweens.add({
      targets: restartPrompt,
      alpha: 0,
      duration: 800,
      ease: 'Linear',
      yoyo: true,
      repeat: -1
    });

    // 4. Click Listener
    this.input.once('pointerdown', () => {
      this.cameras.main.fade(500, 12, 10, 15, false, (_camera: any, progress: number) => {
        if (progress === 1) {
          this.scene.start('PlayScene');
        }
      });
    });
  }
}
