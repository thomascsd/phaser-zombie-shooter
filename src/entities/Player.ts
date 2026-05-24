import Phaser from 'phaser';
import { Bullet } from './Bullet.ts';

export interface Weapon {
  name: string;
  id: number;
  damage: number;
  cooldown: number;
  clipSize: number;
  currentAmmo: number;
  reloadTime: number;
  bulletSpeed: number;
  spread: number; // spread angle (degrees)
  pellets: number; // number of bullets per shot
  isAutomatic: boolean;
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  // Stats
  public maxHealth: number = 100;
  public health: number = 100;
  public speed: number = 200;
  public jumpForce: number = -400;

  // State
  public isHurt: boolean = false;
  private hurtTimer: number = 0;
  public isReloading: boolean = false;
  public reloadProgress: number = 0; // 0 to 1
  private reloadTimer: number = 0;
  private lastFiredTime: number = 0;
  private wasPointerDown: boolean = false;

  // Weapons
  public weapons: Weapon[] = [];
  public currentWeaponIndex: number = 0;

  // Controls
  private keys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
    SPACE: Phaser.Input.Keyboard.Key;
    ONE: Phaser.Input.Keyboard.Key;
    TWO: Phaser.Input.Keyboard.Key;
    THREE: Phaser.Input.Keyboard.Key;
    R: Phaser.Input.Keyboard.Key;
  };

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'player', '0');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCollideWorldBounds(true);
      // Shrink body bounds slightly for better collision
      body.setSize(20, 28);
      body.setOffset(6, 4);
    }

    // Initialize inputs
    if (scene.input.keyboard) {
      this.keys = {
        W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
        A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
        S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
        D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
        SPACE: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE),
        ONE: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
        TWO: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
        THREE: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
        R: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.R)
      };
    }

    // Setup Weapons
    this.weapons = [
      {
        name: 'Pistol',
        id: 1,
        damage: 15,
        cooldown: 350,
        clipSize: Infinity,
        currentAmmo: Infinity,
        reloadTime: 0,
        bulletSpeed: 600,
        spread: 2,
        pellets: 1,
        isAutomatic: false
      },
      {
        name: 'Shotgun',
        id: 2,
        damage: 10,
        cooldown: 800,
        clipSize: 6,
        currentAmmo: 6,
        reloadTime: 1200,
        bulletSpeed: 500,
        spread: 15,
        pellets: 5,
        isAutomatic: false
      },
      {
        name: 'Machine Gun',
        id: 3,
        damage: 8,
        cooldown: 120,
        clipSize: 30,
        currentAmmo: 30,
        reloadTime: 1600,
        bulletSpeed: 700,
        spread: 6,
        pellets: 1,
        isAutomatic: true
      }
    ];

    // Play default animation
    this.play('player-idle');
  }

  public get currentWeapon(): Weapon {
    return this.weapons[this.currentWeaponIndex];
  }

  public update(time: number, delta: number): void {
    if (this.health <= 0) {
      this.setVelocity(0, 0);
      return;
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // Handle Weapon Swapping
    if (Phaser.Input.Keyboard.JustDown(this.keys.ONE) && this.currentWeaponIndex !== 0) {
      this.switchWeapon(0);
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.TWO) && this.currentWeaponIndex !== 1) {
      this.switchWeapon(1);
    } else if (Phaser.Input.Keyboard.JustDown(this.keys.THREE) && this.currentWeaponIndex !== 2) {
      this.switchWeapon(2);
    }

    // Handle Reloading
    if (this.isReloading) {
      this.reloadTimer -= delta;
      const weapon = this.currentWeapon;
      this.reloadProgress = 1 - (this.reloadTimer / weapon.reloadTime);

      if (this.reloadTimer <= 0) {
        this.isReloading = false;
        weapon.currentAmmo = weapon.clipSize;
      }
    }

    // Handle Hurt state
    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        this.setAlpha(1);
      }
    }

    // Aiming / Flipping based on mouse position
    const pointer = this.scene.input.activePointer;
    // Calculate world mouse position since we scroll screen
    const worldMouseX = pointer.x + this.scene.cameras.main.scrollX;
    const worldMouseY = pointer.y + this.scene.cameras.main.scrollY;
    const isMouseRight = worldMouseX >= this.x;

    this.flipX = !isMouseRight;

    // Movement (WASD) - 8-directional movement
    let moveSpeed = this.speed;
    // Slow down slightly if reloading or firing a heavy weapon
    if (this.isReloading) {
      moveSpeed *= 0.7;
    }

    let vx = 0;
    let vy = 0;
    if (this.keys.A.isDown) vx = -1;
    else if (this.keys.D.isDown) vx = 1;

    if (this.keys.W.isDown) vy = -1;
    else if (this.keys.S.isDown) vy = 1;

    if (vx !== 0 && vy !== 0) {
      vx *= Math.SQRT1_2;
      vy *= Math.SQRT1_2;
    }

    this.setVelocity(vx * moveSpeed, vy * moveSpeed);

    if (vx !== 0 || vy !== 0) {
      this.play('player-walk', true);
    } else {
      this.play('player-idle', true);
    }

    // Handle Shooting
    const isMouseDown = pointer.isDown;
    const isJustClicked = isMouseDown && !this.wasPointerDown;
    this.wasPointerDown = isMouseDown;

    const weapon = this.currentWeapon;

    if (isMouseDown && !this.isReloading) {
      if (weapon.isAutomatic || isJustClicked) {
        if (time - this.lastFiredTime >= weapon.cooldown) {
          this.shoot(worldMouseX, worldMouseY, time);
        }
      }
    }

    // Manual reload (press R)
    if (Phaser.Input.Keyboard.JustDown(this.keys.R) && !this.isReloading && weapon.clipSize !== Infinity) {
      if (weapon.currentAmmo < weapon.clipSize) {
        this.startReload();
      }
    }
  }

  private switchWeapon(index: number): void {
    if (this.isReloading) {
      this.isReloading = false; // Cancel current reload
    }
    this.currentWeaponIndex = index;
    // Show short notice
    this.scene.events.emit('weapon-changed', this.currentWeapon);

    // If out of ammo, start reload automatically
    const weapon = this.currentWeapon;
    if (weapon.currentAmmo === 0 && weapon.clipSize !== Infinity) {
      this.startReload();
    }
  }

  private startReload(): void {
    const weapon = this.currentWeapon;
    if (weapon.clipSize === Infinity) return;

    this.isReloading = true;
    this.reloadTimer = weapon.reloadTime;
    this.reloadProgress = 0;
  }

  private shoot(targetX: number, targetY: number, time: number): void {
    const weapon = this.currentWeapon;

    if (weapon.clipSize !== Infinity) {
      if (weapon.currentAmmo <= 0) {
        this.startReload();
        return;
      }
      weapon.currentAmmo--;
    }

    this.lastFiredTime = time;

    // Bullet Spawning
    const bulletGroup = (this.scene as any).bullets as Phaser.GameObjects.Group;
    if (!bulletGroup) return;

    // Trigger gun fire sound/effect
    this.scene.events.emit('player-shot', weapon);

    // Bullet origin is player center/gun point
    // Shift slightly to the front based on direction
    const gunOffsetX = this.flipX ? -12 : 12;
    const gunOffsetY = 4;
    const fireX = this.x + gunOffsetX;
    const fireY = this.y + gunOffsetY;

    // Calculate baseline angle
    const baseAngle = Phaser.Math.Angle.Between(fireX, fireY, targetX, targetY);
    const baseAngleDeg = Phaser.Math.RadToDeg(baseAngle);

    for (let i = 0; i < weapon.pellets; i++) {
      const bullet = bulletGroup.get(fireX, fireY) as Bullet;
      if (bullet) {
        // Calculate offset with spread
        const spreadOffset = (Math.random() - 0.5) * weapon.spread;
        const finalAngleDeg = baseAngleDeg + spreadOffset;
        const finalAngleRad = Phaser.Math.DegToRad(finalAngleDeg);

        const tx = fireX + Math.cos(finalAngleRad) * 100;
        const ty = fireY + Math.sin(finalAngleRad) * 100;

        bullet.fire(fireX, fireY, tx, ty, weapon.bulletSpeed, weapon.damage);
      }
    }

    // Camera shake effect on heavy shoot
    if (weapon.name === 'Shotgun') {
      this.scene.cameras.main.shake(100, 0.005);
      // Add particle sparks
      this.spawnMuzzleFlash(fireX, fireY, baseAngle);
    } else {
      this.spawnMuzzleFlash(fireX, fireY, baseAngle);
    }

    // Auto reload check
    if (weapon.currentAmmo === 0 && weapon.clipSize !== Infinity) {
      this.startReload();
    }
  }

  private spawnMuzzleFlash(x: number, y: number, angle: number): void {
    const particles = this.scene.add.particles(x, y, 'particle_spark', {
      speed: { min: 50, max: 150 },
      angle: { min: Phaser.Math.RadToDeg(angle) - 20, max: Phaser.Math.RadToDeg(angle) + 20 },
      scale: { start: 1, end: 0 },
      lifespan: 150,
      quantity: 4,
      maxParticles: 4
    });
    // Autodestroy particles emitter after timeline
    this.scene.time.delayedCall(200, () => {
      particles.destroy();
    });
  }

  public takeDamage(amount: number): void {
    if (this.health <= 0 || this.isHurt) return;

    this.health = Math.max(0, this.health - amount);
    this.isHurt = true;
    this.hurtTimer = 600; // 0.6 seconds invulnerability/flicker
    this.scene.cameras.main.shake(150, 0.015);
    
    // Play hurt flash
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      duration: 100,
      yoyo: true,
      repeat: 3,
      onComplete: () => {
        if (this.health > 0) this.setAlpha(0.7); // keep semi-transparent during hurt invul
      }
    });

    this.scene.events.emit('player-health-changed', this.health);

    // Check game over
    if (this.health <= 0) {
      this.scene.events.emit('player-died');
    }
  }

  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.scene.events.emit('player-health-changed', this.health);
  }
}
