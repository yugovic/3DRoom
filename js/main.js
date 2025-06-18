// js/main.js
/**
 * アプリケーションのエントリーポイント
 */

import { App } from './core/app.js';

// グローバル変数としてアプリケーションインスタンスを保持（デバッグ用）
window.app = null;

// パフォーマンス監視のインターバルID
let performanceMonitorInterval = null;

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
    
    // 既存のインターバルをクリア
    if (performanceMonitorInterval) {
        clearInterval(performanceMonitorInterval);
    }
    
    // 1秒ごとに更新
    performanceMonitorInterval = setInterval(() => {
        try {
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
        } catch (error) {
            console.error("Performance monitoring error:", error);
            // エラーが発生した場合は監視を停止
            stopPerformanceMonitoring();
        }
    }, 1000);
}

/**
 * パフォーマンス監視を停止
 */
function stopPerformanceMonitoring() {
    if (performanceMonitorInterval) {
        clearInterval(performanceMonitorInterval);
        performanceMonitorInterval = null;
    }
    
    const perfDiv = document.getElementById("performanceMonitor");
    if (perfDiv) {
        perfDiv.remove();
    }
}

/**
 * アプリケーションのクリーンアップ
 */
function cleanup() {
    // パフォーマンス監視を停止
    stopPerformanceMonitoring();
    
    if (window.app) {
        window.app.dispose();
        window.app = null;
    }
}

// ページアンロード時のクリーンアップ
window.addEventListener("beforeunload", cleanup);

// グローバルエラーハンドリング
window.addEventListener("error", (event) => {
    console.error("Global error:", event.error);
    
    // アプリケーションのエラーハンドラーが利用可能な場合は使用
    if (window.app && window.app.getErrorHandler()) {
        window.app.getErrorHandler().handleCriticalError(
            event.error,
            'window.error'
        );
    }
});

// 未処理のPromiseエラー
window.addEventListener("unhandledrejection", (event) => {
    console.error("Unhandled promise rejection:", event.reason);
    
    if (window.app && window.app.getErrorHandler()) {
        window.app.getErrorHandler().handleError(
            new Error(event.reason),
            'window.unhandledrejection'
        );
    }
});

// DOMContentLoadedで開始
document.addEventListener("DOMContentLoaded", startApplication);