export default class Skill extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, skillType, damage, direction = 1) {
        super(scene, x, y, null); // スプライト画像は使わない
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        
        // 重力の影響を受けないように設定
        this.body.setGravityY(0);
        
        this.skillType = skillType;
        this.damage = damage;
        this.direction = direction;
        this.speed = 100; // スピードを下げる
        this.lifespan = 3000; // 3秒で消滅
        this.active = true;
        this.target = null;
        this.initialVelocity = { x: 0, y: -100 }; // 上に飛ぶ初期速度も下げる
        this.velocityX = 0;
        this.velocityY = -100; // 上に飛ぶ速度も下げる
        
        // ホーミング用
        if (skillType === 'fireball') {
            this.target = this.findNearestEnemy();
        }
        // 見た目用Graphics
        this.effectGraphics = this.scene.add.graphics();
        this.effectGraphics.setDepth(20);
        this.effectGraphics.setScrollFactor(1);
        this.effectGraphics.setPosition(x, y);
        // 最初の描画
        this.drawEffect();
        // ライフタイム設定
        this.scene.time.delayedCall(this.lifespan, () => {
            this.destroy();
        });
        
        // 初期速度設定
        if (this.skillType === 'fireball') {
            this.velocityX = 0;
            this.velocityY = -150; // 上に飛ぶ速度を上げる
            this.speed = 300; // 追尾速度を大幅に上げる
            this.body.setVelocity(this.velocityX, this.velocityY);
        } else {
            this.velocityX = this.direction * this.speed;
            this.velocityY = 0;
            this.body.setVelocity(this.velocityX, this.velocityY);
        }
    }
    
    findNearestEnemy() {
        if (!this.scene.enemies || this.scene.enemies.length === 0) return null;
        let minDist = Infinity;
        let nearest = null;
        this.scene.enemies.forEach(enemy => {
            const dist = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y);
            if (dist < minDist) {
                minDist = dist;
                nearest = enemy;
            }
        });
        return nearest;
    }
    
    update() {
        if (!this.active || !this.scene || this.destroyed) {
            // activeがfalseになったら即座にdestroy
            if (!this.active && !this.destroyed) {
                this.destroy();
            }
            return;
        }
        
        // ホーミング処理
        if (this.skillType === 'fireball') {
            // 敵との距離に応じて追尾開始高度を調整
            let homingStartY = 580;
            if (this.target) {
                const distanceToEnemy = Phaser.Math.Distance.Between(this.x, this.y, this.target.x, this.target.y);
                // 遠い敵ほど高い位置から追尾開始
                if (distanceToEnemy > 500) {
                    homingStartY = 400; // 遠い敵は400から追尾開始
                } else if (distanceToEnemy > 300) {
                    homingStartY = 500; // 中距離の敵は500から追尾開始
                }
            }
            
            // 上に飛ぶ（調整された高度で追尾開始）
            if (this.y <= homingStartY) {
                // 追尾開始
                if (this.target && this.target.active && this.target.health > 0) {
                    // 敵への方向ベクトルを計算
                    const dx = this.target.x - this.x;
                    const dy = this.target.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);
                    
                    if (distance > 0) {
                        // 正規化して速度を掛ける
                        this.velocityX = (dx / distance) * this.speed;
                        this.velocityY = (dy / distance) * this.speed;
                    }
                } else {
                    // ターゲットがいない場合は上に飛び続ける
                    this.velocityX = 0;
                    this.velocityY = -200; // 速度を上げる
                }
            } else {
                // 上に飛ぶ（y座標を減らす）
                this.velocityX = 0;
                this.velocityY = -200; // 速度を上げる
            }
            // 位置更新（Phaserの物理エンジンを使用）
            this.body.setVelocity(this.velocityX, this.velocityY);
        } else {
            // 他のスキルは直進
            this.body.setVelocity(this.direction * this.speed, 0);
        }
        
        // Graphicsの位置も更新
        if (this.effectGraphics) {
            this.effectGraphics.setPosition(this.x, this.y);
        }
        
        // 画面外に出たら削除
        if (this.x < 0 || this.x > 1600 || this.y < 0 || this.y > 600) {
            this.destroy();
        }
        
        // 見た目エフェクト
        this.drawEffect();
    }
    
    drawEffect() {
        const g = this.effectGraphics;
        g.clear();
        // 明るい黄色の尾（半分の大きさ）
        g.lineStyle(8, 0xffff00, 1);
        g.beginPath();
        g.moveTo(0, 15);
        g.lineTo(0, 0);
        g.strokePath();
        // 明るい赤い丸（半分の大きさ）
        g.fillStyle(0xff0000, 1);
        g.fillCircle(0, 0, 15);
        // 白い縁取り（半分の大きさ）
        g.lineStyle(3, 0xffffff, 1);
        g.strokeCircle(0, 0, 15);
        // 中心に明るい白い点（半分の大きさ）
        g.fillStyle(0xffffff, 1);
        g.fillCircle(0, 0, 8);
    }
    
    destroy() {
        this.active = false;
        if (this.effectGraphics) {
            this.effectGraphics.clear();
            this.effectGraphics.setVisible(false);
            this.effectGraphics.destroy();
            this.effectGraphics = null;
        }
        // 物理ボディも削除
        if (this.body) {
            this.body.destroy();
        }
        // 親クラスのdestroyを呼ぶ
        super.destroy();
        // オブジェクトをnullにして参照を切る
        this.scene = null;
        this.target = null;
    }
} 