import Phaser from 'phaser';

export class AssetGenerator {
  public static generateAll(scene: Phaser.Scene): void {
    // 1. Ground Tile (32x32)
    this.createGroundTexture(scene);

    // 2. Brick/Wall Tile (32x32)
    this.createBrickTexture(scene);

    // 3. Player Spritesheet (128x32 - 4 frames of 32x32)
    this.createPlayerSpritesheet(scene);

    // 4. Normal Zombie Spritesheet (96x32 - 3 frames of 32x32)
    this.createZombieNormalSpritesheet(scene);

    // 5. Fast Zombie Spritesheet (96x32 - 3 frames of 32x32)
    this.createZombieFastSpritesheet(scene);

    // 6. Tank Zombie Spritesheet (144x48 - 3 frames of 48x48)
    this.createZombieTankSpritesheet(scene);

    // 7. Mid-Boss Spritesheet (192x64 - 3 frames of 64x64)
    this.createMidBossSpritesheet(scene);

    // 8. Final Boss Spritesheet (288x96 - 3 frames of 96x96)
    this.createFinalBossSpritesheet(scene);

    // 9. Bullet & Projectiles
    this.createBulletTexture(scene);
    this.createBossBulletTexture(scene);

    // 10. Particles
    this.createParticleTextures(scene);

    // 11. UI Elements
    this.createUITextures(scene);
  }

  private static drawPixel(ctx: CanvasRenderingContext2D, x: number, y: number, color: string, scale: number = 2): void {
    ctx.fillStyle = color;
    ctx.fillRect(x * scale, y * scale, scale, scale);
  }

  private static createGroundTexture(scene: Phaser.Scene): void {
    const key = 'ground';
    const size = 32;
    const canvas = scene.textures.createCanvas(key, size, size);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Fill base
    ctx.fillStyle = '#2c253d'; // Deep purple/grey
    ctx.fillRect(0, 0, size, size);

    // Draw dirt pattern/cracks (pixel scale = 2)
    const scale = 2;
    const colors = {
      dark: '#1d1729',
      light: '#3d3454'
    };

    // Border lines
    ctx.fillStyle = colors.dark;
    ctx.fillRect(0, size - 2, size, 2);
    ctx.fillRect(size - 2, 0, 2, size);

    ctx.fillStyle = colors.light;
    ctx.fillRect(0, 0, size, 2);
    ctx.fillRect(0, 0, 2, size);

    // Random speckles
    this.drawPixel(ctx, 4, 3, colors.light, scale);
    this.drawPixel(ctx, 5, 8, colors.dark, scale);
    this.drawPixel(ctx, 11, 5, colors.light, scale);
    this.drawPixel(ctx, 8, 12, colors.dark, scale);
    this.drawPixel(ctx, 2, 10, colors.light, scale);
    this.drawPixel(ctx, 14, 11, colors.dark, scale);

    canvas.refresh();
  }

  private static createBrickTexture(scene: Phaser.Scene): void {
    const key = 'brick';
    const size = 32;
    const canvas = scene.textures.createCanvas(key, size, size);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Fill base
    ctx.fillStyle = '#423934'; // Dark orange-brown brick
    ctx.fillRect(0, 0, size, size);

    const colors = {
      line: '#27201c',
      highlight: '#5c504a'
    };

    // Brick mortar lines
    ctx.fillStyle = colors.line;
    ctx.fillRect(0, size - 2, size, 2); // bottom line
    ctx.fillRect(0, 14, size, 2); // middle line
    ctx.fillRect(14, 0, 2, 14); // vertical left
    ctx.fillRect(30, 16, 2, 14); // vertical right
    ctx.fillRect(6, 16, 2, 14); // vertical middle-right

    // Highlights
    ctx.fillStyle = colors.highlight;
    ctx.fillRect(0, 0, 14, 2);
    ctx.fillRect(0, 16, 6, 2);
    ctx.fillRect(8, 16, 22, 2);

    canvas.refresh();
  }

