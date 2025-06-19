// js/assets/AssetPlacer.js
/**
 * アセットの配置を管理するクラス
 */

import { ASSET_TYPES, ASSET_URLS, UI_SETTINGS } from '../config/constants.js';
import { PRESET_COLORS } from '../utils/color-utils.js';

export class AssetPlacer {
    constructor(scene, assetLoader, errorHandler) {
        this.scene = scene;
        this.assetLoader = assetLoader;
        this.errorHandler = errorHandler;
        
        // 配置されたアセットのリスト
        this.placedAssets = [];
        
        // 最後の壁の法線（壁配置用）
        this.lastWallNormal = null;
        
        // シャドウジェネレーターの参照
        this.shadowGenerator = null;
    }

    /**
     * シャドウジェネレーターを設定
     * @param {BABYLON.ShadowGenerator} shadowGenerator
     */
    setShadowGenerator(shadowGenerator) {
        this.shadowGenerator = shadowGenerator;
    }

    /**
     * アセットを配置
     * @param {string} assetType - アセットタイプ
     * @param {BABYLON.Vector3} position - 配置位置
     * @returns {BABYLON.Mesh|null} 配置されたメッシュ
     */
    placeAsset(assetType, position) {
        try {
            let mesh = null;
            
            switch (assetType) {
                case ASSET_TYPES.CUBE:
                    mesh = this.placeBurger(position);
                    break;
                case ASSET_TYPES.RECORD_MACHINE:
                    mesh = this.placeRecordMachine(position);
                    break;
                case ASSET_TYPES.JUICE_BOX:
                    mesh = this.placeJuiceBox(position);
                    break;
                case ASSET_TYPES.MIKE_DESK:
                    mesh = this.placeMikeDesk(position);
                    break;
                default:
                    this.errorHandler.showError(`Unknown asset type: ${assetType}`);
                    return null;
            }
            
            if (mesh) {
                // 配置エフェクトを表示
                this.showPlacementEffect(position, assetType);
                
                // リストに追加
                this.placedAssets.push(mesh);
                
                // 影を設定
                this.setupShadow(mesh);
                
                console.log(`Asset placed: ${assetType} at`, position);
            }
            
            return mesh;
            
        } catch (error) {
            this.errorHandler.showError("アセットの配置に失敗しました: " + error.message);
            return null;
        }
    }

    /**
     * バーガーを配置
     * @param {BABYLON.Vector3} position - 配置位置
     * @returns {BABYLON.Mesh|null}
     */
    placeBurger(position) {
        if (this.assetLoader.isModelAvailable('burger')) {
            const timestamp = Date.now();
            const burger = this.assetLoader.cloneModel('burger', `burger_${timestamp}`);
            
            if (burger) {
                burger.position = position.clone();
                this.applyWallRotation(burger);
                this.setupMeshInteraction(burger);
                this.createBoundingBox(burger, timestamp);
                return burger;
            }
        } else {
            // モデルがない場合は動的にロード
            this.loadAndPlaceAsset(ASSET_URLS.BURGER, `burger_${Date.now()}`, position);
        }
        
        return null;
    }

    /**
     * レコードマシンを配置
     * @param {BABYLON.Vector3} position - 配置位置
     * @returns {BABYLON.Mesh|null}
     */
    placeRecordMachine(position) {
        const timestamp = Date.now();
        const recordMachine = this.assetLoader.cloneModel('recordMachine', `recordMachine_${timestamp}`);
        
        if (recordMachine) {
            recordMachine.position = position.clone();
            this.applyWallRotation(recordMachine);
            this.setupMeshInteraction(recordMachine);
            this.createBoundingBox(recordMachine, timestamp);
            return recordMachine;
        }
        
        // モデルが利用できない場合は動的にロード
        this.loadAndPlaceAsset(ASSET_URLS.RECORD_MACHINE, `recordMachine_${Date.now()}`, position);
        return null;
    }

    /**
     * ジュースボックスを配置
     * @param {BABYLON.Vector3} position - 配置位置
     * @returns {BABYLON.Mesh|null}
     */
    placeJuiceBox(position) {
        if (this.assetLoader.isModelAvailable('juiceBox')) {
            const timestamp = Date.now();
            const juiceBox = this.assetLoader.cloneModel('juiceBox', `juiceBox_${timestamp}`);
            
            if (juiceBox) {
                juiceBox.position = position.clone();
                this.applyWallRotation(juiceBox);
                this.setupMeshInteraction(juiceBox);
                this.createBoundingBox(juiceBox, timestamp);
                return juiceBox;
            }
        } else {
            this.loadAndPlaceAsset(ASSET_URLS.JUICE_BOX, `juiceBox_${Date.now()}`, position);
        }
        
        return null;
    }

