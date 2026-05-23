import Phaser from 'phaser';
import { BootScene } from './scenes/BootScene.ts';
import { MenuScene } from './scenes/MenuScene.ts';
import { PlayScene } from './scenes/PlayScene.ts';
import { GameOverScene } from './scenes/GameOverScene.ts';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 1000,
  height: 600,
  parent: 'game-container',
  backgroundColor: '#110e1b',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 800 },
      debug: false
    }
  },
  render: {
    pixelArt: true,
    antialias: false
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [BootScene, MenuScene, PlayScene, GameOverScene]
};