  private static createPlayerSpritesheet(scene: Phaser.Scene): void {
    const key = 'player';
    const frameWidth = 32;
    const frameHeight = 32;
    const numFrames = 4;
    const canvas = scene.textures.createCanvas(key, frameWidth * numFrames, frameHeight);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const scale = 2; // 16x16 virtual pixels inside 32x32 canvas

    // Palettes
    const helmet = '#3e613c'; // Dark green
    const armor = '#263b5e'; // Navy blue
    const skin = '#fcd0a1'; // Peach
    const visor = '#3ae6c7'; // Cyan visor
    const boots = '#1a191f'; // Dark grey
    const pants = '#4b3e34'; // Brownish
    const gun = '#2a2b30'; // Gunmetal
    const laser = '#ff3366'; // Gun laser

    // Frame 0: Idle
    this.drawPlayerFrame(ctx, 0, 0, false, helmet, armor, skin, visor, boots, pants, gun, laser, scale);
    // Frame 1: Walk 1
    this.drawPlayerFrame(ctx, 1, 1, false, helmet, armor, skin, visor, boots, pants, gun, laser, scale);
    // Frame 2: Walk 2
    this.drawPlayerFrame(ctx, 2, 2, false, helmet, armor, skin, visor, boots, pants, gun, laser, scale);
    // Frame 3: Jump
    this.drawPlayerFrame(ctx, 3, 3, false, helmet, armor, skin, visor, boots, pants, gun, laser, scale);

    canvas.refresh();

    // Define frames inside spritesheet
    for (let i = 0; i < numFrames; i++) {
      canvas.add(i.toString(), 0, i * frameWidth, 0, frameWidth, frameHeight);
    }
  }

  private static drawPlayerFrame(
    ctx: CanvasRenderingContext2D,
    frameIndex: number,
    walkState: number,
    isHurt: boolean,
    helmet: string,
    armor: string,
    skin: string,
    visor: string,
    boots: string,
    pants: string,
    gun: string,
    laser: string,
    scale: number
  ): void {
    const ox = frameIndex * 16; // offsets in grid coords

    // Body base offset depending on animation state
    let headY = 2;
    let chestY = 6;
    let legsOffset = 0;

    if (walkState === 1) {
      headY = 3;
      chestY = 7;
      legsOffset = 1;
    } else if (walkState === 2) {
      headY = 2;
      chestY = 6;
      legsOffset = 2;
    } else if (walkState === 3) {
      headY = 1;
      chestY = 5;
      legsOffset = 3;
    }

    if (isHurt) {
      helmet = '#ff6b6b';
      armor = '#ff6b6b';
      skin = '#ff8787';
    }

    // --- Draw Legs & Boots ---
    if (legsOffset === 0) {
      // Idle legs
      this.drawPixel(ctx, ox + 6, 12, pants, scale);
      this.drawPixel(ctx, ox + 9, 12, pants, scale);
      this.drawPixel(ctx, ox + 6, 13, boots, scale);
      this.drawPixel(ctx, ox + 9, 13, boots, scale);
      this.drawPixel(ctx, ox + 5, 14, boots, scale);
      this.drawPixel(ctx, ox + 9, 14, boots, scale);
    } else if (legsOffset === 1) {
      // Walk frame 1
      this.drawPixel(ctx, ox + 5, 13, pants, scale);
      this.drawPixel(ctx, ox + 8, 13, pants, scale);
      this.drawPixel(ctx, ox + 4, 14, boots, scale);
      this.drawPixel(ctx, ox + 9, 14, boots, scale);
    } else if (legsOffset === 2) {
      // Walk frame 2
      this.drawPixel(ctx, ox + 7, 13, pants, scale);
      this.drawPixel(ctx, ox + 10, 13, pants, scale);
      this.drawPixel(ctx, ox + 6, 14, boots, scale);
      this.drawPixel(ctx, ox + 11, 14, boots, scale);
    } else if (legsOffset === 3) {
      // Jump pose legs
      this.drawPixel(ctx, ox + 5, 11, pants, scale);
      this.drawPixel(ctx, ox + 10, 11, pants, scale);
      this.drawPixel(ctx, ox + 4, 12, boots, scale);
      this.drawPixel(ctx, ox + 11, 12, boots, scale);
    }

    // --- Draw Body/Chest/Armour ---
    for (let x = 5; x <= 10; x++) {
      for (let y = chestY; y <= chestY + 5; y++) {
        this.drawPixel(ctx, ox + x, y, armor, scale);
      }
    }
    // Arm/Sleeve
    this.drawPixel(ctx, ox + 4, chestY + 2, skin, scale);
    this.drawPixel(ctx, ox + 5, chestY + 1, armor, scale);

    // --- Draw Head & Helmet ---
    for (let x = 6; x <= 9; x++) {
      for (let y = headY + 1; y <= headY + 3; y++) {
        this.drawPixel(ctx, ox + x, y, skin, scale);
      }
    }
    // Helmet top
    for (let x = 5; x <= 10; x++) {
      this.drawPixel(ctx, ox + x, headY, helmet, scale);
    }
    this.drawPixel(ctx, ox + 5, headY + 1, helmet, scale);
    this.drawPixel(ctx, ox + 10, headY + 1, helmet, scale);
    // Visor
    this.drawPixel(ctx, ox + 8, headY + 1, visor, scale);
    this.drawPixel(ctx, ox + 9, headY + 1, visor, scale);

    // --- Draw Gun ---
    // Gun body
    for (let gx = 9; gx <= 14; gx++) {
      this.drawPixel(ctx, ox + gx, chestY + 3, gun, scale);
    }
    this.drawPixel(ctx, ox + 10, chestY + 4, gun, scale); // Grip
    // Gun laser sight dot at the end
    this.drawPixel(ctx, ox + 14, chestY + 3, laser, scale);
  }

