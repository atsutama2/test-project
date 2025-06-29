export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, null); // スプライト画像は使わない
        
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        
        // 敵の状態
        this.health = 50;
        this.maxHealth = 50;
        this.damage = 10;
        this.speed = 50;
        this.attackRange = 40;
        this.detectionRange = 150;
        
        // AI状態
        this.state = 'idle'; // idle, patrol, chase, attack
        this.patrolDirection = 1;
        this.patrolDistance = 100;
        this.startX = x;
        this.lastAttackTime = 0;
        this.attackCooldown = 2000; // 2秒
        
        // 物理設定
        this.setCollideWorldBounds(true);
        this.body.setSize(32, 32);
        
        // ゆるキャラ風Graphics（赤）
        this.characterGraphics = this.scene.add.graphics();
        this.drawYuruChar();
        this.characterGraphics.setDepth(10);
        this.characterGraphics.setScrollFactor(1);
        this.characterGraphics.setPosition(this.x, this.y);
        // HPバー
        this.hpBar = this.scene.add.graphics();
        this.hpBar.setDepth(11);
        this.hpBar.setScrollFactor(1);
        this.hpBar.setPosition(this.x, this.y - 28);
    }
    
    drawYuruChar() {
        const g = this.characterGraphics;
        g.clear();
        // 体
        g.fillStyle(0xff4444, 1);
        g.fillEllipse(0, 0, 24, 32);
        // 目
        g.fillStyle(0xffffff, 1);
        g.fillEllipse(-5, -5, 6, 6);
        g.fillEllipse(5, -5, 6, 6);
        g.fillStyle(0x000000, 1);
        g.fillEllipse(-5, -5, 2, 2);
        g.fillEllipse(5, -5, 2, 2);
        // 口（怒り顔）
        g.lineStyle(2, 0x000000, 1);
        g.beginPath();
        g.arc(0, 10, 6, Math.PI, 2 * Math.PI, false);
        g.strokePath();
    }
    
    drawHpBar() {
        const g = this.hpBar;
        g.clear();
        // 背景
        g.fillStyle(0x333333, 1);
        g.fillRect(-12, 0, 24, 4);
        // HP本体
        const hpPercent = Math.max(0, this.health / this.maxHealth);
        g.fillStyle(0xff4444, 1);
        g.fillRect(-12, 0, 24 * hpPercent, 4);
        // 枠
        g.lineStyle(1, 0xffffff, 1);
        g.strokeRect(-12, 0, 24, 4);
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        // ゆるキャラを敵に追従させる
        if (this.characterGraphics) {
            this.characterGraphics.setPosition(this.x, this.y);
        }
        // HPバーも追従
        if (this.hpBar) {
            this.hpBar.setPosition(this.x, this.y - 28);
            this.drawHpBar();
        }
    }
    
    update() {
        if (this.health <= 0) return;
        
        // プレイヤーとの距離を計算
        const player = this.scene.player;
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        
        // AI状態の更新
        this.updateAIState(distanceToPlayer, player);
        
        // 状態に応じた行動
        switch (this.state) {
            case 'idle':
                this.idleBehavior();
                break;
            case 'patrol':
                this.patrolBehavior();
                break;
            case 'chase':
                this.chaseBehavior(player);
                break;
            case 'attack':
                this.attackBehavior(player);
                break;
        }
    }
    
    updateAIState(distanceToPlayer, player) {
        if (distanceToPlayer <= this.attackRange) {
            this.state = 'attack';
        } else if (distanceToPlayer <= this.detectionRange) {
            this.state = 'chase';
        } else {
            // パトロール範囲内ならパトロール、そうでなければアイドル
            const distanceFromStart = Math.abs(this.x - this.startX);
            if (distanceFromStart > this.patrolDistance) {
                this.patrolDirection *= -1; // 方向転換
            }
            this.state = distanceFromStart > 10 ? 'patrol' : 'idle';
        }
    }
    
    idleBehavior() {
        this.setVelocityX(0);
    }
    
    patrolBehavior() {
        this.setVelocityX(this.speed * this.patrolDirection);
        
        // 方向に応じてスプライトを反転
        if (this.patrolDirection > 0) {
            this.setFlipX(false);
        } else {
            this.setFlipX(true);
        }
    }
    
    chaseBehavior(player) {
        // プレイヤーの方向に移動
        const direction = player.x > this.x ? 1 : -1;
        this.setVelocityX(this.speed * direction);
        
        // 方向に応じてスプライトを反転
        this.setFlipX(direction < 0);
        
        // 攻撃範囲に入ったら攻撃状態に
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (distanceToPlayer <= this.attackRange) {
            this.state = 'attack';
        }
    }
    
    attackBehavior(player) {
        // 攻撃クールダウンをチェック
        const currentTime = this.scene.time.now;
        if (currentTime - this.lastAttackTime >= this.attackCooldown) {
            this.performAttack(player);
            this.lastAttackTime = currentTime;
        }
        
        // 攻撃範囲から離れたら追跡状態に
        const distanceToPlayer = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y);
        if (distanceToPlayer > this.attackRange) {
            this.state = 'chase';
        }
    }
    
    performAttack(player) {
        // 攻撃エフェクト
        this.setTint(0xff6666);
        this.scene.time.delayedCall(200, () => {
            this.setTint(0xff0000);
        });
        
        // プレイヤーにダメージを与える
        if (!player.isInvulnerable) {
            player.takeDamage(this.damage);
            
            // ノックバック効果
            const knockbackDirection = player.x < this.x ? -1 : 1;
            player.setVelocityX(knockbackDirection * 150);
        }
    }
    
    takeDamage(damage) {
        this.health = Math.max(0, this.health - damage);
        // ダメージエフェクト
        // this.setTint(0xffffff);
        // if (this.scene && this.scene.time) {
        //     this.scene.time.delayedCall(100, () => {
        //         this.setTint(0xff0000);
        //     });
        // } else {
        //     this.setTint(0xff0000);
        // }
        // 死亡処理
        if (this.health <= 0) {
            this.die();
        }
    }
    
    die() {
        // 死亡エフェクト
        // this.setTint(0x666666);
        if (this.body) this.setVelocity(0, 0);
        // パーティクルエフェクト（Phaser 3.60以降非対応なのでコメントアウト）
        // const deathParticles = this.scene.add.particles('enemy');
        // const emitter = deathParticles.createEmitter({
        //     x: this.x,
        //     y: this.y,
        //     speed: { min: 50, max: 150 },
        //     scale: { start: 0.5, end: 0 },
        //     lifespan: 1000,
        //     quantity: 8,
        //     angle: { min: 0, max: 360 },
        //     tint: 0xff0000
        // });
        // this.scene.time.delayedCall(500, () => {
        //     emitter.stop();
        //     this.destroy();
        // });
        // すぐにdestroy
        if (this.characterGraphics) {
            this.characterGraphics.destroy();
        }
        if (this.hpBar) {
            this.hpBar.destroy();
        }
        this.destroy();
    }
    
    // プレイヤーが近づいた時の反応
    onPlayerDetected(player) {
        if (this.state === 'idle') {
            this.state = 'chase';
        }
    }
    
    // プレイヤーが離れた時の反応
    onPlayerLost() {
        if (this.state === 'chase' || this.state === 'attack') {
            this.state = 'patrol';
        }
    }
} 