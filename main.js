// js/main.js
/**
 * アプリケーションのエントリーポイント
 */

import { App } from './core/app.js';

// グローバル変数としてアプリケーションインスタンスを保持（デバッグ用）
window.app = null;

/**
 * アプリケーションを起動
 */
async function startApplication() {
    try {
        // キャンバス要素を取得
        const canvas = document.getElementById("renderCanvas");
        
        if (!canvas) {
            throw new Error("Canvas element 'renderCanvas' not found");
        }

        // アプリケーションインスタンスを作成
        const app = new App(canvas);
        
        // グローバル変数に保存（デバッグ用）
        window.app = app;
        
        // 初期化
        await app.initialize();
        
        // アプリケーションを開始
        app.start();
        
        // パフォーマンス監視（開発環境のみ）
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            startPerformanceMonitoring(app);
        }
        
        console.log("Application started successfully");
        
    } catch (error) {
        console.error("Failed to start application:", error);
        
        // エラーメッセージを表示
        showStartupError(error.message);
    }
}

/**
 * 起動エラーを表示
 * @param {string} message - エラーメッセージ
 */
function showStartupError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(255, 0, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 8px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        z-index: 1000;
        max-width: 400px;
        text-align: center;
    `;
    errorDiv.innerHTML = `
        <h3 style="margin: 0 0 10px 0;">起動エラー</h3>
        <p>${message}</p>
        <button onclick="location.reload()" style="
            margin-top: 10px;
            padding: 8px 16px;
            border: none;
            border-radius: 4px;
            background-color: white;
            color: red;
            cursor: pointer;
        ">ページを再読み込み</button>
    `;
    document.body.appendChild(errorDiv);
}

/**
 * パフォーマンス監視を開始（開発用）
 * @param {App} app - アプリケーションインスタンス
 */
function startPerformanceMonitoring(app) {
    const perfDiv = document.createElement("div");
    perfDiv.id = "performanceMonitor";
    perfDiv.style.cssText = `
        position: fixed;
        top: 10px;
        right: 300px;
        background-color: rgba(0, 0, 0, 0.7);
        color: #00ff00;
        padding: 10px;
        font-family: monospace;
        font-size: 12px;
        z-index: 100;
        border-radius: 4px;
        pointer-events: none;
    `;
    document.body.appendChild(perfDiv);
    
    // 1秒ごとに更新
    setInterval(() => {
        const stats = app.getPerformanceStats();
        if (stats) {
            perfDiv.innerHTML = `
                FPS: ${stats.fps.toFixed(1)}<br>
                Active Meshes: ${stats.activeMeshes}<br>
                Total Meshes: ${stats.totalMeshes}<br>
                Vertices: ${stats.totalVertices.toLocaleString()}<br>
                Draw Calls: ${stats.drawCalls}
            `;
        }
    }, 1000);
}

/**
 * アプリケーションのクリーンアップ
 */
function cleanup() {
    if (window.app) {
        window.app.dispose();
        window.app = null;
    }
}

// ページ読み込み完了時にアプリケーションを起動
window.addEventListener("DOMContentLoaded", startApplication);

// ページ離脱時にクリーンアップ
window.addEventListener("beforeunload", cleanup);

// エラーハンドリング
window.addEventListener("error", (event) => {
    console.error("Global error:", event.error);
    
    if (window.app && window.app.getErrorHandler()) {
        window.app.getErrorHandler().handleCriticalError(
            event.error,
            'window.error'
        );
    }
});

// 未処理のPromiseエラーをキャッチ
window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
    
    if (window.app && window.app.getErrorHandler()) {
        window.app.getErrorHandler().showError(
            "未処理のエラーが発生しました: " + event.reason
        );
    }
});

// 開発用のグローバル関数
if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    // アプリケーション状態を取得
    window.getAppState = () => {
        if (window.app) {
            return window.app.getState();
        }
        return null;
    };
    
    // スクリーンショットを撮る
    window.takeScreenshot = async () => {
        if (window.app) {
            const dataUrl = await window.app.takeScreenshot();
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = `screenshot_${Date.now()}.png`;
            link.click();
        }
    };
    
    // アプリケーションをリセット
    window.resetApp = () => {
        if (window.app) {
            window.app.reset();
        }
    };
}