  private static createZombieNormalSpritesheet(scene: Phaser.Scene): void {
    const key = 'zombie_normal';
    const frameWidth = 32;
    const frameHeight = 32;
    const numFrames = 3;
    const canvas = scene.textures.createCanvas(key, frameWidth * numFrames, frameHeight);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const scale = 2;
    // Normal Zombie colors
    const skin = '#4d8c58'; // Green
    const clothes = '#3c354a'; // Tattered purple
    const eyes = '#ff0033'; // Red glowing eyes
    const darkGreen = '#2e5d37';

    for (let f = 0; f < numFrames; f++) {
      this.drawZombieFrame(ctx, f, f, skin, clothes, eyes, darkGreen, false, scale);
    }

    canvas.refresh();
    for (let i = 0; i < numFrames; i++) {
      canvas.add(i.toString(), 0, i * frameWidth, 0, frameWidth, frameHeight);
    }
  }

  private static createZombieFastSpritesheet(scene: Phaser.Scene): void {
    const key = 'zombie_fast';
    const frameWidth = 32;
    const frameHeight = 32;
    const numFrames = 3;
    const canvas = scene.textures.createCanvas(key, frameWidth * numFrames, frameHeight);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const scale = 2;
    // Fast zombie colors (reddish, angry)
    const skin = '#8c3d3d'; // Crimson
    const clothes = '#a68b44'; // Dirty yellow
    const eyes = '#ffff00'; // Yellow glowing eyes
    const shadow = '#5e2525';

    for (let f = 0; f < numFrames; f++) {
      this.drawZombieFrame(ctx, f, f, skin, clothes, eyes, shadow, true, scale);
    }

    canvas.refresh();
    for (let i = 0; i < numFrames; i++) {
      canvas.add(i.toString(), 0, i * frameWidth, 0, frameWidth, frameHeight);
    }
  }

