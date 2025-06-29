import Player from '../entities/Player.js';
import Enemy from '../entities/Enemy.js';
import GameUI from '../ui/GameUI.js';

export default class BattleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BattleScene' });
        this.player = null;
        this.enemies = [];
        this.platforms = [];
        this.skills = [];
        this.particles = [];
        this.ui = null;
        this.keyA = null;
        this.keyD = null;
        this.keyW = null;
        this.keyZ = null;
        this.keyS = null;
    }

    preload() {
        try {
            // プレイヤースプライト（10x10緑色PNG）
            this.load.image('player', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVQoU2NkYGD4z0AEYBxVSFJgFIwCAGwABZkQn2wAAAAASUVORK5CYII=');
            
            // 敵スプライト（10x10赤色PNG）
            this.load.image('enemy', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAAFUlEQVQoU2NkYGD4z0AEYRxVSFJgFIwCAGwABZkQn2wAAAAASUVORK5CYII=');
            
            // スキルエフェクト（仮の色付き矩形）
            this.load.image('fireball', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
            this.load.image('lightning', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
            
            // 背景・プラットフォーム
            this.load.image('ground', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
        } catch (error) {
            console.error('BattleScene: preload error:', error);
        }
    }

    create() {
        try {
            // 背景作成
            this.createBackground();
            
            // プラットフォーム作成
            this.createPlatforms();
            
            // プレイヤー作成
            this.player = new Player(this, 100, 300);
            
            // 敵作成
            this.createEnemies();
            
            // カメラ設定
            this.cameras.main.setBounds(0, 0, 1600, 600);
            this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
            
            // 物理設定
            this.physics.world.setBounds(0, 0, 1600, 600);
            
            // 入力処理
            this.setupInput();
            
            // UI作成
            this.ui = new GameUI(this);
            
            // 衝突判定設定
            this.setupCollisions();
            
            // ゲームループ開始
            this.time.addEvent({
                delay: 3000,
                callback: this.spawnEnemy,
                callbackScope: this,
                loop: true
            });
        } catch (error) {
            console.error('BattleScene: create error:', error);
        }
    }

    createBackground() {
        // グラデーション背景
        const bg = this.add.graphics();
        bg.fillGradientStyle(0x87CEEB, 0x87CEEB, 0x98FB98, 0x98FB98, 1);
        bg.fillRect(0, 0, 1600, 600);
        
        // 雲の装飾
        for (let i = 0; i < 5; i++) {
            const cloud = this.add.graphics();
            cloud.fillStyle(0xFFFFFF, 0.7);
            cloud.fillEllipse(200 + i * 300, 100 + Math.sin(i) * 50, 80, 40);
        }
    }

    createPlatforms() {
        // 地面
        const ground = this.physics.add.staticGroup();
        ground.create(400, 580, 'ground').setScale(800, 40).refreshBody();
        ground.create(1200, 580, 'ground').setScale(800, 40).refreshBody();
        
        // 浮遊プラットフォーム
        const platforms = [
            { x: 300, y: 450, width: 200, height: 20 },
            { x: 600, y: 350, width: 200, height: 20 },
            { x: 900, y: 450, width: 200, height: 20 },
            { x: 1200, y: 350, width: 200, height: 20 }
        ];
        
        platforms.forEach(platform => {
            const p = this.physics.add.staticImage(platform.x, platform.y, 'ground');
            p.setScale(platform.width, platform.height);
            p.refreshBody();
            this.platforms.push(p);
        });
    }

    createEnemies() {
        // 初期敵を配置
        const enemyPositions = [
            { x: 400, y: 500 },
            { x: 800, y: 500 },
            { x: 1200, y: 500 }
        ];
        
        enemyPositions.forEach(pos => {
            const enemy = new Enemy(this, pos.x, pos.y);
            this.enemies.push(enemy);
        });
    }

    setupInput() {
        // A:左, D:右, W:ジャンプ, Z:攻撃, S:スキル
        this.keyA = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
        this.keyD = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
        this.keyW = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
        this.keyZ = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.keyS = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    }

    setupCollisions() {
        // プレイヤーとプラットフォーム
        this.physics.add.collider(this.player, this.platforms);
        
        // プレイヤーと敵
        this.physics.add.collider(this.player, this.enemies, this.handlePlayerEnemyCollision, null, this);
        
        // スキルと敵
        this.skills.forEach(skill => {
            this.physics.add.collider(skill, this.enemies, this.handleSkillEnemyCollision, null, this);
        });
    }

    update() {
        // A:左, D:右
        if (this.keyA.isDown) {
            this.player.setVelocityX(-200);
            this.player.setFlipX(true);
        } else if (this.keyD.isDown) {
            this.player.setVelocityX(200);
            this.player.setFlipX(false);
        } else {
            this.player.setVelocityX(0);
        }
        // W:ジャンプ
        if (Phaser.Input.Keyboard.JustDown(this.keyW)) {
            this.player.jump();
        }
        // Z:攻撃
        if (Phaser.Input.Keyboard.JustDown(this.keyZ)) {
            this.player.attack();
        }
        // S:スキル
        if (this.keyS.isDown) {
            this.player.useSkill('fireball');
        }
        // プレイヤー更新
        this.player.update({ left: this.keyA, right: this.keyD });
        // 敵更新
        this.enemies.forEach(enemy => enemy.update());
        // スキル更新
        this.skills.forEach(skill => {
            if (skill.active && !skill.destroyed) {
                skill.update();
            }
        });
        // destroyされたスキルを配列から削除
        this.skills = this.skills.filter(skill => skill.active && !skill.destroyed);
        // ホーミングミサイルの当たり判定
        const skillsToDestroy = []; // destroyするスキルのインデックスを記録
        const enemiesToDestroy = []; // destroyする敵のインデックスを記録
        
        for (let i = this.skills.length - 1; i >= 0; i--) {
            const skill = this.skills[i];
            if (skill.skillType === 'fireball' && skill.active) {
                for (let j = this.enemies.length - 1; j >= 0; j--) {
                    const enemy = this.enemies[j];
                    if (!enemy.active) continue;
                    
                    const distance = Phaser.Math.Distance.Between(skill.x, skill.y, enemy.x, enemy.y);
                    
                    if (distance < 80) { // 衝突判定距離を80に変更
                        // destroyするスキルと敵を記録
                        skillsToDestroy.push({ index: i, skill: skill });
                        enemiesToDestroy.push({ index: j, enemy: enemy, damage: skill.damage });
                        
                        // このミサイルの処理を終了
                        break;
                    }
                }
            }
        }
        
        // 記録されたスキルと敵をdestroy
        skillsToDestroy.forEach(({ index, skill }) => {
            // ミサイルを即座に無効化
            skill.active = false;
            // ミサイルのエフェクトを完全に消す
            if (skill.effectGraphics) {
                skill.effectGraphics.destroy();
                skill.effectGraphics = null;
            }
            // ミサイルを先に消す
            skill.destroy();
            // skills配列からも削除
            this.skills.splice(index, 1);
        });
        
        enemiesToDestroy.forEach(({ index, enemy, damage }) => {
            // 爆発エフェクト
            this.createHitEffect(enemy.x, enemy.y);
            // 敵にダメージを与える
            enemy.takeDamage(damage);
            // 敵が倒されたら配列から削除
            if (enemy.health <= 0) {
                this.enemies.splice(index, 1);
                enemy.destroy();
                this.player.gainExp(10);
            }
        });
        // UI更新
        this.ui.update(this.player);
        // カメラ更新
        this.updateCamera();
        // ゲーム状態チェック
        this.checkGameState();
    }

    updateCamera() {
        // カメラの境界設定
        const camera = this.cameras.main;
        const playerX = this.player.x;
        
        // プレイヤーが画面端に近づいたらカメラを移動
        if (playerX < 200) {
            camera.scrollX = Math.max(0, playerX - 200);
        } else if (playerX > 1400) {
            camera.scrollX = Math.min(800, playerX - 600);
        }
    }

    checkGameState() {
        // 敵が全滅したら新しい敵を生成
        if (this.enemies.length === 0) {
            this.spawnEnemy();
        }
        
        // プレイヤーのHPが0になったらゲームオーバー
        if (this.player.health <= 0) {
            this.gameOver();
        }
    }

    spawnEnemy() {
        const x = Phaser.Math.Between(200, 1400);
        const y = 500;
        const enemy = new Enemy(this, x, y);
        this.enemies.push(enemy);
        
        // 衝突判定を再設定
        this.physics.add.collider(this.player, enemy, this.handlePlayerEnemyCollision, null, this);
        this.skills.forEach(skill => {
            this.physics.add.collider(skill, enemy, this.handleSkillEnemyCollision, null, this);
        });
    }

    handlePlayerEnemyCollision(player, enemy) {
        // プレイヤーが敵に触れた時の処理
        if (!player.isInvulnerable) {
            player.takeDamage(10);
            player.setInvulnerable(1000); // 1秒間無敵
            
            // ノックバック効果
            const knockbackDirection = player.x < enemy.x ? -1 : 1;
            player.setVelocityX(knockbackDirection * 200);
        }
        // HPが0以下なら敵を削除
        if (enemy.health <= 0) {
            const index = this.enemies.indexOf(enemy);
            if (index > -1) {
                this.enemies.splice(index, 1);
            }
            enemy.destroy();
        }
    }

    handleSkillEnemyCollision(skill, enemy) {
        // スキルが敵に当たった時の処理
        enemy.takeDamage(skill.damage);
        skill.destroy();
        
        // ヒットエフェクト
        this.createHitEffect(enemy.x, enemy.y);
        
        // 敵が倒されたら配列から削除
        if (enemy.health <= 0) {
            const index = this.enemies.indexOf(enemy);
            if (index > -1) {
                this.enemies.splice(index, 1);
            }
            enemy.destroy();
            
            // 経験値獲得
            this.player.gainExp(10);
        }
    }

    createHitEffect(x, y) {
        // Phaser 3.60以降 createEmitterは使えないので一旦何もしない
        // const particles = this.add.particles('fireball');
        // const emitter = particles.createEmitter({
        //     x: x,
        //     y: y,
        //     speed: { min: 100, max: 200 },
        //     scale: { start: 0.5, end: 0 },
        //     lifespan: 500,
        //     quantity: 5,
        //     angle: { min: 0, max: 360 }
        // });
        // this.time.delayedCall(500, () => {
        //     emitter.stop();
        // });
    }

    gameOver() {
        // ゲームオーバー処理
        this.scene.pause();
        
        const gameOverText = this.add.text(400, 300, 'GAME OVER', {
            fontSize: '48px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);
        
        const restartText = this.add.text(400, 350, 'Press R to restart', {
            fontSize: '24px',
            fill: '#ffffff'
        }).setOrigin(0.5);
        
        this.input.keyboard.on('keydown-R', () => {
            this.scene.restart();
        });
    }
} 