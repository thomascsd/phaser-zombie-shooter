import Phaser from 'phaser';
import { Player } from './Player.ts';
import { BossBullet } from './Bullet.ts';
import { Zombie } from './Zombie.ts';

export type BossType = 'mid' | 'final';

export class Boss extends Phaser.Physics.Arcade.Sprite {
  public bossType: BossType;
  public maxHealth: number;
  public health: number;
  public baseSpeed: number;
  public currentSpeed: number;
  public collisionDamage: number = 20;

  // AI & States
  public currentPhase: number = 1;
  private isHurt: boolean = false;
  private hurtTimer: number = 0;

  // Boss attack timers
  private nextAttackTime: number = 0;
  private nextSummonTime: number = 0;
  private isDashing: boolean = false;
  private dashEndTime: number = 0;
  private dashVelocityX: number = 0;
  private dashVelocityY: number = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, type: BossType) {
    const texture = type === 'mid' ? 'mid_boss' : 'final_boss';
    super(scene, x, y, texture, '0');
    this.bossType = type;

    if (type === 'mid') {
      this.maxHealth = 500;
      this.health = 500;
      this.baseSpeed = 80;
      this.collisionDamage = 20;
    } else {
      this.maxHealth = 1500;
      this.health = 1500;
      this.baseSpeed = 60;
      this.collisionDamage = 30;
    }

    this.currentSpeed = this.baseSpeed;

    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Physics adjustment
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setCollideWorldBounds(true);
      if (type === 'mid') {
        body.setSize(44, 56);
        body.setOffset(10, 4);
      } else {
        body.setSize(76, 84);
        body.setOffset(10, 6);
      }
    }

    this.play(`boss-${type}-walk`);
  }

  public updateBoss(player: Player, time: number, delta: number): void {
    if (this.health <= 0 || !this.active) return;

    // Handle damage flash
    if (this.isHurt) {
      this.hurtTimer -= delta;
      if (this.hurtTimer <= 0) {
        this.isHurt = false;
        this.setTint(0xffffff);
      }
    }

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (!body) return;

    // Manage Phase Transitions for Final Boss
    if (this.bossType === 'final') {
      const hpPercentage = this.health / this.maxHealth;
      let newPhase = 1;
      if (hpPercentage <= 0.35) {
        newPhase = 3;
      } else if (hpPercentage <= 0.7) {
        newPhase = 2;
      }

      if (newPhase !== this.currentPhase) {
        this.currentPhase = newPhase;
        this.onPhaseTransition(newPhase, time);
      }
    }

    // Handle dash state
    if (this.isDashing) {
      if (time > this.dashEndTime) {
        this.isDashing = false;
        this.currentSpeed = this.baseSpeed;
        this.setTint(0xffffff);
      } else {
        // Keep moving in dash direction
        this.setVelocity(this.dashVelocityX, this.dashVelocityY);
        this.flipX = this.dashVelocityX < 0;
        return; // Skip normal AI during dash
      }
    }

    // Default Walk Behavior towards player in top-down
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > 0) {
      const vx = (dx / distance) * this.currentSpeed;
      const vy = (dy / distance) * this.currentSpeed;
      this.setVelocity(vx, vy);
      this.flipX = vx < 0;
    } else {
      this.setVelocity(0, 0);
    }

    // Run attacks
    if (this.bossType === 'mid') {
      this.handleMidBossAttacks(player, time);
    } else {
      this.handleFinalBossAttacks(player, time);
    }
  }

  private startDash(player: Player, duration: number, speed: number, colorHex: number, time: number, cooldown: number): void {
    this.isDashing = true;
    this.dashEndTime = time + duration;
    this.nextAttackTime = time + cooldown;
    this.currentSpeed = speed;
    this.setTint(colorHex);

    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist > 0) {
      this.dashVelocityX = (dx / dist) * speed;
      this.dashVelocityY = (dy / dist) * speed;
    } else {
      this.dashVelocityX = speed;
      this.dashVelocityY = 0;
    }
  }

  private onPhaseTransition(phase: number, time: number): void {
    // Flash red & show shockwave
    this.scene.cameras.main.flash(500, 255, 0, 0);
    this.scene.cameras.main.shake(300, 0.02);

    if (phase === 2) {
      this.baseSpeed = 80;
      this.currentSpeed = 80;
      this.collisionDamage = 35;
      this.nextAttackTime = time + 1000;
    } else if (phase === 3) {
      this.baseSpeed = 100;
      this.currentSpeed = 100;
      this.collisionDamage = 45;
      this.nextAttackTime = time + 500;
      this.nextSummonTime = time + 1000;

      // Unleash circle bullet storm instantly
      this.releaseCircleBlast(8, 200, 20);
    }

    // Spawn a smoke cloud visual
    this.spawnPhaseParticles();
  }

  private handleMidBossAttacks(player: Player, time: number): void {
    // 1. Dash Attack
    // Cooldown is 5000ms. Dash length 1200ms.
    if (time > this.nextAttackTime) {
      const rand = Math.random();
      if (rand < 0.4) {
        // Dash Attack!
        this.startDash(player, 1200, 300, 0xff33cc, time, 6000);
      } else {
        // Shoot 3 bullets
        this.fireSpreadBullets(player, 3, 20, 180, 15);
        this.nextAttackTime = time + 3000;
      }
    }
  }

  private handleFinalBossAttacks(player: Player, time: number): void {
    // Attacks depend on Phase
    if (time > this.nextAttackTime) {
      if (this.currentPhase === 1) {
        // Fire single targeted bullet
        this.fireTargetedBullet(player, 180, 20);
        this.nextAttackTime = time + 2500;
      } else if (this.currentPhase === 2) {
        // Dash or fire spread
        if (Math.random() < 0.4) {
          // Dash charge
          this.startDash(player, 1500, 320, 0xff3333, time, 5000);
        } else {
          // Fire 3-spread bullets
          this.fireSpreadBullets(player, 3, 25, 200, 20);
          this.nextAttackTime = time + 2200;
        }
      } else {
        // Phase 3: Extreme behavior
        const rand = Math.random();
        if (rand < 0.3) {
          // Rapid Dash
          this.startDash(player, 1000, 360, 0xff3333, time, 4000);
        } else if (rand < 0.7) {
          // Wave Bullet Hell (5 spread)
          this.fireSpreadBullets(player, 5, 35, 220, 20);
          this.nextAttackTime = time + 1500;
        } else {
          // Circle blast
          this.releaseCircleBlast(10, 220, 20);
          this.nextAttackTime = time + 2500;
        }
      }
    }

    // Minion Summoning
    if (time > this.nextSummonTime) {
      let count = 1;
      let types: ('normal' | 'fast' | 'tank')[] = ['normal'];

      if (this.currentPhase === 1) {
        count = 2;
        types = ['normal'];
        this.nextSummonTime = time + 8000;
      } else if (this.currentPhase === 2) {
        count = 3;
        types = ['normal', 'fast'];
        this.nextSummonTime = time + 7000;
      } else {
        count = 4;
        types = ['fast', 'tank'];
        this.nextSummonTime = time + 5500;
      }

      this.summonMinions(count, types);
    }
  }

  private fireTargetedBullet(player: Player, speed: number, damage: number): void {
    const bulletGroup = (this.scene as any).bossBullets as Phaser.GameObjects.Group;
    if (!bulletGroup) return;

    const bullet = bulletGroup.get(this.x, this.y) as BossBullet;
    if (bullet) {
      const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
      bullet.fire(this.x, this.y, angle, speed, damage);
    }
  }

  private fireSpreadBullets(player: Player, count: number, spreadDeg: number, speed: number, damage: number): void {
    const bulletGroup = (this.scene as any).bossBullets as Phaser.GameObjects.Group;
    if (!bulletGroup) return;

    const baseAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y);
    const baseAngleDeg = Phaser.Math.RadToDeg(baseAngle);

    const startAngle = baseAngleDeg - (spreadDeg * (count - 1)) / 2;

    for (let i = 0; i < count; i++) {
      const bullet = bulletGroup.get(this.x, this.y) as BossBullet;
      if (bullet) {
        const finalAngleDeg = startAngle + i * spreadDeg;
        const finalAngleRad = Phaser.Math.DegToRad(finalAngleDeg);
        bullet.fire(this.x, this.y, finalAngleRad, speed, damage);
      }
    }
  }

  private releaseCircleBlast(count: number, speed: number, damage: number): void {
    const bulletGroup = (this.scene as any).bossBullets as Phaser.GameObjects.Group;
    if (!bulletGroup) return;

    const angleStep = 360 / count;

    for (let i = 0; i < count; i++) {
      const bullet = bulletGroup.get(this.x, this.y) as BossBullet;
      if (bullet) {
        const angleRad = Phaser.Math.DegToRad(i * angleStep);
        bullet.fire(this.x, this.y, angleRad, speed, damage);
      }
    }
  }

  private summonMinions(count: number, types: ('normal' | 'fast' | 'tank')[]): void {
    // Trigger portal effects & add to zombies group
    const zombiesGroup = (this.scene as any).zombies as Phaser.GameObjects.Group;
    const player = (this.scene as any).player as Player;
    if (!zombiesGroup || !player) return;

    for (let i = 0; i < count; i++) {
      // Spawn in a random circle radius around player (e.g. 250px to 400px away)
      const angle = Math.random() * Math.PI * 2;
      const distance = 250 + Math.random() * 150;
      let spawnX = player.x + Math.cos(angle) * distance;
      let spawnY = player.y + Math.sin(angle) * distance;

      // Clamp to map bounds (1600x1200 with 50 margin)
      spawnX = Phaser.Math.Clamp(spawnX, 50, 1550);
      spawnY = Phaser.Math.Clamp(spawnY, 50, 1150);

      const type = types[Math.floor(Math.random() * types.length)];
      const zombie = new Zombie(this.scene, spawnX, spawnY, type);
      zombiesGroup.add(zombie);

      // Portal flash effect at spawn
      const flash = this.scene.add.sprite(spawnX, spawnY, 'boss_bullet');
      flash.setScale(2);
      this.scene.tweens.add({
        targets: flash,
        scale: 0.1,
        alpha: 0,
        duration: 300,
        onComplete: () => flash.destroy()
      });
    }
  }

  public takeDamage(amount: number): boolean {
    if (this.health <= 0) return false;

    this.health = Math.max(0, this.health - amount);

    this.isHurt = true;
    this.hurtTimer = 150;
    this.setTint(0xff5555);

    // Emit blood splatter
    this.spawnBloodSplatter();

    // Trigger Boss HP HUD update
    this.scene.events.emit('boss-health-changed', {
      current: this.health,
      max: this.maxHealth
    });

    if (this.health <= 0) {
      this.die();
      return true;
    }
    return false;
  }

  private spawnBloodSplatter(): void {
    const size = this.bossType === 'mid' ? 8 : 12;
    const particles = this.scene.add.particles(this.x, this.y, 'particle_blood', {
      speed: { min: 60, max: 180 },
      angle: { min: 0, max: 360 },
      scale: { start: 1.5, end: 0 },
      lifespan: 350,
      quantity: size,
      maxParticles: size
    });
    this.scene.time.delayedCall(450, () => particles.destroy());
  }

  private spawnPhaseParticles(): void {
    const count = 20;
    const particles = this.scene.add.particles(this.x, this.y, 'particle_smoke', {
      speed: { min: 80, max: 220 },
      angle: { min: 0, max: 360 },
      scale: { start: 2, end: 0 },
      lifespan: 600,
      quantity: count,
      maxParticles: count
    });
    this.scene.time.delayedCall(700, () => particles.destroy());
  }

  private die(): void {
    this.setVelocity(0, 0);
    this.setActive(false);
    this.setVisible(false);

    // Large explosion
    const particles = this.scene.add.particles(this.x, this.y, 'particle_blood', {
      speed: { min: 80, max: 240 },
      angle: { min: 0, max: 360 },
      scale: { start: 2.5, end: 0 },
      lifespan: 600,
      quantity: 30,
      maxParticles: 30
    });
    this.scene.time.delayedCall(700, () => particles.destroy());

    this.scene.events.emit('boss-killed', this);
    this.destroy();
  }
}
