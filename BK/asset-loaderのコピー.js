// js/assets/AssetLoader.js
/**
 * アセットのロードとキャッシュを管理するクラス
 */

import { ASSET_URLS, MODEL_SCALES } from '../config/constants.js';

export class AssetLoader {
    constructor(scene, errorHandler) {
        this.scene = scene;
        this.errorHandler = errorHandler;
        
        // プリロードしたモデルを保持
        this.preloadedModels = {
            burger: null,
            record: null,
            juiceBox: null
        };
        
        // ロード状態
        this.loadingStatus = {
            burger: false,
            record: false,
            juiceBox: false
        };
        
        // ロード完了コールバック
        this.onLoadCallbacks = [];
    }

    /**
     * すべてのアセットを事前ロード
     * @returns {Promise<void>}
     */
    async preloadAssets() {
        console.log("Starting asset preload...");
        
        try {
            // 並列でロード
            await Promise.all([
                this.loadBurgerModel(),
                this.loadRecordModel(),
                this.loadJuiceBoxModel()
            ]);
            
            console.log("All assets preloaded successfully");
            
            // ロード完了コールバックを実行
            this.onLoadCallbacks.forEach(callback => callback());
            
        } catch (error) {
            this.errorHandler.showError("アセットのプリロードに失敗しました: " + error.message);
            console.error("Asset preload error:", error);
        }
    }

