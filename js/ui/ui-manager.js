// js/ui/UIManager.js
/**
 * ユーザーインターフェースを管理するクラス
 */

import { ASSET_TYPES } from '../config/constants.js';
import { color3ToHex } from '../utils/color-utils.js';

export class UIManager {
    constructor(app, errorHandler) {
        this.app = app;
        this.errorHandler = errorHandler;
        
        // DOM要素の参照
        this.elements = {};
        
        // UI状態
        this.controlsPanelVisible = true;
        this.helpPanelVisible = false;
        
        // 位置インジケーター
        this.positionIndicator = null;
        
        // カメラ位置表示（1人称モード用）
        this.cameraPositionDisplay = null;
        
        // 1人称モードガイド
        this.firstPersonGuide = null;
    }

    /**
     * UIを初期化
     */
    initialize() {
        try {
            // DOM要素を取得
            this.collectDOMElements();
            
            // イベントリスナーを設定
            this.setupEventListeners();
            
            // 初期値を設定
            this.setInitialValues();
            
            // 位置インジケーターを作成
            this.createPositionIndicator();
            
            // 1人称モードガイドを作成
            this.createFirstPersonGuide();
            
            console.log("UIManager initialized");
            
        } catch (error) {
            this.errorHandler.handleCriticalError(error, 'UIManager.initialize');
        }
    }

    /**
     * DOM要素を収集
     */
    collectDOMElements() {
        // アセット配置ボタン
        this.elements.cubeBtn = document.getElementById("cubeBtn");
        this.elements.recordBtn = document.getElementById("recordBtn");
        this.elements.juiceBoxBtn = document.getElementById("juiceBoxBtn");
        this.elements.mikeDeskBtn = document.getElementById("mikeDeskBtn");
        
        // アクションボタン
        this.elements.rotateBtn = document.getElementById("rotateBtn");
        this.elements.deleteBtn = document.getElementById("deleteBtn");
        this.elements.firstPersonBtn = document.getElementById("firstPersonBtn");
        this.elements.exportImageBtn = document.getElementById("exportImageBtn");
        
        // コントロールパネル
        this.elements.toggleControlsBtn = document.getElementById("toggleControlsBtn");
        this.elements.toggleControlsIcon = document.querySelector(".toggle-icon");
        this.elements.controlsContent = document.querySelector(".controls-content");
        
        // グリッド設定
        this.elements.gridSizeSelect = document.getElementById("gridSizeSelect");
        this.elements.showGridCheck = document.getElementById("showGridCheck");
        this.elements.snapToGridCheck = document.getElementById("snapToGridCheck");
        
        // ズーム設定
        this.elements.zoomSlider = document.getElementById("zoomSlider");
        this.elements.zoomInBtn = document.getElementById("zoomInBtn");
        this.elements.zoomOutBtn = document.getElementById("zoomOutBtn");
        this.elements.resetZoomBtn = document.getElementById("resetZoomBtn");
        
        // ライティング設定
        this.elements.lighting = {
            ambientIntensity: document.getElementById("ambientIntensity"),
            directionalIntensity: document.getElementById("directionalIntensity"),
            pointLightIntensity: document.getElementById("pointLightIntensity"),
            shadowDarkness: document.getElementById("shadowDarkness"),
            ambientColor: document.getElementById("ambientColor"),
            pointLight1Color: document.getElementById("pointLight1Color"),
            pointLight2Color: document.getElementById("pointLight2Color"),
            dirLightX: document.getElementById("dirLightX"),
            dirLightY: document.getElementById("dirLightY"),
            dirLightZ: document.getElementById("dirLightZ"),
            pointLight1X: document.getElementById("pointLight1X"),
            pointLight1Y: document.getElementById("pointLight1Y"),
            pointLight1Z: document.getElementById("pointLight1Z"),
            pointLight2X: document.getElementById("pointLight2X"),
            pointLight2Y: document.getElementById("pointLight2Y"),
            pointLight2Z: document.getElementById("pointLight2Z"),
            reduceShininess: document.getElementById("reduceShininess")
        };
        
        // カメラデバッグパネル
        this.elements.camera = {
            alphaSlider: document.getElementById("cameraAlpha"),
            betaSlider: document.getElementById("cameraBeta"),
            radiusSlider: document.getElementById("cameraRadius"),
            targetXSlider: document.getElementById("cameraTargetX"),
            targetYSlider: document.getElementById("cameraTargetY"),
            targetZSlider: document.getElementById("cameraTargetZ"),
            infoDisplay: document.getElementById("cameraInfoDisplay"),
            resetBtn: document.getElementById("resetCameraBtn"),
            logBtn: document.getElementById("logCameraBtn")
        };
        
        // ヘルプパネル
        this.elements.helpBtn = document.getElementById("helpBtn");
        this.elements.helpPanel = document.querySelector(".help-panel");
        this.elements.helpCloseBtn = document.getElementById("helpCloseBtn");
    }