  private static drawZombieFrame(
    ctx: CanvasRenderingContext2D,
    frameIndex: number,
    walkState: number,
    skin: string,
    clothes: string,
    eyes: string,
    shadow: string,
    isFastRunner: boolean,
    scale: number
  ): void {
    const ox = frameIndex * 16;
    let headY = 2;
    let chestY = 6;
    let legsOffset = walkState;

    if (isFastRunner) {
      // Lean forward animation
      headY = 3;
      chestY = 5;
    }

    // Legs
    if (legsOffset === 0) {
      this.drawPixel(ctx, ox + 6, 12, clothes, scale);
      this.drawPixel(ctx, ox + 9, 12, clothes, scale);
      this.drawPixel(ctx, ox + 6, 13, skin, scale);
      this.drawPixel(ctx, ox + 9, 13, skin, scale);
      this.drawPixel(ctx, ox + 5, 14, shadow, scale);
      this.drawPixel(ctx, ox + 9, 14, shadow, scale);
    } else if (legsOffset === 1) {
      this.drawPixel(ctx, ox + 5, 12, clothes, scale);
      this.drawPixel(ctx, ox + 8, 12, clothes, scale);
      this.drawPixel(ctx, ox + 4, 13, skin, scale);
      this.drawPixel(ctx, ox + 9, 13, skin, scale);
      this.drawPixel(ctx, ox + 3, 14, shadow, scale);
      this.drawPixel(ctx, ox + 10, 14, shadow, scale);
    } else {
      this.drawPixel(ctx, ox + 7, 12, clothes, scale);
      this.drawPixel(ctx, ox + 10, 12, clothes, scale);
      this.drawPixel(ctx, ox + 6, 13, skin, scale);
      this.drawPixel(ctx, ox + 11, 13, skin, scale);
      this.drawPixel(ctx, ox + 6, 14, shadow, scale);
      this.drawPixel(ctx, ox + 12, 14, shadow, scale);
    }

    // Chest & Armour/Clothes
    const reachX = isFastRunner ? 12 : 11;
    for (let x = 5; x <= 9; x++) {
      for (let y = chestY; y <= chestY + 5; y++) {
        this.drawPixel(ctx, ox + x, y, clothes, scale);
      }
    }

    // Reaching out hands (Zombie arms pointing forward)
    for (let hx = 9; hx <= reachX; hx++) {
      this.drawPixel(ctx, ox + hx, chestY + 1, skin, scale);
      this.drawPixel(ctx, ox + hx, chestY + 3, skin, scale);
    }

    // Head
    for (let x = 5; x <= 8; x++) {
      for (let y = headY; y <= headY + 3; y++) {
        this.drawPixel(ctx, ox + x, y, skin, scale);
      }
    }
    // Eyes
    this.drawPixel(ctx, ox + 8, headY + 1, eyes, scale);
    // Open mouth
    this.drawPixel(ctx, ox + 7, headY + 3, shadow, scale);
  }