    /**
     * バーガーモデルをロード
     * @returns {Promise<void>}
     */
    async loadBurgerModel() {
        if (this.loadingStatus.burger || this.preloadedModels.burger) return;
        
        this.loadingStatus.burger = true;
        
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(
                "", 
                ASSET_URLS.BURGER, 
                "", 
                this.scene,
                (meshes) => {
                    console.log("Burger model preloaded:", meshes.length + " meshes");
                    
                    if (meshes.length > 0) {
                        const rootMesh = this.prepareMesh(meshes[0], MODEL_SCALES.BURGER);
                        this.setupMeshProperties(rootMesh);
                        this.preloadedModels.burger = rootMesh;
                    }
                    
                    this.loadingStatus.burger = false;
                    resolve();
                },
                null,
                (scene, message) => {
                    this.loadingStatus.burger = false;
                    reject(new Error("Failed to load burger model: " + message));
                }
            );
        });
    }

    /**
     * レコードマシンモデルをロード
     * @returns {Promise<void>}
     */
    async loadRecordModel() {
        if (this.loadingStatus.record || this.preloadedModels.record) return;
        
        this.loadingStatus.record = true;
        
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(
                "", 
                ASSET_URLS.RECORD_MACHINE, 
                "", 
                this.scene,
                (meshes) => {
                    console.log("Record machine model preloaded:", meshes.length + " meshes");
                    
                    if (meshes.length > 0) {
                        const rootMesh = this.prepareMesh(meshes[0], MODEL_SCALES.RECORD_MACHINE);
                        this.setupMeshProperties(rootMesh);
                        this.preloadedModels.record = rootMesh;
                    }
                    
                    this.loadingStatus.record = false;
                    resolve();
                },
                null,
                (scene, message) => {
                    this.loadingStatus.record = false;
                    reject(new Error("Failed to load record model: " + message));
                }
            );
        });
    }

    /**
     * ジュースボックスモデルをロード
     * @returns {Promise<void>}
     */
    async loadJuiceBoxModel() {
        if (this.loadingStatus.juiceBox || this.preloadedModels.juiceBox) return;
        
        this.loadingStatus.juiceBox = true;
        
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(
                "", 
                ASSET_URLS.JUICE_BOX, 
                "", 
                this.scene,
                (meshes) => {
                    console.log("Juice box model preloaded:", meshes.length + " meshes");
                    
                    if (meshes.length > 0) {
                        const rootMesh = this.prepareMesh(meshes[0], MODEL_SCALES.JUICE_BOX);
                        this.setupMeshProperties(rootMesh);
                        this.preloadedModels.juiceBox = rootMesh;
                    }
                    
                    this.loadingStatus.juiceBox = false;
                    resolve();
                },
                null,
                (scene, message) => {
                    this.loadingStatus.juiceBox = false;
                    reject(new Error("Failed to load juice box model: " + message));
                }
            );
        });
    }

    /**
     * メッシュを準備
     * @param {BABYLON.Mesh} mesh - ルートメッシュ
     * @param {Object} scale - スケール設定
     * @returns {BABYLON.Mesh} 準備されたメッシュ
     */
    prepareMesh(mesh, scale) {
        // 非表示にしておく
        mesh.setEnabled(false);
        
        // スケーリングを設定
        mesh.scaling = new BABYLON.Vector3(scale.x, scale.y, scale.z);
        
        return mesh;
    }

    /**
     * メッシュプロパティを設定
     * @param {BABYLON.Mesh} rootMesh - ルートメッシュ
     */
    setupMeshProperties(rootMesh) {
        // ルートメッシュの設定
        rootMesh.renderingGroupId = 0;
        rootMesh.alwaysSelectAsActiveMesh = true;
        rootMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
        
        // 子メッシュも設定
        rootMesh.getChildMeshes().forEach(childMesh => {
            childMesh.renderingGroupId = 0;
            childMesh.alwaysSelectAsActiveMesh = true;
            childMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
            
            if (childMesh.material) {
                childMesh.material.backFaceCulling = false;
                childMesh.material.needDepthPrePass = true;
            }
        });
    }

    /**
     * モデルをクローン
     * @param {string} modelType - モデルタイプ ('burger', 'record', 'juiceBox')
     * @param {string} name - 新しい名前
     * @returns {BABYLON.Mesh|null} クローンされたメッシュ
     */
    cloneModel(modelType, name) {
        const originalModel = this.preloadedModels[modelType];
        
        if (!originalModel) {
            console.warn(`Model ${modelType} not preloaded`);
            return null;
        }
        
        // clone()メソッドは子メッシュも自動的にクローンするため、
        // 手動での子メッシュクローンは不要
        const clonedModel = originalModel.clone(name);
        clonedModel.setEnabled(true);
        
        // クローンされた子メッシュも有効化
        clonedModel.getChildMeshes().forEach(childMesh => {
            childMesh.setEnabled(true);
        });
        
        return clonedModel;
    }

    /**
     * 動的にアセットをロード
     * @param {string} url - アセットURL
     * @param {string} name - メッシュ名
     * @returns {Promise<BABYLON.Mesh>}
     */
    async loadAsset(url, name) {
        return new Promise((resolve, reject) => {
            // プレースホルダーを作成
            const placeholder = this.createPlaceholder(name);
            
            BABYLON.SceneLoader.ImportMesh(
                "", 
                url, 
                "", 
                this.scene,
                (meshes) => {
                    // プレースホルダーを削除
                    placeholder.dispose();
                    
                    if (meshes.length > 0) {
                        const rootMesh = meshes[0];
                        rootMesh.name = name;
                        
                        // デフォルトスケールを適用
                        this.applyDefaultScale(rootMesh, name);
                        
                        // メッシュプロパティを設定
                        this.setupDynamicMeshProperties(rootMesh);
                        
                        resolve(rootMesh);
                    } else {
                        reject(new Error("No meshes loaded"));
                    }
                },
                null,
                (scene, message) => {
                    placeholder.dispose();
                    reject(new Error(`Failed to load asset: ${message}`));
                }
            );
        });
    }

    /**
     * プレースホルダーを作成
     * @param {string} name - 名前
     * @returns {BABYLON.Mesh} プレースホルダーメッシュ
     */
    createPlaceholder(name) {
        const placeholder = BABYLON.MeshBuilder.CreateBox(
            `placeholder_${name}`, 
            { size: 0.2 }, 
            this.scene
        );
        
        const material = new BABYLON.StandardMaterial("placeholderMat", this.scene);
        material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1);
        material.alpha = 0.5;
        placeholder.material = material;
        
        return placeholder;
    }

    /**
     * デフォルトスケールを適用
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @param {string} name - メッシュ名
     */
    applyDefaultScale(mesh, name) {
        let scale = MODEL_SCALES.DEFAULT || { x: 0.1, y: 0.1, z: 0.1 };
        
        if (name.includes("juiceBox")) {
            scale = MODEL_SCALES.JUICE_BOX;
        } else if (name.includes("mikeDesk")) {
            scale = MODEL_SCALES.DEFAULT;  // マイクデスクは定義されていないのでデフォルト
        } else if (name.includes("record")) {
            scale = MODEL_SCALES.RECORD_MACHINE;
        } else if (name.includes("burger") || name.includes("cube")) {
            scale = MODEL_SCALES.BURGER;
        }
        
        mesh.scaling = new BABYLON.Vector3(scale.x, scale.y, scale.z);
    }

    /**
     * 動的メッシュのプロパティを設定
     * @param {BABYLON.Mesh} rootMesh - ルートメッシュ
     */
    setupDynamicMeshProperties(rootMesh) {
        // すべてのメッシュを設定
        const allMeshes = [rootMesh, ...rootMesh.getChildMeshes()];
        
        allMeshes.forEach(mesh => {
            mesh.isVisible = true;
            mesh.isPickable = true;
            mesh.receiveShadows = true;
            mesh.renderingGroupId = 0;
            mesh.alwaysSelectAsActiveMesh = true;
            mesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
            
            if (mesh.material) {
                mesh.material.backFaceCulling = false;
                mesh.material.needDepthPrePass = true;
                mesh.material.zOffset = 1;
                mesh.material.forceDepthWrite = true;
            }
        });
    }

    /**
     * モデルが利用可能かチェック
     * @param {string} modelType - モデルタイプ
     * @returns {boolean}
     */
    isModelAvailable(modelType) {
        return this.preloadedModels[modelType] !== null;
    }

    /**
     * すべてのモデルがロード済みかチェック
     * @returns {boolean}
     */
    areAllModelsLoaded() {
        return Object.values(this.preloadedModels).every(model => model !== null);
    }

    /**
     * ロード完了時のコールバックを追加
     * @param {Function} callback - コールバック関数
     */
    onAssetsLoaded(callback) {
        if (this.areAllModelsLoaded()) {
            callback();
        } else {
            this.onLoadCallbacks.push(callback);
        }
    }

    /**
     * ロード状態を取得
     * @returns {Object} ロード状態
     */
    getLoadingStatus() {
        return {
            burger: this.isModelAvailable('burger'),
            record: this.isModelAvailable('record'),
            juiceBox: this.isModelAvailable('juiceBox'),
            isLoading: Object.values(this.loadingStatus).some(status => status)
        };
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing AssetLoader...");
        
        // プリロードしたモデルを破棄
        Object.values(this.preloadedModels).forEach(model => {
            if (model && !model.isDisposed()) {
                model.dispose();
            }
        });
        
        this.preloadedModels = {
            burger: null,
            record: null,
            juiceBox: null
        };
        
        this.loadingStatus = {
            burger: false,
            record: false,
            juiceBox: false
        };
        
        this.onLoadCallbacks = [];
    }
}