    /**
     * イベントリスナーを設定
     */
    setupEventListeners() {
        // アセット配置ボタン
        this.setupAssetButtons();
        
        // アクションボタン
        this.setupActionButtons();
        
        // コントロールパネル
        this.setupControlPanel();
        
        // グリッド設定
        this.setupGridControls();
        
        // ズーム設定
        this.setupZoomControls();
        
        // ライティング設定
        this.setupLightingControls();
        
        // カメラデバッグパネル
        this.setupCameraDebugPanel();
        
        // ヘルプパネル
        this.setupHelpPanel();
    }

    /**
     * アセットボタンを設定
     */
    setupAssetButtons() {
        const buttons = [
            { element: this.elements.cubeBtn, type: ASSET_TYPES.CUBE },
            { element: this.elements.recordBtn, type: ASSET_TYPES.RECORD_MACHINE },
            { element: this.elements.juiceBoxBtn, type: ASSET_TYPES.JUICE_BOX },
            { element: this.elements.mikeDeskBtn, type: ASSET_TYPES.MIKE_DESK }
        ];
        
        buttons.forEach(({ element, type }) => {
            if (element) {
                element.addEventListener("click", () => {
                    this.resetAssetButtons();
                    element.classList.add("active");
                    this.app.getManager('interaction').setPlacementMode(type);
                });
            }
        });
    }

    /**
     * アクションボタンを設定
     */
    setupActionButtons() {
        // 回転ボタン
        if (this.elements.rotateBtn) {
            this.elements.rotateBtn.addEventListener("click", () => {
                this.app.getManager('selection').rotateSelectedMesh();
            });
        }
        
        // 削除ボタン
        if (this.elements.deleteBtn) {
            this.elements.deleteBtn.addEventListener("click", () => {
                this.app.getManager('selection').deleteSelectedMesh();
            });
        }
        
        // 1人称モードボタン
        if (this.elements.firstPersonBtn) {
            this.elements.firstPersonBtn.addEventListener("click", () => {
                this.toggleFirstPersonMode();
            });
        }
        
        // 画像エクスポートボタン
        if (this.elements.exportImageBtn) {
            this.elements.exportImageBtn.addEventListener("click", () => {
                this.exportImage();
            });
        }
    }

    /**
     * コントロールパネルを設定
     */
    setupControlPanel() {
        if (this.elements.toggleControlsBtn) {
            this.elements.toggleControlsBtn.addEventListener("click", () => {
                this.toggleControlsPanel();
            });
        }
    }

    /**
     * グリッドコントロールを設定
     */
    setupGridControls() {
        const gridSystem = this.app.getManager('grid');
        
        if (this.elements.gridSizeSelect) {
            this.elements.gridSizeSelect.addEventListener("change", (e) => {
                gridSystem.setGridSize(parseFloat(e.target.value));
            });
        }
        
        if (this.elements.showGridCheck) {
            this.elements.showGridCheck.addEventListener("change", (e) => {
                gridSystem.setShowGrid(e.target.checked);
            });
        }
        
        if (this.elements.snapToGridCheck) {
            this.elements.snapToGridCheck.addEventListener("change", (e) => {
                gridSystem.setSnapToGrid(e.target.checked);
            });
        }
    }

