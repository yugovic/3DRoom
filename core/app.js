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

export class App {
    constructor(canvas) {
        this.canvas = canvas;
        this.managers = {};
        this.isInitialized = false;
    }

    /**
     * アプリケーションを初期化
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            console.log("Initializing application...");

            // シーンマネージャーを初期化
            this.managers.scene = new SceneManager(this.canvas);
            await this.managers.scene.initialize();

            const scene = this.managers.scene.getScene();
            const errorHandler = this.managers.scene.getErrorHandler();

            // 各マネージャーを初期化
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

            // 環境をセットアップ
            await this.setupEnvironment();

            // インタラクションとUIを初期化
            this.managers.interaction.initialize();
            this.managers.ui.initialize();

            this.isInitialized = true;
            console.log("Application initialized successfully");

        } catch (error) {
            console.error("Failed to initialize application:", error);
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
        // 部屋をロード
        await this.managers.room.loadRoom();
        
        // アセットを事前ロード
        await this.managers.assetLoader.preloadAssets();
        
        // グリッドを作成
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
                this.managers.lighting.getSettings() : null
        };
    }

    /**
     * スクリーンショットを撮る
     * @param {Object} options - オプション
     * @returns {Promise<string>} スクリーンショットのDataURL
     */
    async takeScreenshot(options = {}) {
        if (!this.managers.scene) {
            throw new Error("Scene manager not initialized");
        }
        return await this.managers.scene.takeScreenshot(options);
    }

    /**
     * パフォーマンス統計を取得
     * @returns {Object} パフォーマンス統計
     */
    getPerformanceStats() {
        if (!this.managers.scene) {
            return null;
        }
        return this.managers.scene.getPerformanceStats();
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

        // 各マネージャーを破棄（逆順）
        const managerNames = Object.keys(this.managers).reverse();
        
        for (const name of managerNames) {
            const manager = this.managers[name];
            if (manager && typeof manager.dispose === 'function') {
                console.log(`Disposing ${name} manager...`);
                manager.dispose();
            }
        }

        this.managers = {};
        this.isInitialized = false;
        
        console.log("Application disposed");
    }
}