    /**
     * マイクデスクを配置
     * @param {BABYLON.Vector3} position - 配置位置
     * @returns {BABYLON.Mesh}
     */
    placeMikeDesk(position) {
        const timestamp = Date.now();
        const mesh = BABYLON.MeshBuilder.CreateCylinder(
            `mikeDesk_${timestamp}`, 
            { 
                diameterTop: 0, 
                diameterBottom: 0.6,
                height: 0.9,
                tessellation: 4
            }, 
            this.scene
        );
        
        // マテリアルを作成
        const material = new BABYLON.StandardMaterial("mikeDeskMaterial", this.scene);
        material.diffuseColor = PRESET_COLORS.MIKE_DESK;
        material.specularColor = new BABYLON.Color3(0, 0, 0);
        material.specularPower = 0;
        material.zOffset = 1;
        material.disableLighting = false;
        mesh.material = material;
        
        mesh.position = position.clone();
        this.applyWallRotation(mesh);
        this.setupMeshInteraction(mesh);
        
        return mesh;
    }

    /**
     * 動的にアセットをロードして配置
     * @param {string} url - アセットURL
     * @param {string} name - メッシュ名
     * @param {BABYLON.Vector3} position - 配置位置
     */
    async loadAndPlaceAsset(url, name, position) {
        try {
            const mesh = await this.assetLoader.loadAsset(url, name);
            
            // 位置を設定
            const newPosition = position.clone();
            if (!this.lastWallNormal) {
                newPosition.y += 0.05;
            }
            mesh.position = newPosition;
            
            // 壁配置の場合は回転
            this.applyWallRotation(mesh);
            
            // インタラクションを設定
            this.setupMeshInteraction(mesh);
            
            // リストに追加
            this.placedAssets.push(mesh);
            
            // 影を設定
            this.setupShadow(mesh);
            
            // シーンを再レンダリング
            this.scene.render();
            
        } catch (error) {
            this.errorHandler.showError("アセットのロードに失敗しました: " + error.message);
        }
    }

    /**
     * 壁配置用の回転を適用
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    applyWallRotation(mesh) {
        if (this.lastWallNormal) {
            const rotationQuaternion = BABYLON.Quaternion.FromUnitVectorsToRef(
                new BABYLON.Vector3(0, 0, 1),
                this.lastWallNormal,
                new BABYLON.Quaternion()
            );
            mesh.rotationQuaternion = rotationQuaternion;
            this.lastWallNormal = null;
        }
    }

    /**
     * メッシュのインタラクションを設定
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    setupMeshInteraction(mesh) {
        mesh.isPickable = true;
        mesh.receiveShadows = true;
        mesh.renderingGroupId = 0;
        
        if (mesh.material) {
            mesh.material.needDepthPrePass = false;
            mesh.material.separateCullingPass = true;
        }
        
        mesh.useShadowDepthMaterial = true;
        mesh.alwaysSelectAsActiveMesh = true;
        
        // 子メッシュの設定
        if (mesh.getChildMeshes) {
            mesh.getChildMeshes().forEach(childMesh => {
                childMesh.isPickable = true;
                childMesh.receiveShadows = true;
                childMesh.renderingGroupId = 0;
                childMesh.alwaysSelectAsActiveMesh = true;
                childMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
                
                // メタデータを追加
                childMesh.metadata = childMesh.metadata || {};
                childMesh.metadata.parentAsset = mesh;
                
                if (childMesh.material) {
                    childMesh.material.zOffset = 1;
                    childMesh.material.needDepthPrePass = true;
                    childMesh.material.backFaceCulling = false;
                    childMesh.material.forceDepthWrite = true;
                }
            });
        }
    }

    /**
     * バウンディングボックスを作成
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @param {number} timestamp - タイムスタンプ
     */
    createBoundingBox(mesh, timestamp) {
        const boundingBox = BABYLON.MeshBuilder.CreateBox(
            `boundingBox_${timestamp}`, 
            {
                width: 0.5,
                height: 0.5,
                depth: 0.5
            }, 
            this.scene
        );
        
        boundingBox.position = mesh.position.clone();
        boundingBox.parent = mesh;
        boundingBox.visibility = 0.0;
        boundingBox.isPickable = true;
        
        // メタデータを追加
        boundingBox.metadata = boundingBox.metadata || {};
        boundingBox.metadata.parentAsset = mesh;
    }