    /**
     * ズームコントロールを設定
     */
    setupZoomControls() {
        const cameraManager = this.app.getManager('camera');
        
        if (this.elements.zoomSlider) {
            this.elements.zoomSlider.addEventListener("input", (e) => {
                cameraManager.setZoomLevel(parseFloat(e.target.value));
            });
        }
        
        if (this.elements.zoomInBtn) {
            this.elements.zoomInBtn.addEventListener("click", () => {
                const currentZoom = parseFloat(this.elements.zoomSlider.value);
                const newZoom = Math.min(currentZoom + 0.1, 2.0);
                this.elements.zoomSlider.value = newZoom;
                cameraManager.setZoomLevel(newZoom);
            });
        }
        
        if (this.elements.zoomOutBtn) {
            this.elements.zoomOutBtn.addEventListener("click", () => {
                const currentZoom = parseFloat(this.elements.zoomSlider.value);
                const newZoom = Math.max(currentZoom - 0.1, 0.5);
                this.elements.zoomSlider.value = newZoom;
                cameraManager.setZoomLevel(newZoom);
            });
        }
        
        if (this.elements.resetZoomBtn) {
            this.elements.resetZoomBtn.addEventListener("click", () => {
                this.elements.zoomSlider.value = 1.0;
                cameraManager.setZoomLevel(1.0);
            });
        }
    }

    /**
     * ライティングコントロールを設定
     */
    setupLightingControls() {
        const lightingSystem = this.app.getManager('lighting');
        
        // 強度スライダー
        const intensityControls = [
            { element: this.elements.lighting.ambientIntensity, type: 'ambient', property: 'intensity' },
            { element: this.elements.lighting.directionalIntensity, type: 'directional', property: 'intensity' },
            { element: this.elements.lighting.pointLightIntensity, type: 'pointLight1', property: 'intensity' },
            { element: this.elements.lighting.shadowDarkness, type: 'shadow', property: 'darkness' }
        ];
        
        intensityControls.forEach(({ element, type, property }) => {
            if (element) {
                element.addEventListener("input", (e) => {
                    lightingSystem.updateSetting(type, property, parseFloat(e.target.value));
                    
                    // ポイントライト2も同時に更新
                    if (type === 'pointLight1' && property === 'intensity') {
                        lightingSystem.updateSetting('pointLight2', property, parseFloat(e.target.value));
                    }
                });
            }
        });
        
        // カラーピッカー
        const colorControls = [
            { element: this.elements.lighting.ambientColor, type: 'ambient', property: 'color' },
            { element: this.elements.lighting.pointLight1Color, type: 'pointLight1', property: 'color' },
            { element: this.elements.lighting.pointLight2Color, type: 'pointLight2', property: 'color' }
        ];
        
        colorControls.forEach(({ element, type, property }) => {
            if (element) {
                element.addEventListener("input", (e) => {
                    lightingSystem.updateSetting(type, property, e.target.value);
                });
            }
        });
        
        // 光源位置スライダー
        this.setupLightPositionControls();
        
        // メタリック効果チェックボックス
        if (this.elements.lighting.reduceShininess) {
            this.elements.lighting.reduceShininess.addEventListener("change", (e) => {
                lightingSystem.adjustMaterialShininess(e.target.checked);
            });
        }
    }

    /**
     * 光源位置コントロールを設定
     */
    setupLightPositionControls() {
        const lightingSystem = this.app.getManager('lighting');
        
        // 方向光の位置
        ['X', 'Y', 'Z'].forEach(axis => {
            const element = this.elements.lighting[`dirLight${axis}`];
            if (element) {
                element.addEventListener("input", () => {
                    const position = {
                        x: parseFloat(this.elements.lighting.dirLightX.value),
                        y: parseFloat(this.elements.lighting.dirLightY.value),
                        z: parseFloat(this.elements.lighting.dirLightZ.value)
                    };
                    lightingSystem.updateSetting('directional', 'position', position);
                });
            }
        });
        
        // ポイントライトの位置
        [1, 2].forEach(lightNum => {
            ['X', 'Y', 'Z'].forEach(axis => {
                const element = this.elements.lighting[`pointLight${lightNum}${axis}`];
                if (element) {
                    element.addEventListener("input", () => {
                        const position = {
                            x: parseFloat(this.elements.lighting[`pointLight${lightNum}X`].value),
                            y: parseFloat(this.elements.lighting[`pointLight${lightNum}Y`].value),
                            z: parseFloat(this.elements.lighting[`pointLight${lightNum}Z`].value)
                        };
                        lightingSystem.updateSetting(`pointLight${lightNum}`, 'position', position);
                    });
                }
            });
        });
    }

