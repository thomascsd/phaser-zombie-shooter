import Phaser from 'phaser';
import { GameConfig } from './config.ts';

window.addEventListener('load', () => {
  new Phaser.Game(GameConfig);
});
