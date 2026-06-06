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

    // Preload Bullet asset
    this.load.image('bullet', 'assets/characters/Soldier/Bullet.png');

    // Preload Soldier assets
    for (let i = 0; i < 10; i++) {
      this.load.image(`player-idle-${i}`, `assets/characters/Soldier/Idle/E_E_Gun__Idle_00${i}.png`);
      this.load.image(`player-walk-${i}`, `assets/characters/Soldier/Run/E_E_Gun__Run_000_00${i}.png`);
      this.load.image(`player-shot-${i}`, `assets/characters/Soldier/Shot/E_E_Gun__Attack_00${i}.png`);
      this.load.image(`player-hurt-${i}`, `assets/characters/Soldier/Hurt/E_E_Gun__Hurt_00${i}.png`);
      this.load.image(`player-die-${i}`, `assets/characters/Soldier/Die/E_E__Die_00${i}.png`);
    }

    // Preload Zombie assets
    for (let i = 0; i < 12; i++) {
      const paddedStr = i < 10 ? `0${i}` : `${i}`;
      this.load.image(`zombie-idle-${i}`, `assets/enemies/Zombie/Idle/__Zombie01_Idle_0${paddedStr}.png`);
      this.load.image(`zombie-attack-${i}`, `assets/enemies/Zombie/Attack/__Zombie01_Attack_0${paddedStr}.png`);
    }
    for (let i = 0; i < 8; i++) {
      this.load.image(`zombie-walk-${i}`, `assets/enemies/Zombie/Walk/__Zombie01_Walk_00${i}.png`);
      this.load.image(`zombie-hurt-${i}`, `assets/enemies/Zombie/Hurt/__Zombie01_Hurt_00${i}.png`);
      this.load.image(`zombie-die-${i}`, `assets/enemies/Zombie/Die/__Zombie01_Die_00${i}.png`);
    }

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
      frames: Array.from({ length: 10 }, (_, i) => ({ key: `player-idle-${i}` })),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: 'player-walk',
      frames: Array.from({ length: 10 }, (_, i) => ({ key: `player-walk-${i}` })),
      frameRate: 12,
      repeat: -1
    });

    this.anims.create({
      key: 'player-shot',
      frames: Array.from({ length: 10 }, (_, i) => ({ key: `player-shot-${i}` })),
      frameRate: 20,
      repeat: 0
    });

    this.anims.create({
      key: 'player-hurt',
      frames: Array.from({ length: 10 }, (_, i) => ({ key: `player-hurt-${i}` })),
      frameRate: 15,
      repeat: 0
    });

    this.anims.create({
      key: 'player-die',
      frames: Array.from({ length: 10 }, (_, i) => ({ key: `player-die-${i}` })),
      frameRate: 10,
      repeat: 0
    });

    // Keep dummy player-jump just in case
    this.anims.create({
      key: 'player-jump',
      frames: [{ key: 'player-idle-0' }],
      frameRate: 1
    });

    // 2. Zombie Animations (Normal, Fast, Tank)
    const zombieTypes = ['normal', 'fast', 'tank'] as const;
    const rates = {
      normal: { idle: 10, walk: 10, attack: 12, hurt: 15, die: 10 },
      fast: { idle: 15, walk: 15, attack: 18, hurt: 20, die: 15 },
      tank: { idle: 6, walk: 6, attack: 8, hurt: 10, die: 8 }
    };

    zombieTypes.forEach(type => {
      const rate = rates[type];

      this.anims.create({
        key: `zombie-${type}-idle`,
        frames: Array.from({ length: 12 }, (_, i) => ({ key: `zombie-idle-${i}` })),
        frameRate: rate.idle,
        repeat: -1
      });

      this.anims.create({
        key: `zombie-${type}-walk`,
        frames: Array.from({ length: 8 }, (_, i) => ({ key: `zombie-walk-${i}` })),
        frameRate: rate.walk,
        repeat: -1
      });

      this.anims.create({
        key: `zombie-${type}-attack`,
        frames: Array.from({ length: 12 }, (_, i) => ({ key: `zombie-attack-${i}` })),
        frameRate: rate.attack,
        repeat: 0
      });

      this.anims.create({
        key: `zombie-${type}-hurt`,
        frames: Array.from({ length: 8 }, (_, i) => ({ key: `zombie-hurt-${i}` })),
        frameRate: rate.hurt,
        repeat: 0
      });

      this.anims.create({
        key: `zombie-${type}-die`,
        frames: Array.from({ length: 8 }, (_, i) => ({ key: `zombie-die-${i}` })),
        frameRate: rate.die,
        repeat: 0
      });
    });

    // 3. Boss Animations (keep original canvas textures)
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