    /**
     * カメラデバッグパネルを設定
     */
    setupCameraDebugPanel() {
        const cameraManager = this.app.getManager('camera');
        
        // カメラ角度と位置の調整
        const cameraControls = [
            { element: this.elements.camera.alphaSlider, property: 'alpha' },
            { element: this.elements.camera.betaSlider, property: 'beta' },
            { element: this.elements.camera.radiusSlider, property: 'radius' }
        ];
        
        cameraControls.forEach(({ element, property }) => {
            if (element) {
                element.addEventListener("input", () => {
                    const camera = cameraManager.getActiveCamera();
                    if (camera && camera[property] !== undefined) {
                        camera[property] = parseFloat(element.value);
                        this.updateCameraInfo();
                    }
                });
            }
        });
        
        // カメラターゲット位置
        ['X', 'Y', 'Z'].forEach(axis => {
            const element = this.elements.camera[`target${axis}Slider`];
            if (element) {
                element.addEventListener("input", () => {
                    const camera = cameraManager.getActiveCamera();
                    if (camera && camera.target) {
                        const target = new BABYLON.Vector3(
                            parseFloat(this.elements.camera.targetXSlider.value),
                            parseFloat(this.elements.camera.targetYSlider.value),
                            parseFloat(this.elements.camera.targetZSlider.value)
                        );
                        camera.target = target;
                        this.updateCameraInfo();
                    }
                });
            }
        });
        
        // リセットボタン
        if (this.elements.camera.resetBtn) {
            this.elements.camera.resetBtn.addEventListener("click", () => {
                cameraManager.resetCamera();
                this.updateCameraDebugControls();
            });
        }
        
        // ログボタン
        if (this.elements.camera.logBtn) {
            this.elements.camera.logBtn.addEventListener("click", () => {
                this.logCameraSettings();
            });
        }
        
        // カメラ変更時の更新
        const camera = cameraManager.getActiveCamera();
        if (camera) {
            camera.onViewMatrixChangedObservable.add(() => {
                this.updateCameraInfo();
            });
        }
    }

    /**
     * ヘルプパネルを設定
     */
    setupHelpPanel() {
        if (this.elements.helpBtn) {
            this.elements.helpBtn.addEventListener("click", () => {
                this.showHelpPanel();
            });
        }
        
        if (this.elements.helpCloseBtn) {
            this.elements.helpCloseBtn.addEventListener("click", () => {
                this.hideHelpPanel();
            });
        }
    }

    /**
     * 初期値を設定
     */
    setInitialValues() {
        // グリッド設定
        const gridSettings = this.app.getManager('grid').getSettings();
        if (this.elements.gridSizeSelect) {
            this.elements.gridSizeSelect.value = gridSettings.size;
        }
        if (this.elements.showGridCheck) {
            this.elements.showGridCheck.checked = gridSettings.show;
        }
        if (this.elements.snapToGridCheck) {
            this.elements.snapToGridCheck.checked = gridSettings.snapToGrid;
        }
        
        // ライティング設定
        const lightingSettings = this.app.getManager('lighting').getSettings();
        if (this.elements.lighting.ambientIntensity) {
            this.elements.lighting.ambientIntensity.value = lightingSettings.ambient.intensity;
        }
        if (this.elements.lighting.ambientColor) {
            this.elements.lighting.ambientColor.value = lightingSettings.ambient.color;
        }
        
        // カメラ設定
        this.updateCameraDebugControls();
    }

    /**
     * アセットボタンをリセット
     */
    resetAssetButtons() {
        [this.elements.cubeBtn, this.elements.recordBtn, 
         this.elements.juiceBoxBtn, this.elements.mikeDeskBtn].forEach(btn => {
            if (btn) btn.classList.remove("active");
        });
    }

    /**
     * コントロールパネルの表示を切り替え
     */
    toggleControlsPanel() {
        this.controlsPanelVisible = !this.controlsPanelVisible;
        
        if (this.elements.controlsContent) {
            this.elements.controlsContent.style.display = 
                this.controlsPanelVisible ? "block" : "none";
        }
        
        if (this.elements.toggleControlsIcon) {
            this.elements.toggleControlsIcon.textContent = 
                this.controlsPanelVisible ? "−" : "+";
        }
    }

