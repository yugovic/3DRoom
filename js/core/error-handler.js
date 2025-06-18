// js/core/ErrorHandler.js
/**
 * エラーハンドリングシステム
 */

export class ErrorHandler {
    constructor() {
        this.errorPanel = null;
        this.errorLog = [];
        this.maxLogSize = 100;
        this.initializeErrorPanel();
    }

    /**
     * エラーパネルを初期化
     */
    initializeErrorPanel() {
        this.errorPanel = document.getElementById("errorPanel");
        
        if (!this.errorPanel) {
            // エラーパネルが存在しない場合は作成
            this.errorPanel = document.createElement("div");
            this.errorPanel.id = "errorPanel";
            this.errorPanel.style.cssText = `
                display: none;
                position: absolute;
                bottom: 10px;
                left: 10px;
                background-color: rgba(255, 0, 0, 0.7);
                color: white;
                padding: 10px;
                border-radius: 5px;
                z-index: 100;
                max-width: 400px;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            `;
            document.body.appendChild(this.errorPanel);
        }
    }

    /**
     * エラーを表示
     * @param {Error|string} error - エラーオブジェクトまたはメッセージ
     * @param {Object} context - エラーのコンテキスト情報
     * @param {number} displayDuration - 表示時間（ミリ秒）
     */
    showError(error, context = {}, displayDuration = 5000) {
        const errorMessage = error instanceof Error ? error.message : error;
        const timestamp = new Date().toISOString();
        
        // エラーをログに記録
        this.logError(error, context);
        
        // コンソールにエラーを出力
        console.error("エラーが発生しました:", errorMessage);
        if (error instanceof Error && error.stack) {
            console.error("スタックトレース:", error.stack);
        }
        if (Object.keys(context).length > 0) {
            console.debug("エラーコンテキスト:", context);
        }
        
        // エラーパネルに表示
        if (this.errorPanel) {
            this.errorPanel.textContent = `エラー: ${errorMessage}`;
            this.errorPanel.style.display = "block";
            
            // 自動的に非表示にする
            setTimeout(() => {
                if (this.errorPanel) {
                    this.errorPanel.style.display = "none";
                }
            }, displayDuration);
        }
    }

    /**
     * 警告を表示
     * @param {string} message - 警告メッセージ
     * @param {Object} context - 警告のコンテキスト情報
     */
    showWarning(message, context = {}) {
        console.warn("警告:", message);
        if (Object.keys(context).length > 0) {
            console.debug("警告コンテキスト:", context);
        }
        
        // 警告用の黄色い表示
        if (this.errorPanel) {
            this.errorPanel.textContent = `警告: ${message}`;
            this.errorPanel.style.backgroundColor = "rgba(255, 165, 0, 0.7)";
            this.errorPanel.style.display = "block";
            
            setTimeout(() => {
                if (this.errorPanel) {
                    this.errorPanel.style.display = "none";
                    this.errorPanel.style.backgroundColor = "rgba(255, 0, 0, 0.7)"; // 元の色に戻す
                }
            }, 3000);
        }
    }

    /**
     * 情報メッセージを表示
     * @param {string} message - 情報メッセージ
     * @param {number} displayDuration - 表示時間（ミリ秒）
     */
    showInfo(message, displayDuration = 2000) {
        console.info("情報:", message);
        
        // 情報用の青い表示
        if (this.errorPanel) {
            this.errorPanel.textContent = message;
            this.errorPanel.style.backgroundColor = "rgba(0, 123, 255, 0.7)";
            this.errorPanel.style.display = "block";
            
            setTimeout(() => {
                if (this.errorPanel) {
                    this.errorPanel.style.display = "none";
                    this.errorPanel.style.backgroundColor = "rgba(255, 0, 0, 0.7)"; // 元の色に戻す
                }
            }, displayDuration);
        }
    }

    /**
     * エラーをログに記録
     * @param {Error|string} error - エラー
     * @param {Object} context - コンテキスト情報
     */
    logError(error, context = {}) {
        const errorEntry = {
            timestamp: new Date().toISOString(),
            message: error instanceof Error ? error.message : error,
            stack: error instanceof Error ? error.stack : null,
            context: context
        };
        
        this.errorLog.push(errorEntry);
        
        // ログサイズを制限
        if (this.errorLog.length > this.maxLogSize) {
            this.errorLog.shift();
        }
    }

    /**
     * エラーログを取得
     * @returns {Array} エラーログ
     */
    getErrorLog() {
        return [...this.errorLog];
    }

    /**
     * エラーログをクリア
     */
    clearErrorLog() {
        this.errorLog = [];
    }

    /**
     * エラーログをエクスポート
     * @returns {string} JSON形式のエラーログ
     */
    exportErrorLog() {
        return JSON.stringify(this.errorLog, null, 2);
    }

    /**
     * クリティカルエラーハンドラー
     * @param {Error} error - エラー
     * @param {string} component - エラーが発生したコンポーネント
     */
    handleCriticalError(error, component) {
        const message = `クリティカルエラー [${component}]: ${error.message}`;
        
        // ログに記録
        this.logError(error, { component, severity: 'critical' });
        
        // エラーパネルに表示（長時間）
        if (this.errorPanel) {
            this.errorPanel.textContent = message;
            this.errorPanel.style.backgroundColor = "rgba(139, 0, 0, 0.9)"; // 暗い赤
            this.errorPanel.style.display = "block";
            
            // クリティカルエラーは自動的に非表示にしない
        }
        
        // コンソールに詳細を出力
        console.error("=== クリティカルエラー ===");
        console.error(`コンポーネント: ${component}`);
        console.error(`メッセージ: ${error.message}`);
        console.error(`スタックトレース:`, error.stack);
        console.error("========================");
    }

    /**
     * エラーパネルを手動で非表示
     */
    hideError() {
        if (this.errorPanel) {
            this.errorPanel.style.display = "none";
        }
    }

    /**
     * クリーンアップ
     */
    dispose() {
        if (this.errorPanel && this.errorPanel.parentNode) {
            this.errorPanel.parentNode.removeChild(this.errorPanel);
        }
        this.errorPanel = null;
        this.errorLog = [];
    }
}