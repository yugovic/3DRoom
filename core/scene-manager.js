// js/core/SceneManager.js
/**
 * Babylon.jsのシーンとエンジンを管理するクラス
 */

import { DEFAULT_SETTINGS } from '../config/default-settings.js';
import { ErrorHandler } from './error-handler.js';

export class SceneManager {
    constructor(canvas) {
        this.canvas = canvas;
        this.engine = null;
        this.scene = null;
        this.errorHandler = new ErrorHandler();
        this.isInitialized = false;
    }

    /**
     * エンジンとシーンを初期化
     * @returns {Promise<void>}
     */
    async initialize() {
        try {
            this.initializeEngine();
            this.createScene();
            this.setupWindowResize();
            this.isInitialized = true;
            
            console.log("SceneManager initialized successfully");
        } catch (error) {
            this.errorHandler.handleCriticalError(error, 'SceneManager.initialize');
            throw error;
        }
    }

    /**
     * Babylon.jsエンジンの初期化
     */
    initializeEngine() {
        try {
            const engineSettings = DEFAULT_SETTINGS.engine;
            
            this.engine = new BABYLON.Engine(
                this.canvas, 
                engineSettings.antialiasing
            );
            
            // アルファモードを設定
            if (engineSettings.alphaMode === 'DISABLE') {
                this.engine.alphaMode = BABYLON.Engine.ALPHA_DISABLE;
            }
            
            // ハードウェアスケーリングレベルを設定
            this.engine.setHardwareScalingLevel(engineSettings.hardwareScalingLevel);
            
            console.log("Babylon.js engine initialized");
        } catch (error) {
            throw new Error("Babylon.jsエンジンの初期化に失敗しました: " + error.message);
        }
    }

    /**
     * シーンの作成
     */
    createScene() {
        try {
            this.scene = new BABYLON.Scene(this.engine);
            
            const envSettings = DEFAULT_SETTINGS.environment;
            
            // 背景色を設定
            this.scene.clearColor = new BABYLON.Color4(
                envSettings.backgroundColor.r,
                envSettings.backgroundColor.g,
                envSettings.backgroundColor.b,
                envSettings.backgroundColor.a
            );
            
            // 座標系を設定
            this.scene.useRightHandedSystem = envSettings.useRightHandedSystem;
            
            // 環境光を設定
            this.scene.ambientColor = new BABYLON.Color3(
                envSettings.ambientColor.r,
                envSettings.ambientColor.g,
                envSettings.ambientColor.b
            );
            
            // 深度レンダラーを設定
            this.setupDepthRenderer();
            
            // ハイライトレイヤーを作成
            this.createHighlightLayer();
            
            // レンダリング設定
            this.setupRenderingSettings();
            
            console.log("Scene created successfully");
        } catch (error) {
            throw new Error("シーンの作成に失敗しました: " + error.message);
        }
    }

    /**
     * 深度レンダラーの設定
     */
    setupDepthRenderer() {
        this.scene.depthRenderer = new BABYLON.DepthRenderer(this.scene, {
            useOnlyInActiveCamera: true,
            depthScale: 10 // 深度スケールを増加して精度を向上
        });
        
        // 深度バッファの精度を向上
        this.scene.getEngine().setDepthBuffer(true);
        this.scene.getEngine().setDepthFunction(BABYLON.Engine.LEQUAL);
    }

    /**
     * ハイライトレイヤーの作成
     */
    createHighlightLayer() {
        this.highlightLayer = new BABYLON.HighlightLayer("highlightLayer", this.scene, {
            blurHorizontalSize: 2,
            blurVerticalSize: 2,
            mainTextureRatio: 0.5
        });
        
        console.log("Highlight layer created");
    }

    /**
     * レンダリング設定
     */
    setupRenderingSettings() {
        // Frustum Cullingの設定
        this.scene.autoClear = false;
        this.scene.skipFrustumClipping = true;
        
        // レンダリング前の処理を登録
        this.scene.registerBeforeRender(() => {
            // 必要に応じて処理を追加
        });
    }

    /**
     * ウィンドウリサイズの処理
     */
    setupWindowResize() {
        window.addEventListener("resize", () => {
            if (this.engine) {
                this.engine.resize();
            }
        });
    }

