// js/core/App.js
/**
 * メインアプリケーションクラス
 * 各モジュールを統合して管理
 */

import { SceneManager } from './scene-manager.js';
import { RoomManager } from '../environment/room-manager.js';
import { GridSystem } from '../environment/grid-system.js';
import { LightingSystem } from '../environment/lighting-system.js';
import { CameraManager } from '../camera/camera-manager.js';
import { AssetLoader } from '../assets/asset-loader.js';
import { AssetPlacer } from '../assets/asset-placer.js';
import { InteractionManager } from '../interaction/interaction-manager.js';
import { UIManager } from '../ui/ui-manager.js';
import { SelectionController } from '../interaction/selection-controller.js';
import { LoadingManager } from '../ui/loading-manager.js';

export class App {
    constructor(canvas) {
        this.canvas = canvas;
        this.managers = {};
        this.isInitialized = false;
        this.loadingManager = new LoadingManager();
    }

    /**
     * アプリケーションを初期化
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log("Initializing application...");
            
            // ローディング表示を開始
            this.loadingManager.show("アプリケーションを初期化中...");
            this.loadingManager.setProgress(10);

            // シーンマネージャーを初期化
            this.managers.scene = new SceneManager(this.canvas);
            await this.managers.scene.initialize();
            this.loadingManager.setProgress(20);

            const scene = this.managers.scene.getScene();
            const errorHandler = this.managers.scene.getErrorHandler();

            // 各マネージャーを初期化
            this.loadingManager.updateMessage("マネージャーを初期化中...");
            this.managers.room = new RoomManager(scene, errorHandler);
            this.managers.grid = new GridSystem(scene, errorHandler);
            this.managers.lighting = new LightingSystem(scene, errorHandler);
            this.managers.camera = new CameraManager(scene, this.canvas, errorHandler);
            this.managers.assetLoader = new AssetLoader(scene, errorHandler);
            this.managers.assetPlacer = new AssetPlacer(scene, this.managers.assetLoader, errorHandler);
            this.managers.selection = new SelectionController(
                scene, 
                this.managers.scene.getHighlightLayer(), 
                errorHandler,
                this
            );
            this.managers.interaction = new InteractionManager(this, errorHandler);
            this.managers.ui = new UIManager(this, errorHandler);
            this.loadingManager.setProgress(40);

            // 環境をセットアップ
            await this.setupEnvironment();

            // インタラクションとUIを初期化
            this.managers.interaction.initialize();
            this.managers.ui.initialize();
            this.loadingManager.setProgress(100);

            this.isInitialized = true;
            console.log("Application initialized successfully");
            
            // ローディング表示を非表示
            setTimeout(() => {
                this.loadingManager.hide();
            }, 500);

        } catch (error) {
            console.error("Failed to initialize application:", error);
            this.loadingManager.showError(error.message);
            
            if (this.managers.scene) {
                this.managers.scene.getErrorHandler().handleCriticalError(
                    error, 
                    'App.initialize'
                );
            }
            throw error;
        }
    }

    /**
     * 環境をセットアップ
     * @returns {Promise<void>}
     */
    async setupEnvironment() {
        try {
            // 部屋をロード
            this.loadingManager.updateMessage("3Dルームをロード中...");
            await this.managers.room.loadRoom();
            this.loadingManager.setProgress(60);
            
            // アセットを事前ロード
            this.loadingManager.updateMessage("アセットをプリロード中...");
            
            // アセットローダーのプログレスを監視
            let loadedCount = 0;
            const totalAssets = 3; // バーガー、レコード、ジュースボックス
            
            this.managers.assetLoader.onAssetsLoaded(() => {
                loadedCount = totalAssets;
                this.loadingManager.updateAssetProgress(loadedCount, totalAssets);
            });
            
            await this.managers.assetLoader.preloadAssets();
            this.loadingManager.setProgress(80);
            
            // グリッドを作成
            this.loadingManager.updateMessage("環境を構築中...");
            this.managers.grid.initialize(
                this.managers.room.getGround(),
                this.managers.room.getWalls()
            );
            
            // ライティングをセットアップ
            this.managers.lighting.setupLights();
            
            // シャドウレシーバーとキャスターを設定
            this.managers.lighting.setShadowReceivers(this.managers.room.getShadowReceivers());
            this.managers.lighting.setShadowCasters(this.managers.room.getShadowCasters());
            
            // AssetPlacerにシャドウジェネレーターを設定
            this.managers.assetPlacer.setShadowGenerator(this.managers.lighting.getShadowGenerator());
            
            // カメラをセットアップ
            this.managers.camera.setupDefaultCamera();
            this.loadingManager.setProgress(90);
            
        } catch (error) {
            this.loadingManager.showError("環境のセットアップに失敗しました");
            throw error;
        }
    }