    /**
     * 1人称モードを切り替え
     */
    toggleFirstPersonMode() {
        const cameraManager = this.app.getManager('camera');
        const currentMode = cameraManager.getCurrentMode();
        
        if (currentMode === 'firstPerson') {
            // 通常モードに戻る
            cameraManager.switchCameraMode('isometric');
            this.elements.firstPersonBtn.classList.remove("active");
            this.elements.firstPersonBtn.textContent = "1人称モード";
            this.hideFirstPersonUI();
            this.enablePlacementControls();
        } else {
            // 1人称モードに切り替え
            cameraManager.switchCameraMode('firstPerson');
            this.elements.firstPersonBtn.classList.add("active");
            this.elements.firstPersonBtn.textContent = "通常モード";
            this.showFirstPersonUI();
            this.disablePlacementControls();
        }
    }

    /**
     * 1人称モードUIを表示
     */
    showFirstPersonUI() {
        if (this.firstPersonGuide) {
            this.firstPersonGuide.style.display = "block";
        }
        
        if (!this.cameraPositionDisplay) {
            this.createCameraPositionDisplay();
        }
        this.cameraPositionDisplay.style.display = "block";
        
        // カメラ位置更新を開始
        this.startCameraPositionUpdate();
    }

    /**
     * 1人称モードUIを非表示
     */
    hideFirstPersonUI() {
        if (this.firstPersonGuide) {
            this.firstPersonGuide.style.display = "none";
        }
        
        if (this.cameraPositionDisplay) {
            this.cameraPositionDisplay.style.display = "none";
        }
        
        // カメラ位置更新を停止
        this.stopCameraPositionUpdate();
    }

    /**
     * 配置コントロールを無効化
     */
    disablePlacementControls() {
        const buttons = [
            this.elements.cubeBtn, this.elements.recordBtn,
            this.elements.juiceBoxBtn, this.elements.mikeDeskBtn,
            this.elements.rotateBtn, this.elements.deleteBtn,
            this.elements.exportImageBtn
        ];
        
        buttons.forEach(btn => {
            if (btn) {
                btn.disabled = true;
                btn.style.opacity = "0.5";
                btn.style.cursor = "not-allowed";
            }
        });
        
        // グリッドコントロールも無効化
        if (this.elements.gridSizeSelect) this.elements.gridSizeSelect.disabled = true;
        if (this.elements.showGridCheck) this.elements.showGridCheck.disabled = true;
        if (this.elements.snapToGridCheck) this.elements.snapToGridCheck.disabled = true;
    }

    /**
     * 配置コントロールを有効化
     */
    enablePlacementControls() {
        const buttons = [
            this.elements.cubeBtn, this.elements.recordBtn,
            this.elements.juiceBoxBtn, this.elements.mikeDeskBtn,
            this.elements.rotateBtn, this.elements.deleteBtn,
            this.elements.exportImageBtn
        ];
        
        buttons.forEach(btn => {
            if (btn) {
                btn.disabled = false;
                btn.style.opacity = "1";
                btn.style.cursor = "pointer";
            }
        });
        
        // グリッドコントロールも有効化
        if (this.elements.gridSizeSelect) this.elements.gridSizeSelect.disabled = false;
        if (this.elements.showGridCheck) this.elements.showGridCheck.disabled = false;
        if (this.elements.snapToGridCheck) this.elements.snapToGridCheck.disabled = false;
    }

    /**
     * 画像をエクスポート
     */
    async exportImage() {
        try {
            const timestamp = new Date().toISOString().replace(/[:.-]/g, '').slice(0, 15);
            const filename = `3d_room_${timestamp}.png`;
            
            const dataUrl = await this.app.takeScreenshot({ scaling: 0.5 });
            
            // ダウンロードリンクを作成
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            console.log("Image exported:", filename);
            
        } catch (error) {
            this.errorHandler.showError("画像の書き出しに失敗しました: " + error.message);
        }
    }

    /**
     * ヘルプパネルを表示
     */
    showHelpPanel() {
        if (this.elements.helpPanel) {
            this.elements.helpPanel.style.display = "block";
            this.helpPanelVisible = true;
        }
    }

    /**
     * ヘルプパネルを非表示
     */
    hideHelpPanel() {
        if (this.elements.helpPanel) {
            this.elements.helpPanel.style.display = "none";
            this.helpPanelVisible = false;
        }
    }