    /**
     * レンダリングループの開始
     */
    startRenderLoop() {
        if (!this.engine || !this.scene) {
            this.errorHandler.showError("エンジンまたはシーンが初期化されていません");
            return;
        }

        this.engine.runRenderLoop(() => {
            // 透明度バッファをクリア
            this.engine.clear(this.scene.clearColor, true, true, true);
            
            // シーンのレンダリング
            this.scene.render();
        });
        
        console.log("Render loop started");
    }

    /**
     * レンダリングループの停止
     */
    stopRenderLoop() {
        if (this.engine) {
            this.engine.stopRenderLoop();
            console.log("Render loop stopped");
        }
    }

    /**
     * シーンを取得
     * @returns {BABYLON.Scene}
     */
    getScene() {
        return this.scene;
    }

    /**
     * エンジンを取得
     * @returns {BABYLON.Engine}
     */
    getEngine() {
        return this.engine;
    }

    /**
     * ハイライトレイヤーを取得
     * @returns {BABYLON.HighlightLayer}
     */
    getHighlightLayer() {
        return this.highlightLayer;
    }

    /**
     * エラーハンドラーを取得
     * @returns {ErrorHandler}
     */
    getErrorHandler() {
        return this.errorHandler;
    }

    /**
     * キャンバスを取得
     * @returns {HTMLCanvasElement}
     */
    getCanvas() {
        return this.canvas;
    }

    /**
     * レンダリングの一時停止
     */
    pauseRendering() {
        this.stopRenderLoop();
    }

    /**
     * レンダリングの再開
     */
    resumeRendering() {
        this.startRenderLoop();
    }

    /**
     * シーンのスクリーンショットを撮る
     * @param {Object} options - スクリーンショットオプション
     * @returns {Promise<string>} - スクリーンショットのDataURL
     */
    takeScreenshot(options = {}) {
        return new Promise((resolve, reject) => {
            try {
                const screenshotSize = {
                    width: options.width || this.engine.getRenderWidth(),
                    height: options.height || this.engine.getRenderHeight()
                };
                
                // 一時的に高解像度に設定
                const originalScaling = this.engine.getHardwareScalingLevel();
                this.engine.setHardwareScalingLevel(options.scaling || 0.5);
                
                // シーンを一度レンダリング
                this.scene.render();
                
                // スクリーンショットを撮る
                BABYLON.Tools.CreateScreenshot(
                    this.engine,
                    this.scene.activeCamera,
                    screenshotSize,
                    (screenshot) => {
                        // 元のスケーリングに戻す
                        this.engine.setHardwareScalingLevel(originalScaling);
                        resolve(screenshot);
                    }
                );
            } catch (error) {
                this.errorHandler.showError("スクリーンショットの作成に失敗しました: " + error.message);
                reject(error);
            }
        });
    }

    /**
     * パフォーマンス統計を取得
     * @returns {Object} パフォーマンス統計
     */
    getPerformanceStats() {
        // Babylon.jsのバージョンや設定によっては _textureCollector が利用できないため、安全にアクセスする
        let texturesCacheSize = 0;
        const engine = this.scene.getEngine();
        
        try {
            // テクスチャキャッシュサイズを安全に取得
            if (engine.getCaps().s3tc && engine._textureCollector && engine._textureCollector.texturesCache) {
                texturesCacheSize = engine._textureCollector.texturesCache.length;
            }
        } catch (e) {
            console.warn('Failed to get textures cache size:', e);
        }
        
        return {
            fps: this.engine.getFps(),
            activeMeshes: this.scene.getActiveMeshes().length,
            totalMeshes: this.scene.meshes.length,
            totalVertices: this.scene.getTotalVertices(),
            drawCalls: engine.drawCalls,
            texturesCacheSize: texturesCacheSize
        };
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing SceneManager...");
        
        // レンダリングループを停止
        this.stopRenderLoop();
        
        // シーンの破棄
        if (this.scene) {
            this.scene.dispose();
            this.scene = null;
        }
        
        // エンジンの破棄
        if (this.engine) {
            this.engine.dispose();
            this.engine = null;
        }
        
        // エラーハンドラーの破棄
        if (this.errorHandler) {
            this.errorHandler.dispose();
            this.errorHandler = null;
        }
        
        this.isInitialized = false;
        console.log("SceneManager disposed");
    }
}