  private static createZombieTankSpritesheet(scene: Phaser.Scene): void {
    const key = 'zombie_tank';
    const frameWidth = 48;
    const frameHeight = 48;
    const numFrames = 3;
    const canvas = scene.textures.createCanvas(key, frameWidth * numFrames, frameHeight);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const scale = 2; // 24x24 pixels inside 48x48 canvas

    const skin = '#52695c'; // Dull grey-green skin
    const clothes = '#54463d'; // Tattered brown
    const eyes = '#ff6600'; // Orange eyes
    const darkSkin = '#33423a';

    for (let f = 0; f < numFrames; f++) {
      const ox = f * 24;
      const walkState = f;

      // Legs
      if (walkState === 0) {
        ctx.fillStyle = clothes;
        ctx.fillRect((ox + 8) * scale, 17 * scale, 3 * scale, 4 * scale);
        ctx.fillRect((ox + 13) * scale, 17 * scale, 3 * scale, 4 * scale);
        ctx.fillStyle = skin;
        ctx.fillRect((ox + 8) * scale, 21 * scale, 3 * scale, 2 * scale);
        ctx.fillRect((ox + 13) * scale, 21 * scale, 3 * scale, 2 * scale);
      } else if (walkState === 1) {
        ctx.fillStyle = clothes;
        ctx.fillRect((ox + 6) * scale, 17 * scale, 3 * scale, 4 * scale);
        ctx.fillRect((ox + 11) * scale, 17 * scale, 3 * scale, 4 * scale);
        ctx.fillStyle = skin;
        ctx.fillRect((ox + 5) * scale, 21 * scale, 3 * scale, 2 * scale);
        ctx.fillRect((ox + 12) * scale, 21 * scale, 3 * scale, 2 * scale);
      } else {
        ctx.fillStyle = clothes;
        ctx.fillRect((ox + 10) * scale, 17 * scale, 3 * scale, 4 * scale);
        ctx.fillRect((ox + 15) * scale, 17 * scale, 3 * scale, 4 * scale);
        ctx.fillStyle = skin;
        ctx.fillRect((ox + 9) * scale, 21 * scale, 3 * scale, 2 * scale);
        ctx.fillRect((ox + 16) * scale, 21 * scale, 3 * scale, 2 * scale);
      }

      // Massive chest
      ctx.fillStyle = clothes;
      ctx.fillRect((ox + 6) * scale, 8 * scale, 12 * scale, 9 * scale);

      // Huge shoulders/arms
      ctx.fillStyle = skin;
      ctx.fillRect((ox + 4) * scale, 9 * scale, 3 * scale, 6 * scale); // back arm
      ctx.fillRect((ox + 16) * scale, 8 * scale, 6 * scale, 4 * scale); // front arm reaching forward

      // Big head
      ctx.fillStyle = skin;
      ctx.fillRect((ox + 9) * scale, 3 * scale, 6 * scale, 5 * scale);
      ctx.fillStyle = eyes;
      ctx.fillRect((ox + 14) * scale, 4 * scale, 1 * scale, 1 * scale); // eye
      ctx.fillStyle = darkSkin;
      ctx.fillRect((ox + 12) * scale, 6 * scale, 2 * scale, 1 * scale); // mouth
    }

    canvas.refresh();
    for (let i = 0; i < numFrames; i++) {
      canvas.add(i.toString(), 0, i * frameWidth, 0, frameWidth, frameHeight);
    }
  }

