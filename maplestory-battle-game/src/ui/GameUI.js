export default class GameUI {
    constructor(scene) {
        this.scene = scene;
        this.createUI();
    }
    
    createUI() {
        // HPバー
        this.hpBar = this.scene.add.graphics();
        this.hpText = this.scene.add.text(10, 10, 'HP: 100/100', {
            fontSize: '16px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        // MPバー
        this.mpBar = this.scene.add.graphics();
        this.mpText = this.scene.add.text(10, 35, 'MP: 100/100', {
            fontSize: '16px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        // レベル・経験値
        this.levelText = this.scene.add.text(10, 60, 'Lv.1 EXP: 0/100', {
            fontSize: '14px',
            fill: '#ffffff',
            stroke: '#000000',
            strokeThickness: 2
        });
        
        // スキルボタン
        this.createSkillButtons();
        
        // 固定UIとして設定
        this.hpBar.setScrollFactor(0);
        this.hpText.setScrollFactor(0);
        this.mpBar.setScrollFactor(0);
        this.mpText.setScrollFactor(0);
        this.levelText.setScrollFactor(0);
    }
    
    createSkillButtons() {
        const buttonStyle = {
            fontSize: '12px',
            fill: '#ffffff',
            backgroundColor: '#444444',
            padding: { x: 10, y: 5 }
        };
        
        this.fireballBtn = this.scene.add.text(10, 90, 'Fireball (S)', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => this.scene.player.useSkill('fireball'));
            
        this.lightningBtn = this.scene.add.text(10, 115, 'Lightning (D)', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => this.scene.player.useSkill('lightning'));
            
        this.healBtn = this.scene.add.text(10, 140, 'Heal (F)', buttonStyle)
            .setInteractive()
            .on('pointerdown', () => this.scene.player.useSkill('heal'));
            
        // 固定UI
        this.fireballBtn.setScrollFactor(0);
        this.lightningBtn.setScrollFactor(0);
        this.healBtn.setScrollFactor(0);
    }
    
    update(player) {
        // HPバー更新
        this.updateHPBar(player);
        
        // MPバー更新
        this.updateMPBar(player);
        
        // レベル更新
        this.levelText.setText(`Lv.${player.level} EXP: ${player.exp}/${player.expToNext}`);
        
        // スキルクールダウン表示
        this.updateSkillCooldowns(player);
    }
    
    updateHPBar(player) {
        this.hpBar.clear();
        
        // HPバーの背景
        this.hpBar.fillStyle(0x333333);
        this.hpBar.fillRect(50, 10, 100, 15);
        
        // HPバーの本体
        const hpPercentage = player.health / player.maxHealth;
        if (hpPercentage > 0.5) {
            this.hpBar.fillStyle(0x00ff00); // 緑
        } else if (hpPercentage > 0.25) {
            this.hpBar.fillStyle(0xffff00); // 黄
        } else {
            this.hpBar.fillStyle(0xff0000); // 赤
        }
        this.hpBar.fillRect(50, 10, 100 * hpPercentage, 15);
        
        // HPバーの枠線
        this.hpBar.lineStyle(2, 0xffffff);
        this.hpBar.strokeRect(50, 10, 100, 15);
        
        this.hpText.setText(`HP: ${Math.floor(player.health)}/${player.maxHealth}`);
    }
    
    updateMPBar(player) {
        this.mpBar.clear();
        
        // MPバーの背景
        this.mpBar.fillStyle(0x333333);
        this.mpBar.fillRect(50, 35, 100, 15);
        
        // MPバーの本体
        const mpPercentage = player.mana / player.maxMana;
        this.mpBar.fillStyle(0x0000ff);
        this.mpBar.fillRect(50, 35, 100 * mpPercentage, 15);
        
        // MPバーの枠線
        this.mpBar.lineStyle(2, 0xffffff);
        this.mpBar.strokeRect(50, 35, 100, 15);
        
        this.mpText.setText(`MP: ${Math.floor(player.mana)}/${player.maxMana}`);
    }
    
    updateSkillCooldowns(player) {
        const skills = ['fireball', 'lightning', 'heal'];
        const buttons = [this.fireballBtn, this.lightningBtn, this.healBtn];
        
        skills.forEach((skill, index) => {
            const cooldown = player.skillCooldowns.get(skill) || 0;
            const manaCost = player.getSkillManaCost ? player.getSkillManaCost(skill) : 20;
            
            if (cooldown > 0) {
                buttons[index].setStyle({ 
                    fill: '#888888',
                    backgroundColor: '#222222'
                });
                buttons[index].setText(`${skill} (${Math.ceil(cooldown / 60)}s)`);
            } else if (player.mana < manaCost) {
                buttons[index].setStyle({ 
                    fill: '#ff6666',
                    backgroundColor: '#444444'
                });
                buttons[index].setText(`${skill} (No MP)`);
            } else {
                buttons[index].setStyle({ 
                    fill: '#ffffff',
                    backgroundColor: '#444444'
                });
                buttons[index].setText(`${skill} (Ready)`);
            }
        });
    }
    
    showLevelUpEffect() {
        // レベルアップエフェクト
        const levelUpText = this.scene.add.text(400, 200, 'LEVEL UP!', {
            fontSize: '32px',
            fill: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5).setScrollFactor(0);
        
        // アニメーション
        this.scene.tweens.add({
            targets: levelUpText,
            y: 150,
            alpha: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                levelUpText.destroy();
            }
        });
    }
    
    showDamageText(x, y, damage) {
        // ダメージテキスト表示
        const damageText = this.scene.add.text(x, y, damage.toString(), {
            fontSize: '20px',
            fill: '#ff0000',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5);
        
        // アニメーション
        this.scene.tweens.add({
            targets: damageText,
            y: y - 50,
            alpha: 0,
            duration: 1000,
            ease: 'Power2',
            onComplete: () => {
                damageText.destroy();
            }
        });
    }
    
    showExpGain(amount) {
        // 経験値獲得表示
        const expText = this.scene.add.text(400, 250, `+${amount} EXP`, {
            fontSize: '18px',
            fill: '#00ff00',
            stroke: '#000000',
            strokeThickness: 2
        }).setOrigin(0.5).setScrollFactor(0);
        
        // アニメーション
        this.scene.tweens.add({
            targets: expText,
            y: 200,
            alpha: 0,
            duration: 1500,
            ease: 'Power2',
            onComplete: () => {
                expText.destroy();
            }
        });
    }
} 