    /**
     * カメラ情報を更新
     */
    updateCameraInfo() {
        const cameraManager = this.app.getManager('camera');
        const settings = cameraManager.getCameraSettings();
        
        if (!settings || !this.elements.camera.infoDisplay) return;
        
        this.elements.camera.infoDisplay.textContent = 
            `α: ${settings.alpha.toFixed(2)}, β: ${settings.beta.toFixed(2)}, r: ${settings.radius.toFixed(2)}\n` +
            `Target: (${settings.target.x.toFixed(2)}, ${settings.target.y.toFixed(2)}, ${settings.target.z.toFixed(2)})\n` +
            `Pos: (${settings.position.x.toFixed(2)}, ${settings.position.y.toFixed(2)}, ${settings.position.z.toFixed(2)})`;
    }

    /**
     * カメラデバッグコントロールを更新
     */
    updateCameraDebugControls() {
        const cameraManager = this.app.getManager('camera');
        const camera = cameraManager.getActiveCamera();
        
        if (!camera) return;
        
        if (this.elements.camera.alphaSlider) {
            this.elements.camera.alphaSlider.value = camera.alpha;
        }
        if (this.elements.camera.betaSlider) {
            this.elements.camera.betaSlider.value = camera.beta;
        }
        if (this.elements.camera.radiusSlider) {
            this.elements.camera.radiusSlider.value = camera.radius;
        }
        
        if (camera.target) {
            if (this.elements.camera.targetXSlider) {
                this.elements.camera.targetXSlider.value = camera.target.x;
            }
            if (this.elements.camera.targetYSlider) {
                this.elements.camera.targetYSlider.value = camera.target.y;
            }
            if (this.elements.camera.targetZSlider) {
                this.elements.camera.targetZSlider.value = camera.target.z;
            }
        }
        
        this.updateCameraInfo();
    }

    /**
     * カメラ設定をログ出力
     */
    logCameraSettings() {
        const cameraManager = this.app.getManager('camera');
        const settings = cameraManager.getCameraSettings();
        
        if (!settings) return;
        
        console.log("現在のカメラ設定:", settings);
        
        const codeExample = `// カメラ設定
const cameraSettings = {
    alpha: ${settings.alpha.toFixed(4)},
    beta: ${settings.beta.toFixed(4)},
    radius: ${settings.radius.toFixed(4)},
    target: new BABYLON.Vector3(${settings.target.x.toFixed(4)}, ${settings.target.y.toFixed(4)}, ${settings.target.z.toFixed(4)})
};`;
        
        console.log("コード例:");
        console.log(codeExample);
        
        alert("カメラ設定をコンソールに出力しました。F12キーを押してコンソールを確認してください。");
    }

    /**
     * 位置インジケーターを作成
     */
    createPositionIndicator() {
        const indicator = document.createElement("div");
        indicator.className = "position-indicator";
        indicator.style.display = "none";
        document.body.appendChild(indicator);
        
        this.positionIndicator = indicator;
    }

    /**
     * 位置インジケーターを更新
     * @param {BABYLON.Vector3} position - 位置
     * @param {string} additionalInfo - 追加情報
     */
    updatePositionIndicator(position, additionalInfo = "") {
        if (!this.positionIndicator) return;
        
        this.positionIndicator.style.display = "block";
        this.positionIndicator.textContent = 
            `位置: (${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)})`;
        
        if (additionalInfo) {
            this.positionIndicator.textContent += `\n${additionalInfo}`;
        }
    }

    /**
     * 位置インジケーターを非表示
     */
    hidePositionIndicator() {
        if (this.positionIndicator) {
            this.positionIndicator.style.display = "none";
        }
    }

    /**
     * 1人称モードガイドを作成
     */
    createFirstPersonGuide() {
        const guide = document.createElement("div");
        guide.className = "first-person-guide";
        guide.innerHTML = `
            <h4>1人称モード操作方法</h4>
            <ul>
                <li><strong>W</strong>: カメラの向いている方向へ前進（水平移動）</li>
                <li><strong>S</strong>: カメラの向いている方向から後退（水平移動）</li>
                <li><strong>A</strong>: カメラから見て左方向へ移動（水平移動）</li>
                <li><strong>D</strong>: カメラから見て右方向へ移動（水平移動）</li>
                <li><strong>Space</strong>: 上昇</li>
                <li><strong>C</strong>: 下降</li>
                <li><strong>マウス</strong>: 視点変更（水平移動方向に影響）</li>
                <li><strong>Shift</strong>: 高速移動</li>
                <li><strong>Ctrl</strong>: 低速移動</li>
            </ul>
        `;
        guide.style.display = "none";
        document.body.appendChild(guide);
        
        this.firstPersonGuide = guide;
    }

