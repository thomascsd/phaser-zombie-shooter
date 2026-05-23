import Phaser from 'phaser';
import { AssetGenerator } from '../utils/AssetGenerator.ts';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  public preload(): void {
    // Show a loading text HUD
    const width = this.cameras.main.width;
    const height = this.cameras.main.height;

    const loadingText = this.make.text({
      x: width / 2,
      y: height / 2 - 20,
      text: 'GENERATING RENDER TILES...',
      style: {
        font: '16px "Press Start 2P"',
        color: '#3bf1a9'
      }
    });
    loadingText.setOrigin(0, 0); // Need to setOrigin properly, wait, setOrigin(0.5) is better
    loadingText.setOrigin(0.5, 0.5);

    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x1a1625, 0.8);
    progressBox.fillRect(width / 2 - 160, height / 2 + 10, 320, 20);

    // Mock asset preloader paths as requested
    this.load.image('preload_player_placeholder', 'assets/player.png');
    this.load.image('preload_zombie_placeholder', 'assets/zombie.png');

    // Simulate standard progress indicator
    this.load.on('progress', (value: number) => {
      progressBar.clear();
      progressBar.fillStyle(0xaa3bff, 1);
      progressBar.fillRect(width / 2 - 155, height / 2 + 15, 310 * value, 10);
    });

    this.load.on('complete', () => {
      // Dynamic generation happens here
      AssetGenerator.generateAll(this);
      this.createAnimations();

      loadingText.destroy();
      progressBar.destroy();
      progressBox.destroy();

      // Go to main menu scene
      this.scene.start('MenuScene');
    });
  }

  private createAnimations(): void {
    // 1. Player Animations
    this.anims.create({
      key: 'player-idle',
      frames: [{ key: 'player', frame: '0' }],
      frameRate: 1
    });

    this.anims.create({
      key: 'player-walk',
      frames: [
        { key: 'player', frame: '1' },
        { key: 'player', frame: '0' },
        { key: 'player', frame: '2' },
        { key: 'player', frame: '0' }
      ],
      frameRate: 8,
      repeat: -1
    });

    this.anims.create({
      key: 'player-jump',
      frames: [{ key: 'player', frame: '3' }],
      frameRate: 1
    });

    // 2. Zombie Animations
    this.anims.create({
      key: 'zombie-normal-walk',
      frames: [
        { key: 'zombie_normal', frame: '0' },
        { key: 'zombie_normal', frame: '1' },
        { key: 'zombie_normal', frame: '0' },
        { key: 'zombie_normal', frame: '2' }
      ],
      frameRate: 6,
      repeat: -1
    });

    this.anims.create({
      key: 'zombie-fast-walk',
      frames: [
        { key: 'zombie_fast', frame: '0' },
        { key: 'zombie_fast', frame: '1' },
        { key: 'zombie_fast', frame: '0' },
        { key: 'zombie_fast', frame: '2' }
      ],
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'zombie-tank-walk',
      frames: [
        { key: 'zombie_tank', frame: '0' },
        { key: 'zombie_tank', frame: '1' },
        { key: 'zombie_tank', frame: '0' },
        { key: 'zombie_tank', frame: '2' }
      ],
      frameRate: 4,
      repeat: -1
    });

    // 3. Boss Animations
    this.anims.create({
      key: 'boss-mid-walk',
      frames: [
        { key: 'mid_boss', frame: '0' },
        { key: 'mid_boss', frame: '1' },
        { key: 'mid_boss', frame: '0' },
        { key: 'mid_boss', frame: '2' }
      ],
      frameRate: 6,
      repeat: -1
    });

    this.anims.create({
      key: 'boss-final-walk',
      frames: [
        { key: 'final_boss', frame: '0' },
        { key: 'final_boss', frame: '1' },
        { key: 'final_boss', frame: '0' },
        { key: 'final_boss', frame: '2' }
      ],
      frameRate: 4,
      repeat: -1
    });
  }
}