  private static createMidBossSpritesheet(scene: Phaser.Scene): void {
    const key = 'mid_boss';
    const frameWidth = 64;
    const frameHeight = 64;
    const numFrames = 3;
    const canvas = scene.textures.createCanvas(key, frameWidth * numFrames, frameHeight);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const scale = 2; // 32x32 virtual pixels inside 64x64 canvas
    const skin = '#8c3d9c'; // Purple boss skin
    const armor = '#352e42'; // Dark slate armor
    const glow = '#e63ae0'; // Neon magenta glow

    for (let f = 0; f < numFrames; f++) {
      const ox = f * 32;
      const walkState = f;

      // Legs
      if (walkState === 0) {
        ctx.fillStyle = armor;
        ctx.fillRect((ox + 10) * scale, 22 * scale, 4 * scale, 6 * scale);
        ctx.fillRect((ox + 18) * scale, 22 * scale, 4 * scale, 6 * scale);
        ctx.fillStyle = skin;
        ctx.fillRect((ox + 9) * scale, 28 * scale, 5 * scale, 3 * scale);
        ctx.fillRect((ox + 18) * scale, 28 * scale, 5 * scale, 3 * scale);
      } else if (walkState === 1) {
        ctx.fillStyle = armor;
        ctx.fillRect((ox + 8) * scale, 22 * scale, 4 * scale, 6 * scale);
        ctx.fillRect((ox + 16) * scale, 22 * scale, 4 * scale, 6 * scale);
        ctx.fillStyle = skin;
        ctx.fillRect((ox + 7) * scale, 28 * scale, 5 * scale, 3 * scale);
        ctx.fillRect((ox + 17) * scale, 28 * scale, 5 * scale, 3 * scale);
      } else {
        ctx.fillStyle = armor;
        ctx.fillRect((ox + 12) * scale, 22 * scale, 4 * scale, 6 * scale);
        ctx.fillRect((ox + 20) * scale, 22 * scale, 4 * scale, 6 * scale);
        ctx.fillStyle = skin;
        ctx.fillRect((ox + 11) * scale, 28 * scale, 5 * scale, 3 * scale);
        ctx.fillRect((ox + 20) * scale, 28 * scale, 5 * scale, 3 * scale);
      }

      // Torso / Spikes
      ctx.fillStyle = armor;
      ctx.fillRect((ox + 8) * scale, 10 * scale, 16 * scale, 12 * scale);
      // Spikes on back
      ctx.fillStyle = glow;
      ctx.fillRect((ox + 6) * scale, 9 * scale, 2 * scale, 2 * scale);
      ctx.fillRect((ox + 5) * scale, 13 * scale, 2 * scale, 2 * scale);
      ctx.fillRect((ox + 6) * scale, 17 * scale, 2 * scale, 2 * scale);

      // Huge purple arm pointing forward
      ctx.fillStyle = skin;
      ctx.fillRect((ox + 22) * scale, 12 * scale, 8 * scale, 5 * scale);
      ctx.fillStyle = glow;
      ctx.fillRect((ox + 29) * scale, 13 * scale, 2 * scale, 3 * scale); // Claws

      // Head with glowing visor/eyes
      ctx.fillStyle = skin;
      ctx.fillRect((ox + 12) * scale, 4 * scale, 8 * scale, 6 * scale);
      ctx.fillStyle = armor;
      ctx.fillRect((ox + 11) * scale, 3 * scale, 10 * scale, 2 * scale); // Helmet top
      ctx.fillStyle = glow;
      ctx.fillRect((ox + 18) * scale, 5 * scale, 2 * scale, 1 * scale); // Eye visor
    }

    canvas.refresh();
    for (let i = 0; i < numFrames; i++) {
      canvas.add(i.toString(), 0, i * frameWidth, 0, frameWidth, frameHeight);
    }
  }

