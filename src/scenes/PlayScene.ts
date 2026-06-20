import Phaser from 'phaser';
import { Player, type Weapon } from '../entities/Player.ts';
import { Zombie } from '../entities/Zombie.ts';
import { Boss } from '../entities/Boss.ts';
import { Bullet, BossBullet } from '../entities/Bullet.ts';
import { LevelManager } from '../utils/LevelManager.ts';
import { DevConfig } from '../config.ts';

export class PlayScene extends Phaser.Scene {
  // Game Entities
  public player!: Player;
  public zombies!: Phaser.Physics.Arcade.Group;
  public bullets!: Phaser.Physics.Arcade.Group;
  public bossBullets!: Phaser.Physics.Arcade.Group;
  public activeBoss: Boss | null = null;

  // Environment
  private platforms!: Phaser.Physics.Arcade.StaticGroup;
  private crosshair!: Phaser.GameObjects.Sprite;

  // Managers
  private levelManager!: LevelManager;
  private spawnTimerEvent: Phaser.Time.TimerEvent | null = null;

  // HUD elements (ScrollFactor = 0)
  private hudHealthBar!: Phaser.GameObjects.Graphics;
  private hudHealthText!: Phaser.GameObjects.Text;
  private hudWeaponIconBg!: Phaser.GameObjects.Graphics;
  private hudWeaponText!: Phaser.GameObjects.Text;
  private hudAmmoText!: Phaser.GameObjects.Text;
  private hudReloadBar!: Phaser.GameObjects.Graphics;
  private hudLevelText!: Phaser.GameObjects.Text;
  private hudKillsText!: Phaser.GameObjects.Text;
  private hudProgressText!: Phaser.GameObjects.Text;

  // Boss HUD elements
  private hudBossContainer!: Phaser.GameObjects.Container;
  private hudBossBar!: Phaser.GameObjects.Graphics;
  private hudBossNameText!: Phaser.GameObjects.Text;

  // Alerts
  private overlayAlertText!: Phaser.GameObjects.Text;

  // Music
  private backgroundMusic!: Phaser.Sound.BaseSound;

  constructor() {
    super('PlayScene');
  }

