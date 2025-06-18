// js/ui/PlacementFeedback.js
/**
 * アセット配置時のビジュアルフィードバックを管理
 */

export class PlacementFeedback {
    constructor(scene, errorHandler) {
        this.scene = scene;
        this.errorHandler = errorHandler;
        
        // フィードバック要素
        this.placementIndicator = null;
        this.successIndicator = null;
        this.validPlacementMaterial = null;
        this.invalidPlacementMaterial = null;
        
        this.initialize();
    }

    /**
     * 初期化
     */
    initialize() {
        this.createMaterials();
        this.createPlacementIndicator();
        this.createSuccessIndicator();
    }

    /**
     * マテリアルを作成
     */
    createMaterials() {
        // 配置可能な場所用のマテリアル（緑）
        this.validPlacementMaterial = new BABYLON.StandardMaterial("validPlacementMat", this.scene);
        this.validPlacementMaterial.diffuseColor = new BABYLON.Color3(0.2, 0.8, 0.2);
        this.validPlacementMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        this.validPlacementMaterial.alpha = 0.3;
        this.validPlacementMaterial.backFaceCulling = false;

        // 配置不可能な場所用のマテリアル（赤）
        this.invalidPlacementMaterial = new BABYLON.StandardMaterial("invalidPlacementMat", this.scene);
        this.invalidPlacementMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.2, 0.2);
        this.invalidPlacementMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        this.invalidPlacementMaterial.alpha = 0.3;
        this.invalidPlacementMaterial.backFaceCulling = false;
    }

    /**
     * 配置インジケーターを作成
     */
    createPlacementIndicator() {
        // 円形のインジケーター
        this.placementIndicator = BABYLON.MeshBuilder.CreateTorus(
            "placementIndicator",
            {
                diameter: 1,
                thickness: 0.1,
                tessellation: 32
            },
            this.scene
        );
        
        this.placementIndicator.material = this.validPlacementMaterial;
        this.placementIndicator.isPickable = false;
        this.placementIndicator.setEnabled(false);
        
        // 回転アニメーション
        this.scene.registerBeforeRender(() => {
            if (this.placementIndicator.isEnabled()) {
                this.placementIndicator.rotation.y += 0.02;
            }
        });
    }

    /**
     * 成功インジケーターを作成
     */
    createSuccessIndicator() {
        // パーティクルシステムで成功エフェクトを作成
        this.successParticleSystem = new BABYLON.ParticleSystem(
            "successParticles",
            100,
            this.scene
        );
        
        // テクスチャーを設定
        this.successParticleSystem.particleTexture = new BABYLON.Texture(
            "https://assets.babylonjs.com/textures/flare.png",
            this.scene
        );
        
        // パーティクルの設定
        this.successParticleSystem.minSize = 0.1;
        this.successParticleSystem.maxSize = 0.3;
        this.successParticleSystem.minLifeTime = 0.3;
        this.successParticleSystem.maxLifeTime = 0.8;
        this.successParticleSystem.emitRate = 50;
        this.successParticleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
        
        // 色の設定
        this.successParticleSystem.color1 = new BABYLON.Color4(0.2, 1, 0.2, 1);
        this.successParticleSystem.color2 = new BABYLON.Color4(0.5, 1, 0.5, 0.5);
        this.successParticleSystem.colorDead = new BABYLON.Color4(0, 0, 0, 0);
        
        // 方向の設定
        this.successParticleSystem.direction1 = new BABYLON.Vector3(-1, 8, 1);
        this.successParticleSystem.direction2 = new BABYLON.Vector3(1, 8, -1);
        
        // 速度の設定
        this.successParticleSystem.minEmitPower = 1;
        this.successParticleSystem.maxEmitPower = 3;
        this.successParticleSystem.updateSpeed = 0.01;
        
        // 重力
        this.successParticleSystem.gravity = new BABYLON.Vector3(0, -9.81, 0);
    }

    /**
     * 配置プレビューを表示
     * @param {BABYLON.Vector3} position - 位置
     * @param {boolean} isValid - 配置可能かどうか
     */
    showPlacementPreview(position, isValid = true) {
        if (!this.placementIndicator) return;
        
        this.placementIndicator.position = position.clone();
        this.placementIndicator.position.y += 0.05; // 少し浮かせる
        this.placementIndicator.material = isValid ? 
            this.validPlacementMaterial : 
            this.invalidPlacementMaterial;
        this.placementIndicator.setEnabled(true);
    }

    /**
     * 配置プレビューを非表示
     */
    hidePlacementPreview() {
        if (this.placementIndicator) {
            this.placementIndicator.setEnabled(false);
        }
    }

    /**
     * 配置成功エフェクトを表示
     * @param {BABYLON.Vector3} position - 位置
     */
    showSuccessEffect(position) {
        // パーティクルエミッターを設定
        this.successParticleSystem.emitter = position.clone();
        
        // パーティクルを開始
        this.successParticleSystem.start();
        
        // 0.5秒後に停止
        setTimeout(() => {
            this.successParticleSystem.stop();
        }, 500);
        
        // サウンドエフェクト（実装されている場合）
        this.playPlacementSound();
    }

    /**
     * 配置失敗エフェクトを表示
     * @param {BABYLON.Vector3} position - 位置
     */
    showFailureEffect(position) {
        // 赤いフラッシュエフェクト
        const flash = BABYLON.MeshBuilder.CreateSphere(
            "failureFlash",
            { diameter: 2, segments: 8 },
            this.scene
        );
        
        flash.position = position.clone();
        flash.material = this.invalidPlacementMaterial;
        flash.isPickable = false;
        
        // アニメーション
        const animationAlpha = new BABYLON.Animation(
            "failureFlashAlpha",
            "material.alpha",
            30,
            BABYLON.Animation.ANIMATIONTYPE_FLOAT,
            BABYLON.Animation.ANIMATIONLOOPMODE_CONSTANT
        );
        
        const keys = [
            { frame: 0, value: 0.5 },
            { frame: 15, value: 0 }
        ];
        
        animationAlpha.setKeys(keys);
        flash.material.animations.push(animationAlpha);
        
        this.scene.beginAnimation(flash.material, 0, 15, false, 1, () => {
            flash.dispose();
        });
    }

    /**
     * 配置音を再生（実装されている場合）
     */
    playPlacementSound() {
        // 音声システムが実装されている場合はここで再生
        console.log("Placement sound effect");
    }

    /**
     * グリッドスナップインジケーターを表示
     * @param {BABYLON.Vector3} originalPos - 元の位置
     * @param {BABYLON.Vector3} snappedPos - スナップ後の位置
     */
    showSnapIndicator(originalPos, snappedPos) {
        // スナップラインを作成
        const snapLine = BABYLON.MeshBuilder.CreateLines(
            "snapLine",
            {
                points: [originalPos, snappedPos],
                updatable: false
            },
            this.scene
        );
        
        snapLine.color = new BABYLON.Color3(0, 1, 1);
        snapLine.alpha = 0.5;
        snapLine.isPickable = false;
        
        // 0.3秒後に削除
        setTimeout(() => {
            snapLine.dispose();
        }, 300);
    }

    /**
     * クリーンアップ
     */
    dispose() {
        if (this.placementIndicator) {
            this.placementIndicator.dispose();
        }
        
        if (this.successParticleSystem) {
            this.successParticleSystem.dispose();
        }
        
        if (this.validPlacementMaterial) {
            this.validPlacementMaterial.dispose();
        }
        
        if (this.invalidPlacementMaterial) {
            this.invalidPlacementMaterial.dispose();
        }
    }
}