    /**
     * 影を設定
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    setupShadow(mesh) {
        if (!this.shadowGenerator) return;
        
        try {
            this.shadowGenerator.removeShadowCaster(mesh);
        } catch (e) {
            // 初回は存在しないのでエラーは無視
        }
        
        this.shadowGenerator.addShadowCaster(mesh, true);
        console.log("Shadow caster added:", mesh.name);
        
        // シーンを再レンダリング
        setTimeout(() => {
            this.scene.render();
        }, 100);
    }

    /**
     * 配置エフェクトを表示
     * @param {BABYLON.Vector3} position - 位置
     * @param {string} assetType - アセットタイプ
     */
    showPlacementEffect(position, assetType) {
        try {
            const particleSystem = new BABYLON.ParticleSystem(
                "placementEffect", 
                UI_SETTINGS.PARTICLE_EFFECT.COUNT, 
                this.scene
            );
            
            particleSystem.particleTexture = new BABYLON.Texture(
                ASSET_URLS.FLARE_TEXTURE, 
                this.scene
            );
            
            particleSystem.emitter = position.clone();
            
            // アセットタイプに応じてスケールを調整
            const scale = this.getEffectScale(assetType);
            
            particleSystem.minEmitBox = new BABYLON.Vector3(-0.5 * scale, 0, -0.5 * scale);
            particleSystem.maxEmitBox = new BABYLON.Vector3(0.5 * scale, 0, 0.5 * scale);
            
            particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
            particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
            particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
            
            particleSystem.minSize = 0.1 * scale;
            particleSystem.maxSize = 0.3 * scale;
            
            particleSystem.minLifeTime = UI_SETTINGS.PARTICLE_EFFECT.MIN_LIFETIME;
            particleSystem.maxLifeTime = UI_SETTINGS.PARTICLE_EFFECT.MAX_LIFETIME;
            
            particleSystem.emitRate = UI_SETTINGS.PARTICLE_EFFECT.EMIT_RATE;
            
            particleSystem.direction1 = new BABYLON.Vector3(-1, 2, -1);
            particleSystem.direction2 = new BABYLON.Vector3(1, 2, 1);
            
            particleSystem.minEmitPower = 1 * scale;
            particleSystem.maxEmitPower = 2 * scale;
            
            particleSystem.updateSpeed = UI_SETTINGS.PARTICLE_EFFECT.UPDATE_SPEED;
            
            // 一時的に表示
            particleSystem.start();
            
            setTimeout(() => {
                particleSystem.stop();
                setTimeout(() => {
                    particleSystem.dispose();
                }, 1000);
            }, 500);
            
        } catch (error) {
            console.error("Failed to create placement effect:", error);
        }
    }

    /**
     * エフェクトのスケールを取得
     * @param {string} assetType - アセットタイプ
     * @returns {number} スケール
     */
    getEffectScale(assetType) {
        switch (assetType) {
            case ASSET_TYPES.JUICE_BOX:
                return 3.0;
            case ASSET_TYPES.MIKE_DESK:
                return 4.0;
            case ASSET_TYPES.RECORD:
                return 2.5;
            case ASSET_TYPES.CUBE:
                return 2.0;
            default:
                return 1.0;
        }
    }

    /**
     * 壁の法線を設定
     * @param {BABYLON.Vector3} normal - 法線ベクトル
     */
    setWallNormal(normal) {
        this.lastWallNormal = normal;
    }

    /**
     * アセットを削除
     * @param {BABYLON.Mesh} mesh - 削除するメッシュ
     */
    removeAsset(mesh) {
        const index = this.placedAssets.indexOf(mesh);
        if (index > -1) {
            this.placedAssets.splice(index, 1);
        }
        
        if (mesh && !mesh.isDisposed()) {
            mesh.dispose();
        }
    }

    /**
     * すべてのアセットをクリア
     */
    clearAllAssets() {
        this.placedAssets.forEach(mesh => {
            if (mesh && !mesh.isDisposed()) {
                mesh.dispose();
            }
        });
        
        this.placedAssets = [];
        console.log("All placed assets cleared");
    }

    /**
     * 配置されたアセットの数を取得
     * @returns {number} アセット数
     */
    getPlacedAssetCount() {
        return this.placedAssets.length;
    }

    /**
     * 配置されたアセットのリストを取得
     * @returns {Array<BABYLON.Mesh>} アセットリスト
     */
    getPlacedAssets() {
        return [...this.placedAssets];
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing AssetPlacer...");
        
        this.clearAllAssets();
        this.shadowGenerator = null;
        this.lastWallNormal = null;
    }
}