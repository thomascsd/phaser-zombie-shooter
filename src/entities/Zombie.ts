import Phaser from 'phaser';
import { Player } from './Player.ts';

export type ZombieType = 'normal' | 'fast' | 'tank';

export class Zombie extends Phaser.Physics.Arcade.Sprite {
  public zombieType: ZombieType;
  public maxHealth: number;
  public health: number;
  public speed: number;
  public damageValue: number;
  public pointsValue: number;

  private isHurt: boolean = false;
  private hurtTimer: number = 0;
  private isDashing: boolean = false;
  private dashCooldownTimer: number = 0;
  private dashActiveTimer: number = 0;
  private dashVelocityX: number = 0;
  private dashVelocityY: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, type: ZombieType) {
    // Determine texture based on type
    const texture = `zombie_${type}`;
    super(scene, x, y, texture, '0');
    this.zombieType = type;

    // Apply specific stats based on type
    switch (type) {
      case 'fast':
        this.maxHealth = 20;
        this.health = 20;
        this.speed = 120;
        this.damageValue = 8;
        this.pointsValue = 20;
        break;
      case 'tank':
        this.maxHealth = 90;
        this.health = 90;
        this.speed = 40;
        this.damageValue = 25;
        this.pointsValue = 50;
        break;
      case 'normal':
      default:
        this.maxHealth = 40;
        this.health = 40;
        this.speed = 65;
        this.damageValue = 12;
        this.pointsValue = 10;
        break;
    }

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Setup bounds sizes
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCollideWorldBounds(true);
      if (type === 'tank') {
        body.setSize(30, 42);
        body.setOffset(9, 6);
      } else {
        body.setSize(20, 28);
        body.setOffset(6, 4);
      }
    }

    // Play default walking animation
    this.play(`zombie-${type}-walk`);
  }

  public updateZombie(player: Player, delta: number): void {
    if (this.health <= 0 || !this.active) return;

    // Handle damage flash cooldown and knockback state
    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        this.setTint(0xffffff);
      }
      return; // Skip AI pathfinding while knocked back
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // Dash timers for Fast Zombies
    if (this.zombieType === 'fast') {
      if (this.isDashing) {
        this.dashActiveTimer -= delta;
        if (this.dashActiveTimer <= 0) {
          this.isDashing = false;
          this.dashCooldownTimer = 3000;
          this.setTint(0xffffff);
        } else {
          this.setVelocity(this.dashVelocityX, this.dashVelocityY);
          this.flipX = this.dashVelocityX < 0;
          return;
        }
      } else if (this.dashCooldownTimer > 0) {
        this.dashCooldownTimer -= delta;
      }
    }

    // AI logic: Walk directly towards player
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Trigger Dash if fast zombie is close enough and off cooldown
    if (this.zombieType === 'fast' && !this.isDashing && this.dashCooldownTimer <= 0 && distance < 200 && distance > 30) {
      this.isDashing = true;
      this.dashActiveTimer = 500;
      this.setTint(0xffaa55); // Orange glow during dash
      if (distance > 0) {
        this.dashVelocityX = (dx / distance) * this.speed * 3.0;
        this.dashVelocityY = (dy / distance) * this.speed * 3.0;
      } else {
        this.dashVelocityX = this.speed * 3.0;
        this.dashVelocityY = 0;
      }
      this.setVelocity(this.dashVelocityX, this.dashVelocityY);
      this.flipX = this.dashVelocityX < 0;
      return;
    }

    // Normal movement
    if (distance > 0) {
      const vx = (dx / distance) * this.speed;
      const vy = (dy / distance) * this.speed;
      this.setVelocity(vx, vy);
      this.flipX = vx < 0;
    } else {
      this.setVelocity(0, 0);
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.health <= 0) return false;

    this.health -= amount;

    // Hurt flash (red tint)
    this.isHurt = true;
    this.hurtTimer = 150;
    this.setTint(0xff5555);

    // Cancel current dash if hurt
    if (this.isDashing) {
      this.isDashing = false;
      this.dashCooldownTimer = 1500; // shorter cooldown on interrupt
    }

    // Knockback effect: push away from player in top-down plane
    const playScene = this.scene as any;
    const player = playScene.player as Player;
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body && player) {
      const knockbackStrength = this.zombieType === 'tank' ? 50 : 150;
      const dx = this.x - player.x;
      const dy = this.y - player.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > 0) {
        this.setVelocity((dx / dist) * knockbackStrength, (dy / dist) * knockbackStrength);
      }
    }

    // Blood Splatter Particles
    this.spawnBloodSplatter();

    if (this.health <= 0) {
      this.die();
      return true; // Killed
    }
    return false; // Damaged but alive
  }

  private spawnBloodSplatter(): void {
    const particles = this.scene.add.particles(this.x, this.y, 'particle_blood', {
      speed: { min: 40, max: 120 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.2, end: 0 },
      lifespan: 300,
      quantity: 6,
      maxParticles: 6
    });

    this.scene.time.delayedCall(400, () => {
      particles.destroy();
    });
  }

  private die(): void {
    this.setVelocity(0, 0);
    this.setActive(false);
    this.setVisible(false);

    // Final explosion of blood
    const particles = this.scene.add.particles(this.x, this.y, 'particle_blood', {
      speed: { min: 50, max: 160 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 400,
      quantity: 12,
      maxParticles: 12
    });

    this.scene.time.delayedCall(500, () => {
      particles.destroy();
    });

    // Notify scene of zombie death
    this.scene.events.emit('zombie-killed', this);
    this.destroy();
  }
}