  private static createFinalBossSpritesheet(scene: Phaser.Scene): void {
    const key = 'final_boss';
    const frameWidth = 96;
    const frameHeight = 96;
    const numFrames = 3;
    const canvas = scene.textures.createCanvas(key, frameWidth * numFrames, frameHeight);
    if (!canvas) return;
    const ctx = canvas.getContext();

    const scale = 2; // 48x48 virtual pixels inside 96x96 canvas
    const armor = '#1e1c24'; // Very dark grey
    const body = '#781515'; // Dark red
    const glow = '#ff003c'; // Bright glowing red
    const horns = '#d9bf8f'; // Ivory horn color

    for (let f = 0; f < numFrames; f++) {
      const ox = f * 48;
      const walkState = f;

      // Heavy Legs
      if (walkState === 0) {
        ctx.fillStyle = armor;
        ctx.fillRect((ox + 14) * scale, 35 * scale, 6 * scale, 9 * scale);
        ctx.fillRect((ox + 26) * scale, 35 * scale, 6 * scale, 9 * scale);
        ctx.fillStyle = body;
        ctx.fillRect((ox + 12) * scale, 44 * scale, 8 * scale, 4 * scale);
        ctx.fillRect((ox + 26) * scale, 44 * scale, 8 * scale, 4 * scale);
      } else if (walkState === 1) {
        ctx.fillStyle = armor;
        ctx.fillRect((ox + 11) * scale, 35 * scale, 6 * scale, 9 * scale);
        ctx.fillRect((ox + 23) * scale, 35 * scale, 6 * scale, 9 * scale);
        ctx.fillStyle = body;
        ctx.fillRect((ox + 9) * scale, 44 * scale, 8 * scale, 4 * scale);
        ctx.fillRect((ox + 23) * scale, 44 * scale, 8 * scale, 4 * scale);
      } else {
        ctx.fillStyle = armor;
        ctx.fillRect((ox + 17) * scale, 35 * scale, 6 * scale, 9 * scale);
        ctx.fillRect((ox + 29) * scale, 35 * scale, 6 * scale, 9 * scale);
        ctx.fillStyle = body;
        ctx.fillRect((ox + 15) * scale, 44 * scale, 8 * scale, 4 * scale);
        ctx.fillRect((ox + 29) * scale, 44 * scale, 8 * scale, 4 * scale);
      }

      // Giant Torso / Shell
      ctx.fillStyle = armor;
      ctx.fillRect((ox + 10) * scale, 16 * scale, 26 * scale, 20 * scale);
      // Ribcage detail
      ctx.fillStyle = glow;
      ctx.fillRect((ox + 18) * scale, 22 * scale, 10 * scale, 2 * scale);
      ctx.fillRect((ox + 20) * scale, 26 * scale, 6 * scale, 2 * scale);
      ctx.fillRect((ox + 22) * scale, 30 * scale, 2 * scale, 4 * scale);

      // Massive Claw Arms reaching forward
      ctx.fillStyle = body;
      ctx.fillRect((ox + 34) * scale, 18 * scale, 10 * scale, 8 * scale); // Top arm
      ctx.fillRect((ox + 32) * scale, 26 * scale, 8 * scale, 6 * scale); // Lower arm
      ctx.fillStyle = glow;
      ctx.fillRect((ox + 43) * scale, 19 * scale, 3 * scale, 6 * scale); // Glowing top claws
      ctx.fillRect((ox + 39) * scale, 27 * scale, 3 * scale, 4 * scale); // Glowing low claws

      // Demonic Head
      ctx.fillStyle = body;
      ctx.fillRect((ox + 18) * scale, 6 * scale, 12 * scale, 10 * scale);
      // Glowing Red Eyes
      ctx.fillStyle = glow;
      ctx.fillRect((ox + 26) * scale, 9 * scale, 3 * scale, 2 * scale);
      // Large Ivory Horns
      ctx.fillStyle = horns;
      ctx.fillRect((ox + 14) * scale, 2 * scale, 4 * scale, 5 * scale); // Left horn
      ctx.fillRect((ox + 14) * scale, 2 * scale, 8 * scale, 2 * scale);
      ctx.fillRect((ox + 28) * scale, 2 * scale, 4 * scale, 5 * scale); // Right horn
      ctx.fillRect((ox + 24) * scale, 2 * scale, 8 * scale, 2 * scale);
    }

    canvas.refresh();
    for (let i = 0; i < numFrames; i++) {
      canvas.add(i.toString(), 0, i * frameWidth, 0, frameWidth, frameHeight);
    }
  }

  private static createBulletTexture(scene: Phaser.Scene): void {
    const key = 'bullet';
    const canvas = scene.textures.createCanvas(key, 8, 8);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Yellow center with orange shell
    ctx.fillStyle = '#ffaa00';
    ctx.fillRect(0, 0, 8, 8);
    ctx.fillStyle = '#ffff55';
    ctx.fillRect(2, 2, 4, 4);

    canvas.refresh();
  }

  private static createBossBulletTexture(scene: Phaser.Scene): void {
    const key = 'boss_bullet';
    const canvas = scene.textures.createCanvas(key, 16, 16);
    if (!canvas) return;
    const ctx = canvas.getContext();

    // Glowing purple orb
    ctx.fillStyle = 'rgba(170, 59, 255, 0.4)';
    ctx.fillRect(0, 0, 16, 16);
    ctx.fillStyle = '#d946ef';
    ctx.fillRect(2, 2, 12, 12);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(5, 5, 6, 6);

    canvas.refresh();
  }