    /**
     * アプリケーションを開始
     */
    start() {
        if (!this.isInitialized) {
            console.error("Application not initialized");
            return;
        }

        this.managers.scene.startRenderLoop();
        console.log("Application started");
    }

    /**
     * マネージャーを取得
     * @param {string} name - マネージャー名
     * @returns {Object} マネージャーインスタンス
     */
    getManager(name) {
        return this.managers[name];
    }

    /**
     * シーンを取得
     * @returns {BABYLON.Scene}
     */
    getScene() {
        return this.managers.scene ? this.managers.scene.getScene() : null;
    }

    /**
     * エンジンを取得
     * @returns {BABYLON.Engine}
     */
    getEngine() {
        return this.managers.scene ? this.managers.scene.getEngine() : null;
    }

    /**
     * エラーハンドラーを取得
     * @returns {ErrorHandler}
     */
    getErrorHandler() {
        return this.managers.scene ? this.managers.scene.getErrorHandler() : null;
    }

    /**
     * ローディングマネージャーを取得
     * @returns {LoadingManager}
     */
    getLoadingManager() {
        return this.loadingManager;
    }

    /**
     * アプリケーションの状態を取得
     * @returns {Object} アプリケーション状態
     */
    getState() {
        return {
            isInitialized: this.isInitialized,
            currentMode: this.managers.interaction ? 
                this.managers.interaction.getCurrentMode() : null,
            selectedObject: this.managers.selection ? 
                this.managers.selection.getSelectedMesh() : null,
            cameraMode: this.managers.camera ? 
                this.managers.camera.getCurrentMode() : null,
            gridSettings: this.managers.grid ? 
                this.managers.grid.getSettings() : null,
            lightingSettings: this.managers.lighting ? 
                this.managers.lighting.getSettings() : null,
            assetLoadingStatus: this.managers.assetLoader ? 
                this.managers.assetLoader.getLoadingStatus() : null
        };
    }

    /**
     * パフォーマンス統計を取得
     * @returns {Object} パフォーマンス統計
     */
    getPerformanceStats() {
        if (!this.managers.scene || !this.getScene()) {
            return null;
        }
        
        const scene = this.getScene();
        const engine = this.getEngine();
        
        if (!scene || !engine) {
            return null;
        }
        
        return {
            fps: engine.getFps(),
            activeMeshes: scene.getActiveMeshes().length,
            totalMeshes: scene.meshes.length,
            totalVertices: scene.getTotalVertices(),
            drawCalls: scene.getEngine().drawCalls || 0
        };
    }

    /**
     * スクリーンショットを撮る
     * @param {Object} options - スクリーンショットオプション
     * @returns {Promise<string>} DataURL
     */
    async takeScreenshot(options = {}) {
        if (!this.managers.scene) {
            throw new Error("Scene not initialized");
        }
        
        return await this.managers.scene.takeScreenshot(options);
    }

    /**
     * アプリケーションをリセット
     */
    reset() {
        console.log("Resetting application...");

        // すべての配置済みアセットを削除
        if (this.managers.assetPlacer) {
            this.managers.assetPlacer.clearAllAssets();
        }

        // 選択を解除
        if (this.managers.selection) {
            this.managers.selection.deselectAll();
        }

        // インタラクションモードをリセット
        if (this.managers.interaction) {
            this.managers.interaction.resetMode();
        }

        // カメラをリセット
        if (this.managers.camera) {
            this.managers.camera.resetCamera();
        }

        console.log("Application reset complete");
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing application...");
        
        // すべてのマネージャーをクリーンアップ
        Object.values(this.managers).forEach(manager => {
            if (manager && typeof manager.dispose === 'function') {
                manager.dispose();
            }
        });
        
        // ローディングマネージャーをクリーンアップ
        if (this.loadingManager) {
            this.loadingManager.dispose();
        }
        
        this.managers = {};
        this.isInitialized = false;
        
        console.log("Application disposed");
    }
}