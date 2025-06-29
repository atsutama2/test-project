import Phaser from 'phaser';
import BattleScene from './scenes/BattleScene.js';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#87CEEB',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 800 },
            debug: false
        }
    },
    scene: BattleScene
};

try {
    const game = new Phaser.Game(config);
} catch (error) {
    console.error('Failed to create game instance:', error);
} 