import Phaser from 'phaser';

export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  public create(): void {
    // Stop any active sounds (safeguard)
    this.sound.stopAll();

    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    // Background colour
    this.cameras.main.setBackgroundColor('#0c0a0f');

    // Title text
    const title = this.add.text(width / 2, height / 3, 'Z-SOLDIER', {
      font: '42px "Press Start 2P"',
      color: '#3bf1a9'
    });
    title.setOrigin(0.5);
    title.setShadow(4, 4, '#aa3bff', 0, true, true);

    // Blinking prompt
    const startPrompt = this.add.text(width / 2, height / 2 + 10, 'CLICK TO START MISSION', {
      font: '14px "Press Start 2P"',
      color: '#e5e4e7'
    });
    startPrompt.setOrigin(0.5);

    // Blinking tween
    this.tweens.add({
      targets: startPrompt,
      alpha: 0,
      duration: 800,
      ease: 'Linear',
      yoyo: true,
      repeat: -1
    });

    // Control instructions text
    this.add.text(width / 2, height - 80, 'CONTROLS: WASD to Move | Mouse to Aim & Shoot', {
      font: '10px "Press Start 2P"',
      color: '#8b80a5'
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 55, 'WEAPONS: 1 - Pistol | 2 - Shotgun | 3 - Machine Gun', {
      font: '10px "Press Start 2P"',
      color: '#8b80a5'
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 30, 'Press R to reload manually', {
      font: '10px "Press Start 2P"',
      color: '#8b80a5'
    }).setOrigin(0.5);

    // Dynamic decorative elements: scroll zombies in menu background
    this.createMenuZombies(width, height);

    // Click to start listener
    this.input.once('pointerdown', () => {
      this.cameras.main.fade(500, 12, 10, 15, false, (_camera: any, progress: number) => {
        if (progress === 1) {
          this.scene.start('PlayScene');
        }
      });
    });
  }

  private createMenuZombies(width: number, height: number): void {
    const types: ('normal' | 'fast' | 'tank')[] = ['normal', 'fast', 'tank'];
    
    // Spawn 5 zombies walking left to right in the background (no physics needed, just tweens)
    for (let i = 0; i < 5; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const y = height - 120 - Math.random() * 30;
      const startX = -50 - Math.random() * 200;
      
      const zombie = this.add.sprite(startX, y, `zombie_${type}`, '0');
      zombie.setScale(type === 'tank' ? 1.5 : 2);
      zombie.setAlpha(0.35); // semi-transparent background
      zombie.play(`zombie-${type}-walk`);

      this.tweens.add({
        targets: zombie,
        x: width + 100,
        duration: 10000 + Math.random() * 10000,
        repeat: -1,
        delay: Math.random() * 5000,
        onRepeat: () => {
          zombie.x = -50;
        }
      });
    }
  }
}
