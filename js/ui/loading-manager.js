// js/ui/LoadingManager.js
/**
 * ローディング表示を管理するクラス
 */

export class LoadingManager {
    constructor() {
        this.loadingOverlay = null;
        this.progressBar = null;
        this.loadingText = null;
        this.progressValue = 0;
        this.initializeLoadingUI();
    }

    /**
     * ローディングUIを初期化
     */
    initializeLoadingUI() {
        // オーバーレイを作成
        this.loadingOverlay = document.createElement("div");
        this.loadingOverlay.id = "loadingOverlay";
        this.loadingOverlay.style.cssText = `
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.8);
            z-index: 9999;
            justify-content: center;
            align-items: center;
            flex-direction: column;
        `;

        // ローディングコンテナ
        const loadingContainer = document.createElement("div");
        loadingContainer.style.cssText = `
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            padding: 30px;
            text-align: center;
            backdrop-filter: blur(10px);
        `;

        // ローディングテキスト
        this.loadingText = document.createElement("div");
        this.loadingText.style.cssText = `
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 18px;
            margin-bottom: 20px;
        `;
        this.loadingText.textContent = "アセットを読み込み中...";

        // プログレスバーコンテナ
        const progressContainer = document.createElement("div");
        progressContainer.style.cssText = `
            width: 300px;
            height: 20px;
            background-color: rgba(255, 255, 255, 0.2);
            border-radius: 10px;
            overflow: hidden;
            margin-bottom: 10px;
        `;

        // プログレスバー
        this.progressBar = document.createElement("div");
        this.progressBar.style.cssText = `
            width: 0%;
            height: 100%;
            background: linear-gradient(90deg, #4CAF50, #8BC34A);
            transition: width 0.3s ease;
            border-radius: 10px;
        `;

        // パーセント表示
        this.percentText = document.createElement("div");
        this.percentText.style.cssText = `
            color: white;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            font-size: 14px;
            margin-top: 10px;
        `;
        this.percentText.textContent = "0%";

        // スピナー（補助的なアニメーション）
        const spinner = document.createElement("div");
        spinner.className = "loading-spinner";
        spinner.style.cssText = `
            width: 40px;
            height: 40px;
            margin: 20px auto 0;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-top-color: white;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        `;

        // CSSアニメーションを追加
        const style = document.createElement("style");
        style.textContent = `
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);

        // 要素を構築
        progressContainer.appendChild(this.progressBar);
        loadingContainer.appendChild(this.loadingText);
        loadingContainer.appendChild(progressContainer);
        loadingContainer.appendChild(this.percentText);
        loadingContainer.appendChild(spinner);
        this.loadingOverlay.appendChild(loadingContainer);

        // DOMに追加
        document.body.appendChild(this.loadingOverlay);
    }

    /**
     * ローディングを表示
     * @param {string} message - 表示するメッセージ
     */
    show(message = "読み込み中...") {
        if (this.loadingOverlay) {
            this.loadingText.textContent = message;
            this.loadingOverlay.style.display = "flex";
            this.setProgress(0);
        }
    }

    /**
     * ローディングを非表示
     */
    hide() {
        if (this.loadingOverlay) {
            // フェードアウトアニメーション
            this.loadingOverlay.style.opacity = "0";
            setTimeout(() => {
                this.loadingOverlay.style.display = "none";
                this.loadingOverlay.style.opacity = "1";
                this.setProgress(0);
            }, 300);
        }
    }

    /**
     * プログレスを設定
     * @param {number} percent - 進捗率（0-100）
     */
    setProgress(percent) {
        this.progressValue = Math.min(100, Math.max(0, percent));
        
        if (this.progressBar) {
            this.progressBar.style.width = `${this.progressValue}%`;
        }
        
        if (this.percentText) {
            this.percentText.textContent = `${Math.round(this.progressValue)}%`;
        }
    }

    /**
     * プログレスを増加
     * @param {number} amount - 増加量
     */
    incrementProgress(amount) {
        this.setProgress(this.progressValue + amount);
    }

    /**
     * メッセージを更新
     * @param {string} message - 新しいメッセージ
     */
    updateMessage(message) {
        if (this.loadingText) {
            this.loadingText.textContent = message;
        }
    }

    /**
     * アセットロードの進捗を管理
     * @param {number} loaded - ロード済みアセット数
     * @param {number} total - 総アセット数
     */
    updateAssetProgress(loaded, total) {
        const percent = (loaded / total) * 100;
        this.setProgress(percent);
        this.updateMessage(`アセットを読み込み中... (${loaded}/${total})`);
    }

    /**
     * エラー状態を表示
     * @param {string} errorMessage - エラーメッセージ
     */
    showError(errorMessage) {
        if (this.loadingText) {
            this.loadingText.textContent = `エラー: ${errorMessage}`;
            this.loadingText.style.color = "#ff5252";
        }
        
        // 3秒後に自動的に非表示
        setTimeout(() => {
            this.hide();
        }, 3000);
    }

    /**
     * クリーンアップ
     */
    dispose() {
        if (this.loadingOverlay && this.loadingOverlay.parentNode) {
            this.loadingOverlay.parentNode.removeChild(this.loadingOverlay);
        }
        this.loadingOverlay = null;
        this.progressBar = null;
        this.loadingText = null;
        this.percentText = null;
    }
}