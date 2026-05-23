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

    // Handle damage flash cooldown
    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        this.setTint(0xffffff);
      }
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // AI logic: Walk towards player
    const direction = player.x - this.x;
    const absDir = Math.abs(direction);

    // Turn sprite to face player
    if (direction > 0) {
      this.flipX = false;
      this.setVelocityX(this.speed);
    } else {
      this.flipX = true;
      this.setVelocityX(-this.speed);
    }

    // Special jump logic for fast zombie to leap over obstacles or just jump towards player
    if (this.zombieType === 'fast' && (body.blocked.down || body.touching.down)) {
      // Leap if player is higher up or randomly to create chaotic behavior
      const isPlayerHigher = player.y < this.y - 40;
      if (isPlayerHigher && absDir < 150 && Math.random() < 0.02) {
        this.setVelocityY(-250);
      }
    }

    // Special AI: tank zombies are resistant to knockback, normal/fast are not
  }

  public takeDamage(amount: number): boolean {
    if (this.health <= 0) return false;

    this.health -= amount;

    // Hurt flash (red tint)
    this.isHurt = true;
    this.hurtTimer = 150;
    this.setTint(0xff5555);

    // Knocback effect: bounce away from projectile impact slightly
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      const knockbackFactor = this.zombieType === 'tank' ? -20 : -80;
      // knock back in opposite direction of current horizontal movement
      const dirX = body.velocity.x > 0 ? 1 : -1;
      this.setVelocityX(dirX * knockbackFactor);
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