  public create(data?: { startLevel?: number }): void {
    // 1. Reset managers
    this.levelManager = new LevelManager();
    this.levelManager.reset();
    if (data && typeof data.startLevel === 'number') {
      this.levelManager.setLevel(data.startLevel);
    }
    this.activeBoss = null;

    // 2. Set physics bounds
    // World is 1600px wide, 1200px high (top-down arena)
    this.physics.world.setBounds(0, 0, 1600, 1200);

    // 3. Create level map / platforms
    this.createWorldLayout();

    // 4. Create Player
    // Spawn player at center of arena (x=800, y=600)
    this.player = new Player(this, 800, 600);

    // 5. Physics Groups
    this.bullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 60,
      runChildUpdate: true
    });

    this.bossBullets = this.physics.add.group({
      classType: BossBullet,
      maxSize: 80,
      runChildUpdate: true
    });

    this.zombies = this.physics.add.group({
      classType: Zombie,
      runChildUpdate: true
    });

    // 6. Physics Colliders
    // Player and ground
    this.physics.add.collider(this.player, this.platforms);
    // Zombies and ground
    this.physics.add.collider(this.zombies, this.platforms);
    // Boss and ground
    this.physics.add.collider(this.zombies, this.platforms); // standard check, wait: boss collider added dynamically in spawn

    // Bullet hit Zombie collider
    this.physics.add.overlap(this.bullets, this.zombies, this.handleBulletHitZombie, undefined, this);

    // Zombie hit Player collider
    this.physics.add.overlap(this.player, this.zombies, this.handleZombieHitPlayer, undefined, this);

    // Boss Bullet hit Player collider
    this.physics.add.overlap(this.player, this.bossBullets, this.handleBossBulletHitPlayer, undefined, this);

    // 7. Camera settings
    this.cameras.main.setBounds(0, 0, 1600, 1200);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setBackgroundColor('#110e1b'); // Dark neon tint

    // 8. Custom Crosshair
    this.crosshair = this.add.sprite(this.input.x, this.input.y, 'ui_crosshair');
    this.crosshair.setDepth(100);

    // 9. Init HUD & Listeners
    this.createHUD();
    this.setupEventListeners();

    // 10. Start Level Spawning
    this.startLevelSpawning();

    // 11. Large welcome alert
    const levelNum = this.levelManager.currentLevel.levelNumber;
    this.showLevelStartAlert(levelNum);

    // 12. Play gameplay background music
    this.backgroundMusic = this.sound.add('gameplay_music', {
      loop: true,
      volume: 0
    });
    this.backgroundMusic.play();

    this.tweens.add({
      targets: this.backgroundMusic,
      volume: 0.5,
      duration: 1000
    });
  }

  public update(time: number, delta: number): void {
    // 1. Update entities
    this.player.update(time, delta);

    if (this.activeBoss && this.activeBoss.active) {
      this.activeBoss.updateBoss(this.player, time, delta);
    }

    this.zombies.getChildren().forEach((zombie) => {
      (zombie as Zombie).updateZombie(this.player, delta);
    });

    // 2. Update crosshair position in world coordinates
    const pointer = this.input.activePointer;
    this.crosshair.x = pointer.worldX;
    this.crosshair.y = pointer.worldY;

    // 3. Update HUD values
    this.updateHUDDrawing();
  }

  private createWorldLayout(): void {
    this.platforms = this.physics.add.staticGroup();

    // 1. Border Walls (using 'ground' texture, 32x32 blocks)
    // Top & Bottom walls
    for (let x = 16; x < 1600; x += 32) {
      this.platforms.create(x, 16, 'ground');
      this.platforms.create(x, 1184, 'ground');
    }
    // Left & Right walls (exclude corners)
    for (let y = 48; y < 1180; y += 32) {
      this.platforms.create(16, y, 'ground');
      this.platforms.create(1584, y, 'ground');
    }

    // Helper to create a solid rectangular block of bricks
    const createBrickBlock = (startX: number, startY: number, cols: number, rows: number) => {
      for (let col = 0; col < cols; col++) {
        for (let row = 0; row < rows; row++) {
          this.platforms.create(startX + col * 32, startY + row * 32, 'brick');
        }
      }
    };

    // 2. Scattered Obstacles in the arena (using 'brick' texture)
    // Pillars/structures in the quadrants (3x3 blocks)
    createBrickBlock(352, 252, 3, 3);
    createBrickBlock(1152, 252, 3, 3);
    createBrickBlock(352, 852, 3, 3);
    createBrickBlock(1152, 852, 3, 3);

    // Center area obstacles (leaving the absolute center 800,600 open for player spawning)
    createBrickBlock(736, 400, 5, 1); // Top of center
    createBrickBlock(736, 768, 5, 1); // Bottom of center
    createBrickBlock(448, 544, 1, 4); // Left of center
    createBrickBlock(1120, 544, 1, 4); // Right of center
  }

  private startLevelSpawning(): void {
    if (this.spawnTimerEvent) {
      this.spawnTimerEvent.destroy();
    }

    const config = this.levelManager.currentLevel;

    // Set up recurring spawns
    this.spawnTimerEvent = this.time.addEvent({
      delay: config.spawnInterval,
      callback: this.spawnZombieWave,
      callbackScope: this,
      loop: true
    });
  }

  private spawnZombieWave(): void {
    // Do not spawn minions if boss is spawned in Level 2 mid boss or Level 5 final boss, 
    // unless they are spawned by the boss itself. Wait! Spawning standard adds is fine 
    // but we want to limit the active count.
    if (this.zombies.getLength() >= 12) return;

    const config = this.levelManager.currentLevel;

    // For level 5, boss spawns immediately. LevelManager controls progression.
    if (config.hasFinalBoss && !this.activeBoss) {
      this.spawnBossEntity('final');
      return;
    }

    // If mid boss is active, do not spawn waves
    if (this.levelManager.isBossActive && this.activeBoss) {
      return;
    }

    // If level 2 and kills reached target, spawn mid boss instead of normal wave
    if (config.hasMidBoss && this.levelManager.killsCount >= config.targetKills && !this.levelManager.isBossSpawned) {
      this.spawnBossEntity('mid');
      return;
    }

    // Determine spawn position in a random circle radius around the player (off-screen)
    const angle = Math.random() * Math.PI * 2;
    const distance = 400 + Math.random() * 200;
    let spawnX = this.player.x + Math.cos(angle) * distance;
    let spawnY = this.player.y + Math.sin(angle) * distance;

    spawnX = Phaser.Math.Clamp(spawnX, 50, 1550);
    spawnY = Phaser.Math.Clamp(spawnY, 50, 1150);

    const type = this.levelManager.getNextSpawnType();
    const zombie = new Zombie(this, spawnX, spawnY, type);
    this.zombies.add(zombie);
  }

  private spawnBossEntity(type: 'mid' | 'final'): void {
    this.levelManager.isBossActive = true;
    this.levelManager.isBossSpawned = true;

    // Clear normal spawning loop briefly to focus on Boss setup
    if (this.spawnTimerEvent) {
      this.spawnTimerEvent.destroy();
    }

    // Spawn coordinate in a random direction from the player
    const angle = Math.random() * Math.PI * 2;
    const distance = 400;
    let spawnX = this.player.x + Math.cos(angle) * distance;
    let spawnY = this.player.y + Math.sin(angle) * distance;

    spawnX = Phaser.Math.Clamp(spawnX, 100, 1500);
    spawnY = Phaser.Math.Clamp(spawnY, 100, 1100);

    this.activeBoss = new Boss(this, spawnX, spawnY, type);

    // Boss collides with ground
    this.physics.add.collider(this.activeBoss, this.platforms);
    // Boss collides with player bullet
    this.physics.add.overlap(this.bullets, this.activeBoss, this.handleBulletHitBoss, undefined, this);
    // Boss overlaps player directly
    this.physics.add.overlap(this.player, this.activeBoss, this.handleBossHitPlayer, undefined, this);

    // Show Alert Banner
    const bossName = type === 'mid' ? 'MUTANT SLEDGE (MID-BOSS)' : 'ABOMINATION CRUCIBLE (FINAL BOSS)';
    this.showAlert(`WARNING: ${bossName} ENCOUNTER!`, '#ff3b3b');
    this.cameras.main.flash(800, 180, 0, 0);

    // Activate Boss HP HUD
    this.hudBossContainer.setVisible(true);
    this.hudBossNameText.setText(bossName);
    this.updateBossHealthHUD(this.activeBoss.health, this.activeBoss.maxHealth);

    // Re-enable minion spawns at a slower interval if final boss
    if (type === 'final') {
      this.spawnTimerEvent = this.time.addEvent({
        delay: 5000,
        callback: this.spawnZombieWave,
        callbackScope: this,
        loop: true
      });
    }
  }

  private handleBulletHitZombie(bulletRef: any, zombieRef: any): void {
    const bullet = bulletRef as Bullet;
    const zombie = zombieRef as Zombie;

    // Bullet damage logic
    const isDead = zombie.takeDamage(bullet.damage);
    bullet.destroyBullet();

    if (isDead) {
      // Score will update and register
    }
  }

  private handleBulletHitBoss(bossRef: any, bulletRef: any): void {
    const boss = bossRef as Boss;
    const bullet = bulletRef as Bullet;

    boss.takeDamage(bullet.damage);
    bullet.destroyBullet();
  }

  private handleZombieHitPlayer(_playerRef: any, zombieRef: any): void {
    const zombie = zombieRef as Zombie;
    this.player.takeDamage(zombie.damageValue);
    zombie.playAttack();
  }

  private handleBossHitPlayer(_playerRef: any, bossRef: any): void {
    const boss = bossRef as Boss;
    this.player.takeDamage(boss.collisionDamage);
  }

  private handleBossBulletHitPlayer(_playerRef: any, bulletRef: any): void {
    const bullet = bulletRef as BossBullet;
    this.player.takeDamage(bullet.damage);
    bullet.destroy();
  }

  private setupEventListeners(): void {
    // Listen to zombie death events
    this.events.on('zombie-killed', (zombie: Zombie) => {
      // Small chance to drop heal item
      if (Math.random() < 0.15) {
        this.spawnHealPack(zombie.x, zombie.y);
      }

      // Check if boss spawned or advance wave
      const oldLevel = this.levelManager.currentLevel.levelNumber;
      const spawnedBoss = this.levelManager.registerKill();
      const newLevel = this.levelManager.currentLevel.levelNumber;

      if (spawnedBoss) {
        this.spawnBossEntity('mid');
      } else if (newLevel !== oldLevel) {
        this.startLevelSpawning();
        this.showLevelStartAlert(newLevel);
      }
    });

    // Listen to boss death events
    this.events.on('boss-killed', (boss: Boss) => {
      this.hudBossContainer.setVisible(false);

      if (boss.bossType === 'mid') {
        this.levelManager.advanceLevel();
        this.showAlert('LEVEL 2 COMPLETE: MID-BOSS SLAIN!', '#3bf1a9');
        this.startLevelSpawning();
      } else {
        // Final boss defeated -> VICTORY
        this.tweens.add({
          targets: this.backgroundMusic,
          volume: 0,
          duration: 1000
        });
        this.time.delayedCall(1500, () => {
          this.backgroundMusic.stop();
          this.scene.start('GameOverScene', {
            isVictory: true,
            score: this.levelManager.totalKillsCount * 100,
            kills: this.levelManager.totalKillsCount,
            level: 5
          });
        });
      }
    });

    // Listen to boss HP updates
    this.events.on('boss-health-changed', (data: { current: number; max: number }) => {
      this.updateBossHealthHUD(data.current, data.max);
    });

    // Listen to player death
    this.events.on('player-died', () => {
      this.tweens.add({
        targets: this.backgroundMusic,
        volume: 0,
        duration: 800
      });
      this.cameras.main.fade(800, 0, 0, 0, false, (_camera: any, progress: number) => {
        if (progress === 1) {
          this.backgroundMusic.stop();
          this.scene.start('GameOverScene', {
            isVictory: false,
            score: this.levelManager.totalKillsCount * 100,
            kills: this.levelManager.totalKillsCount,
            level: this.levelManager.currentLevel.levelNumber
          });
        }
      });
    });

    this.events.on('weapon-changed', (weapon: Weapon) => {
      this.showAlert(`WEAPON: ${weapon.name.toUpperCase()}`, '#aa3bff');
    });

    this.events.on('player-shot', (weapon: Weapon) => {
      let volume = 0.5;
      let rate = 1.0;

      if (weapon.name === 'Shotgun') {
        volume = 0.8;
        rate = 0.75;
      } else if (weapon.name === 'Machine Gun') {
        volume = 0.4;
        rate = 1.2;
      }

      this.sound.play('gun_fire', { volume, rate });
    });

    this.events.once('shutdown', () => {
      if (this.backgroundMusic) {
        this.backgroundMusic.stop();
      }
    });
  }

  private spawnHealPack(x: number, y: number): void {
    // Draw a small healing pack sprite using a rectangle & cross
    const pack = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, 14, 14, 0xe5e4e7);
    const c1 = this.add.rectangle(0, 0, 10, 3, 0xff3b3b);
    const c2 = this.add.rectangle(0, 0, 3, 10, 0xff3b3b);
    pack.add([bg, c1, c2]);

    this.physics.add.existing(pack);
    const body = pack.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setAllowGravity(false);
      
      // Give it a tiny slide/friction effect on drop
      const angle = Math.random() * Math.PI * 2;
      const speed = 100;
      body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      body.setDrag(200);

      this.physics.add.collider(pack, this.platforms);

      // Player overlaps to pick up
      this.physics.add.overlap(this.player, pack, () => {
        if (this.player.health < this.player.maxHealth) {
          this.player.heal(25);
          
          // Spawn little green plus sparkles
          const particles = this.add.particles(pack.x, pack.y, 'particle_spark', {
            speed: { min: 20, max: 80 },
            scale: { start: 1, end: 0 },
            tint: 0x3bf1a9,
            lifespan: 400,
            quantity: 8,
            maxParticles: 8
          });
          this.time.delayedCall(500, () => particles.destroy());

          pack.destroy();
        }
      });
    }
  }

  private createHUD(): void {
    // Use container styled coordinates
    const hudContainer = this.add.container(0, 0);
    hudContainer.setScrollFactor(0); // STATIC position relative to camera!
    hudContainer.setDepth(90);

    // 1. Health Panel
    const heartIcon = this.add.sprite(24, 24, 'ui_heart');
    heartIcon.setScale(1.5);
    hudContainer.add(heartIcon);

    this.hudHealthBar = this.add.graphics();
    hudContainer.add(this.hudHealthBar);

    this.hudHealthText = this.add.text(190, 16, '100/100', {
      font: '10px "Press Start 2P"',
      color: '#e5e4e7'
    });
    hudContainer.add(this.hudHealthText);

    // 2. Weapon Panel
    this.hudWeaponIconBg = this.add.graphics();
    hudContainer.add(this.hudWeaponIconBg);

    this.hudWeaponText = this.add.text(20, 60, 'PISTOL', {
      font: '12px "Press Start 2P"',
      color: '#3bf1a9'
    });
    hudContainer.add(this.hudWeaponText);

    this.hudAmmoText = this.add.text(20, 78, 'AMMO: INFINITY', {
      font: '10px "Press Start 2P"',
      color: '#e5e4e7'
    });
    hudContainer.add(this.hudAmmoText);

    this.hudReloadBar = this.add.graphics();
    hudContainer.add(this.hudReloadBar);

    // 3. Game Progression Panel
    this.hudLevelText = this.add.text(640, 16, 'STAGE: 1/5', {
      font: '10px "Press Start 2P"',
      color: '#aa3bff'
    });
    hudContainer.add(this.hudLevelText);

    this.hudKillsText = this.add.text(640, 32, 'KILLS: 0/15', {
      font: '10px "Press Start 2P"',
      color: '#e5e4e7'
    });
    hudContainer.add(this.hudKillsText);

    this.hudProgressText = this.add.text(640, 48, 'PROGRESS: 0%', {
      font: '8px "Press Start 2P"',
      color: '#8b80a5'
    });
    hudContainer.add(this.hudProgressText);

    // 4. Boss Health Overlay Container (Hidden initially)
    this.hudBossContainer = this.add.container(0, 0);
    this.hudBossContainer.setScrollFactor(0);
    this.hudBossContainer.setDepth(95);
    this.hudBossContainer.setVisible(false);

    this.hudBossBar = this.add.graphics();
    this.hudBossContainer.add(this.hudBossBar);

    this.hudBossNameText = this.add.text(400, 16, 'MUTANT CHARGER (BOSS)', {
      font: '10px "Press Start 2P"',
      color: '#ff3b3b'
    }).setOrigin(0.5);
    this.hudBossContainer.add(this.hudBossNameText);

    // 5. Overlay alert banner text
    this.overlayAlertText = this.add.text(400, 200, '', {
      font: '14px "Press Start 2P"',
      color: '#3bf1a9',
      align: 'center'
    }).setOrigin(0.5).setVisible(false);
    this.overlayAlertText.setScrollFactor(0);
    this.overlayAlertText.setDepth(100);

    // 6. Test/Debug Level Selector Buttons
    if (DevConfig.enableTestButtons) {
      const btnWidth = 36;
      const btnHeight = 22;
      const startX = 760;
      const startY = 15;
      const spacing = 8;

      for (let i = 0; i < 5; i++) {
        const x = startX + i * (btnWidth + spacing);
        const y = startY;
        const levelNum = i + 1;

        // Background rectangle
        const bg = this.add.rectangle(x + btnWidth / 2, y + btnHeight / 2, btnWidth, btnHeight, 0xaa3bff)
          .setScrollFactor(0)
          .setInteractive({ useHandCursor: true });
        
        // Border / outline to make it feel premium
        const border = this.add.graphics();
        border.setScrollFactor(0);
        border.lineStyle(1.5, 0x3bf1a9, 1);
        border.strokeRect(x, y, btnWidth, btnHeight);

        // Text
        const txt = this.add.text(x + btnWidth / 2, y + btnHeight / 2, `L${levelNum}`, {
          font: '8px "Press Start 2P"',
          color: '#ffffff'
        }).setOrigin(0.5);
        txt.setScrollFactor(0);

        hudContainer.add([bg, border, txt]);

        // Interactive events
        bg.on('pointerover', () => {
          bg.setFillStyle(0x3bf1a9);
          txt.setColor('#110e1b');
        });
        bg.on('pointerout', () => {
          bg.setFillStyle(0xaa3bff);
          txt.setColor('#ffffff');
        });
        bg.on('pointerdown', () => {
          // Disable inputs immediately to prevent shooting or double clicking
          this.input.enabled = false;
          // Stop background music and start PlayScene with this level
          this.tweens.add({
            targets: this.backgroundMusic,
            volume: 0,
            duration: 200
          });
          this.time.delayedCall(200, () => {
            this.backgroundMusic.stop();
            this.scene.start('PlayScene', { startLevel: levelNum });
          });
        });
      }
    }
  }

  private updateHUDDrawing(): void {
    const config = this.levelManager.currentLevel;

    // Draw Health bar (green neon)
    this.hudHealthBar.clear();
    this.hudHealthBar.fillStyle(0x1a1625, 0.8); // dark background
    this.hudHealthBar.fillRect(45, 15, 130, 16);

    const hpPercent = Phaser.Math.Clamp(this.player.health / this.player.maxHealth, 0, 1);
    const hpColor = hpPercent > 0.4 ? 0x3bf1a9 : 0xff3b3b;
    this.hudHealthBar.fillStyle(hpColor, 1);
    this.hudHealthBar.fillRect(47, 17, 126 * hpPercent, 12);

    this.hudHealthText.setText(`${Math.ceil(this.player.health)}/${this.player.maxHealth}`);

    // Update weapon panel
    const weapon = this.player.currentWeapon;
    this.hudWeaponText.setText(weapon.name.toUpperCase());
    
    if (weapon.clipSize === Infinity) {
      this.hudAmmoText.setText('AMMO: INFINITE');
    } else {
      this.hudAmmoText.setText(`AMMO: ${weapon.currentAmmo}/${weapon.clipSize}`);
    }

    // Draw reload progress bar above weapon text
    this.hudReloadBar.clear();
    if (this.player.isReloading) {
      this.hudReloadBar.fillStyle(0x1a1625, 0.8);
      this.hudReloadBar.fillRect(20, 95, 100, 6);
      this.hudReloadBar.fillStyle(0xaa3bff, 1);
      this.hudReloadBar.fillRect(22, 97, 96 * this.player.reloadProgress, 2);
    }

    // Draw progression HUD
    this.hudLevelText.setText(`STAGE: ${config.levelNumber}/5`);
    
    if (config.hasFinalBoss) {
      this.hudKillsText.setText('BOSS ENCOUNTER');
      this.hudProgressText.setText('BOSS DEFEATED: 0%');
    } else if (config.hasMidBoss && this.levelManager.isBossSpawned) {
      this.hudKillsText.setText('BOSS ENCOUNTER');
      this.hudProgressText.setText('BOSS DEFEATED: 0%');
    } else {
      this.hudKillsText.setText(`KILLS: ${this.levelManager.killsCount}/${config.targetKills}`);
      const prog = Math.min(Math.floor((this.levelManager.killsCount / config.targetKills) * 100), 100);
      this.hudProgressText.setText(`PROGRESS: ${prog}%`);
    }

    // If level manager shows that level index doesn't match the current rendered stage HUD
    // (Checked automatically during progression advance)
  }

  private updateBossHealthHUD(current: number, max: number): void {
    this.hudBossBar.clear();
    
    // Boss frame border
    this.hudBossBar.fillStyle(0x1a1625, 0.8);
    this.hudBossBar.fillRect(200, 28, 400, 16);

    // red filler
    const hpPercent = Phaser.Math.Clamp(current / max, 0, 1);
    this.hudBossBar.fillStyle(0xff3b3b, 1);
    this.hudBossBar.fillRect(202, 30, 396 * hpPercent, 12);
  }

  private showLevelStartAlert(levelNum: number): void {
    const levelNames: { [key: number]: string } = {
      1: 'STAGE 1: ZOMBIE WASTELAND',
      2: 'STAGE 2: MUTANT ENCOUNTER',
      3: 'STAGE 3: FAST HORDE',
      4: 'STAGE 4: TANK WAVES',
      5: 'STAGE 5: FINAL CRUCIBLE'
    };
    const alertColor = levelNum === 5 ? '#ff3b3b' : '#3bf1a9';
    this.showAlert(levelNames[levelNum] || `STAGE ${levelNum}`, alertColor);
  }

  private showAlert(message: string, colorHexStr: string): void {
    this.overlayAlertText.setText(message);
    this.overlayAlertText.setColor(colorHexStr);
    this.overlayAlertText.setVisible(true);
    this.overlayAlertText.setAlpha(1);

    // Pulsate text
    this.tweens.add({
      targets: this.overlayAlertText,
      scale: 1.1,
      duration: 250,
      yoyo: true,
      repeat: 1,
      onComplete: () => {
        // fade away
        this.tweens.add({
          targets: this.overlayAlertText,
          alpha: 0,
          duration: 1000,
          delay: 500,
          onComplete: () => {
            this.overlayAlertText.setVisible(false);
          }
        });
      }
    });
  }
}
