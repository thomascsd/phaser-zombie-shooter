import Phaser from 'phaser';

export class Bullet extends Phaser.Physics.Arcade.Sprite {
  private damageValue: number = 10;

  constructor(scene: Phaser.Scene, x: number, y: number, texture: string = 'bullet') {
    super(scene, x, y, texture);
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Disable gravity on bullet
    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setAllowGravity(false);
      body.setCollideWorldBounds(false);
    }
  }

  public fire(x: number, y: number, targetX: number, targetY: number, speed: number, damage: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.damageValue = damage;

    // Calculate angle towards target
    const angle = Phaser.Math.Angle.Between(x, y, targetX, targetY);
    this.setRotation(angle);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      this.scene.physics.velocityFromRotation(angle, speed, body.velocity);
    }
  }

  public get damage(): number {
    return this.damageValue;
  }

  protected preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    // Destroy bullet if it goes out of screen bounds
    const camera = this.scene.cameras.main;
    if (
      this.x < camera.scrollX - 50 ||
      this.x > camera.scrollX + camera.width + 50 ||
      this.y < camera.scrollY - 50 ||
      this.y > camera.scrollY + camera.height + 50
    ) {
      this.destroyBullet();
    }
  }

  public destroyBullet(): void {
    this.setActive(false);
    this.setVisible(false);
    this.destroy();
  }
}

export class BossBullet extends Phaser.Physics.Arcade.Sprite {
  private damageValue: number = 15;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'boss_bullet');
    scene.add.existing(this);
    scene.physics.add.existing(this);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      body.setAllowGravity(false);
      body.setCollideWorldBounds(false);
      // Give it circular body shape for better collision
      body.setCircle(6, 2, 2);
    }
  }

  public fire(x: number, y: number, angle: number, speed: number, damage: number): void {
    this.setPosition(x, y);
    this.setActive(true);
    this.setVisible(true);
    this.damageValue = damage;
    this.setRotation(angle);

    const body = this.body as Phaser.Physics.Arcade.Body;
    if (body) {
      this.scene.physics.velocityFromRotation(angle, speed, body.velocity);
    }
  }

  public get damage(): number {
    return this.damageValue;
  }

  protected preUpdate(time: number, delta: number): void {
    super.preUpdate(time, delta);

    const camera = this.scene.cameras.main;
    if (
      this.x < camera.scrollX - 50 ||
      this.x > camera.scrollX + camera.width + 50 ||
      this.y < camera.scrollY - 50 ||
      this.y > camera.scrollY + camera.height + 50
    ) {
      this.setActive(false);
      this.setVisible(false);
      this.destroy();
    }
  }
}
