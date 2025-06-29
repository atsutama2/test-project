import Skill from './Skill.js';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, null); // スプライト画像は使わない
        this.scene = scene;
        this.scene.add.existing(this);
        this.scene.physics.add.existing(this);
        
        // プレイヤー状態
        this.health = 100;
        this.maxHealth = 100;
        this.mana = 100;
        this.maxMana = 100;
        this.level = 1;
        this.exp = 0;
        this.expToNext = 100;
        
        // 戦闘状態
        this.isAttacking = false;
        this.isCasting = false;
        this.isInvulnerable = false;
        this.attackCooldown = 0;
        this.skillCooldowns = new Map();
        
        // 物理設定
        this.setCollideWorldBounds(true);
        this.body.setSize(32, 48);
        
        // スプライト設定
        this.setTint(0x00ff00); // 緑色のプレイヤー
        this.setScale(1);
        
        // アニメーション設定
        this.setupAnimations();
        
        // ゆるキャラ風Graphics
        this.characterGraphics = this.scene.add.graphics();
        this.drawYuruChar();
        this.characterGraphics.setDepth(10);
        this.characterGraphics.setScrollFactor(1);
        this.characterGraphics.setPosition(this.x, this.y);
    }
    
    setupAnimations() {
        // 簡単なアニメーション（色の変化）
        this.scene.tweens.add({
            targets: this,
            alpha: 0.8,
            duration: 500,
            yoyo: true,
            repeat: -1
        });
    }
    
    drawYuruChar() {
        const g = this.characterGraphics;
        g.clear();
        // 体
        g.fillStyle(0x00ff00, 1);
        g.fillEllipse(0, 0, 24, 32);
        // 目
        g.fillStyle(0xffffff, 1);
        g.fillEllipse(-5, -5, 6, 6);
        g.fillEllipse(5, -5, 6, 6);
        g.fillStyle(0x000000, 1);
        g.fillEllipse(-5, -5, 2, 2);
        g.fillEllipse(5, -5, 2, 2);
        // 口
        g.lineStyle(2, 0x000000, 1);
        g.beginPath();
        g.arc(0, 6, 6, 0, Math.PI, false);
        g.strokePath();
    }
    
    update(cursors) {
        // 移動処理
        if (cursors.left.isDown) {
            this.setVelocityX(-200);
            this.setFlipX(true);
        } else if (cursors.right.isDown) {
            this.setVelocityX(200);
            this.setFlipX(false);
        } else {
            this.setVelocityX(0);
        }
        
        // 攻撃クールダウン更新
        if (this.attackCooldown > 0) {
            this.attackCooldown--;
        }
        
        // スキルクールダウン更新
        this.skillCooldowns.forEach((cooldown, skill) => {
            if (cooldown > 0) {
                this.skillCooldowns.set(skill, cooldown - 1);
            }
        });
        
        // マナ自動回復
        if (this.mana < this.maxMana) {
            this.mana = Math.min(this.maxMana, this.mana + 0.5);
        }
    }
    
    jump() {
        if (this.body && this.body.onFloor && this.body.onFloor()) {
            this.setVelocityY(-400);
        }
    }
    
    attack() {
        if (this.attackCooldown <= 0 && !this.isAttacking) {
            this.isAttacking = true;
            this.attackCooldown = 30;
            // 攻撃エフェクト
            this.showAttackEffect();
            this.scene.time.delayedCall(200, () => {
                this.isAttacking = false;
            });
            // 攻撃判定
            this.scene.time.delayedCall(100, () => {
                this.checkAttackHit();
            });
        }
    }
    
    showAttackEffect() {
        // 攻撃方向
        const direction = this.flipX ? -1 : 1;
        const effect = this.scene.add.graphics();
        effect.setDepth(20);
        effect.setScrollFactor(1);
        // 白い半透明の線
        effect.lineStyle(6, 0xffffff, 0.7);
        effect.beginPath();
        effect.moveTo(this.x, this.y);
        effect.lineTo(this.x + direction * 32, this.y);
        effect.strokePath();
        // 0.1秒後に消す
        this.scene.time.delayedCall(100, () => {
            effect.destroy();
        });
    }
    
    checkAttackHit() {
        // 攻撃範囲内の敵をチェック
        const attackRange = 60;
        const attackDirection = this.flipX ? -1 : 1;
        
        this.scene.enemies.forEach(enemy => {
            const distanceX = Math.abs(enemy.x - this.x);
            const distanceY = Math.abs(enemy.y - this.y);
            
            if (distanceX < attackRange && distanceY < 50) {
                // 攻撃方向の判定
                const enemyDirection = enemy.x > this.x ? 1 : -1;
                if (attackDirection === enemyDirection) {
                    enemy.takeDamage(15);
                    this.scene.createHitEffect(enemy.x, enemy.y);
                }
            }
        });
    }
    
    useSkill(skillType) {
        if (this.skillCooldowns.get(skillType) > 0) return;
        
        this.skillCooldowns.set(skillType, this.getSkillCooldown(skillType));
        
        switch (skillType) {
            case 'fireball':
                // 3つのミサイルを同時発射
                for (let i = 0; i < 3; i++) {
                    const skill = new Skill(this.scene, this.x, this.y - 20, skillType, 30, 1);
                    this.scene.skills.push(skill);
                }
                break;
            case 'lightning':
                const skill = new Skill(this.scene, this.x, this.y - 20, skillType, 50, 1);
                this.scene.skills.push(skill);
                break;
        }
    }
    
    getSkillManaCost(skillType) {
        const costs = {
            'fireball': 20,
            'lightning': 30,
            'heal': 25
        };
        return costs[skillType] || 20;
    }
    
    getSkillCooldown(skillType) {
        const cooldowns = {
            'fireball': 100, // 1秒（連打可能）
            'lightning': 120, // 2秒
            'heal': 180 // 3秒
        };
        return cooldowns[skillType] || 60;
    }
    
    createSkillEffect(skillType) {
        let skill;
        const direction = this.flipX ? -1 : 1;
        
        switch (skillType) {
            case 'fireball':
                skill = new Skill(this.scene, this.x + direction * 50, this.y, 'fireball', 25, direction);
                break;
            case 'lightning':
                skill = new Skill(this.scene, this.x, this.y - 50, 'lightning', 35, direction);
                break;
            case 'heal':
                this.heal(30);
                this.createHealEffect();
                return;
        }
        
        if (skill) {
            this.scene.skills.push(skill);
            this.scene.physics.add.collider(skill, this.scene.enemies, this.scene.handleSkillEnemyCollision, null, this.scene);
        }
    }
    
    createHealEffect() {
        // ヒールエフェクト
        const healParticles = this.scene.add.particles('fireball');
        const emitter = healParticles.createEmitter({
            x: this.x,
            y: this.y,
            speed: { min: 50, max: 100 },
            scale: { start: 0.3, end: 0 },
            lifespan: 1000,
            quantity: 10,
            angle: { min: 0, max: 360 },
            gravityY: -100,
            tint: 0x00ff00
        });
        
        this.scene.time.delayedCall(1000, () => {
            emitter.stop();
        });
    }
    
    takeDamage(damage) {
        if (!this.isInvulnerable) {
            this.health = Math.max(0, this.health - damage);
            
            // ダメージエフェクト
            this.setTint(0xff0000);
            this.scene.time.delayedCall(200, () => {
                this.setTint(0x00ff00);
            });
        }
    }
    
    heal(amount) {
        this.health = Math.min(this.maxHealth, this.health + amount);
    }
    
    setInvulnerable(duration) {
        this.isInvulnerable = true;
        this.scene.time.delayedCall(duration, () => {
            this.isInvulnerable = false;
        });
    }
    
    gainExp(amount) {
        this.exp += amount;
        
        // レベルアップチェック
        if (this.exp >= this.expToNext) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.exp -= this.expToNext;
        this.expToNext = Math.floor(this.expToNext * 1.2);
        
        // ステータス上昇
        this.maxHealth += 20;
        this.health = this.maxHealth;
        this.maxMana += 10;
        this.mana = this.maxMana;
    }
    
    preUpdate(time, delta) {
        super.preUpdate(time, delta);
        // ゆるキャラをプレイヤーに追従させる
        if (this.characterGraphics) {
            this.characterGraphics.setPosition(this.x, this.y);
        }
    }
} 