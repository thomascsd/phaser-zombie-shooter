export interface LevelConfig {
  levelNumber: number;
  targetKills: number;
  spawnInterval: number; // in ms
  spawnComposition: {
    normal: number; // weight
    fast: number;   // weight
    tank: number;   // weight
  };
  hasMidBoss: boolean;
  hasFinalBoss: boolean;
}

export class LevelManager {
  private static levels: LevelConfig[] = [
    {
      levelNumber: 1,
      targetKills: 15,
      spawnInterval: 3000,
      spawnComposition: { normal: 1.0, fast: 0.0, tank: 0.0 },
      hasMidBoss: false,
      hasFinalBoss: false
    },
    {
      levelNumber: 2,
      targetKills: 20, // After 20 normal kills, mid boss spawns
      spawnInterval: 2500,
      spawnComposition: { normal: 1.0, fast: 0.0, tank: 0.0 },
      hasMidBoss: true,
      hasFinalBoss: false
    },
    {
      levelNumber: 3,
      targetKills: 25,
      spawnInterval: 2000,
      spawnComposition: { normal: 0.6, fast: 0.4, tank: 0.0 },
      hasMidBoss: false,
      hasFinalBoss: false
    },
    {
      levelNumber: 4,
      targetKills: 35,
      spawnInterval: 1500,
      spawnComposition: { normal: 0.4, fast: 0.4, tank: 0.2 },
      hasMidBoss: false,
      hasFinalBoss: false
    },
    {
      levelNumber: 5,
      targetKills: 1, // Killing final boss wins
      spawnInterval: 4000, // spawn few minion adds during boss fight
      spawnComposition: { normal: 0.5, fast: 0.5, tank: 0.0 },
      hasMidBoss: false,
      hasFinalBoss: true
    }
  ];

  public currentLevelIndex: number = 0;
  public killsCount: number = 0;
  public totalKillsCount: number = 0;
  public isBossActive: boolean = false;
  public isBossSpawned: boolean = false;

  public get currentLevel(): LevelConfig {
    return LevelManager.levels[this.currentLevelIndex];
  }

  public reset(): void {
    this.currentLevelIndex = 0;
    this.killsCount = 0;
    this.totalKillsCount = 0;
    this.isBossActive = false;
    this.isBossSpawned = false;
  }

  public registerKill(): boolean {
    this.killsCount++;
    this.totalKillsCount++;

    const config = this.currentLevel;

    // Check level progression criteria
    if (config.hasMidBoss) {
      if (this.killsCount >= config.targetKills && !this.isBossSpawned) {
        // Trigger mid boss spawn
        this.isBossActive = true;
        this.isBossSpawned = true;
        return true; // Return true to indicate boss should spawn
      }
    } else if (config.hasFinalBoss) {
      // For level 5, boss spawns immediately. Kills count registers boss death.
      // This is handled in the scene logic when the Boss entity dies.
    } else {
      // Normal level check
      if (this.killsCount >= config.targetKills) {
        this.advanceLevel();
      }
    }
    return false;
  }

  public advanceLevel(): boolean {
    if (this.currentLevelIndex < LevelManager.levels.length - 1) {
      this.currentLevelIndex++;
      this.killsCount = 0;
      this.isBossActive = false;
      this.isBossSpawned = false;
      if (this.currentLevel.hasFinalBoss) {
        this.isBossActive = true;
        this.isBossSpawned = true;
      }
      return true; // Level advanced
    }
    return false; // Already at max level
  }

  public checkVictory(): boolean {
    const config = this.currentLevel;
    if (config.hasFinalBoss && this.killsCount >= config.targetKills) {
      return true;
    }
    return false;
  }

  // Helper to determine what zombie type to spawn
  public getNextSpawnType(): 'normal' | 'fast' | 'tank' {
    const comp = this.currentLevel.spawnComposition;
    const rand = Math.random();

    if (rand < comp.normal) {
      return 'normal';
    } else if (rand < comp.normal + comp.fast) {
      return 'fast';
    } else {
      return 'tank';
    }
  }
}