  private static createParticleTextures(scene: Phaser.Scene): void {
    // 1. Blood particle (red)
    const bloodCanvas = scene.textures.createCanvas('particle_blood', 4, 4);
    if (bloodCanvas) {
      const ctx = bloodCanvas.getContext();
      ctx.fillStyle = '#d32f2f'; // Dark red
      ctx.fillRect(0, 0, 4, 4);
      bloodCanvas.refresh();
    }

    // 2. Muzzle flash/spark particle (yellow/orange)
    const sparkCanvas = scene.textures.createCanvas('particle_spark', 4, 4);
    if (sparkCanvas) {
      const ctx = sparkCanvas.getContext();
      ctx.fillStyle = '#ffeb3b'; // Yellow
      ctx.fillRect(0, 0, 4, 4);
      sparkCanvas.refresh();
    }

    // 3. Smoke particle (grey)
    const smokeCanvas = scene.textures.createCanvas('particle_smoke', 8, 8);
    if (smokeCanvas) {
      const ctx = smokeCanvas.getContext();
      ctx.fillStyle = '#555555';
      ctx.fillRect(0, 0, 8, 8);
      ctx.fillStyle = '#888888';
      ctx.fillRect(2, 2, 4, 4);
      smokeCanvas.refresh();
    }
  }

  private static createUITextures(scene: Phaser.Scene): void {
    // 1. Heart (16x16)
    const heartCanvas = scene.textures.createCanvas('ui_heart', 16, 16);
    if (heartCanvas) {
      const ctx = heartCanvas.getContext();
      const p = '#ff003c'; // red
      const s = '#8c0022'; // shadow
      const w = '#ffffff'; // white highlight

      // Red Heart pixels
      ctx.fillStyle = p;
      // top lobes
      ctx.fillRect(2, 2, 4, 4);
      ctx.fillRect(10, 2, 4, 4);
      ctx.fillRect(1, 4, 14, 6);
      ctx.fillRect(2, 10, 12, 2);
      ctx.fillRect(4, 12, 8, 2);
      ctx.fillRect(6, 14, 4, 2);

      // shadow outline bottom
      ctx.fillStyle = s;
      ctx.fillRect(1, 9, 1, 1);
      ctx.fillRect(2, 11, 2, 1);
      ctx.fillRect(4, 13, 2, 1);
      ctx.fillRect(6, 15, 4, 1);
      ctx.fillRect(10, 13, 2, 1);
      ctx.fillRect(12, 11, 2, 1);
      ctx.fillRect(14, 9, 1, 1);

      // highlight top-left
      ctx.fillStyle = w;
      ctx.fillRect(3, 3, 2, 2);

      heartCanvas.refresh();
    }

    // 2. Crosshair (32x32)
    const crossCanvas = scene.textures.createCanvas('ui_crosshair', 32, 32);
    if (crossCanvas) {
      const ctx = crossCanvas.getContext();
      ctx.strokeStyle = '#3bf1a9'; // neon green crosshair
      ctx.lineWidth = 2;

      // Circle
      ctx.beginPath();
      ctx.arc(16, 16, 10, 0, Math.PI * 2);
      ctx.stroke();

      // Inner dot
      ctx.fillStyle = '#3bf1a9';
      ctx.fillRect(15, 15, 2, 2);

      // Cross lines
      ctx.beginPath();
      ctx.moveTo(16, 2);
      ctx.lineTo(16, 8);
      ctx.moveTo(16, 24);
      ctx.lineTo(16, 30);
      ctx.moveTo(2, 16);
      ctx.lineTo(8, 16);
      ctx.moveTo(24, 16);
      ctx.lineTo(30, 16);
      ctx.stroke();

      crossCanvas.refresh();
    }
  }
}