    /**
     * カメラ位置表示を作成
     */
    createCameraPositionDisplay() {
        const display = document.createElement("div");
        display.id = "cameraPositionDisplay";
        display.style.cssText = `
            position: fixed;
            bottom: 10px;
            right: 10px;
            padding: 10px;
            background-color: rgba(0, 0, 0, 0.7);
            color: white;
            font-family: monospace;
            font-size: 12px;
            border-radius: 5px;
            z-index: 1000;
            pointer-events: none;
        `;
        document.body.appendChild(display);
        
        this.cameraPositionDisplay = display;
    }

    /**
     * カメラ位置更新を開始
     */
    startCameraPositionUpdate() {
        this.cameraUpdateInterval = setInterval(() => {
            this.updateCameraPositionDisplay();
        }, 100);
    }

    /**
     * カメラ位置更新を停止
     */
    stopCameraPositionUpdate() {
        if (this.cameraUpdateInterval) {
            clearInterval(this.cameraUpdateInterval);
            this.cameraUpdateInterval = null;
        }
    }

    /**
     * カメラ位置表示を更新
     */
    updateCameraPositionDisplay() {
        if (!this.cameraPositionDisplay) return;
        
        const cameraManager = this.app.getManager('camera');
        const camera = cameraManager.getActiveCamera();
        
        if (!camera || cameraManager.getCurrentMode() !== 'firstPerson') return;
        
        const position = camera.position;
        const rotation = camera.rotation;
        const direction = camera.getDirection(BABYLON.Vector3.Forward());
        
        this.cameraPositionDisplay.innerHTML = `
            <div><strong>カメラ位置情報:</strong></div>
            <div>位置: X=${position.x.toFixed(2)}, Y=${position.y.toFixed(2)}, Z=${position.z.toFixed(2)}</div>
            <div>回転: X=${rotation.x.toFixed(2)}, Y=${rotation.y.toFixed(2)}, Z=${rotation.z.toFixed(2)}</div>
            <div>方向: X=${direction.x.toFixed(2)}, Y=${direction.y.toFixed(2)}, Z=${direction.z.toFixed(2)}</div>
        `;
    }

    /**
     * UIを有効化（1人称モード解除時）
     */
    enableUI() {
        this.enablePlacementControls();
    }

    /**
     * UIを無効化（1人称モード時）
     */
    disableUI() {
        this.disablePlacementControls();
        
        // 配置モードを終了
        this.app.getManager('interaction').exitPlacementMode();
        this.resetAssetButtons();
        
        // 選択を解除
        this.app.getManager('selection').deselectAll();
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing UIManager...");
        
        // インターバルを停止
        this.stopCameraPositionUpdate();
        
        // イベントリスナーを削除
        if (this.elements.deleteBtn) {
            this.elements.deleteBtn.replaceWith(this.elements.deleteBtn.cloneNode(true));
        }
        
        // 他のボタンのイベントリスナーも同様に削除
        if (this.elements.rotateBtn) {
            this.elements.rotateBtn.replaceWith(this.elements.rotateBtn.cloneNode(true));
        }
        
        if (this.elements.firstPersonBtn) {
            this.elements.firstPersonBtn.replaceWith(this.elements.firstPersonBtn.cloneNode(true));
        }
        
        // 作成した要素を削除
        if (this.positionIndicator && this.positionIndicator.parentNode) {
            this.positionIndicator.parentNode.removeChild(this.positionIndicator);
        }
        
        if (this.cameraPositionDisplay && this.cameraPositionDisplay.parentNode) {
            this.cameraPositionDisplay.parentNode.removeChild(this.cameraPositionDisplay);
        }
        
        if (this.firstPersonGuide && this.firstPersonGuide.parentNode) {
            this.firstPersonGuide.parentNode.removeChild(this.firstPersonGuide);
        }
        
        // 参照をクリア
        this.elements = {};
    }
}