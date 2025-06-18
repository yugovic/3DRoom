// DOM要素
const canvas = document.getElementById("renderCanvas");
const cubeBtn = document.getElementById("cubeBtn");
const recordBtn = document.getElementById("recordBtn");
const juiceBoxBtn = document.getElementById("juiceBoxBtn");
const mikeDeskBtn = document.getElementById("mikeDeskBtn");
const rotateBtn = document.getElementById("rotateBtn");
const deleteBtn = document.getElementById("deleteBtn");
const toggleControlsBtn = document.getElementById("toggleControlsBtn");
const toggleControlsIcon = document.querySelector(".toggle-icon");
const exportImageBtn = document.getElementById("exportImageBtn");
const gridSizeSelect = document.getElementById("gridSizeSelect");
const showGridCheck = document.getElementById("showGridCheck");
const snapToGridCheck = document.getElementById("snapToGridCheck");
const helpBtn = document.getElementById("helpBtn");
const helpPanel = document.querySelector(".help-panel");
const helpCloseBtn = document.getElementById("helpCloseBtn");
const errorPanel = document.getElementById("errorPanel");
const reduceShininess = document.getElementById("reduceShininess");

// ズーム関連のDOM要素
const zoomSlider = document.getElementById("zoomSlider");
const zoomInBtn = document.getElementById("zoomInBtn");
const zoomOutBtn = document.getElementById("zoomOutBtn");
const resetZoomBtn = document.getElementById("resetZoomBtn");

// カメラ調整用デバッグパネルのDOM要素
const cameraAlphaSlider = document.getElementById("cameraAlpha");
const cameraBetaSlider = document.getElementById("cameraBeta");
const cameraRadiusSlider = document.getElementById("cameraRadius");
const cameraTargetXSlider = document.getElementById("cameraTargetX");
const cameraTargetYSlider = document.getElementById("cameraTargetY");
const cameraTargetZSlider = document.getElementById("cameraTargetZ");
const cameraInfoDisplay = document.getElementById("cameraInfoDisplay");
const resetCameraBtn = document.getElementById("resetCameraBtn");
const logCameraBtn = document.getElementById("logCameraBtn");

// ライティング設定用DOM要素
const ambientIntensitySlider = document.getElementById("ambientIntensity");
const directionalIntensitySlider = document.getElementById("directionalIntensity");
const pointLightIntensitySlider = document.getElementById("pointLightIntensity");
const shadowDarknessSlider = document.getElementById("shadowDarkness");
const ambientColorPicker = document.getElementById("ambientColor");
const pointLight1ColorPicker = document.getElementById("pointLight1Color");
const pointLight2ColorPicker = document.getElementById("pointLight2Color");

// 光源位置調整用DOM要素
const dirLightXSlider = document.getElementById("dirLightX");
const dirLightYSlider = document.getElementById("dirLightY");
const dirLightZSlider = document.getElementById("dirLightZ");
const pointLight1XSlider = document.getElementById("pointLight1X");
const pointLight1YSlider = document.getElementById("pointLight1Y");
const pointLight1ZSlider = document.getElementById("pointLight1Z");
const pointLight2XSlider = document.getElementById("pointLight2X");
const pointLight2YSlider = document.getElementById("pointLight2Y");
const pointLight2ZSlider = document.getElementById("pointLight2Z");

// グローバル変数
let engine, scene, camera;
let selectedMesh = null;
let currentMode = null;
let isPlacing = false;
let originalPosition = null; // ドラッグ開始時の元の位置を記録
let groundMaterial, wallMaterial1, wallMaterial2;
let ground; // 床オブジェクトへの参照を保持
let wall1, wall2; // 壁オブジェクトへの参照を保持
let highlightLayer;
let shadowGenerator;
let grid;
let verticalHelper;
let gridSize = 1.0;
let showGrid = true;
let snapToGrid = true;
let zoomLevel = 1.0; // ズームレベルの初期値

// 1人称モード用の変数
let firstPersonMode = false;
let firstPersonCamera = null;
let originalCamera = null;
let keys = {};

// カメラ設定のデフォルト値（リセット用）
const DEFAULT_CAMERA_SETTINGS = {
    alpha: -Math.PI / 4,    // -45度
    beta: Math.PI / 4,      // 45度
    radius: 20,             // 最大値に設定（アセットが切れない値）
    target: new BABYLON.Vector3(0, 1, 0)  // Y座標を上げて画面中央に表示
};

// 事前ロードしたモデルを保持するオブジェクト
let preloadedModels = {
    juiceBox: null,
    mikeDesk: null,
    record: null,
    burger: null
};

// プレビューメッシュ用のグローバル変数
let previewMesh = null;

// 壁面配置用の法線ベクトルを保持する一時変数
window.lastWallNormal = null;
let roomBoundary = { // 部屋の境界（内側）
    minX: -9,
    maxX: 9,
    minZ: -9,
    maxZ: 9
};

// ライティング用のグローバル変数
let ambientLight, dirLight, pointLight1, pointLight2;

// エラーハンドリング関数
function showError(error) {
    console.error("エラーが発生しました:", error);
    if (errorPanel) {
        // エラーの詳細情報を表示
        errorPanel.textContent = "エラー: " + error.message;
        
        // デバッグ情報をコンソールに表示
        console.debug("エラー発生時の状態:", {
            isPlacing: isPlacing,
            currentMode: currentMode,
            selectedMesh: selectedMesh ? selectedMesh.name : "なし"
        });
        
        // エラーパネルを表示
        errorPanel.style.display = "block";
        
        // 0.5秒後に非表示
        setTimeout(() => {
            errorPanel.style.display = "none";
        }, 500);
    }
}

// アセットを事前ロードする関数
function preloadAssets() {
    console.log("アセットの事前ロードを開始します...");
    
    // ジュースボックスのGLBモデルをロード
    const juiceBoxUrl = "https://raw.githubusercontent.com/yugovic/test/main/juice_boxv3.glb";
    BABYLON.SceneLoader.ImportMesh("", juiceBoxUrl, "", scene, function(meshes) {
        console.log("ジュースボックスモデルを事前ロードしました:", meshes.length + "個のメッシュ");
        
        if (meshes.length > 0) {
            // ルートメッシュを保存
            const rootMesh = meshes[0];
            
            // 非表示にしておく
            rootMesh.setEnabled(false);
            
            // スケーリングを設定
            rootMesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
            
            // レンダリング設定を調整
            rootMesh.renderingGroupId = 0; // デフォルトレイヤーに統一
            rootMesh.alwaysSelectAsActiveMesh = true; // クリッピング問題を回避
            rootMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION; // クリッピングを最適化
            
            // 子メッシュもすべて設定
            rootMesh.getChildMeshes().forEach(childMesh => {
                childMesh.renderingGroupId = 0; // デフォルトレイヤーに統一
                childMesh.alwaysSelectAsActiveMesh = true;
                childMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
                
                if (childMesh.material) {
                    // zOffsetは使用しない
                    childMesh.material.backFaceCulling = false; // 両面表示
                    childMesh.material.needDepthPrePass = true; // 深度プリパスを有効化
                }
            });
            
            // 参照を保存
            preloadedModels.juiceBox = rootMesh;
        }
    }, null, function(scene, message) {
        console.error("ジュースボックスモデルのプリロードに失敗しました:", message);
    });
    
    // バーガーのGLBモデルをロード
    const burgerUrl = "https://raw.githubusercontent.com/yugovic/test/main/Burger.glb";
    BABYLON.SceneLoader.ImportMesh("", burgerUrl, "", scene, function(meshes) {
        console.log("バーガーモデルを事前ロードしました:", meshes.length + "個のメッシュ");
        
        if (meshes.length > 0) {
            // ルートメッシュを保存
            const rootMesh = meshes[0];
            
            // 非表示にしておく
            rootMesh.setEnabled(false);
            
            // スケーリングを設定（5倍の大きさ）
            rootMesh.scaling = new BABYLON.Vector3(0.5, 0.5, 0.5);
            
            // レンダリング設定を調整
            rootMesh.renderingGroupId = 0; // デフォルトレイヤーに統一
            rootMesh.alwaysSelectAsActiveMesh = true; // クリッピング問題を回避
            rootMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION; // クリッピングを最適化
            
            // 子メッシュもすべて設定
            rootMesh.getChildMeshes().forEach(childMesh => {
                childMesh.renderingGroupId = 0; // デフォルトレイヤーに統一
                childMesh.alwaysSelectAsActiveMesh = true;
                childMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
                
                if (childMesh.material) {
                    // zOffsetは使用しない
                    childMesh.material.backFaceCulling = false; // 両面表示
                    childMesh.material.needDepthPrePass = true; // 深度プリパスを有効化
                }
            });
            
            // 参照を保存
            preloadedModels.burger = rootMesh;
        }
    }, null, function(scene, message) {
        console.error("バーガーモデルのプリロードに失敗しました:", message);
    });
    
    // レコードマシンのGLBモデルをロード
    const recordUrl = "https://raw.githubusercontent.com/yugovic/test/main/RecordMachine.glb";
    BABYLON.SceneLoader.ImportMesh("", recordUrl, "", scene, function(meshes) {
        console.log("レコードマシンモデルを事前ロードしました:", meshes.length + "個のメッシュ");
        
        if (meshes.length > 0) {
            // ルートメッシュを保存
            const rootMesh = meshes[0];
            
            // 非表示にしておく
            rootMesh.setEnabled(false);
            
            // スケーリングを設定
            rootMesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
            
            // レンダリング設定を調整
            rootMesh.renderingGroupId = 0; // デフォルトレイヤーに統一
            rootMesh.alwaysSelectAsActiveMesh = true; // クリッピング問題を回避
            rootMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION; // クリッピングを最適化
            
            // 子メッシュもすべて設定
            rootMesh.getChildMeshes().forEach(childMesh => {
                childMesh.renderingGroupId = 0; // デフォルトレイヤーに統一
                childMesh.alwaysSelectAsActiveMesh = true;
                childMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION;
                
                if (childMesh.material) {
                    // zOffsetは使用しない
                    childMesh.material.backFaceCulling = false; // 両面表示
                    childMesh.material.needDepthPrePass = true; // 深度プリパスを有効化
                }
            });
            
            // 参照を保存
            preloadedModels.record = rootMesh;
        }
    }, null, function(scene, message) {
        console.error("レコードマシンモデルのプリロードに失敗しました:", message);
    });
}

// 初期化
window.addEventListener("DOMContentLoaded", function() {
    try {
        initEngine();
        createScene();
        
        // 3D要素の作成を個別に実行し、エラーがあれば検出しやすくする
        try {
            createRoom();
        } catch (e) {
            showError(new Error("部屋の作成中にエラーが発生しました: " + e.message));
        }
        
        try {
            setupFloorMaterial(); // 床のマテリアルを設定
        } catch (e) {
            showError(new Error("床のマテリアル設定中にエラーが発生しました: " + e.message));
        }
        
        try {
            setupLights();
        } catch (e) {
            showError(new Error("照明の設定中にエラーが発生しました: " + e.message));
        }
        
        // アセットの事前ロード
        try {
            preloadAssets();
        } catch (e) {
            showError(new Error("アセットの事前ロード中にエラーが発生しました: " + e.message));
        }
        
        try {
            setupCamera();
        } catch (e) {
            showError(new Error("カメラの設定中にエラーが発生しました: " + e.message));
        }
        
        try {
            createGrid();
        } catch (e) {
            showError(new Error("グリッドの作成中にエラーが発生しました: " + e.message));
        }
        
        setupInteraction();
        setupUI();
        
        // ページ読み込み後にメタリック効果を抑える
        setTimeout(function() {
            if (reduceShininess && reduceShininess.checked) {
                adjustMaterialShininess(true);
            }
        }, 1000);
        
        // レンダリングループの開始
        engine.runRenderLoop(function() {
            // 壁の可視性を確保
            if (wall1 && wall2) {
                wall1.isVisible = true;
                ensureWallOpacity(wall1);
                wall2.isVisible = true;
                ensureWallOpacity(wall2);
            }
            
            // 前回のレンダリングの透明度バッファをクリア（手前の描画問題を解決）
            engine.clear(scene.clearColor, true, true, true);
            
            // シーンのレンダリング
            scene.render();
        });
        
        // ウィンドウサイズ変更時の対応
        window.addEventListener("resize", function() {
            engine.resize();
            // カメラの投影範囲も更新
            setTimeout(() => {
                updateCameraProjection();
            }, 100); // リサイズ完了後に実行
        });
    } catch (error) {
        showError(error);
    }
});

// Babylon.jsエンジンの初期化
function initEngine() {
    try {
        engine = new BABYLON.Engine(canvas, true);
        
        // アルファモードを無効化（透明度の問題を防止）
        engine.alphaMode = BABYLON.Engine.ALPHA_DISABLE;
        
        // エンジンのアンチエイリアスも最適化
        engine.setHardwareScalingLevel(1.0);
    } catch (e) {
        throw new Error("Babylon.jsエンジンの初期化に失敗しました: " + e.message);
    }
}

// シーンの作成
function createScene() {
    try {
        scene = new BABYLON.Scene(engine);
        
        // 背景を透明に設定して、CSS背景を表示できるようにする
        scene.clearColor = new BABYLON.Color4(0, 0, 0, 0); // 完全に透明
        
        // 正確な深度描画のために右手系座標を使用
        scene.useRightHandedSystem = true;
        
        // 深度レンダラーを設定（精度を向上）
        scene.depthRenderer = new BABYLON.DepthRenderer(scene, {
            useOnlyInActiveCamera: true,
            depthScale: 10 // 深度スケールを増加して精度を向上
        });
        
        // 深度バッファの精度を向上
        scene.getEngine().setDepthBuffer(true);
        scene.getEngine().setDepthFunction(BABYLON.Engine.LEQUAL); // 深度比較関数を調整
        
        // Frustum Cullingを無効化（手前のオブジェクトが切れる問題を解決）
        scene.autoClear = false; // 自動クリアを無効化
        scene.skipFrustumClipping = true; // フラスタムクリッピングをスキップ
        
        // ハイライトレイヤーの作成（輝度を高めに設定）
        highlightLayer = new BABYLON.HighlightLayer("highlightLayer", scene, {
            blurHorizontalSize: 2,    // 水平方向のブラー強度
            blurVerticalSize: 2,      // 垂直方向のブラー強度
            mainTextureRatio: 0.5     // テクスチャ解像度（パフォーマンス向上のため）
        });
        
        // シーンのレンダリング時に毎回実行される関数
        scene.registerBeforeRender(function() {
            // 壁が常に表示されるようにチェック
            if (wall1 && wall2) {
                if (!wall1.isVisible || !wall2.isVisible) {
                    wall1.isVisible = true;
                    ensureWallOpacity(wall1);
                    wall2.isVisible = true;
                    ensureWallOpacity(wall2);
                }
            }
        });
    } catch (e) {
        throw new Error("シーンの作成に失敗しました: " + e.message);
    }
}

// グリッドの作成
function createGrid() {
    try {
        // 既存のグリッドがあれば削除
        if (grid) {
            grid.dispose();
        }
        
        // 垂直ヘルパーラインの作成（配置時に使用）
        createVerticalHelper();
        
        // 1/10スケールに合わせてグリッドサイズを調整
        const gridWidth = 2;
        const gridHeight = 2;
        
        // 3Dアセットの床にグリッドを直接適用するため、
        // 床のメッシュが存在するか確認
        if (ground) {
            console.log("3Dアセットの床にグリッドを適用します:", ground.name);
            console.log("現在の床マテリアル:", ground.material ? ground.material.name : "なし");
            console.log("保存されたオリジナルマテリアル:", ground._originalMaterial ? ground._originalMaterial.name : "なし");
            
            // グリッドのサイズと密度を設定
            const gridOptions = {
                majorUnitFrequency: 5,
                minorUnitVisibility: 0.45,
                gridRatio: parseFloat(gridSize) || 1.0,
                mainColor: new BABYLON.Color3(0.2, 0.8, 0.8), // サイバーテーマに合わせた色
                secondaryColor: new BABYLON.Color3(0.2, 0.4, 0.8), // サイバーテーマに合わせた色
                opacity: 0.5
            };
            
            // GridMaterialが利用可能か確認
            if (typeof BABYLON.GridMaterial === 'undefined') {
                console.warn("GridMaterialが利用できません。床への直接適用ができません。");
                
                // 代替として通常のグリッド
                grid = BABYLON.MeshBuilder.CreateGround("gridMesh", {width: gridWidth, height: gridHeight}, scene);
                const gridMat = new BABYLON.StandardMaterial("gridMat", scene);
                gridMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
                gridMat.wireframe = true;
                grid.material = gridMat;
                grid.position.y = ground.position.y + 0.01;
                grid.isPickable = false;
                grid.receiveShadows = false;
                grid.setEnabled(showGrid);
                
                // 床グリッドを作成したら、壁用のグリッドも作成
                createWallGrids();
                return;
            }
            
            // オリジナルの床マテリアルを保存（クローンして保護）
            if (!ground._originalMaterial && ground.material) {
                // マテリアルをクローンして保存（元のマテリアルが変更されないように）
                if (ground.material.clone) {
                    ground._originalMaterial = ground.material.clone("ground_original_material");
                } else {
                    ground._originalMaterial = ground.material;
                }
                console.log("床のオリジナルマテリアルを保存:", ground._originalMaterial.name);
            }
            
            // 床に直接グリッドマテリアルを適用
            if (showGrid) {
                console.log("床グリッド表示を開始");
                console.log("床メッシュの現在の状態:", {
                    name: ground.name,
                    currentMaterial: ground.material ? ground.material.name : "なし",
                    originalMaterial: ground._originalMaterial ? ground._originalMaterial.name : "なし",
                    isEnabled: ground.isEnabled(),
                    isVisible: ground.isVisible,
                    isPickable: ground.isPickable
                });
                
                // GridMaterialが利用可能か再確認
                if (typeof BABYLON.GridMaterial === 'undefined') {
                    console.error("BABYLON.GridMaterialが利用できません");
                    return;
                }
                
                const floorGridMaterial = new BABYLON.GridMaterial(`floorGridMaterial_${Date.now()}`, scene);
                
                // グリッド素材の設定
                floorGridMaterial.majorUnitFrequency = gridOptions.majorUnitFrequency;
                floorGridMaterial.minorUnitVisibility = gridOptions.minorUnitVisibility;
                floorGridMaterial.gridRatio = gridOptions.gridRatio;
                floorGridMaterial.mainColor = gridOptions.mainColor;
                floorGridMaterial.lineColor = gridOptions.secondaryColor;
                floorGridMaterial.opacity = gridOptions.opacity;
                
                console.log("作成したグリッドマテリアル設定:", {
                    name: floorGridMaterial.name,
                    majorUnitFrequency: floorGridMaterial.majorUnitFrequency,
                    minorUnitVisibility: floorGridMaterial.minorUnitVisibility,
                    gridRatio: floorGridMaterial.gridRatio,
                    mainColor: floorGridMaterial.mainColor,
                    lineColor: floorGridMaterial.lineColor,
                    opacity: floorGridMaterial.opacity
                });
                
                // 床のマテリアルを変更
                ground.material = floorGridMaterial;
                ground.isPickable = true; // 配置のためにピック可能に設定
                
                // 強制的に床を表示状態にする
                ground.setEnabled(true);
                ground.isVisible = true;
                
                // シーンの再レンダリングを強制
                scene.render();
                
                console.log("床グリッドマテリアルを適用:", floorGridMaterial.name);
                console.log("床メッシュの更新後状態:", {
                    name: ground.name,
                    material: ground.material.name,
                    isEnabled: ground.isEnabled(),
                    isVisible: ground.isVisible,
                    isPickable: ground.isPickable
                });
            } else {
                // グリッド非表示時はオリジナルのマテリアルに戻す
                console.log("床グリッド非表示を開始");
                if (ground._originalMaterial) {
                    ground.material = ground._originalMaterial;
                    console.log("床オリジナルマテリアルに復元:", ground._originalMaterial.name);
                } else {
                    console.warn("床のオリジナルマテリアルが見つかりません");
                }
                
                // グリッド非表示でもアセット配置を可能にするため、ピック可能に設定
                ground.isPickable = true;
                console.log("床をピック可能に設定（アセット配置のため）");
            }
            
            // グリッドの参照を保持
            grid = ground;
        } else {
            // 床が見つからない場合は従来通り別メッシュとして作成
            console.log("床メッシュが見つからないため、別途グリッドを作成します");
            
            // グリッドのサイズと密度を設定
            const gridOptions = {
                size: gridWidth,
                majorUnitFrequency: 5,
                minorUnitVisibility: 0.45,
                gridRatio: parseFloat(gridSize) || 1.0,
                mainColor: new BABYLON.Color3(0.2, 0.8, 0.8),
                secondaryColor: new BABYLON.Color3(0.2, 0.4, 0.8),
                opacity: 0.5
            };
            
            grid = BABYLON.MeshBuilder.CreateGround("gridMesh", {width: gridWidth, height: gridHeight}, scene);
            const gridMaterial = new BABYLON.GridMaterial("gridMaterial", scene);
            
            // グリッド素材の設定
            gridMaterial.majorUnitFrequency = gridOptions.majorUnitFrequency;
            gridMaterial.minorUnitVisibility = gridOptions.minorUnitVisibility;
            gridMaterial.gridRatio = gridOptions.gridRatio;
            gridMaterial.mainColor = gridOptions.mainColor;
            gridMaterial.lineColor = gridOptions.secondaryColor;
            gridMaterial.opacity = gridOptions.opacity;
            
            grid.material = gridMaterial;
            grid.position.y = 0.01;
            grid.isPickable = false;
            grid.receiveShadows = false;
            grid.setEnabled(showGrid);
            
            console.log("代替グリッドメッシュを作成:", {
                name: grid.name,
                material: grid.material.name,
                enabled: grid.isEnabled(),
                visible: grid.isVisible,
                showGrid: showGrid
            });
        }
        
        // 壁用のグリッドを作成
        createWallGrids();
        
    } catch (e) {
        console.error("グリッドの作成に失敗しました:", e);
        // グリッドがなくても部屋を表示するため、エラーをスローしない
    }
}

// グリッドマテリアルのクリーンアップ関数
function cleanupGridMaterials() {
    try {
        // 床と壁のオリジナルマテリアルを保護するため、先に復元
        if (ground) {
            // 床のマテリアルを元に戻す
            if (ground._originalMaterial) {
                console.log("床のオリジナルマテリアルを復元してから削除");
                ground.material = ground._originalMaterial;
            }
            
            // グリッドマテリアルを削除
            if (ground.material && (ground.material.name.includes("gridMat") || ground.material.name.includes("GridMaterial"))) {
                console.log("床のグリッドマテリアルを削除:", ground.material.name);
                const mat = ground.material;
                ground.material = null;
                mat.dispose();
            }
        }
        
        // 壁のオリジナルマテリアルも復元
        [wall1, wall2].forEach(wallMesh => {
            if (wallMesh) {
                if (wallMesh._originalMaterial && wallMesh.material !== wallMesh._originalMaterial) {
                    console.log("壁のオリジナルマテリアルを復元してから削除:", wallMesh.name);
                    wallMesh.material = wallMesh._originalMaterial;
                }
                
                // 壁のグリッドマテリアルを削除
                if (wallMesh.material && (wallMesh.material.name.includes("gridMat") || wallMesh.material.name.includes("GridMaterial"))) {
                    console.log("壁のグリッドマテリアルを削除:", wallMesh.material.name);
                    const mat = wallMesh.material;
                    wallMesh.material = null;
                    mat.dispose();
                }
            }
        });
        
        // シーン内のグリッドマテリアルを削除
        const materials = BABYLON.Material.Materials.filter(mat => 
            mat && (mat.name.includes("gridMat") || mat.name.includes("GridMaterial")) &&
            !mat.name.includes("_original")
        );
        
        materials.forEach(mat => {
            console.log("グリッドマテリアルを削除:", mat.name);
            mat.dispose();
        });
        
        // 既存の壁グリッドメッシュを削除
        const existingGrids = scene.meshes.filter(mesh => 
            mesh && mesh.name && mesh.name.startsWith("wallGrid")
        );
        
        existingGrids.forEach(mesh => {
            console.log("壁グリッドメッシュを削除:", mesh.name);
            mesh.dispose();
        });
        
        console.log("グリッドマテリアルクリーンアップ完了");
    } catch (e) {
        console.error("グリッドマテリアルクリーンアップに失敗:", e);
    }
}

// 壁用のグリッドを作成
function createWallGrids() {
    try {
        
        // 実際の壁メッシュが存在しない場合は何もしない
        if (!wall1 && !wall2) {
            console.log("壁メッシュが見つからないため、壁グリッドを作成しません");
            return;
        }
        
        // グリッドのサイズと密度
        const gridOptions = {
            majorUnitFrequency: 5,
            minorUnitVisibility: 0.35,
            gridRatio: parseFloat(gridSize) || 1.0,
            mainColor: new BABYLON.Color3(0.2, 0.7, 0.7), // サイバーテーマに合わせた色
            secondaryColor: new BABYLON.Color3(0.2, 0.4, 0.7), // サイバーテーマに合わせた色
            opacity: 0.3
        };
        
        // グリッド素材の作成
        const createGridMaterial = (name) => {
            const material = new BABYLON.GridMaterial(name, scene);
            material.majorUnitFrequency = gridOptions.majorUnitFrequency;
            material.minorUnitVisibility = gridOptions.minorUnitVisibility;
            material.gridRatio = gridOptions.gridRatio;
            material.mainColor = gridOptions.mainColor;
            material.lineColor = gridOptions.secondaryColor;
            material.opacity = gridOptions.opacity;
            return material;
        };
        
        // 壁メッシュの配列
        const wallMeshes = [];
        if (wall1) wallMeshes.push(wall1);
        if (wall2) wallMeshes.push(wall2);
        
        // オリジナルのマテリアルを保存
        wallMeshes.forEach(wallMesh => {
            // オリジナルマテリアルを保存（まだ保存していない場合）
            if (!wallMesh._originalMaterial && wallMesh.material) {
                // マテリアルをクローンして保存（元のマテリアルが変更されないように）
                if (wallMesh.material.clone) {
                    wallMesh._originalMaterial = wallMesh.material.clone(`${wallMesh.name}_original_material`);
                } else {
                    wallMesh._originalMaterial = wallMesh.material;
                }
                console.log("壁のオリジナルマテリアルを保存:", wallMesh.name, wallMesh._originalMaterial.name);
            }
            
            // グリッド表示が有効な場合
            if (showGrid) {
                console.log("壁グリッド表示を開始:", wallMesh.name);
                console.log("壁メッシュの現在の状態:", {
                    name: wallMesh.name,
                    currentMaterial: wallMesh.material ? wallMesh.material.name : "なし",
                    originalMaterial: wallMesh._originalMaterial ? wallMesh._originalMaterial.name : "なし",
                    isEnabled: wallMesh.isEnabled(),
                    isVisible: wallMesh.isVisible,
                    isPickable: wallMesh.isPickable
                });
                
                // 新しいグリッドマテリアルを作成
                const wallGridMat = createGridMaterial(`${wallMesh.name}_gridMat_${Date.now()}`);
                
                // 回転調整：壁の向きに合わせてグリッドを回転
                // 壁の法線ベクトルを計算
                const boundingInfo = wallMesh.getBoundingInfo();
                const min = boundingInfo.boundingBox.minimumWorld;
                const max = boundingInfo.boundingBox.maximumWorld;
                
                // 壁の中心位置を計算
                const center = new BABYLON.Vector3(
                    (min.x + max.x) / 2,
                    (min.y + max.y) / 2,
                    (min.z + max.z) / 2
                );
                
                // 部屋の中心位置
                const roomCenter = new BABYLON.Vector3(
                    (roomBoundary.minX + roomBoundary.maxX) / 2,
                    center.y,
                    (roomBoundary.minZ + roomBoundary.maxZ) / 2
                );
                
                // 壁の法線方向（部屋の中心に向かう方向）
                const toCenter = roomCenter.subtract(center).normalize();
                
                // 壁の向きに基づいてグリッドの回転を設定
                if (Math.abs(max.z - min.z) < Math.abs(max.x - min.x)) {
                    // X方向に長い壁（Z方向の壁）
                    wallGridMat.mainAxis = new BABYLON.Vector3(1, 0, 0); // X軸を主軸に
                    wallGridMat.rotation = toCenter.z > 0 ? 0 : Math.PI; // Z向きに応じて回転
                } else {
                    // Z方向に長い壁（X方向の壁）
                    wallGridMat.mainAxis = new BABYLON.Vector3(0, 0, 1); // Z軸を主軸に
                    wallGridMat.rotation = toCenter.x > 0 ? -Math.PI / 2 : Math.PI / 2; // X向きに応じて回転
                }
                
                // メタデータの設定（オブジェクト配置用）
                wallMesh.metadata = {
                    isInteriorWall: true,
                    normalDirection: toCenter.clone()
                };
                
                console.log("作成した壁グリッドマテリアル設定:", {
                    name: wallGridMat.name,
                    majorUnitFrequency: wallGridMat.majorUnitFrequency,
                    minorUnitVisibility: wallGridMat.minorUnitVisibility,
                    gridRatio: wallGridMat.gridRatio,
                    opacity: wallGridMat.opacity
                });
                
                // マテリアルを適用
                wallMesh.material = wallGridMat;
                
                // 壁自体をピック可能に設定
                wallMesh.isPickable = true;
                
                // 強制的に壁を表示状態にする
                wallMesh.setEnabled(true);
                wallMesh.isVisible = true;
                
                console.log("壁グリッドマテリアルを適用:", wallMesh.name, wallGridMat.name);
                console.log("壁メッシュの更新後状態:", {
                    name: wallMesh.name,
                    material: wallMesh.material.name,
                    isEnabled: wallMesh.isEnabled(),
                    isVisible: wallMesh.isVisible,
                    isPickable: wallMesh.isPickable
                });
            } else {
                // グリッド非表示の場合はオリジナルマテリアルに戻す
                if (wallMesh._originalMaterial) {
                    wallMesh.material = wallMesh._originalMaterial;
                    console.log("壁オリジナルマテリアルに復元:", wallMesh.name);
                } else {
                    console.warn("壁のオリジナルマテリアルが見つかりません:", wallMesh.name);
                }
                
                // グリッド非表示でもアセット配置を可能にするため、ピック可能に設定
                wallMesh.isPickable = true;
                console.log("壁をピック可能に設定（アセット配置のため）:", wallMesh.name);
            }
        });
        
        console.log("実際の壁に直接グリッドを適用しました:", wallMeshes.length + "個");
    } catch (e) {
        console.error("壁グリッドの作成に失敗しました:", e);
    }
}

// この関数は削除 - 壁に直接グリッドを適用するため不要になりました

// 垂直ヘルパーラインの作成
function createVerticalHelper() {
    try {
        if (verticalHelper) {
            verticalHelper.dispose();
        }
        
        // 垂直なラインを作成 - サイズを調整して見やすく
        verticalHelper = BABYLON.MeshBuilder.CreateLines("verticalHelper", {
            points: [
                new BABYLON.Vector3(0, 0, 0),
                new BABYLON.Vector3(0, 2.5, 0) // 1/10スケールに合わせて高さを調整
            ]
        }, scene);
        
        // 色と太さを設定して見やすく
        verticalHelper.color = new BABYLON.Color3(0, 0.7, 1);
        verticalHelper.isVisible = false;
        
        // クリック不可に設定（重要）
        verticalHelper.isPickable = false;
        
        // 確実にクリックできないようにレンダリング関連の設定を追加
        verticalHelper.renderingGroupId = 0; // デフォルトレイヤーに統一
        verticalHelper.checkCollisions = false;
        verticalHelper.useOctreeForRenderingSelection = false;
    } catch (e) {
        console.error("垂直ヘルパーの作成に失敗しました:", e);
        // ヘルパーがなくても部屋を表示するため、エラーをスローしない
    }
}

// 部屋の作成（GLBモデルを使用）
function createRoom() {
    // 位置表示インジケータの作成
    createPositionIndicator();
    
    // 部屋の境界を示すヘルパーを作成（デバッグ用）
    createRoomBoundaryHelper();
    
    // GLBモデルのURL
    const modelUrl = "https://raw.githubusercontent.com/yugovic/test/main/RoomEmpty.glb";
    
    // GLBモデルをロード
    BABYLON.SceneLoader.ImportMesh("", "", modelUrl, scene, function(meshes) {
        console.log("新しいルームアセットがロードされました:", meshes.length + "個のメッシュ");
        
        // ルートメッシュ
        const rootMesh = meshes[0];
        
        // スケールを縦横ともに1/10に調整（1/5の半分）
        rootMesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
        
        // 部屋全体の位置を少し上方向に移動して底面が見えるようにする
        rootMesh.position = new BABYLON.Vector3(0, 0.5, 0);
        
        // 床を探して、その高さを取得
        let floorY = 0;
        for (const mesh of meshes) {
            if (mesh.name.toLowerCase() === "floor" || mesh.name.toLowerCase().includes("floor")) {
                floorY = mesh.position.y;
                console.log("床の元の位置:", floorY);
                break;
            }
        }
        
        // モデル全体の位置を調整して床がY=0になるようにする（画面中央表示のため元に戻す）
        rootMesh.position.y = -floorY * rootMesh.scaling.y; // スケールを考慮して調整
        console.log("モデル全体の位置を調整しました:", rootMesh.position.y);
        
        // 部屋の境界を計算
        calculateRoomBoundary(meshes);
        
        // シャドウキャスターとシャドウレシーバーのリスト
        const shadowCasters = [];
        const shadowReceivers = [];
        
        // 床メッシュの検出
        let floorMesh = null;
        
        // 床を優先的に探す（新しいアセットでは "floor" という名前）
        for (let mesh of meshes) {
            if (mesh.name.toLowerCase() === "floor" || mesh.name.toLowerCase().includes("floor")) {
                floorMesh = mesh;
                console.log("床メッシュを検出:", mesh.name);
                break;
            }
        }
        
        // 床が見つからなかった場合、最も大きな平面メッシュを探す
        if (!floorMesh) {
            let maxSize = 0;
            for (let mesh of meshes) {
                // バウンディングボックスを取得
                if (mesh.getBoundingInfo) {
                    const boundingInfo = mesh.getBoundingInfo();
                    const min = boundingInfo.boundingBox.minimumWorld;
                    const max = boundingInfo.boundingBox.maximumWorld;
                    
                    // 平坦なメッシュを探す (高さが小さく、横幅が大きいもの)
                    const height = Math.abs(max.y - min.y);
                    const width = Math.max(max.x - min.x, max.z - min.z);
                    
                    if (height < 1 && width > maxSize && mesh.position.y < 5) {
                        maxSize = width;
                        floorMesh = mesh;
                    }
                }
            }
            
            if (floorMesh) {
                console.log("床メッシュを推定しました:", floorMesh.name);
            }
        }
        
        // 床メッシュが見つかった場合
        if (floorMesh) {
            ground = floorMesh;
            ground.isPickable = true;
            
            // 床として認識するためのメタデータを追加
            ground.metadata = ground.metadata || {};
            ground.metadata.isFloor = true;
            
            // Body*メッシュにもメタデータを追加（床の一部として認識）
            meshes.forEach(mesh => {
                if (mesh.name.toLowerCase().includes("body")) {
                    mesh.isPickable = true;
                    mesh.metadata = mesh.metadata || {};
                    mesh.metadata.isFloor = true;
                    console.log("Bodyメッシュを床として設定:", mesh.name);
                }
            });
            
            // 床のY座標を0に設定（画面中央表示のため）
            console.log("床のY座標を調整前:", ground.position.y);
            
            // 床の位置を0に設定
            ground.position.y = 0;
            
            // 床のマテリアルを最適化して影をよく受け取るようにする
            if (ground.material) {
                ground.material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                ground.material.roughness = 0.9; // PBRマテリアルの場合
                ground.material.specularPower = 1;
                ground.material.disableLighting = false; // ライティングを有効化
                
                // ディフューズ色を少し暗くして影を目立たせる
                if (ground.material.diffuseColor) {
                    const currentColor = ground.material.diffuseColor;
                    ground.material.diffuseColor = new BABYLON.Color3(
                        Math.max(0.1, currentColor.r - 0.1),
                        Math.max(0.1, currentColor.g - 0.1),
                        Math.max(0.1, currentColor.b - 0.1)
                    );
                }
            }
            
            // 床に影を受け取る設定
            ground.receiveShadows = true;
            shadowReceivers.push(ground);
            
            console.log("床メッシュを設定しました:", {
                name: ground.name,
                receiveShadows: ground.receiveShadows,
                position: ground.position
            });
        } else {
            // 床が見つからない場合は新規作成
            console.log("床メッシュが見つからないため、新規作成します");
            ground = BABYLON.MeshBuilder.CreateGround("ground", {width: 20, height: 20}, scene);
            const groundMat = new BABYLON.StandardMaterial("groundMaterial", scene);
            groundMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
            groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
            ground.material = groundMat;
            ground.position.y = 0; // 床の位置をデフォルトに設定
            ground.receiveShadows = true;
            ground.isPickable = true;
            shadowReceivers.push(ground);
        }
        
        // すべてのメッシュに対して処理
        for (let mesh of meshes) {
            // すべてのメッシュに対してマテリアルチェック
            if (mesh.material) {
                // マテリアルの最適化
                mesh.material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                mesh.material.specularPower = 1;
                
                // 影を目立たせるために環境反射を抑える
                if (mesh.material.reflectionTexture) {
                    mesh.material.reflectionTexture.level = 0.1;
                }
                
                // PBRマテリアルの場合
                if (mesh.material.metallic !== undefined) {
                    mesh.material.metallic = 0.1;
                    mesh.material.roughness = 0.9;
                }
            }
            
            // 床はすでに処理済み
            if (mesh === ground) {
                continue;
            }
            
            // 壁メッシュを特定して参照を保持（新しいアセットでは "wall" という名前）
            if (mesh.name.toLowerCase() === "wall" || mesh.name.toLowerCase().includes("wall")) {
                // 最初の壁
                if (!wall1) {
                    wall1 = mesh;
                    console.log("壁1メッシュを特定しました:", mesh.name);
                } 
                // 2つ目の壁
                else if (!wall2) {
                    wall2 = mesh;
                    console.log("壁2メッシュを特定しました:", mesh.name);
                }
                
                // 壁のための新しいマテリアルを作成して適用
                const wallMaterial = new BABYLON.StandardMaterial("wallMaterial_" + mesh.name, scene);
                
                // マテリアルの基本色を設定（元のマテリアルの色を維持）
                if (mesh.material && mesh.material.diffuseColor) {
                    wallMaterial.diffuseColor = mesh.material.diffuseColor.clone();
                } else {
                    wallMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8); // デフォルトは薄いグレー
                }
                
                // 完全に不透明なマテリアル設定
                wallMaterial.alpha = 1.0;
                wallMaterial.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
                wallMaterial.backFaceCulling = true;
                wallMaterial.twoSidedLighting = false;
                wallMaterial.needDepthPrePass = true;
                wallMaterial.disableDepthWrite = false;
                wallMaterial.zOffset = -10;
                
                // 反射を抑制
                wallMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                wallMaterial.specularPower = 1;
                
                // 環境反射を無効化
                wallMaterial.reflectionTexture = null;
                wallMaterial.reflectionFresnelParameters = null;
                
                // 新しいマテリアルを壁に適用
                mesh.material = wallMaterial;
                
                console.log("壁に新しい不透明マテリアルを適用:", mesh.name);
                
                // 描画順序の設定
                mesh.renderingGroupId = 0; // 背景として描画されるように設定
                
                // オクルージョン設定
                mesh.occlusionType = BABYLON.AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;
                mesh.occlusionQueryAlgorithmType = BABYLON.AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
                
                // その他の設定
                mesh.receiveShadows = true; // 壁も影を受け取る
                mesh.isVisible = true;
                mesh.isPickable = true; // 壁へのアイテム配置を可能に
                shadowReceivers.push(mesh);
            }
            // その他の装飾的なオブジェクト
            else if (!mesh.name.includes("helper") && !mesh.name.includes("grid") && !mesh.name.includes("preview")) {
                // メッシュの種類を判断
                const isLargeObject = mesh.getBoundingInfo && 
                                     mesh.getBoundingInfo().boundingBox.extendSize.y > 1;
                
                // 大きなオブジェクトは影を落とす
                if (isLargeObject) {
                    shadowCasters.push(mesh);
                    console.log("影を落とすオブジェクトを追加:", mesh.name);
                }
                
                // すべてのオブジェクトは影を受け取る
                mesh.receiveShadows = true;
                shadowReceivers.push(mesh);
            }
        }
        
        // 追加の床メッシュを作成して影の受け取りを確実にする
        const shadowFloor = BABYLON.MeshBuilder.CreateGround("shadowFloor", {
            width: 20, 
            height: 20
        }, scene);
        
        // 透明マテリアルを作成
        const shadowFloorMat = new BABYLON.StandardMaterial("shadowFloorMat", scene);
        shadowFloorMat.alpha = 0.01; // ほぼ透明
        shadowFloorMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        shadowFloorMat.specularColor = new BABYLON.Color3(0, 0, 0);
        shadowFloorMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
        shadowFloorMat.ambientColor = new BABYLON.Color3(0, 0, 0);
        shadowFloorMat.backFaceCulling = false;
        
        shadowFloor.material = shadowFloorMat;
        shadowFloor.receiveShadows = true;
        shadowFloor.position.y = 0.02; // 床の上に少し浮かせる（床はY=0に設定済み）
        shadowFloor.isPickable = false; // クリックできないように
        
        // 影を受け取るリストに追加
        shadowReceivers.push(shadowFloor);
        
        // シャドウジェネレーターが設定されている場合、影の設定を行う
        if (shadowGenerator) {
            // 影を受け取るメッシュの設定を最適化
            console.log("影を受け取るメッシュを設定:", shadowReceivers.length + "個");
            shadowReceivers.forEach(mesh => {
                if (!mesh.receiveShadows) {
                    mesh.receiveShadows = true;
                }
                // メッシュのシャドウマッピング設定
                if (mesh === ground || mesh === shadowFloor) {
                    // 床用の最適化
                    mesh.useShadowDepthMaterial = true;
                }
            });
            
            // 影を生成するメッシュを登録
            console.log("影を生成するメッシュを設定:", shadowCasters.length + "個");
            shadowCasters.forEach(mesh => {
                shadowGenerator.addShadowCaster(mesh);
                console.log("シャドウキャスターに追加:", mesh.name);
            });
            
            // 配置されるオブジェクトも影を生成するように登録
            scene.onNewMeshAddedObservable.add(mesh => {
                if (mesh.name.startsWith("cube_") || mesh.name.startsWith("record_") ||
                    mesh.name.startsWith("juiceBox_") || mesh.name.startsWith("mikeDesk_") ||
                    (mesh.parent && (mesh.parent.name.startsWith("record_") || mesh.parent.name.startsWith("juiceBox_") || mesh.parent.name.startsWith("mikeDesk_")))) {
                    if (shadowGenerator) {
                        shadowGenerator.addShadowCaster(mesh);
                        console.log("新しいシャドウキャスターを追加:", mesh.name);
                    }
                }
            });
        }
        
        // 床と壁のグリッドを更新（直接床と壁のマテリアルとして適用）
        if (ground) {
            createGrid();
            createWallGrids();
        }
        
        // 壁が特定できなかった場合
        if (!wall1 || !wall2) {
            console.log("壁メッシュが見つかりません。視覚的なレンダリング順序設定のみ行います。");
        }
        
        // 壁のレンダリング設定
        ensureWallsVisibility();
    }, null, function(scene, message) {
        showError(new Error("GLBモデルのロード中にエラーが発生しました: " + message));
    });
}

// 床のマテリアルを設定する
function setupFloorMaterial() {
    // デフォルトの床マテリアルを設定
    groundMaterial = new BABYLON.StandardMaterial("groundMaterial", scene);
    groundMaterial.diffuseColor = new BABYLON.Color3(0.5, 0.5, 0.5);
    groundMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
}

// 位置表示インジケータ
function createPositionIndicator() {
    try {
        const positionIndicator = document.createElement("div");
        positionIndicator.className = "position-indicator";
        positionIndicator.style.display = "none";
        document.body.appendChild(positionIndicator);
        
        return positionIndicator;
    } catch (e) {
        console.error("位置インジケータの作成に失敗しました:", e);
        return null;
    }
}

// 光源の設定
function setupLights() {
    // サイバールームに合わせた環境光（青みがかった雰囲気）
    ambientLight = new BABYLON.HemisphericLight("ambientLight", new BABYLON.Vector3(0, 1, 0), scene);
    ambientLight.intensity = 0.6; // さらに暗くして影をはっきりさせる
    ambientLight.diffuse = new BABYLON.Color3(0.7, 0.8, 1.0); // 青みがかった光
    ambientLight.specular = new BABYLON.Color3(0.1, 0.1, 0.15); // 反射光を抑える
    ambientLight.groundColor = new BABYLON.Color3(0.2, 0.2, 0.3); // 下からの環境光も設定
    
    // 方向光源 - サイバールームを照らす位置に調整（影を生成する主光源）
    dirLight = new BABYLON.DirectionalLight("dirLight", new BABYLON.Vector3(-0.329292799969871, -0.768349381992783325, -0.548821299944517), scene);
    dirLight.position = new BABYLON.Vector3(-20, 40, -20); // さらに高さを上げて斜めから影を落とす
    dirLight.intensity = 1.0; // 強度を上げて影をはっきりさせる
    dirLight.specular = new BABYLON.Color3(0.1, 0.1, 0.15); // 反射光を抑える
    
    // 方向光源の設定を調整して影を正確に投影
    dirLight.shadowMinZ = 1;    // 影の最小距離
    dirLight.shadowMaxZ = 100;  // 影の最大距離
    dirLight.autoUpdateExtends = true; // 自動的に範囲を更新
    dirLight.shadowOrthoScale = 0.5;  // 投影範囲を調整
    
    // サイバー風のポイントライト（装飾用）
    pointLight1 = new BABYLON.PointLight("pointLight1", new BABYLON.Vector3(5, 8, 5), scene);
    pointLight1.diffuse = new BABYLON.Color3(0.2, 0.4, 0.8); // 青色
    pointLight1.specular = new BABYLON.Color3(0.1, 0.1, 0.2); // 反射光を抑える
    pointLight1.intensity = 0.3; // より抑える
    pointLight1.radius = 20; // 影響範囲を設定
    
    pointLight2 = new BABYLON.PointLight("pointLight2", new BABYLON.Vector3(-5, 8, -5), scene);
    pointLight2.diffuse = new BABYLON.Color3(0.8, 0.2, 0.5); // 紫色
    pointLight2.specular = new BABYLON.Color3(0.1, 0.1, 0.2); // 反射光を抑える
    pointLight2.intensity = 0.3; // より抑える
    pointLight2.radius = 20; // 影響範囲を設定
    
    try {
        // 影の設定
        shadowGenerator = new BABYLON.ShadowGenerator(4096, dirLight); // さらに解像度を上げて影をより鮮明に
        
        // シャドウマップの設定
        shadowGenerator.useBlurExponentialShadowMap = false; // ブラーを無効化してシャープな影に
        shadowGenerator.usePoissonSampling = false; // ポアソンサンプリングも無効化
        
        // PCFフィルタリングを使用
        shadowGenerator.usePercentageCloserFiltering = true; // PCFフィルタリングを使用
        shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH; // 高品質モード
        
        // シャドウマップのパラメータ調整
        shadowGenerator.bias = 0.0001; // バイアスを小さくして影のエッジを正確に
        shadowGenerator.normalBias = 0.005; // 法線バイアスも小さく
        shadowGenerator.darkness = 0.7; // 影の濃さをさらに上げる
        
        // 影の表示距離の調整
        shadowGenerator.depthScale = 30;
        
        // 固定サイズの影を使用
        shadowGenerator.useContactHardeningShadow = false;
        shadowGenerator.contactHardeningLightSizeUVRatio = 0.0;
        
        // ESMシャドウマップを使用して精度を高める
        shadowGenerator.useExponentialShadowMap = true;
        shadowGenerator.useKernelBlur = false;
        
        // セルフシャドウの設定
        shadowGenerator.enableSoftTransparentShadow = true;
        shadowGenerator.transparencyShadow = true;
        
        // シャドウマップを常に更新 - リアルタイム更新のため変更
        shadowGenerator.forceBackFacesOnly = false;
        
        // 追加のシャドウ設定
        shadowGenerator.frustumEdgeFalloff = 0.1; // エッジの減衰を小さく
        
        console.log("シャドウジェネレーターを設定しました:", {
            resolution: 4096,
            darkness: shadowGenerator.darkness,
            quality: "HIGH",
            PCF: true,
            exponentialShadowMap: true
        });
    } catch (e) {
        console.error("影の設定に失敗しました:", e);
        // 影がなくても部屋を表示するため、エラーをスローしない
    }
    
    // ライティングスライダーの初期値を設定
    if (ambientIntensitySlider) ambientIntensitySlider.value = ambientLight.intensity;
    if (directionalIntensitySlider) directionalIntensitySlider.value = dirLight.intensity;
    if (pointLightIntensitySlider) pointLightIntensitySlider.value = pointLight1.intensity;
    if (shadowDarknessSlider && shadowGenerator) shadowDarknessSlider.value = shadowGenerator.darkness;
    
    // カラーピッカーの初期値を設定
    if (ambientColorPicker) {
        const ambientColor = ambientLight.diffuse;
        ambientColorPicker.value = rgbToHex(ambientColor.r, ambientColor.g, ambientColor.b);
    }
    
    if (pointLight1ColorPicker) {
        const pointLight1Color = pointLight1.diffuse;
        pointLight1ColorPicker.value = rgbToHex(pointLight1Color.r, pointLight1Color.g, pointLight1Color.b);
    }
    
    if (pointLight2ColorPicker) {
        const pointLight2Color = pointLight2.diffuse;
        pointLight2ColorPicker.value = rgbToHex(pointLight2Color.r, pointLight2Color.g, pointLight2Color.b);
    }
    
    // 光源位置スライダーの初期値を設定
    if (dirLightXSlider) dirLightXSlider.value = dirLight.position.x;
    if (dirLightYSlider) dirLightYSlider.value = dirLight.position.y;
    if (dirLightZSlider) dirLightZSlider.value = dirLight.position.z;
    
    if (pointLight1XSlider) pointLight1XSlider.value = pointLight1.position.x;
    if (pointLight1YSlider) pointLight1YSlider.value = pointLight1.position.y;
    if (pointLight1ZSlider) pointLight1ZSlider.value = pointLight1.position.z;
    
    if (pointLight2XSlider) pointLight2XSlider.value = pointLight2.position.x;
    if (pointLight2YSlider) pointLight2YSlider.value = pointLight2.position.y;
    if (pointLight2ZSlider) pointLight2ZSlider.value = pointLight2.position.z;
}

// カメラの設定（アイソメトリックビュー）
function setupCamera() {
    // デフォルトのカメラ設定を使用
    const alpha = DEFAULT_CAMERA_SETTINGS.alpha;
    const beta = DEFAULT_CAMERA_SETTINGS.beta;
    const radius = DEFAULT_CAMERA_SETTINGS.radius;
    const target = DEFAULT_CAMERA_SETTINGS.target.clone();
    
    camera = new BABYLON.ArcRotateCamera("camera", alpha, beta, radius, target, scene);
    camera.lowerRadiusLimit = 10;  // 最小半径を大きくして切れを防止
    camera.upperRadiusLimit = 25; // より大きな最大半径
    camera.lowerBetaLimit = 0.1;
    camera.upperBetaLimit = Math.PI / 2;
    camera.panningSensibility = 0; // パンニングを無効化
    
    // デバッグ用スライダーの初期値を設定
    updateCameraDebugControls();
    
    // クリッピングプレーンを設定（手前側の切れを防止）
    camera.minZ = 0.01; // 最小距離を調整（クリッピング問題対策）
    camera.maxZ = 1000;   // 最大距離を大きく設定
    
    // メタリック効果を軽減するためのレンダリング設定
    scene.ambientColor = new BABYLON.Color3(0.3, 0.3, 0.3); // 環境光の色を調整
    
    // カメラコントロールの設定
    camera.attachControl(canvas, true);
    
    // マウスホイールでのズーム操作を設定
    camera.useAutoRotationBehavior = false;
    camera.wheelPrecision = 10; // ホイールの感度調整
    
    // マウスホイールのイベントをカスタマイズ
    scene.onPointerObservable.add((pointerInfo) => {
        if (pointerInfo.type === BABYLON.PointerEventTypes.POINTERWHEEL) {
            // ホイールの方向に応じてズームレベルを調整
            const wheelDelta = pointerInfo.event.deltaY || pointerInfo.event.detail;
            
            if (wheelDelta > 0) {
                // ホイールを下に回した（縮小）
                zoomLevel = Math.max(zoomLevel - 0.05, 0.5);
            } else {
                // ホイールを上に回した（拡大）
                zoomLevel = Math.min(zoomLevel + 0.05, 2.0);
            }
            
            // スライダー値を更新
            if (zoomSlider) zoomSlider.value = zoomLevel;
            
            // カメラの投影範囲を更新
            updateCameraProjection();
            
            // カメラデバッグ情報を更新
            updateCameraInfoDisplay();
            
            // デフォルトのホイール動作をキャンセル
            pointerInfo.event.preventDefault();
        }
    });
    
    // カメラの位置が変わるたびにデバッグ情報を更新
    camera.onViewMatrixChangedObservable.add(() => {
        updateCameraInfoDisplay();
    });
    
    try {
        // アイソメトリックビュー（等角投影）の設定
        camera.mode = BABYLON.Camera.ORTHOGRAPHIC_CAMERA;
        
        // フラスタムカリングを有効化（壁の透過問題の解決策として）
        camera.skipFrustumClipping = false;
        camera.checkCollisions = false;
        
        // 等角投影のサイズ調整（レスポンシブ対応）
        updateCameraProjection();
    } catch (e) {
        console.error("等角投影の設定に失敗しました:", e);
        // 等角投影でなくても部屋を表示するため、エラーをスローしない
    }
    
    // カメラの位置を再度確認して調整
    // 注：初期化時に設定したtargetを上書きしない
    
    // カメラ位置変更イベントで必要なメッシュの表示を確保
    camera.onViewMatrixChangedObservable.add(function() {
        // すべてのメッシュを適切に表示
        scene.meshes.forEach(mesh => {
            // モデルに関連するメッシュは常に表示
            if (mesh !== grid && !mesh.name.startsWith("preview") && !mesh.name.startsWith("vertical")) {
                mesh.isVisible = true;
                mesh.alwaysSelectAsActiveMesh = true; // 常にアクティブメッシュとして選択（クリッピング問題を回避）
                mesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION; // クリッピングを最適化
            }
        });
    });
}

// カメラの投影範囲を画面サイズに応じて更新
function updateCameraProjection() {
    if (!camera || !engine) return;
    
    try {
        const aspectRatio = engine.getAspectRatio(camera);
        const canvas = engine.getRenderingCanvas();
        const canvasWidth = canvas.width;
        const canvasHeight = canvas.height;
        
        // デバイスの種類に応じてサイズを調整 - カメラのradiusに合わせて大きめに設定
        let orthoSize;
        
        if (canvasWidth <= 768) {
            // モバイル
            orthoSize = 15; // カメラradiusに合わせて拡大表示
        } else if (canvasWidth <= 1024) {
            // タブレット
            orthoSize = 18; // カメラradiusに合わせて拡大表示
        } else {
            // デスクトップ
            orthoSize = 20; // カメラradiusに合わせて拡大表示
        }
        
        // ズームレベルを適用（値が小さいほど拡大、大きいほど縮小）
        // zoomLevelの逆数を使用することで、スライダーを右に動かすほど拡大される
        orthoSize = orthoSize / zoomLevel;
        
        // ズームレベルに応じてクリッピングプレーンを動的に調整
        // より小さい値に設定して手前の切れを防止
        camera.minZ = 0.01; // 固定値に設定（クリッピング問題対策）
        camera.maxZ = 1000;  // 固定値に設定（十分な表示範囲を確保）
        
        // バランスよく表示するために投影パラメータを調整（中央表示）
        if (aspectRatio > 1.5) {
            // 横長画面では垂直方向を基準にサイズを決定
            camera.orthoTop = orthoSize;                    // 上下対称に設定
            camera.orthoBottom = -orthoSize;                // 上下対称に設定
            camera.orthoLeft = -orthoSize * aspectRatio;
            camera.orthoRight = orthoSize * aspectRatio;
        } else {
            // 通常の画面
            camera.orthoTop = orthoSize;                    // 上下対称に設定
            camera.orthoBottom = -orthoSize;                // 上下対称に設定
            camera.orthoLeft = -orthoSize * aspectRatio;
            camera.orthoRight = orthoSize * aspectRatio;
        }
        
        console.log("カメラ投影範囲を更新:", {
            aspectRatio: aspectRatio,
            orthoSize: orthoSize,
            canvasSize: `${canvasWidth}x${canvasHeight}`
        });
        
        // 壁の表示を確保
        ensureWallsVisibility();
    } catch (e) {
        console.error("カメラ投影範囲の更新に失敗しました:", e);
    }
}

// 壁が常に表示されるようにする
// 壁の不透明度を確保する関数
function ensureWallOpacity(wallMesh) {
    if (!wallMesh) return;
    
    // 壁に新しいマテリアルを適用
    if (!wallMesh._originalMaterial && wallMesh.material) {
        // オリジナルのマテリアルを保存
        wallMesh._originalMaterial = wallMesh.material;
    }
    
    // 新しい不透明マテリアルを作成
    const wallMaterial = new BABYLON.StandardMaterial("wallMaterial_" + wallMesh.name, scene);
    
    // 元のマテリアルの色を保持
    if (wallMesh._originalMaterial && wallMesh._originalMaterial.diffuseColor) {
        wallMaterial.diffuseColor = wallMesh._originalMaterial.diffuseColor.clone();
    } else if (wallMesh.material && wallMesh.material.diffuseColor) {
        wallMaterial.diffuseColor = wallMesh.material.diffuseColor.clone();
    } else {
        wallMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8); // デフォルトはグレー
    }
    
    // 完全に不透明なマテリアル設定
    wallMaterial.alpha = 1.0;
    wallMaterial.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
    wallMaterial.backFaceCulling = true;
    wallMaterial.twoSidedLighting = false;
    wallMaterial.needDepthPrePass = true;
    wallMaterial.disableDepthWrite = false;
    
    // 反射を抑制
    wallMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
    wallMaterial.specularPower = 1;
    
    // 環境反射を無効化
    wallMaterial.reflectionTexture = null;
    wallMaterial.reflectionFresnelParameters = null;
    
    // テクスチャがある場合は転送
    if (wallMesh._originalMaterial && wallMesh._originalMaterial.diffuseTexture) {
        wallMaterial.diffuseTexture = wallMesh._originalMaterial.diffuseTexture.clone();
    }
    
    // 新しいマテリアルを壁に適用
    wallMesh.material = wallMaterial;
    
    // レンダリング設定を調整
    wallMesh.renderingGroupId = 0; // 背景レイヤー
    wallMesh.occlusionType = BABYLON.AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;
    wallMesh.occlusionQueryAlgorithmType = BABYLON.AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
    
    console.log("壁に新しい不透明マテリアルを適用:", wallMesh.name);
}

function ensureWallsVisibility() {
    try {
        // エンジンのアルファモードを無効化（透明度の問題を防止）
        engine.alphaMode = BABYLON.Engine.ALPHA_DISABLE;
        
        // 壁メッシュがある場合は表示を確保
        if (wall1) {
            wall1.isVisible = true;
            ensureWallOpacity(wall1);
        }
        if (wall2) {
            wall2.isVisible = true;
            ensureWallOpacity(wall2);
        }
        
        // GLBモデル内の壁を適切に表示するためのレンダリング設定
        scene.setRenderingOrder(BABYLON.RenderingGroup.OPAQUE_OBJECTS, 
            (meshA, meshB) => {
                // ユーザーが配置したすべてのオブジェクトを前面に描画（レコードマシン、ジュースボックス、マイクデスクを含む）
                const isUserObjA = meshA.name.startsWith("cube_") || 
                                   meshA.name.startsWith("record_") || 
                                   meshA.name.startsWith("juiceBox_") || 
                                   meshA.name.startsWith("mikeDesk_") ||
                                   (meshA.parent && (
                                       meshA.parent.name.startsWith("record_") ||
                                       meshA.parent.name.startsWith("juiceBox_") || 
                                       meshA.parent.name.startsWith("mikeDesk_")
                                   ));
                                   
                const isUserObjB = meshB.name.startsWith("cube_") || 
                                   meshB.name.startsWith("record_") || 
                                   meshB.name.startsWith("juiceBox_") || 
                                   meshB.name.startsWith("mikeDesk_") ||
                                   (meshB.parent && (
                                       meshB.parent.name.startsWith("record_") ||
                                       meshB.parent.name.startsWith("juiceBox_") || 
                                       meshB.parent.name.startsWith("mikeDesk_")
                                   ));
                
                if (isUserObjA && !isUserObjB) {
                    return -1; // ユーザーオブジェクトを先に描画
                }
                if (!isUserObjA && isUserObjB) {
                    return 1; // ユーザーオブジェクトを先に描画
                }
                
                // 壁を背景として描画（名前に "wall" を含むか、一部のモデルでの特定のメッシュ名をチェック）
                const isWallA = meshA.name.toLowerCase().includes("wall") || 
                               meshA.name.toLowerCase().includes("building") || 
                               meshA.name.toLowerCase().includes("structure");
                const isWallB = meshB.name.toLowerCase().includes("wall") || 
                               meshB.name.toLowerCase().includes("building") || 
                               meshB.name.toLowerCase().includes("structure");
                
                if (isWallA && !isWallB) {
                    return 1; // 壁を後に描画
                }
                if (!isWallA && isWallB) {
                    return -1; // 壁を後に描画
                }
                
                // 床は壁より先に描画（インタラクションのため）
                const isFloorA = meshA.name.toLowerCase().includes("floor") || 
                                meshA.name.toLowerCase().includes("ground") || 
                                meshA === ground;
                const isFloorB = meshB.name.toLowerCase().includes("floor") || 
                                meshB.name.toLowerCase().includes("ground") || 
                                meshB === ground;
                
                if (isFloorA && isWallB) {
                    return -1; // 床を先に描画
                }
                if (isWallA && isFloorB) {
                    return 1; // 床を先に描画
                }
                
                return 0; // 順序変更なし
            }
        );
        
        // レンダリング前に毎回、配置したオブジェクトが前面に表示されるようにする
        scene.onBeforeRenderObservable.clear(); // 既存のオブザーバーをクリア
        scene.onBeforeRenderObservable.add(() => {
            // すべてのメッシュをチェック
            scene.meshes.forEach(mesh => {
                // ユーザーが配置したオブジェクト（レコードマシン、ジュースボックス、マイクデスクを含む）
                if (mesh.name.startsWith("cube_") || 
                    mesh.name.startsWith("record_") || 
                    mesh.name.startsWith("juiceBox_") || 
                    mesh.name.startsWith("mikeDesk_")) {
                    
                    // マテリアルのZ値を調整して前面に表示
                    if (mesh.material) {
                        mesh.material.zOffset = 1;
                    }
                    // レンダリンググループを設定
                    mesh.renderingGroupId = 0; // デフォルトレイヤーに統一
                    
                    // GLBモデルの子メッシュも同じレイヤーに設定
                    if (mesh.getChildMeshes && typeof mesh.getChildMeshes === 'function') {
                        mesh.getChildMeshes().forEach(childMesh => {
                            if (childMesh.material) {
                                // zOffsetは使用しない
                            }
                            childMesh.renderingGroupId = 0; // デフォルトレイヤーに統一
                        });
                    }
                }
                
                // GLBモデルの壁などの背景要素
                if (mesh.name.toLowerCase().includes("wall") || 
                    mesh.name.toLowerCase().includes("building") || 
                    mesh.name.toLowerCase().includes("structure")) {
                    
                    // 壁用の新しいマテリアルを作成
                    const wallMaterial = new BABYLON.StandardMaterial("wallMaterial_" + mesh.name, scene);
                    
                    // 元のマテリアルの色を保持
                    if (mesh.material && mesh.material.diffuseColor) {
                        wallMaterial.diffuseColor = mesh.material.diffuseColor.clone();
                    } else {
                        wallMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8); // デフォルト色
                    }
                    
                    // テクスチャがある場合は転送
                    if (mesh.material && mesh.material.diffuseTexture) {
                        wallMaterial.diffuseTexture = mesh.material.diffuseTexture.clone();
                    }
                    
                    // 完全に不透明なマテリアル設定
                    wallMaterial.alpha = 1.0;
                    wallMaterial.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
                    wallMaterial.backFaceCulling = true;
                    wallMaterial.twoSidedLighting = false;
                    wallMaterial.needDepthPrePass = true;
                    wallMaterial.disableDepthWrite = false;
                    wallMaterial.zOffset = -10;
                    
                    // 反射を抑制
                    wallMaterial.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                    wallMaterial.specularPower = 1;
                    
                    // 環境反射を無効化
                    wallMaterial.reflectionTexture = null;
                    wallMaterial.reflectionFresnelParameters = null;
                    
                    // 新しいマテリアルを適用
                    mesh.material = wallMaterial;
                    
                    // レンダリンググループを設定
                    mesh.renderingGroupId = 0;
                    
                    // オクルージョン設定を最適化
                    mesh.occlusionType = BABYLON.AbstractMesh.OCCLUSION_TYPE_OPTIMISTIC;
                    mesh.occlusionQueryAlgorithmType = BABYLON.AbstractMesh.OCCLUSION_ALGORITHM_TYPE_CONSERVATIVE;
                    
                    console.log("GLBモデル内の壁に不透明マテリアルを適用:", mesh.name);
                }
            });
        });
        
        console.log("レンダリング設定を更新しました");
    } catch (e) {
        console.error("レンダリング設定の更新に失敗しました:", e);
    }
}

// UIの設定
function setupUI() {
    try {
        // ズーム機能の設定
        if (zoomSlider) {
            zoomSlider.addEventListener("input", function() {
                zoomLevel = parseFloat(this.value);
                updateCameraProjection();
            });
        }
        
        if (zoomInBtn) {
            zoomInBtn.addEventListener("click", function() {
                zoomLevel = Math.min(zoomLevel + 0.1, 2.0);
                if (zoomSlider) zoomSlider.value = zoomLevel;
                updateCameraProjection();
            });
        }
        
        if (zoomOutBtn) {
            zoomOutBtn.addEventListener("click", function() {
                zoomLevel = Math.max(zoomLevel - 0.1, 0.5);
                if (zoomSlider) zoomSlider.value = zoomLevel;
                updateCameraProjection();
            });
        }
        
        if (resetZoomBtn) {
            resetZoomBtn.addEventListener("click", function() {
                zoomLevel = 1.0;
                if (zoomSlider) zoomSlider.value = zoomLevel;
                updateCameraProjection();
            });
        }
        
        // カメラ調整用デバッグパネルの設定
        setupCameraDebugPanel();
        
        // メタリック効果を抑えるチェックボックスの処理
        if (reduceShininess) {
            reduceShininess.addEventListener("change", function() {
                // シーン内のすべてのマテリアルの反射を調整
                adjustMaterialShininess(this.checked);
            });
        }
        
        // グリッドサイズの処理
        gridSizeSelect.addEventListener("change", function() {
            gridSize = parseFloat(this.value);
            // 床と壁の両方のグリッドを更新
            createGrid();
            createWallGrids();
        });
        
        // グリッド表示の切り替え
        showGridCheck.addEventListener("change", function() {
            showGrid = this.checked;
            console.log("=== グリッド表示を変更 ===", showGrid);
            console.log("現在の床メッシュ:", ground ? ground.name : "なし");
            console.log("現在の壁メッシュ:", wall1 ? wall1.name : "なし", wall2 ? wall2.name : "なし");
            
            // 既存のグリッドマテリアルを確実にクリーンアップ
            cleanupGridMaterials();
            
            // グリッドの表示を更新（createGrid内でcreateWallGridsも呼び出される）
            createGrid();
            
            // シーンの強制再レンダリング
            if (scene) {
                scene.render();
                console.log("シーンを強制再レンダリングしました");
            }
            
            console.log("=== グリッド表示変更完了 ===");
        });
        
        // スナップの切り替え
        snapToGridCheck.addEventListener("change", function() {
            snapToGrid = this.checked;
        });
        
        // ライティング調整スライダーの処理
        if (ambientIntensitySlider) {
            ambientIntensitySlider.addEventListener("input", function() {
                if (ambientLight) {
                    ambientLight.intensity = parseFloat(this.value);
                }
            });
        }
        
        if (directionalIntensitySlider) {
            directionalIntensitySlider.addEventListener("input", function() {
                if (dirLight) {
                    dirLight.intensity = parseFloat(this.value);
                }
            });
        }
        
        if (pointLightIntensitySlider) {
            pointLightIntensitySlider.addEventListener("input", function() {
                const intensity = parseFloat(this.value);
                if (pointLight1) pointLight1.intensity = intensity;
                if (pointLight2) pointLight2.intensity = intensity;
            });
        }
        
        if (shadowDarknessSlider) {
            shadowDarknessSlider.addEventListener("input", function() {
                if (shadowGenerator) {
                    shadowGenerator.darkness = parseFloat(this.value);
                }
            });
        }
        
        // 色の調整
        if (ambientColorPicker) {
            ambientColorPicker.addEventListener("input", function() {
                if (ambientLight) {
                    ambientLight.diffuse = hexToColor3(this.value);
                }
            });
        }
        
        if (pointLight1ColorPicker) {
            pointLight1ColorPicker.addEventListener("input", function() {
                if (pointLight1) {
                    pointLight1.diffuse = hexToColor3(this.value);
                }
            });
        }
        
        if (pointLight2ColorPicker) {
            pointLight2ColorPicker.addEventListener("input", function() {
                if (pointLight2) {
                    pointLight2.diffuse = hexToColor3(this.value);
                }
            });
        }
        
        // 光源位置スライダーのイベントリスナー設定
        // 方向光の位置
        if (dirLightXSlider) {
            dirLightXSlider.addEventListener("input", function() {
                if (dirLight) {
                    dirLight.position.x = parseFloat(this.value);
                    // 影の投影範囲も更新
                    updateShadowCaster();
                }
            });
        }
        
        if (dirLightYSlider) {
            dirLightYSlider.addEventListener("input", function() {
                if (dirLight) {
                    dirLight.position.y = parseFloat(this.value);
                    // 影の投影範囲も更新
                    updateShadowCaster();
                }
            });
        }
        
        if (dirLightZSlider) {
            dirLightZSlider.addEventListener("input", function() {
                if (dirLight) {
                    dirLight.position.z = parseFloat(this.value);
                    // 影の投影範囲も更新
                    updateShadowCaster();
                }
            });
        }
        
        // ポイント光1の位置
        if (pointLight1XSlider) {
            pointLight1XSlider.addEventListener("input", function() {
                if (pointLight1) {
                    pointLight1.position.x = parseFloat(this.value);
                }
            });
        }
        
        if (pointLight1YSlider) {
            pointLight1YSlider.addEventListener("input", function() {
                if (pointLight1) {
                    pointLight1.position.y = parseFloat(this.value);
                }
            });
        }
        
        if (pointLight1ZSlider) {
            pointLight1ZSlider.addEventListener("input", function() {
                if (pointLight1) {
                    pointLight1.position.z = parseFloat(this.value);
                }
            });
        }
        
        // ポイント光2の位置
        if (pointLight2XSlider) {
            pointLight2XSlider.addEventListener("input", function() {
                if (pointLight2) {
                    pointLight2.position.x = parseFloat(this.value);
                }
            });
        }
        
        if (pointLight2YSlider) {
            pointLight2YSlider.addEventListener("input", function() {
                if (pointLight2) {
                    pointLight2.position.y = parseFloat(this.value);
                }
            });
        }
        
        if (pointLight2ZSlider) {
            pointLight2ZSlider.addEventListener("input", function() {
                if (pointLight2) {
                    pointLight2.position.z = parseFloat(this.value);
                }
            });
        }
        
        // オブジェクト回転ボタン
        rotateBtn.addEventListener("click", function() {
            if (selectedMesh) {
                // 選択中のオブジェクトをY軸で90度回転
                selectedMesh.rotation.y += Math.PI / 2; // 90度（π/2ラジアン）回転
                console.log("オブジェクトを90度回転しました:", selectedMesh.name);
            }
        });
        
        // オブジェクト削除ボタン
        deleteBtn.addEventListener("click", function() {
            if (selectedMesh) {
                // 選択中のオブジェクトを削除
                selectedMesh.dispose();
                selectedMesh = null;
            }
        });
        
        // ヘルプパネルの設定
        helpBtn.addEventListener("click", function() {
            helpPanel.style.display = "block";
        });
        
        helpCloseBtn.addEventListener("click", function() {
            helpPanel.style.display = "none";
        });
        
        // コントロールパネルの折りたたみ機能
        if (toggleControlsBtn) {
            const controlsContent = document.querySelector(".controls-content");
            
            // 初期状態を設定
            controlsContent.style.display = "block";
            if (toggleControlsIcon) {
                toggleControlsIcon.textContent = "−";
            }
            
            // ヘッダーボタンクリックで反応するように
            toggleControlsBtn.addEventListener("click", toggleControlsVisibility);
            
            function toggleControlsVisibility() {
                if (controlsContent.style.display === "none") {
                    controlsContent.style.display = "block";
                    if (toggleControlsIcon) {
                        toggleControlsIcon.textContent = "−";
                    }
                } else {
                    controlsContent.style.display = "none";
                    if (toggleControlsIcon) {
                        toggleControlsIcon.textContent = "+";
                    }
                }
            }
        }
        
        // 画像書き出し機能
        if (exportImageBtn) {
            exportImageBtn.addEventListener("click", function() {
                try {
                    // 高解像度スクリーンショットを保存する
                    const screenshotSize = {
                        width: engine.getRenderWidth(),
                        height: engine.getRenderHeight()
                    };
                    
                    // 一時的にレンダリング解像度を高くする
                    engine.setHardwareScalingLevel(0.5); // 1.0より小さい値で高解像度に
                    
                    // シーンを一度レンダリング
                    scene.render();
                    
                    // レンダリングされたシーンをキャプチャ
                    BABYLON.Tools.CreateScreenshot(engine, camera, screenshotSize, function(screenshot) {
                        // ファイル名に現在の日時を含める
                        const now = new Date();
                        const timestamp = now.getFullYear() + 
                            String(now.getMonth() + 1).padStart(2, '0') + 
                            String(now.getDate()).padStart(2, '0') + '_' +
                            String(now.getHours()).padStart(2, '0') + 
                            String(now.getMinutes()).padStart(2, '0') + 
                            String(now.getSeconds()).padStart(2, '0');
                        
                        const filename = `3d_room_${timestamp}.png`;
                        
                        // ダウンロードリンクを作成
                        const link = document.createElement('a');
                        link.href = screenshot;
                        link.download = filename;
                        
                        // ダウンロードを実行
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        
                        // 元のスケーリングに戻す
                        engine.setHardwareScalingLevel(1.0);
                        
                        console.log("画像を書き出しました:", filename);
                    });
                } catch (error) {
                    console.error("画像書き出しエラー:", error);
                    alert("画像の書き出しに失敗しました。");
                    // エラーが発生した場合も元のスケーリングに戻す
                    engine.setHardwareScalingLevel(1.0);
                }
            });
        }
    } catch (e) {
        showError(new Error("UIの設定中にエラーが発生しました: " + e.message));
    }
}

// 床にテクスチャを適用する
function applyFloorTexture(textureType) {
    if (!ground) return;
    
    console.log("床のテクスチャを変更:", textureType);
    
    switch (textureType) {
        case "default":
            ground.material = groundMaterial;
            break;
        case "wood":
        case "marble":
        case "concrete":
            if (floorTextures[textureType]) {
                ground.material = floorTextures[textureType];
            }
            break;
        default:
            ground.material = groundMaterial;
    }
}

// 16進カラーコードをBabylon.jsのColor3に変換
function hexToColor3(hexColor) {
    const r = parseInt(hexColor.substr(1, 2), 16) / 255;
    const g = parseInt(hexColor.substr(3, 2), 16) / 255;
    const b = parseInt(hexColor.substr(5, 2), 16) / 255;
    return new BABYLON.Color3(r, g, b);
}

// RGBをHEXカラーコードに変換
function rgbToHex(r, g, b) {
    r = Math.floor(r * 255);
    g = Math.floor(g * 255);
    b = Math.floor(b * 255);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// マテリアルの反射を調整する
function adjustMaterialShininess(reduce) {
    // シーン内のすべてのメッシュに対して処理
    for (let mesh of scene.meshes) {
        if (mesh.material) {
            if (reduce) {
                // メタリック効果を抑える
                mesh.material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                mesh.material.specularPower = 1;
                
                // PBRマテリアルの場合
                if (mesh.material.metallicF0Factor !== undefined) {
                    mesh.material.metallicF0Factor = 0.1;
                }
                if (mesh.material.roughness !== undefined) {
                    mesh.material.roughness = 0.9; // 粗さを上げる（反射を抑える）
                }
            } else {
                // デフォルトの反射設定に戻す
                mesh.material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                mesh.material.specularPower = 64;
                
                // PBRマテリアルの場合
                if (mesh.material.metallicF0Factor !== undefined) {
                    mesh.material.metallicF0Factor = 0.5;
                }
                if (mesh.material.roughness !== undefined) {
                    mesh.material.roughness = 0.4;
                }
            }
            
            // 重要: マテリアルの調整がPickableに影響しないようにする
            if (mesh.name.startsWith("cube_") || mesh.name.startsWith("record_") || 
                mesh.name.startsWith("juiceBox_") || mesh.name.startsWith("mikeDesk_")) {
                mesh.isPickable = true;
            }
        }
    }
    
    // 光源の反射も調整
    if (ambientLight) {
        ambientLight.specular = reduce ? 
            new BABYLON.Color3(0.1, 0.1, 0.15) : 
            new BABYLON.Color3(0.2, 0.2, 0.3);
    }
    
    if (dirLight) {
        dirLight.specular = reduce ? 
            new BABYLON.Color3(0.1, 0.1, 0.15) : 
            new BABYLON.Color3(1, 1, 1);
    }
    
    if (pointLight1) {
        pointLight1.specular = reduce ? 
            new BABYLON.Color3(0.1, 0.1, 0.2) : 
            new BABYLON.Color3(1, 1, 1);
    }
    
    if (pointLight2) {
        pointLight2.specular = reduce ? 
            new BABYLON.Color3(0.1, 0.1, 0.2) : 
            new BABYLON.Color3(1, 1, 1);
    }
}

// 影の投影設定を更新する
function updateShadowCaster() {
    if (!shadowGenerator || !dirLight) return;
    
    try {
        // 方向光の位置が変更されたら、影の投影方向と範囲を更新
        const dirLightPosition = dirLight.position.clone();
        
        // シャドウマップの自動更新を有効化 - リアルタイム更新のため変更
        shadowGenerator.forceBackFacesOnly = false;
        shadowGenerator.useKernelBlur = false;
        shadowGenerator.blurKernel = 1;
        
        // 方向光の投影方向を更新 - 初期方向を維持
        // 計算した場合の方向
        // const targetPosition = new BABYLON.Vector3(0, 0, 0); // 部屋の中心に向ける
        // const lightDirection = targetPosition.subtract(dirLightPosition).normalize();
        
        // 画像で指定された方向に設定
        const lightDirection = new BABYLON.Vector3(
            -0.329292799969871,
            -0.768349381992783325,
            -0.548821299944517
        );
        dirLight.direction = lightDirection;
        
        // 必要に応じて影のパラメーターを調整
        const distanceFromCenter = Math.sqrt(
            dirLightPosition.x * dirLightPosition.x + 
            dirLightPosition.z * dirLightPosition.z
        );
        
        // 距離に応じて影の濃さを調整（遠いほど薄くなる）
        const distanceFactor = Math.min(1, 20 / Math.max(10, distanceFromCenter));
        if (shadowGenerator.darkness !== undefined) {
            shadowGenerator.darkness = 0.7 * distanceFactor;
            
            // スライダーの値も更新
            if (shadowDarknessSlider) {
                shadowDarknessSlider.value = shadowGenerator.darkness;
            }
        }
        
        // 高さに応じて影の精度を調整
        const heightFactor = Math.min(1, 40 / Math.max(20, dirLightPosition.y));
        shadowGenerator.bias = 0.0001 * (1 / heightFactor);
        
        // 影のサイズと品質を動的に調整
        const lightDistance = dirLightPosition.length();
        
        console.log("影の設定を更新しました:", {
            lightPosition: dirLightPosition,
            lightDirection: lightDirection,
            shadowDarkness: shadowGenerator.darkness,
            shadowBias: shadowGenerator.bias
        });
        
        // シーンを再レンダリングして影を更新
        if (scene) {
            scene.render();
        }
    } catch (e) {
        console.error("影の更新に失敗しました:", e);
    }
}

// 床にカスタム色を適用する
function applyCustomFloorColor(hexColor) {
    if (!ground || !floorTextures.custom) return;
    
    floorTextures.custom.diffuseColor = hexToColor3(hexColor);
    ground.material = floorTextures.custom;
    
    console.log("床のカスタム色を設定:", hexColor);
}

// カメラのデバッグ情報を表示する関数
function updateCameraInfoDisplay() {
    if (!camera || !cameraInfoDisplay) return;
    
    const info = {
        alpha: camera.alpha.toFixed(2),
        beta: camera.beta.toFixed(2),
        radius: camera.radius.toFixed(2),
        target: {
            x: camera.target.x.toFixed(2),
            y: camera.target.y.toFixed(2),
            z: camera.target.z.toFixed(2)
        },
        position: {
            x: camera.position.x.toFixed(2),
            y: camera.position.y.toFixed(2),
            z: camera.position.z.toFixed(2)
        }
    };
    
    cameraInfoDisplay.textContent = `α: ${info.alpha}, β: ${info.beta}, r: ${info.radius}\nTarget: (${info.target.x}, ${info.target.y}, ${info.target.z})\nPos: (${info.position.x}, ${info.position.y}, ${info.position.z})`;
}

// カメラのスライダー値を更新する関数
function updateCameraDebugControls() {
    if (!camera) return;
    
    if (cameraAlphaSlider) cameraAlphaSlider.value = camera.alpha;
    if (cameraBetaSlider) cameraBetaSlider.value = camera.beta;
    if (cameraRadiusSlider) cameraRadiusSlider.value = camera.radius;
    if (cameraTargetXSlider) cameraTargetXSlider.value = camera.target.x;
    if (cameraTargetYSlider) cameraTargetYSlider.value = camera.target.y;
    if (cameraTargetZSlider) cameraTargetZSlider.value = camera.target.z;
    
    updateCameraInfoDisplay();
}

// カメラデバッグパネルのセットアップ
function setupCameraDebugPanel() {
    // カメラの角度調整
    if (cameraAlphaSlider) {
        cameraAlphaSlider.addEventListener("input", function() {
            if (camera) {
                camera.alpha = parseFloat(this.value);
                updateCameraInfoDisplay();
            }
        });
    }
    
    if (cameraBetaSlider) {
        cameraBetaSlider.addEventListener("input", function() {
            if (camera) {
                camera.beta = parseFloat(this.value);
                updateCameraInfoDisplay();
            }
        });
    }
    
    if (cameraRadiusSlider) {
        cameraRadiusSlider.addEventListener("input", function() {
            if (camera) {
                camera.radius = parseFloat(this.value);
                updateCameraInfoDisplay();
            }
        });
    }
    
    // カメラのターゲット位置調整
    if (cameraTargetXSlider) {
        cameraTargetXSlider.addEventListener("input", function() {
            if (camera) {
                const x = parseFloat(this.value);
                const y = camera.target.y;
                const z = camera.target.z;
                camera.target = new BABYLON.Vector3(x, y, z);
                updateCameraInfoDisplay();
            }
        });
    }
    
    if (cameraTargetYSlider) {
        cameraTargetYSlider.addEventListener("input", function() {
            if (camera) {
                const x = camera.target.x;
                const y = parseFloat(this.value);
                const z = camera.target.z;
                camera.target = new BABYLON.Vector3(x, y, z);
                updateCameraInfoDisplay();
            }
        });
    }
    
    if (cameraTargetZSlider) {
        cameraTargetZSlider.addEventListener("input", function() {
            if (camera) {
                const x = camera.target.x;
                const y = camera.target.y;
                const z = parseFloat(this.value);
                camera.target = new BABYLON.Vector3(x, y, z);
                updateCameraInfoDisplay();
            }
        });
    }
    
    // カメラリセットボタン
    if (resetCameraBtn) {
        resetCameraBtn.addEventListener("click", function() {
            if (camera) {
                camera.alpha = DEFAULT_CAMERA_SETTINGS.alpha;
                camera.beta = DEFAULT_CAMERA_SETTINGS.beta;
                camera.radius = DEFAULT_CAMERA_SETTINGS.radius;
                camera.target = DEFAULT_CAMERA_SETTINGS.target.clone();
                updateCameraDebugControls();
            }
        });
    }
    
    // カメラ設定をログ出力するボタン
    if (logCameraBtn) {
        logCameraBtn.addEventListener("click", function() {
            if (camera) {
                const settings = {
                    alpha: camera.alpha,
                    beta: camera.beta,
                    radius: camera.radius,
                    target: {
                        x: camera.target.x,
                        y: camera.target.y,
                        z: camera.target.z
                    },
                    position: {
                        x: camera.position.x,
                        y: camera.position.y,
                        z: camera.position.z
                    }
                };
                
                console.log("現在のカメラ設定:", settings);
                
                // コンソールに設定をコピーするためのコード例を出力
                const codeExample = `// カメラ設定
const cameraSettings = {
    alpha: ${settings.alpha.toFixed(4)},
    beta: ${settings.beta.toFixed(4)},
    radius: ${settings.radius.toFixed(4)},
    target: new BABYLON.Vector3(${settings.target.x.toFixed(4)}, ${settings.target.y.toFixed(4)}, ${settings.target.z.toFixed(4)})
};`;
                
                console.log("コード例:");
                console.log(codeExample);
                
                // ユーザーに通知
                alert("カメラ設定をコンソールに出力しました。F12キーを押してコンソールを確認してください。");
            }
        });
    }
    
    // 初期値の設定
    updateCameraDebugControls();
}

// 部屋の境界を計算する
function calculateRoomBoundary(meshes) {
    try {
        // 壁メッシュをもとに部屋の境界を計算
        let wallMeshes = meshes.filter(mesh => 
            mesh.name.toLowerCase().includes("wall") || 
            mesh.name.toLowerCase().includes("building") || 
            mesh.name.toLowerCase().includes("structure")
        );
        
        if (wallMeshes.length > 0) {
            // 壁の境界ボックスから部屋のサイズを計算
            let minX = Infinity, maxX = -Infinity;
            let minZ = Infinity, maxZ = -Infinity;
            
            for (let mesh of wallMeshes) {
                const boundingInfo = mesh.getBoundingInfo();
                const min = boundingInfo.boundingBox.minimumWorld;
                const max = boundingInfo.boundingBox.maximumWorld;
                
                minX = Math.min(minX, min.x);
                maxX = Math.max(maxX, max.x);
                minZ = Math.min(minZ, min.z);
                maxZ = Math.max(maxZ, max.z);
            }
            
            // 少し内側に調整して余裕を持たせる
            const margin = 1.0; // 1単位の余裕
            roomBoundary.minX = minX + margin;
            roomBoundary.maxX = maxX - margin;
            roomBoundary.minZ = minZ + margin;
            roomBoundary.maxZ = maxZ - margin;
            
            // 部屋の境界が不自然な値の場合はデフォルト値を使用
            if (!isFinite(roomBoundary.minX) || !isFinite(roomBoundary.maxX) || 
                !isFinite(roomBoundary.minZ) || !isFinite(roomBoundary.maxZ) ||
                Math.abs(roomBoundary.minX) > 100 || Math.abs(roomBoundary.maxX) > 100 ||
                Math.abs(roomBoundary.minZ) > 100 || Math.abs(roomBoundary.maxZ) > 100) {
                console.warn("異常な部屋境界値を検出、デフォルト値を使用します", roomBoundary);
                roomBoundary.minX = -9;
                roomBoundary.maxX = 9;
                roomBoundary.minZ = -9;
                roomBoundary.maxZ = 9;
            }
            
            console.log("部屋の境界を計算しました:", roomBoundary);
            
            // 境界ヘルパーを更新
            updateRoomBoundaryHelper();
        } else {
            // 壁が見つからない場合はデフォルト値を使用
            roomBoundary = {
                minX: -9,
                maxX: 9,
                minZ: -9,
                maxZ: 9
            };
            console.log("壁メッシュが見つからないため、デフォルトの部屋境界を使用します:", roomBoundary);
            
            // 境界ヘルパーを更新
            updateRoomBoundaryHelper();
        }
    } catch (e) {
        console.error("部屋の境界計算に失敗しました:", e);
        // デフォルト値を使用
        roomBoundary = {
            minX: -9,
            maxX: 9,
            minZ: -9,
            maxZ: 9
        };
    }
}

// 部屋の境界ヘルパーを作成（デバッグ用）
function createRoomBoundaryHelper() {
    try {
        // 既存のヘルパーを削除
        const existingHelper = scene.getMeshByName("roomBoundaryHelper");
        if (existingHelper) {
            existingHelper.dispose();
        }
        
        // デバッグ用の境界ヘルパーは作成しない（緑の線を非表示にするため）
        console.log("部屋境界ヘルパーの作成をスキップしました（デバッグ表示を無効化）");
    } catch (e) {
        console.error("部屋境界ヘルパーの作成に失敗しました:", e);
    }
}

// 部屋の境界ヘルパーを更新
function updateRoomBoundaryHelper() {
    try {
        // 既存の境界ヘルパーがあれば削除
        const boundaryMesh = scene.getMeshByName("roomBoundaryHelper");
        if (boundaryMesh) {
            boundaryMesh.dispose();
            console.log("部屋境界ヘルパーを削除しました");
        }
        
        // 壁グリッドも更新
        updateWallGrids();
    } catch (e) {
        console.error("部屋境界ヘルパーの更新に失敗しました:", e);
    }
}

// 壁グリッドを更新
function updateWallGrids() {
    try {
        // 既存の壁グリッドを削除して再作成
        const existingGrids = scene.meshes.filter(mesh => 
            mesh.name.startsWith("wallGrid")
        );
        
        existingGrids.forEach(mesh => mesh.dispose());
        
        // 壁グリッドを再作成
        createWallGrids();
        
        console.log("壁グリッドを更新しました");
    } catch (e) {
        console.error("壁グリッドの更新に失敗しました:", e);
    }
}

// 位置が部屋の内側にあるかチェック
function isPositionInsideRoom(position, isWallPlacement = false) {
    // roomBoundaryのオーバーライド（強制的にデフォルト値を使用）
    // スクリーンショットを見た結果、境界値が正しく設定されていないようなので強制修正
    const fixedRoomBoundary = {
        minX: -9,
        maxX: 9,
        minZ: -9,
        maxZ: 9
    };
    
    console.log("位置チェック:", {
        position: position,
        roomBoundary: fixedRoomBoundary, // 修正した境界値を使用
        isWallPlacement: isWallPlacement
    });
    
    // 壁に配置する場合は特別な判定を行う
    if (isWallPlacement) {
        // 壁の近くでの配置を許可（少し余裕を持たせる）
        const wallTolerance = 0.5;
        
        // X方向の壁に近いか（境界上または非常に近いか）
        const nearXWall = 
            Math.abs(position.x - fixedRoomBoundary.minX) <= wallTolerance || 
            Math.abs(position.x - fixedRoomBoundary.maxX) <= wallTolerance;
            
        // Z方向の壁に近いか
        const nearZWall = 
            Math.abs(position.z - fixedRoomBoundary.minZ) <= wallTolerance || 
            Math.abs(position.z - fixedRoomBoundary.maxZ) <= wallTolerance;
        
        // Y座標が適切な範囲内か
        const validYPos = position.y >= 0 && position.y <= 15; // 適当な高さ制限
        
        // 壁沿いかつY座標が適切な範囲内なら部屋の内側と判定
        if ((nearXWall || nearZWall) && validYPos) {
            console.log("壁配置のための特別な室内判定を行いました:", position);
            return true;
        }
    }
    
    // 通常の判定（部屋の内側かどうか）- 厳密な境界チェック
    const isInside = position.x > fixedRoomBoundary.minX && 
                     position.x < fixedRoomBoundary.maxX && 
                     position.z > fixedRoomBoundary.minZ && 
                     position.z < fixedRoomBoundary.maxZ;
    
    console.log("境界チェック結果:", {
        isInside: isInside,
        x: position.x,
        z: position.z,
        xRange: [fixedRoomBoundary.minX, fixedRoomBoundary.maxX],
        zRange: [fixedRoomBoundary.minZ, fixedRoomBoundary.maxZ],
        xCheck: position.x > fixedRoomBoundary.minX && position.x < fixedRoomBoundary.maxX,
        zCheck: position.z > fixedRoomBoundary.minZ && position.z < fixedRoomBoundary.maxZ
    });
    
    return isInside;
}

// 位置を部屋の境界内に制限する
function constrainPositionToRoomBoundary(position) {
    const constrained = position.clone();
    
    // X座標を境界内に制限
    constrained.x = Math.max(roomBoundary.minX, Math.min(roomBoundary.maxX, constrained.x));
    
    // Z座標を境界内に制限
    constrained.z = Math.max(roomBoundary.minZ, Math.min(roomBoundary.maxZ, constrained.z));
    
    return constrained;
}

// インタラクションの設定
function setupInteraction() {
    try {
        // オブジェクト配置モードの切り替え
        cubeBtn.addEventListener("click", function() {
            setPlacementMode("cube");
        });
        
        recordBtn.addEventListener("click", function() {
            setPlacementMode("record");
        });
        
        juiceBoxBtn.addEventListener("click", function() {
            setPlacementMode("juiceBox");
        });
        
        mikeDeskBtn.addEventListener("click", function() {
            setPlacementMode("mikeDesk");
        });
        
        // 1人称モードボタンのイベントリスナー
        const firstPersonBtn = document.getElementById("firstPersonBtn");
        firstPersonBtn.addEventListener("click", function() {
            toggleFirstPersonMode();
        });
        
        // ポインターイベントの処理
        let startingPoint = null;
        let currentMesh = null;
        const positionIndicator = document.querySelector(".position-indicator");
        
        // 垂直ヘルパーの初期化を確保
        if (!verticalHelper || verticalHelper.isDisposed()) {
            createVerticalHelper();
        }
        
        scene.onPointerDown = function (evt, pickResult) {
            // 1人称モード中は配置・選択操作を無効化
            if (firstPersonMode) {
                return;
            }
            
            console.log("Pointer down:", {
                isPlacing: isPlacing,
                currentMode: currentMode,
                hit: pickResult.hit,
                meshName: pickResult.hit ? pickResult.pickedMesh.name : "no mesh",
                isPickable: pickResult.hit ? pickResult.pickedMesh.isPickable : "N/A"
            });
            
            // デバッグ情報：すべてのメッシュの情報を出力
            console.log("シーン内の全メッシュ情報:");
            scene.meshes.forEach(mesh => {
                if (mesh.name.includes("record_") || mesh.name.includes("juiceBox_")) {
                    console.log(`メッシュ: ${mesh.name}, isPickable: ${mesh.isPickable}, 子メッシュ数: ${mesh.getChildMeshes ? mesh.getChildMeshes().length : 0}`);
                }
            });
            
            // 配置モードの場合の処理
            if (isPlacing) {
                // プレビューメッシュの場合は地面の位置を直接取得
                let placementPosition = null;
                
                // クリック検出用に特別なピック処理を行う
                console.log("配置モード中のクリックを処理します");
                
                // verticalHelperのクリックを無視
                if (pickResult.hit && pickResult.pickedMesh && pickResult.pickedMesh.name === "verticalHelper") {
                    console.log("verticalHelperがクリックされました - 処理をスキップ");
                    return;
                }
                
                // 通常のピック処理では、プレビューメッシュやその他のアセットがレイキャストを遮ることがある
                // そのため、特別なレイキャストを使用して、床と壁のみを検出する
                
                // 床と壁のみをフィルタリングする述語関数
                const floorWallPredicate = (mesh) => {
                    // 床または壁のみを検出（Body* も床として認識）
                    return (mesh.name.toLowerCase() === "floor" || 
                            mesh.name.toLowerCase() === "wall" ||
                            mesh.name.toLowerCase().includes("floor") || 
                            mesh.name.toLowerCase().includes("wall") ||
                            mesh.name.toLowerCase().includes("body") ||
                            mesh === ground ||
                            (mesh.metadata && mesh.metadata.isFloor));
                };
                
                // 床と壁のみに対するレイキャスト
                const floorWallPickResult = scene.pickWithRay(
                    scene.createPickingRay(
                        scene.pointerX, 
                        scene.pointerY, 
                        BABYLON.Matrix.Identity(), 
                        camera
                    ), 
                    floorWallPredicate
                );
                
                // 床または壁にヒットした場合
                if (floorWallPickResult.hit && floorWallPickResult.pickedMesh) {
                    console.log("床または壁を検出しました:", {
                        name: floorWallPickResult.pickedMesh.name,
                        distance: floorWallPickResult.distance,
                        point: floorWallPickResult.pickedPoint ? floorWallPickResult.pickedPoint.toString() : "なし"
                    });
                    
                    if (floorWallPickResult.pickedPoint) {
                        placementPosition = floorWallPickResult.pickedPoint.clone();
                        console.log("床または壁の位置を取得:", placementPosition.toString());
                    }
                } else {
                    console.log("床または壁が検出できませんでした - 通常のピック結果を確認");
                    
                    // 通常のピック結果も確認
                    if (pickResult.hit && pickResult.pickedMesh) {
                        console.log("クリックされたメッシュ詳細:", {
                            name: pickResult.pickedMesh.name,
                            isPickable: pickResult.pickedMesh.isPickable,
                            parent: pickResult.pickedMesh.parent ? pickResult.pickedMesh.parent.name : "なし"
                        });
                        
                        // 床または壁の場合（Body* も床として認識）
                        if (pickResult.pickedMesh.name.toLowerCase() === "floor" || 
                            pickResult.pickedMesh.name.toLowerCase() === "wall" ||
                            pickResult.pickedMesh.name.toLowerCase().includes("floor") || 
                            pickResult.pickedMesh.name.toLowerCase().includes("wall") ||
                            pickResult.pickedMesh.name.toLowerCase().includes("body") ||
                            pickResult.pickedMesh === ground) {
                            if (pickResult.pickedPoint) {
                                placementPosition = pickResult.pickedPoint.clone();
                                console.log("通常のピックから床または壁を検出:", pickResult.pickedMesh.name);
                            }
                        }
                    }
                }
                
                // 床との交点を計算 - 直接クリックで検出できなかった場合のフォールバック
                if (!placementPosition) {
                    try {
                        // 床のY座標を取得
                        const floorY = ground ? ground.position.y : 0;
                        
                        // レイを作成
                        const ray = scene.createPickingRay(
                            scene.pointerX, 
                            scene.pointerY, 
                            BABYLON.Matrix.Identity(), 
                            camera
                        );
                        
                        // レイと床平面（Y=floorY）の交点を計算
                        const worldOrigin = ray.origin;
                        const worldDirection = ray.direction;
                        
                        if (Math.abs(worldDirection.y) > 0.001) { // ゼロ除算を防ぐ
                            const t = (floorY - worldOrigin.y) / worldDirection.y;
                            if (t >= 0) { // 視点より前方
                                placementPosition = worldOrigin.add(worldDirection.scale(t));
                                console.log("計算で床位置を取得しました:", placementPosition.toString());
                            }
                        }
                    } catch (e) {
                        console.error("床位置の計算に失敗しました:", e);
                    }
                }
                
                if (placementPosition) {
                    console.log("配置処理を実行中...");
                    const position = snapToGrid ? snapPositionToGrid(placementPosition) : placementPosition;
                    
                    // 床や壁の表面に自動的にスナップ
                    let isWallPlacement = false;
                    let isValidPlacement = false;
                    
                    if (pickResult.hit && pickResult.pickedMesh) {
                        // verticalHelperがクリックされた場合はスキップ
                        if (pickResult.pickedMesh.name === "verticalHelper") {
                            console.log("verticalHelperがクリックされました - 配置できません");
                            isValidPlacement = false;
                            return;
                        }
                        
                        // 表面の法線ベクトルを取得（nullチェックを追加）
                        let normal = null;
                        try {
                            normal = pickResult.getNormal(true);
                            if (normal) {
                                console.log("配置面の法線:", normal.toString());
                            } else {
                                console.log("法線が取得できませんでした");
                                normal = new BABYLON.Vector3(0, 1, 0); // デフォルト値として上方向を設定
                            }
                        } catch (e) {
                            console.error("法線の取得に失敗しました:", e);
                            normal = new BABYLON.Vector3(0, 1, 0); // エラー時のデフォルト値
                        }
                        
                        // 床か壁かを判断（Y成分がほぼ1なら床、それ以外は壁と判断）
                        const isFloor = Math.abs(normal.y) > 0.7;
                        isWallPlacement = !isFloor;
                        
                        // 床または壁のみに配置を許可（Body* も床として認識）
                        if (pickResult.pickedMesh.name.toLowerCase() === "floor" || 
                            pickResult.pickedMesh.name.toLowerCase().includes("floor") ||
                            pickResult.pickedMesh.name.toLowerCase().includes("body") ||
                            pickResult.pickedMesh === ground ||
                            (pickResult.pickedMesh.metadata && pickResult.pickedMesh.metadata.isFloor)) {
                            // 床の場合
                            position.y = pickResult.pickedPoint.y + 0.1; // 1/10スケールに合わせたオブジェクトのサイズの半分を考慮
                            console.log("床に配置します。高さ:", position.y);
                            isValidPlacement = true;
                        } else if (pickResult.pickedMesh.name.toLowerCase() === "wall" || 
                                   pickResult.pickedMesh.name.toLowerCase().includes("wall")) {
                            // 壁の場合
                            const offset = 0.1; // 1/10スケールに合わせたオブジェクトのサイズの半分
                            position.x += normal.x * offset;
                            position.y = pickResult.pickedPoint.y; // 壁の高さを維持
                            position.z += normal.z * offset;
                            
                            // オブジェクトを壁に向かって回転
                            if (currentMode === "cube") {
                                window.lastWallNormal = normal;
                            }
                            
                            console.log("壁に配置します。位置:", position);
                            isValidPlacement = true;
                        } else {
                            // 床と壁以外には配置不可
                            console.log("床または壁以外には配置できません:", pickResult.pickedMesh.name);
                            isValidPlacement = false;
                        }
                    } else {
                        // 床や壁以外がヒットした場合は配置不可
                        console.log("床または壁以外がヒットしました。配置できません。");
                        isValidPlacement = false;
                    }
                    
                    // 有効な配置位置の場合のみオブジェクトを配置
                    if (isValidPlacement) {
                        placeObject(currentMode, position);
                        isPlacing = false;
                        currentMode = null;
                        resetButtons();
                        cleanupPreviewMesh(); // プレビューメッシュを削除
                        
                        // 垂直ヘルパーを非表示
                        if (verticalHelper) {
                            verticalHelper.isVisible = false;
                        }
                    } else {
                        // 配置が無効な場合のエラーメッセージ
                        console.log("配置できない位置:", position);
                        
                        // クリックされたメッシュの情報を表示
                        if (pickResult && pickResult.pickedMesh) {
                            console.log("クリックされたメッシュ:", {
                                name: pickResult.pickedMesh.name,
                                isPickable: pickResult.pickedMesh.isPickable,
                                parent: pickResult.pickedMesh.parent ? pickResult.pickedMesh.parent.name : "なし"
                            });
                        }
                        
                        // エラーメッセージを表示（デバッグ情報付き）
                        console.log("配置失敗の詳細:", {
                            pickedMesh: pickResult && pickResult.pickedMesh ? pickResult.pickedMesh.name : "なし",
                            isFloor: pickResult && pickResult.pickedMesh ? pickResult.pickedMesh.name.toLowerCase().includes("floor") || pickResult.pickedMesh.name.toLowerCase().includes("body") : false,
                            isWall: pickResult && pickResult.pickedMesh ? pickResult.pickedMesh.name.toLowerCase().includes("wall") : false,
                            isGround: pickResult && pickResult.pickedMesh ? pickResult.pickedMesh === ground : false,
                            hasFloorMetadata: pickResult && pickResult.pickedMesh && pickResult.pickedMesh.metadata ? pickResult.pickedMesh.metadata.isFloor : false
                        });
                        showError(new Error("オブジェクトを配置できませんでした。再度クリックしてください。"));
                    }
                } else {
                    console.log("配置位置が特定できませんでした");
                }
            } else if (pickResult.hit) {
                // オブジェクト名のデバッグ
                console.log("クリックしたオブジェクト:", {
                    name: pickResult.pickedMesh.name,
                    isPickable: pickResult.pickedMesh.isPickable,
                    parent: pickResult.pickedMesh.parent ? pickResult.pickedMesh.parent.name : "無し",
                    isAsset: pickResult.pickedMesh.name.startsWith("cube_") || 
                            pickResult.pickedMesh.name.startsWith("record_") ||
                            pickResult.pickedMesh.name.startsWith("juiceBox_") ||
                            pickResult.pickedMesh.name.startsWith("mikeDesk_")
                });
                
                // オブジェクトのピッキング処理を改善
                let targetMesh = null;
                
                // メタデータから親アセットを取得（最優先）
                if (pickResult.pickedMesh.metadata && pickResult.pickedMesh.metadata.parentAsset) {
                    targetMesh = pickResult.pickedMesh.metadata.parentAsset;
                    console.log("メタデータから親メッシュを選択しました:", targetMesh.name);
                }
                // 直接メッシュ名でチェック
                else if (pickResult.pickedMesh.name.startsWith("cube_") || 
                    pickResult.pickedMesh.name.startsWith("record_") ||
                    pickResult.pickedMesh.name.startsWith("juiceBox_") ||
                    pickResult.pickedMesh.name.startsWith("mikeDesk_")) {
                    targetMesh = pickResult.pickedMesh;
                    console.log("直接親メッシュを選択しました:", targetMesh.name);
                } 
                // 子メッシュから親メッシュを特定
                else if (pickResult.pickedMesh.parent && 
                        (pickResult.pickedMesh.parent.name.startsWith("record_") || 
                         pickResult.pickedMesh.parent.name.startsWith("juiceBox_"))) {
                    targetMesh = pickResult.pickedMesh.parent;
                    console.log("子メッシュ経由で親メッシュを選択しました:", targetMesh.name);
                }
                // シーン内の全メッシュから検索（バックアップ手段）
                else {
                    // クリック位置からレイを飛ばして交差するメッシュをすべて取得
                    const ray = scene.createPickingRay(
                        scene.pointerX, 
                        scene.pointerY, 
                        BABYLON.Matrix.Identity(), 
                        camera
                    );
                    
                    const hits = scene.multiPickWithRay(ray);
                    console.log("レイキャストによる検出結果:", hits.length + "個のヒット");
                    
                    // ヒットしたメッシュの中から移動可能なアセットを探す
                    for (let hit of hits) {
                        const hitMesh = hit.pickedMesh;
                        
                        // 直接アセットメッシュの場合
                        if (hitMesh.name.startsWith("record_") || 
                            hitMesh.name.startsWith("juiceBox_") ||
                            hitMesh.name.startsWith("cube_") ||
                            hitMesh.name.startsWith("mikeDesk_")) {
                            targetMesh = hitMesh;
                            console.log("マルチピックで親メッシュを検出:", targetMesh.name);
                            break;
                        }
                        
                        // 親メッシュを確認
                        if (hitMesh.parent && 
                           (hitMesh.parent.name.startsWith("record_") || 
                            hitMesh.parent.name.startsWith("juiceBox_"))) {
                            targetMesh = hitMesh.parent;
                            console.log("マルチピックで子メッシュから親メッシュを検出:", targetMesh.name);
                            break;
                        }
                    }
                }
                
                // 対象メッシュが見つかった場合は選択して移動開始
                if (targetMesh) {
                    currentMesh = targetMesh;
                    selectObject(currentMesh);
                    
                    // 開始位置を記録（元に戻すために使用）
                    originalPosition = currentMesh.position.clone();
                    
                    // 床の位置を簡略化された方法で取得
                    try {
                        // 床のY座標を取得
                        const floorY = ground ? ground.position.y : 0;
                        
                        // レイを作成
                        const ray = scene.createPickingRay(
                            scene.pointerX, 
                            scene.pointerY, 
                            BABYLON.Matrix.Identity(), 
                            camera
                        );
                        
                        // レイと床平面（Y=floorY）の交点を計算
                        const worldOrigin = ray.origin;
                        const worldDirection = ray.direction;
                        
                        if (Math.abs(worldDirection.y) > 0.001) { // ゼロ除算を防ぐ
                            const t = (floorY - worldOrigin.y) / worldDirection.y;
                            if (t >= 0) { // 視点より前方
                                startingPoint = worldOrigin.add(worldDirection.scale(t));
                                console.log("ドラッグ開始位置:", startingPoint);
                            }
                        }
                    } catch (e) {
                        console.error("ドラッグ開始位置の計算に失敗しました:", e);
                        startingPoint = null;
                    }
                    
                    console.log("オブジェクトを選択しました:", currentMesh.name);
                } else {
                    // 選択解除
                    deselectObject();
                    currentMesh = null;
                    startingPoint = null;
                }
            } else {
                // 選択解除
                deselectObject();
                currentMesh = null;
                startingPoint = null;
            }
        };
        
        scene.onPointerUp = function () {
            // 1人称モード中は操作を無効化
            if (firstPersonMode) {
                return;
            }
            
            console.log("Pointer up:", currentMesh ? currentMesh.name : "no mesh");
            
            if (currentMesh) {
                // 移動対象のメッシュを決定（複合アセットの場合は親メッシュを使用）
                let targetMesh = currentMesh;
                
                // メタデータから親アセットを取得
                if (currentMesh.metadata && currentMesh.metadata.parentAsset) {
                    targetMesh = currentMesh.metadata.parentAsset;
                } else if (currentMesh.parent && 
                    (currentMesh.parent.name.startsWith("record_") || 
                     currentMesh.parent.name.startsWith("juiceBox_"))) {
                    targetMesh = currentMesh.parent;
                }
                
                // 部屋の境界チェックのみ実行（レイキャスティングは省略）
                const isValid = isPositionInsideRoom(targetMesh.position);
                console.log("部屋の境界チェック結果:", isValid);
                
                if (!isValid) {
                    // 部屋の外にある場合は元の位置に戻す
                    if (originalPosition) {
                        targetMesh.position.x = originalPosition.x;
                        targetMesh.position.z = originalPosition.z;
                        console.log("元の位置に戻しました:", originalPosition);
                    }
                    // エラーメッセージを表示
                    showError(new Error("オブジェクトを配置できません。部屋の中に配置してください。"));
                    console.log("部屋の外への移動を阻止しました");
                } else {
                    // 部屋の内側の場合はグリッドスナップを適用
                    if (snapToGrid) {
                        targetMesh.position.x = Math.round(targetMesh.position.x / gridSize) * gridSize;
                        targetMesh.position.z = Math.round(targetMesh.position.z / gridSize) * gridSize;
                        
                        console.log("スナップ後の位置:", {
                            name: targetMesh.name,
                            x: targetMesh.position.x,
                            y: targetMesh.position.y,
                            z: targetMesh.position.z
                        });
                    }
                }
                
                // 位置インジケータを非表示
                if (positionIndicator) {
                    positionIndicator.style.display = "none";
                }
            } else {
                // オブジェクトのドラッグではない場合（通常のクリック終了時）は、カメラコントロールを有効に戻す
                // ただし、何かオブジェクトが選択されている場合は、カメラコントロールは無効のまま
                if (!selectedMesh && camera && canvas) {
                    camera.attachControl(canvas, true);
                    console.log("通常クリック終了: カメラ操作を有効化しました");
                }
            }
            
            startingPoint = null;
            currentMesh = null;
            originalPosition = null;
        };
        
        // プレビュー機能とポインター移動時の処理
        
        scene.onPointerMove = function (evt) {
            // 1人称モード中は操作を無効化
            if (firstPersonMode) {
                return;
            }
            
            // ドラッグ中の処理
            if (startingPoint && currentMesh) {
                console.log("ドラッグ中:", currentMesh.name);
                
                // 移動対象のメッシュを決定（複合アセットの場合は親メッシュを使用）
                let targetMesh = currentMesh;
                
                // 選択されたメッシュが子メッシュだった場合、親メッシュを使用
                if (currentMesh.metadata && currentMesh.metadata.parentAsset) {
                    // メタデータから親アセットを取得
                    targetMesh = currentMesh.metadata.parentAsset;
                    console.log("メタデータから親メッシュを使用:", targetMesh.name);
                } else if (currentMesh.parent && 
                    (currentMesh.parent.name.startsWith("record_") || 
                     currentMesh.parent.name.startsWith("juiceBox_"))) {
                    // 後方互換性のため親子関係も確認
                    targetMesh = currentMesh.parent;
                    console.log("親子関係から親メッシュを使用:", targetMesh.name);
                }
                
                // 簡略化された方法で床との交点を計算
                let current = null;
                
                try {
                    // 床のY座標を取得
                    const floorY = ground ? ground.position.y : 0;
                    
                    // レイを作成
                    const ray = scene.createPickingRay(
                        scene.pointerX, 
                        scene.pointerY, 
                        BABYLON.Matrix.Identity(), 
                        camera
                    );
                    
                    // レイと床平面（Y=floorY）の交点を計算
                    const worldOrigin = ray.origin;
                    const worldDirection = ray.direction;
                    
                    if (Math.abs(worldDirection.y) > 0.001) { // ゼロ除算を防ぐ
                        const t = (floorY - worldOrigin.y) / worldDirection.y;
                        if (t >= 0) { // 視点より前方
                            current = worldOrigin.add(worldDirection.scale(t));
                        }
                    }
                } catch (e) {
                    console.error("ドラッグ中の床位置計算に失敗しました:", e);
                }
                
                if (!current) {
                    console.log("ドラッグ中の地面位置が取得できません");
                    return;
                }
                
                const diff = current.subtract(startingPoint);
                
                // 移動量をログに出力（デバッグ用）
                console.log("移動差分:", {x: diff.x, z: diff.z});
                
                // 新しい位置を計算
                const newPosition = new BABYLON.Vector3(
                    targetMesh.position.x + diff.x,
                    targetMesh.position.y,
                    targetMesh.position.z + diff.z
                );
                
                // 元の操作感を維持（制限は行わない）
                targetMesh.position.x = newPosition.x;
                targetMesh.position.z = newPosition.z;
                
                // 位置インジケータを更新
                if (positionIndicator) {
                    positionIndicator.style.display = "block";
                    const snapPos = snapToGrid ? 
                        `スナップ位置: (${Math.round(targetMesh.position.x / gridSize) * gridSize}, ${targetMesh.position.y}, ${Math.round(targetMesh.position.z / gridSize) * gridSize})` :
                        "";
                    positionIndicator.textContent = `位置: (${targetMesh.position.x.toFixed(2)}, ${targetMesh.position.y.toFixed(2)}, ${targetMesh.position.z.toFixed(2)})
${snapPos}`;
                }
                
                startingPoint = current;
                return;
            } else if (positionIndicator) {
                positionIndicator.style.display = "none";
            }
            
            // 配置モード中のプレビュー
            if (isPlacing) {
                // 床や壁との交点を検出
                const pickInfo = scene.pick(
                    scene.pointerX,
                    scene.pointerY,
                    null,  // すべてのメッシュを対象にする
                    false,
                    camera
                );
                
                let previewPosition = null;
                let isWallHit = false;
                let surfaceNormal = null;
                let isValidPlacement = false;
                
                // ピックした場所の表面法線を取得
                if (pickInfo.hit && pickInfo.pickedMesh) {
                    // verticalHelperがクリックされた場合はスキップ
                    if (pickInfo.pickedMesh.name === "verticalHelper") {
                        console.log("verticalHelperがヒットしました - 配置プレビューを表示しません");
                        isValidPlacement = false;
                        return;
                    }
                    
                    if (pickInfo.pickedPoint) {
                        previewPosition = pickInfo.pickedPoint.clone();
                    } else {
                        console.log("ピック位置がnullです");
                        isValidPlacement = false;
                        return;
                    }
                    
                    try {
                        surfaceNormal = pickInfo.getNormal(true);
                        if (!surfaceNormal) {
                            console.log("法線が取得できませんでした");
                            surfaceNormal = new BABYLON.Vector3(0, 1, 0); // デフォルト値として上方向を設定
                        }
                    } catch (e) {
                        console.error("法線の取得に失敗しました:", e);
                        surfaceNormal = new BABYLON.Vector3(0, 1, 0); // エラー時のデフォルト値
                    }
                    
                    // 床か壁かを判断（Y成分がほぼ1なら床、それ以外は壁と判断）
                    isWallHit = Math.abs(surfaceNormal.y) < 0.7;
                    
                    // 床または壁のみに配置を許可
                    // Body* メッシュ名も床として扱う（3Dモデルのパーツ）
                    if (pickInfo.pickedMesh.name.toLowerCase() === "floor" || 
                        pickInfo.pickedMesh.name.toLowerCase().includes("floor") ||
                        pickInfo.pickedMesh.name.toLowerCase().includes("body")) {
                        // 床の場合は有効
                        isValidPlacement = true;
                        console.log("床メッシュとして認識:", pickInfo.pickedMesh.name);
                    } else if (pickInfo.pickedMesh.name.toLowerCase() === "wall" || 
                               pickInfo.pickedMesh.name.toLowerCase().includes("wall")) {
                        // 壁の場合は有効
                        isValidPlacement = true;
                        console.log("壁メッシュとして認識:", pickInfo.pickedMesh.name);
                    } else if (pickInfo.pickedMesh === ground) {
                        // 明示的に床として設定されたメッシュの場合も有効
                        isValidPlacement = true;
                        console.log("グローバル床メッシュとして認識:", pickInfo.pickedMesh.name);
                    } else if (pickInfo.pickedMesh.metadata && pickInfo.pickedMesh.metadata.isFloor) {
                        // メタデータで床として設定されているメッシュの場合も有効
                        isValidPlacement = true;
                        console.log("メタデータ床メッシュとして認識:", pickInfo.pickedMesh.name);
                    } else {
                        // 床と壁以外は無効
                        isValidPlacement = false;
                        console.log("床または壁以外のメッシュです:", pickInfo.pickedMesh.name);
                    }
                    
                    console.log("ピック検出:", {
                        mesh: pickInfo.pickedMesh.name,
                        position: previewPosition,
                        normal: surfaceNormal,
                        isWall: isWallHit,
                        isValid: isValidPlacement
                    });
                    
                    // 有効でない配置の場合は検出をリセット
                    if (!isValidPlacement) {
                        previewPosition = null;
                        surfaceNormal = null;
                        isWallHit = false;
                    }
                }
                
                // 床または壁にヒットしなかった場合、またはverticalHelperがヒットした場合は、プレビューを表示しない
                if (!previewPosition || (pickInfo.hit && pickInfo.pickedMesh && pickInfo.pickedMesh.name === "verticalHelper")) {
                    console.log("床または壁にヒットしませんでした、またはverticalHelperがヒットしました");
                    return;
                }
                
                if (previewPosition) {
                    // 位置をグリッドにスナップ
                    const snappedPos = snapToGrid ? snapPositionToGrid(previewPosition) : previewPosition;
                    
                    // オブジェクトの配置位置を調整（床/壁に応じて）
                    if (isWallHit) {
                        // 壁の場合、法線方向に少しオフセットする
                        const offset = 0.1; // 1/10スケールに合わせたオブジェクトのサイズの半分
                        snappedPos.x += surfaceNormal.x * offset;
                        snappedPos.z += surfaceNormal.z * offset;
                    } else {
                        // 床の場合、オブジェクトの底面が床の表面に接するように
                        snappedPos.y = previewPosition.y + 0.1; // 1/10スケールに合わせたオブジェクトのサイズの半分を考慮
                    }
                    
                    // 部屋の内側かどうかチェック（壁配置かどうかも考慮）
                    const isInside = isPositionInsideRoom(snappedPos, isWallHit);
                    
                    // 既存のプレビューメッシュがあるかチェック、異なるタイプの場合は削除
                    if (previewMesh) {
                        const expectedName = "preview" + currentMode;
                        if (previewMesh.name !== expectedName) {
                            console.log("異なるタイプのプレビューメッシュを削除:", previewMesh.name);
                            previewMesh.dispose();
                            previewMesh = null;
                        }
                    }
                    
                    if (!previewMesh) {
                        // プレビューメッシュの作成
                        if (currentMode === "cube") {
                            // バーガーモデルのプレビューを表示
                            if (preloadedModels.burger) {
                                // 事前ロードしたバーガーモデルをクローンして使用
                                previewMesh = preloadedModels.burger.clone("preview" + currentMode);
                                previewMesh.setEnabled(true);
                                
                                // プレビューのため半透明に設定
                                previewMesh.getChildMeshes().forEach(childMesh => {
                                    if (childMesh.material) {
                                        // オリジナルの色を保持して半透明に設定
                                        childMesh.material.alpha = 0.5;
                                    }
                                });
                            } else {
                                // バーガーモデルがロードされていない場合は単純なボックスを表示
                                previewMesh = BABYLON.MeshBuilder.CreateBox("preview" + currentMode, { size: 0.2 }, scene);
                                const material = new BABYLON.StandardMaterial("preview" + currentMode + "Material", scene);
                                material.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9);
                                material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                                material.specularPower = 1;
                                material.alpha = 0.5;
                                previewMesh.material = material;
                            }
                        } else if (currentMode === "record") {
                            // レコードマシンはGLBモデルのプレビューを表示
                            if (preloadedModels.record) {
                                // 事前ロードしたモデルをクローンして使用
                                previewMesh = preloadedModels.record.clone("preview" + currentMode);
                                previewMesh.setEnabled(true);
                                
                                // プレビューのため半透明に設定
                                previewMesh.getChildMeshes().forEach(childMesh => {
                                    if (childMesh.material) {
                                        // オリジナルの色を保持して半透明に設定
                                        childMesh.material.alpha = 0.5;
                                    }
                                });
                            } else {
                                // 事前ロードされたモデルがない場合はボックスを表示
                                previewMesh = BABYLON.MeshBuilder.CreateBox("preview" + currentMode, { size: 0.2 }, scene);
                                const material = new BABYLON.StandardMaterial("preview" + currentMode + "Material", scene);
                                material.diffuseColor = new BABYLON.Color3(0.7, 0.3, 0.8); // 紫色
                                material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                                material.specularPower = 1;
                                material.alpha = 0.5;
                                previewMesh.material = material;
                            }
                        } else if (currentMode === "juiceBox") {
                            // ジュースボックスはGLBモデルのプレビューを表示
                            if (preloadedModels.juiceBox) {
                                // 事前ロードしたモデルをクローンして使用
                                previewMesh = preloadedModels.juiceBox.clone("preview" + currentMode);
                                previewMesh.setEnabled(true);
                                
                                // プレビューのため半透明に設定
                                previewMesh.getChildMeshes().forEach(childMesh => {
                                    if (childMesh.material) {
                                        // オリジナルの色を保持して半透明に設定
                                        childMesh.material.alpha = 0.5;
                                    }
                                });
                            } else {
                                // 事前ロードされたモデルがない場合はボックスを表示
                                previewMesh = BABYLON.MeshBuilder.CreateBox("preview" + currentMode, { size: 0.2 }, scene);
                                const material = new BABYLON.StandardMaterial("preview" + currentMode + "Material", scene);
                                material.diffuseColor = new BABYLON.Color3(0.9, 0.7, 0.3); // オレンジ色
                                material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                                material.specularPower = 1;
                                material.alpha = 0.5;
                                previewMesh.material = material;
                            }
                        } else if (currentMode === "mikeDesk") {
                            // マイクデスクは三角錐を表示（サイズを3倍に）
                            previewMesh = BABYLON.MeshBuilder.CreateCylinder("preview" + currentMode, { 
                                diameterTop: 0, 
                                diameterBottom: 0.6, // 3倍に拡大
                                height: 0.9, // 3倍に拡大
                                tessellation: 4 // 四面体（三角錐）になるよう設定
                            }, scene);
                            const material = new BABYLON.StandardMaterial("preview" + currentMode + "Material", scene);
                            material.diffuseColor = new BABYLON.Color3(0.3, 0.8, 0.6); // 緑色
                            material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                            material.specularPower = 1;
                            material.alpha = 0.5;
                            previewMesh.material = material;
                        }
                        
                        // プレビューメッシュはピック不可に設定 - レイキャストを妨げないように
                        if (previewMesh) {
                            // 確実にピック不可に設定
                            previewMesh.isPickable = false;
                            
                            // プレビューメッシュと子メッシュはすべてピック不可に
                            if (previewMesh.getChildMeshes && typeof previewMesh.getChildMeshes === 'function') {
                                previewMesh.getChildMeshes().forEach(child => {
                                    child.isPickable = false;
                                });
                            }
                            
                            // レイキャストの判定も無効化（重要）
                            previewMesh.checkCollisions = false;
                            
                            // 影を生成するように設定
                            if (shadowGenerator) {
                                shadowGenerator.addShadowCaster(previewMesh);
                                previewMesh.receiveShadows = true;
                            }
                        }
                    } else {
                        // 既存のプレビューメッシュの形状を変更する場合
                        if ((currentMode === "cube" && previewMesh.name !== "previewcube") ||
                            (currentMode === "record" && previewMesh.name !== "previewrecord") ||
                            (currentMode === "juiceBox" && previewMesh.name !== "previewjuiceBox") ||
                            (currentMode === "mikeDesk" && previewMesh.name !== "previewmikeDesk")) {
                            // 古いプレビューメッシュを削除して新しく作成
                            previewMesh.dispose();
                            previewMesh = null;
                            
                            if (currentMode === "cube") {
                                // バーガーモデルのプレビューを表示
                                if (preloadedModels.burger) {
                                    // 事前ロードしたバーガーモデルをクローンして使用
                                    previewMesh = preloadedModels.burger.clone("preview" + currentMode);
                                    previewMesh.setEnabled(true);
                                    
                                    // プレビューのため半透明に設定
                                    previewMesh.getChildMeshes().forEach(childMesh => {
                                        if (childMesh.material) {
                                            // オリジナルの色を保持して半透明に設定
                                            childMesh.material.alpha = 0.5;
                                        }
                                    });
                                } else {
                                    // バーガーモデルがロードされていない場合は単純なボックスを表示
                                    previewMesh = BABYLON.MeshBuilder.CreateBox("preview" + currentMode, { size: 0.2 }, scene);
                                    const material = new BABYLON.StandardMaterial("preview" + currentMode + "Material", scene);
                                    material.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9);
                                    material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                                    material.specularPower = 1;
                                    material.alpha = 0.5;
                                    previewMesh.material = material;
                                }
                            } else if (currentMode === "record") {
                                // レコードマシンはGLBモデルのプレビューを表示
                                if (preloadedModels.record) {
                                    // 事前ロードしたモデルをクローンして使用
                                    previewMesh = preloadedModels.record.clone("preview" + currentMode);
                                    previewMesh.setEnabled(true);
                                    
                                    // プレビューのため半透明に設定
                                    previewMesh.getChildMeshes().forEach(childMesh => {
                                        if (childMesh.material) {
                                            // オリジナルの色を保持して半透明に設定
                                            childMesh.material.alpha = 0.5;
                                        }
                                    });
                                } else {
                                    // 事前ロードされたモデルがない場合はボックスを表示
                                    previewMesh = BABYLON.MeshBuilder.CreateBox("preview" + currentMode, { size: 0.2 }, scene);
                                    const material = new BABYLON.StandardMaterial("preview" + currentMode + "Material", scene);
                                    material.diffuseColor = new BABYLON.Color3(0.7, 0.3, 0.8); // 紫色
                                    material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                                    material.specularPower = 1;
                                    material.alpha = 0.5;
                                    previewMesh.material = material;
                                }
                            } else if (currentMode === "juiceBox") {
                                // ジュースボックスはGLBモデルのプレビューを表示
                                if (preloadedModels.juiceBox) {
                                    // 事前ロードしたモデルをクローンして使用
                                    previewMesh = preloadedModels.juiceBox.clone("preview" + currentMode);
                                    previewMesh.setEnabled(true);
                                    
                                    // プレビューのため半透明に設定
                                    previewMesh.getChildMeshes().forEach(childMesh => {
                                        if (childMesh.material) {
                                            // オリジナルの色を保持して半透明に設定
                                            childMesh.material.alpha = 0.5;
                                        }
                                    });
                                } else {
                                    // 事前ロードされたモデルがない場合はボックスを表示
                                    previewMesh = BABYLON.MeshBuilder.CreateBox("preview" + currentMode, { size: 0.2 }, scene);
                                    const material = new BABYLON.StandardMaterial("preview" + currentMode + "Material", scene);
                                    material.diffuseColor = new BABYLON.Color3(0.9, 0.7, 0.3); // オレンジ色
                                    material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                                    material.specularPower = 1;
                                    material.alpha = 0.5;
                                    previewMesh.material = material;
                                }
                            } else if (currentMode === "mikeDesk") {
                                // マイクデスクは三角錐を表示（サイズを3倍に）
                                previewMesh = BABYLON.MeshBuilder.CreateCylinder("preview" + currentMode, { 
                                    diameterTop: 0, 
                                    diameterBottom: 0.6, // 3倍に拡大
                                    height: 0.9, // 3倍に拡大
                                    tessellation: 4 // 四面体（三角錐）になるよう設定
                                }, scene);
                                const material = new BABYLON.StandardMaterial("preview" + currentMode + "Material", scene);
                                material.diffuseColor = new BABYLON.Color3(0.3, 0.8, 0.6); // 緑色
                                material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                                material.specularPower = 1;
                                material.alpha = 0.5;
                                previewMesh.material = material;
                            }
                            
                            if (previewMesh) {
                                // 確実にピック不可に設定
                                previewMesh.isPickable = false;
                                
                                // プレビューメッシュと子メッシュはすべてピック不可に
                                if (previewMesh.getChildMeshes && typeof previewMesh.getChildMeshes === 'function') {
                                    previewMesh.getChildMeshes().forEach(child => {
                                        child.isPickable = false;
                                    });
                                }
                                
                                // レイキャストの判定も無効化（重要）
                                previewMesh.checkCollisions = false;
                                
                                if (shadowGenerator) {
                                    shadowGenerator.addShadowCaster(previewMesh);
                                    previewMesh.receiveShadows = true;
                                }
                            }
                        }
                    }
                    
                    // プレビューメッシュの位置を更新
                    if (previewMesh) {
                        // 常に配置可能な色を表示
                        if (previewMesh.material) {
                            if (currentMode === "cube") {
                                if (preloadedModels.burger && previewMesh.getChildMeshes) {
                                    // バーガーモデルのプレビューの場合、子メッシュに半透明処理
                                    previewMesh.getChildMeshes().forEach(childMesh => {
                                        if (childMesh.material) {
                                            childMesh.material.alpha = 0.5;
                                        }
                                    });
                                } else {
                                    // 通常のプレビューメッシュの場合
                                    previewMesh.material.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9); // 青色
                                }
                            } else if (currentMode === "record") {
                                if (preloadedModels.record && previewMesh.getChildMeshes) {
                                    // GLBモデルのプレビューの場合、子メッシュに半透明処理
                                    previewMesh.getChildMeshes().forEach(childMesh => {
                                        if (childMesh.material) {
                                            childMesh.material.alpha = 0.5;
                                        }
                                    });
                                } else {
                                    // 通常のプレビューメッシュの場合
                                    previewMesh.material.diffuseColor = new BABYLON.Color3(0.7, 0.3, 0.8); // 紫色
                                }
                            } else if (currentMode === "juiceBox") {
                                    if (preloadedModels.juiceBox && previewMesh.getChildMeshes) {
                                    // GLBモデルのプレビューの場合、子メッシュに半透明処理
                                    previewMesh.getChildMeshes().forEach(childMesh => {
                                        if (childMesh.material) {
                                            childMesh.material.alpha = 0.5;
                                        }
                                    });
                                } else {
                                    // 通常のプレビューメッシュの場合
                                    previewMesh.material.diffuseColor = new BABYLON.Color3(0.9, 0.7, 0.3); // オレンジ色
                                }
                            } else if (currentMode === "mikeDesk") {
                                previewMesh.material.diffuseColor = new BABYLON.Color3(0.3, 0.8, 0.6); // 緑色
                            }
                            previewMesh.material.alpha = 0.5;
                        }
                        
                        // // 部屋の内側かどうかに応じてマテリアルの色を変更
                        // if (isInside) {
                        //     // 部屋の内側（配置可能）
                        //     if (previewMesh.material) {
                        //         if (currentMode === "cube") {
                        //             previewMesh.material.diffuseColor = new BABYLON.Color3(0.4, 0.6, 0.9); // 青色
                        //         } else {
                        //             previewMesh.material.diffuseColor = new BABYLON.Color3(0.9, 0.4, 0.5); // 赤色
                        //         }
                        //         previewMesh.material.alpha = 0.5;
                        //     }
                        // } else {
                        //     // 部屋の外側（配置不可）
                        //     if (previewMesh.material) {
                        //         previewMesh.material.diffuseColor = new BABYLON.Color3(0.9, 0.2, 0.2); // 赤色
                        //         previewMesh.material.alpha = 0.3;
                        //     }
                        // }
                        
                        previewMesh.position = snappedPos;
                        
                        // 壁に配置する場合は、プレビューメッシュを壁に向かって回転
                        if (isWallHit && surfaceNormal) {
                            // 法線に基づいて回転角度を計算
                            const rotationQuaternion = BABYLON.Quaternion.FromUnitVectorsToRef(
                                new BABYLON.Vector3(0, 0, 1), // デフォルト前方
                                surfaceNormal, // 壁の法線方向
                                new BABYLON.Quaternion()
                            );
                            previewMesh.rotationQuaternion = rotationQuaternion;
                        } else {
                            // 床に配置する場合はリセット
                            previewMesh.rotation = BABYLON.Vector3.Zero();
                            previewMesh.rotationQuaternion = null;
                        }
                        
                        // 垂直ヘルパーラインを表示（床配置時のみかつ、すべての配置モードで表示）
                        if (verticalHelper && !verticalHelper.isDisposed()) {
                            if (isWallHit) {
                                verticalHelper.isVisible = false;
                            } else if (snappedPos) { // snappedPosがnullでないことを確認
                                if (!verticalHelper.isVisible) {
                                    verticalHelper.isVisible = true;
                                }
                                verticalHelper.position.x = snappedPos.x;
                                verticalHelper.position.z = snappedPos.z;
                                
                                // 配置モードに応じて色を変更
                                if (currentMode === "cube") {
                                    verticalHelper.color = new BABYLON.Color3(0, 0.7, 1); // 青色
                                } else if (currentMode === "sphere") {
                                    verticalHelper.color = new BABYLON.Color3(0.9, 0.4, 0.5); // 赤色
                                } else if (currentMode === "juiceBox") {
                                    verticalHelper.color = new BABYLON.Color3(0.9, 0.7, 0.3); // オレンジ色
                                } else if (currentMode === "mikeDesk") {
                                    verticalHelper.color = new BABYLON.Color3(0.3, 0.8, 0.6); // 緑色
                                } else {
                                    verticalHelper.color = new BABYLON.Color3(0, 0.7, 1); // デフォルト青色
                                }
                                
                                // // 部屋の内側かどうかに応じて色を変更
                                // verticalHelper.color = isInside ? 
                                //     new BABYLON.Color3(0, 0.7, 1) : // 青色（配置可能）
                                //     new BABYLON.Color3(0.9, 0.2, 0.2); // 赤色（配置不可）
                            }
                        }
                        
                        // 位置インジケータを更新
                        if (positionIndicator) {
                            positionIndicator.style.display = "block";
                            const placeType = isWallHit ? "壁" : "床";
                            // const statusText = isInside ? `配置可能（${placeType}）` : "配置不可（部屋の外側）";
                            const statusText = `配置可能（${placeType}）`;
                            positionIndicator.textContent = `配置位置: (${snappedPos.x.toFixed(1)}, ${snappedPos.y.toFixed(1)}, ${snappedPos.z.toFixed(1)}) - ${statusText}`;
                        }
                    }
                }
            } else {
                // 配置モードでない場合はプレビューメッシュを削除
                if (previewMesh) {
                    console.log("配置モード終了のためプレビューメッシュを削除:", previewMesh.name);
                    previewMesh.dispose();
                    previewMesh = null;
                }
                
                // 垂直ヘルパーを非表示
                if (verticalHelper) {
                    verticalHelper.isVisible = false;
                }
                
                // 位置インジケータも非表示
                if (positionIndicator) {
                    positionIndicator.style.display = "none";
                }
            }
        };
    } catch (e) {
        showError(new Error("インタラクション設定中にエラーが発生しました: " + e.message));
    }
}

// 位置をグリッドにスナップする
function snapPositionToGrid(position) {
    if (gridSize <= 0) return position.clone();
    
    const snappedPosition = position.clone();
    snappedPosition.x = Math.round(position.x / gridSize) * gridSize;
    snappedPosition.z = Math.round(position.z / gridSize) * gridSize;
    return snappedPosition;
}

// 地面上の位置を取得
function getGroundPosition(evt) {
    try {
        // 既存の垂直ヘルパーがあれば一旦初期化
        if (!verticalHelper || verticalHelper.isDisposed()) {
            verticalHelper = BABYLON.MeshBuilder.CreateLines("verticalHelper", {
                points: [
                    new BABYLON.Vector3(0, 0, 0),
                    new BABYLON.Vector3(0, 160, 0)
                ]
            }, scene);
            verticalHelper.color = new BABYLON.Color3(0, 0.7, 1);
            verticalHelper.isVisible = false;
            verticalHelper.isPickable = false; // 確実にクリック不可にする
            verticalHelper.renderingGroupId = 0; // 背景レイヤーに配置
        }
        
        // シーン内のすべてのメッシュをピックして、その中から床を見つける
        // ドラッグ処理は変数参照を避けて簡略化する
        const predicate = (mesh) => {
            return mesh === ground || 
                  (mesh.isPickable && 
                   (mesh.name.toLowerCase().includes("floor") || 
                    mesh.name.toLowerCase().includes("ground")));
        };
        
        const pickinfo = scene.pick(
            scene.pointerX, 
            scene.pointerY,
            predicate,
            false,
            camera
        );
        
        console.log("Pick info:", {
            hit: pickinfo.hit,
            meshName: pickinfo.hit ? pickinfo.pickedMesh.name : "no mesh",
            distance: pickinfo.hit ? pickinfo.distance : "N/A"
        });
        
        // 床メッシュが直接ヒットした場合
        if (pickinfo.hit) {
            console.log("床の位置を取得:", pickinfo.pickedPoint);
            return pickinfo.pickedPoint;
        }
        
        // 床メッシュが見つからない場合は、床と考えられる平面との交点を計算
        const ray = scene.createPickingRay(
            scene.pointerX, 
            scene.pointerY, 
            BABYLON.Matrix.Identity(), 
            camera
        );
        
        // 床のY座標がある場合はその高さ、なければ0を使用
        const floorY = ground ? ground.position.y : 0;
        
        // レイと床平面（Y=floorY）の交点を計算
        const worldOrigin = ray.origin;
        const worldDirection = ray.direction;
        
        // 床の平面との交点を計算
        if (Math.abs(worldDirection.y) > 0.001) { // ゼロ除算を防ぐ
            const t = (floorY - worldOrigin.y) / worldDirection.y;
            if (t >= 0) { // 視点より前方
                const hitPoint = worldOrigin.add(worldDirection.scale(t));
                
                // サイバールームサイズ内かチェック（拡張された範囲）
                if (hitPoint.x >= -10 && hitPoint.x <= 10 && 
                    hitPoint.z >= -10 && hitPoint.z <= 10) {
                    console.log("計算で床の位置を特定:", hitPoint);
                    return hitPoint;
                }
            }
        }
        
        console.log("床が見つかりませんでした");
        return null;
    } catch (e) {
        console.error("地面位置の取得に失敗しました:", e);
    }
    
    return null;
}

// オブジェクト配置モードの設定
function setPlacementMode(mode) {
    resetButtons();
    
    // 既存のプレビューメッシュがあれば削除
    cleanupPreviewMesh();
    
    if (mode === "cube") {
        cubeBtn.classList.add("active");
        currentMode = "cube";
        isPlacing = true;
        console.log("バーガー配置モードに設定しました");
    } else if (mode === "record") {
        recordBtn.classList.add("active");
        currentMode = "record";
        isPlacing = true;
        console.log("レコードマシン配置モードに設定しました");
    } else if (mode === "juiceBox") {
        juiceBoxBtn.classList.add("active");
        currentMode = "juiceBox";
        isPlacing = true;
        console.log("ジュースボックス配置モードに設定しました");
    } else if (mode === "mikeDesk") {
        mikeDeskBtn.classList.add("active");
        currentMode = "mikeDesk";
        isPlacing = true;
        console.log("マイクデスク配置モードに設定しました");
    }
    
    deselectObject();
}

// プレビューメッシュをクリーンアップする関数
function cleanupPreviewMesh() {
    // シーン内のプレビューメッシュを探して削除
    const previewMeshes = scene.meshes.filter(mesh => 
        mesh.name.startsWith("preview") || 
        mesh.name === "previewCube" || 
        mesh.name === "previewSphere" ||
        mesh.name.startsWith("placeholder")
    );
    
    previewMeshes.forEach(mesh => {
        console.log("プレビューメッシュを削除:", mesh.name);
        
        // 子メッシュも含めて削除する（GLBモデルの場合）
        if (mesh.getChildMeshes && typeof mesh.getChildMeshes === 'function') {
            const children = mesh.getChildMeshes();
            if (children.length > 0) {
                console.log("  プレビューメッシュの子メッシュも削除:", children.length + "個");
            }
        }
        
        mesh.dispose();
    });
}

// オブジェクトの配置
function placeObject(type, position) {
    try {
        let mesh;
        
        if (type === "cube") {
            console.log("バーガーを配置します...");
            
            if (preloadedModels.burger) {
                // 事前ロードしたモデルをクローンして使用
                const timestamp = Date.now();
                const burgerInstance = preloadedModels.burger.clone("burger_" + timestamp);
                
                // 表示を有効化
                burgerInstance.setEnabled(true);
                
                // 位置を設定
                burgerInstance.position = position.clone();
                
                // 壁配置の場合は回転を適用
                if (window.lastWallNormal) {
                    const rotationQuaternion = BABYLON.Quaternion.FromUnitVectorsToRef(
                        new BABYLON.Vector3(0, 0, 1),
                        window.lastWallNormal,
                        new BABYLON.Quaternion()
                    );
                    burgerInstance.rotationQuaternion = rotationQuaternion;
                    window.lastWallNormal = null;
                }
                
                // すべての子メッシュに対してプロパティを設定
                burgerInstance.getChildMeshes().forEach(childMesh => {
                    childMesh.isPickable = true; // 子メッシュも選択可能に設定
                    childMesh.receiveShadows = true;
                    childMesh.renderingGroupId = 0; // デフォルトレイヤーに統一
                    childMesh.alwaysSelectAsActiveMesh = true; // クリッピング問題を回避
                    childMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION; // クリッピングを最適化
                    
                    // メタデータを追加して親メッシュを参照できるようにする
                    childMesh.metadata = childMesh.metadata || {};
                    childMesh.metadata.parentAsset = burgerInstance;
                    
                    // 確実に前面に表示されるようにマテリアル設定を調整
                    if (childMesh.material) {
                        childMesh.material.zOffset = 1;  // 前面に表示
                        childMesh.material.needDepthPrePass = true; // 深度プリパスを有効化
                        childMesh.material.backFaceCulling = false; // 両面表示
                        childMesh.material.forceDepthWrite = true;  // 深度書き込みを強制
                    }
                    
                    // 影を生成するオブジェクトとして登録
                    if (shadowGenerator) {
                        shadowGenerator.addShadowCaster(childMesh);
                    }
                });
                
                // パーティクルエフェクト用のメッシュを返す
                mesh = burgerInstance;
                
                // 親メッシュが選択可能であることを確認
                burgerInstance.isPickable = true;
                
                // 当たり判定を明確にするために透明ボックスを追加
                const boundingBox = BABYLON.MeshBuilder.CreateBox("boundingBox_" + timestamp, {
                    width: 0.5,
                    height: 0.5,
                    depth: 0.5
                }, scene);
                boundingBox.position = burgerInstance.position.clone();
                boundingBox.parent = burgerInstance;
                boundingBox.visibility = 0.0; // 完全に透明に
                boundingBox.isPickable = true;
                
                // メタデータを追加して親子関係を明確にする
                boundingBox.metadata = boundingBox.metadata || {};
                boundingBox.metadata.parentAsset = burgerInstance;
                
                console.log("事前ロードしたバーガーモデルを配置しました（選択可能：" + burgerInstance.isPickable + "）");
            } else {
                // 事前ロードしたモデルがない場合は一時的なボックスを表示
                console.log("事前ロードしたモデルがないため、一時的なボックスを表示します");
                mesh = BABYLON.MeshBuilder.CreateBox("burger_temp_" + Date.now(), {size: 0.01}, scene);
                mesh.position = position.clone();
                mesh.isVisible = false; // 見えないように設定
                
                // 非同期でGLBモデルをロード
                loadAssetAtPosition("https://raw.githubusercontent.com/yugovic/test/main/Burger.glb", "burger_" + Date.now(), position);
            }
        } else if (type === "record") {
            console.log("レコードマシンを配置します...");
            
            if (preloadedModels.record) {
                // 事前ロードしたモデルをクローンして使用
                const timestamp = Date.now();
                const recordInstance = preloadedModels.record.clone("record_" + timestamp);
                
                // 表示を有効化
                recordInstance.setEnabled(true);
                
                // 位置を設定
                recordInstance.position = position.clone();
                
                // 壁配置の場合は回転を適用
                if (window.lastWallNormal) {
                    const rotationQuaternion = BABYLON.Quaternion.FromUnitVectorsToRef(
                        new BABYLON.Vector3(0, 0, 1),
                        window.lastWallNormal,
                        new BABYLON.Quaternion()
                    );
                    recordInstance.rotationQuaternion = rotationQuaternion;
                    window.lastWallNormal = null;
                }
                
                // すべての子メッシュに対してプロパティを設定
                recordInstance.getChildMeshes().forEach(childMesh => {
                    childMesh.isPickable = true; // 子メッシュも選択可能に設定（親に伝達するため）
                    childMesh.receiveShadows = true;
                    childMesh.renderingGroupId = 0; // デフォルトレイヤーに統一
                    childMesh.alwaysSelectAsActiveMesh = true; // クリッピング問題を回避
                    childMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION; // クリッピングを最適化
                    
                    // メタデータを追加して親メッシュを参照できるようにする
                    childMesh.metadata = childMesh.metadata || {};
                    childMesh.metadata.parentAsset = recordInstance;
                    
                    // 確実に前面に表示されるようにマテリアル設定を調整
                    if (childMesh.material) {
                        childMesh.material.zOffset = 1;  // 前面に表示
                        childMesh.material.needDepthPrePass = true; // 深度プリパスを有効化
                        childMesh.material.backFaceCulling = false; // 両面表示
                        childMesh.material.forceDepthWrite = true;  // 深度書き込みを強制
                    }
                    
                    // 影を生成するオブジェクトとして登録
                    if (shadowGenerator) {
                        shadowGenerator.addShadowCaster(childMesh);
                    }
                });
                
                // パーティクルエフェクト用のメッシュを返す
                mesh = recordInstance;
                
                // 親メッシュが選択可能であることを確認
                recordInstance.isPickable = true;
                
                // 当たり判定を明確にするために透明ボックスを追加
                const boundingBox = BABYLON.MeshBuilder.CreateBox("boundingBox_" + timestamp, {
                    width: 0.5,
                    height: 0.5,
                    depth: 0.5
                }, scene);
                boundingBox.position = recordInstance.position.clone();
                boundingBox.parent = recordInstance;
                boundingBox.visibility = 0.0; // 完全に透明に
                boundingBox.isPickable = true;
                
                // メタデータを追加して親子関係を明確にする
                boundingBox.metadata = boundingBox.metadata || {};
                boundingBox.metadata.parentAsset = recordInstance;
                
                console.log("事前ロードしたレコードマシンモデルを配置しました（選択可能：" + recordInstance.isPickable + "）");
            } else {
                // 事前ロードしたモデルがない場合は一時的なボックスを表示
                console.log("事前ロードしたモデルがないため、一時的なボックスを表示します");
                mesh = BABYLON.MeshBuilder.CreateBox("record_temp_" + Date.now(), {size: 0.01}, scene);
                mesh.position = position.clone();
                mesh.isVisible = false; // 見えないように設定
                
                // 非同期でGLBモデルをロード
                loadAssetAtPosition("https://raw.githubusercontent.com/yugovic/test/main/RecordMachine.glb", "record_" + Date.now(), position);
            }
        } else if (type === "juiceBox") {
            console.log("ジュースボックスを配置します...");
            
            if (preloadedModels.juiceBox) {
                // 事前ロードしたモデルをクローンして使用
                const timestamp = Date.now();
                const juiceBoxInstance = preloadedModels.juiceBox.clone("juiceBox_" + timestamp);
                
                // 表示を有効化
                juiceBoxInstance.setEnabled(true);
                
                // 位置を設定
                juiceBoxInstance.position = position.clone();
                
                // 壁配置の場合は回転を適用
                if (window.lastWallNormal) {
                    const rotationQuaternion = BABYLON.Quaternion.FromUnitVectorsToRef(
                        new BABYLON.Vector3(0, 0, 1),
                        window.lastWallNormal,
                        new BABYLON.Quaternion()
                    );
                    juiceBoxInstance.rotationQuaternion = rotationQuaternion;
                    window.lastWallNormal = null;
                }
                
                // すべての子メッシュに対してプロパティを設定
                juiceBoxInstance.getChildMeshes().forEach(childMesh => {
                    childMesh.isPickable = true; // 子メッシュも選択可能に設定（親に伝達するため）
                    childMesh.receiveShadows = true;
                    childMesh.renderingGroupId = 0; // デフォルトレイヤーに統一
                    childMesh.alwaysSelectAsActiveMesh = true; // クリッピング問題を回避
                    childMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION; // クリッピングを最適化
                    
                    // メタデータを追加して親メッシュを参照できるようにする
                    childMesh.metadata = childMesh.metadata || {};
                    childMesh.metadata.parentAsset = juiceBoxInstance;
                    
                    // 確実に前面に表示されるようにマテリアル設定を調整
                    if (childMesh.material) {
                        childMesh.material.zOffset = 1;  // 前面に表示
                        childMesh.material.needDepthPrePass = true; // 深度プリパスを有効化
                        childMesh.material.backFaceCulling = false; // 両面表示
                        childMesh.material.forceDepthWrite = true;  // 深度書き込みを強制
                    }
                    
                    // 影を生成するオブジェクトとして登録
                    if (shadowGenerator) {
                        shadowGenerator.addShadowCaster(childMesh);
                    }
                });
                
                // パーティクルエフェクト用のメッシュを返す
                mesh = juiceBoxInstance;
                
                // 親メッシュが選択可能であることを確認
                juiceBoxInstance.isPickable = true;
                
                // 当たり判定を明確にするために透明ボックスを追加
                const boundingBox = BABYLON.MeshBuilder.CreateBox("boundingBox_" + timestamp, {
                    width: 0.5,
                    height: 0.5,
                    depth: 0.5
                }, scene);
                boundingBox.position = juiceBoxInstance.position.clone();
                boundingBox.parent = juiceBoxInstance;
                boundingBox.visibility = 0.0; // 完全に透明に
                boundingBox.isPickable = true;
                
                // メタデータを追加して親子関係を明確にする
                boundingBox.metadata = boundingBox.metadata || {};
                boundingBox.metadata.parentAsset = juiceBoxInstance;
                
                console.log("事前ロードしたジュースボックスモデルを配置しました（選択可能：" + juiceBoxInstance.isPickable + "）");
            } else {
                // 事前ロードしたモデルがない場合は一時的なボックスを表示
                console.log("事前ロードしたモデルがないため、一時的なボックスを表示します");
                mesh = BABYLON.MeshBuilder.CreateBox("juiceBox_temp_" + Date.now(), {size: 0.01}, scene);
                mesh.position = position.clone();
                mesh.isVisible = false; // 見えないように設定
                
                // 非同期でGLBモデルをロード
                loadAssetAtPosition("https://raw.githubusercontent.com/yugovic/test/main/juice_boxv3.glb", "juiceBox_" + Date.now(), position);
            }
        } else if (type === "mikeDesk") {
            // マイクデスク用の三角錐を作成
            mesh = BABYLON.MeshBuilder.CreateCylinder("mikeDesk_" + Date.now(), { 
                diameterTop: 0, 
                diameterBottom: 0.6, // 3倍サイズ
                height: 0.9, // 3倍サイズ
                tessellation: 4 // 四面体（三角錐）になるよう設定
            }, scene);
            
            // マイクデスク用マテリアル
            const mikeDeskMaterial = new BABYLON.StandardMaterial("mikeDeskMaterial", scene);
            mikeDeskMaterial.diffuseColor = new BABYLON.Color3(0.3, 0.8, 0.6); // 緑色
            mikeDeskMaterial.specularColor = new BABYLON.Color3(0, 0, 0); // 反射を完全に抑える
            mikeDeskMaterial.specularPower = 0; // 反射の鋭さを最小に
            mikeDeskMaterial.zOffset = 1; // 前面に表示するためのZ値オフセット
            mikeDeskMaterial.disableLighting = false; // ライティングを有効にする（影を受けるため）
            mesh.material = mikeDeskMaterial;
            
            // 壁配置の場合は回転を適用
            if (window.lastWallNormal) {
                const rotationQuaternion = BABYLON.Quaternion.FromUnitVectorsToRef(
                    new BABYLON.Vector3(0, 0, 1),
                    window.lastWallNormal,
                    new BABYLON.Quaternion()
                );
                mesh.rotationQuaternion = rotationQuaternion;
                window.lastWallNormal = null;
            }
            
            console.log("マイクデスクを配置しました");
        }
        
        if (mesh) {
            mesh.position = position.clone();
            mesh.receiveShadows = true; // 影を受け取るように設定
            mesh.renderingGroupId = 0; // デフォルトレイヤーに統一
            
            // 深度バッファの処理を適切に設定
            if (mesh.material) {
                mesh.material.needDepthPrePass = false;
                mesh.material.separateCullingPass = true;
            }
            
            // 影に関する追加設定
            mesh.useShadowDepthMaterial = true; // 影の深度材質を使用
            
            // 選択・ドラッグ操作可能にする
            mesh.isPickable = true;
            
            // 複合アセット（レコードマシン、ジュースボックス、バーガー）の場合の当たり判定設定
            if (mesh.name.startsWith("record_") || mesh.name.startsWith("juiceBox_") || mesh.name.startsWith("burger_")) {
                // 親メッシュは選択可能に
                mesh.isPickable = true;
                
                // バウンディングボックスを作成して当たり判定を確実にする
                const timestamp = Date.now();
                const boundingBox = BABYLON.MeshBuilder.CreateBox("boundingBox_" + timestamp, {
                    width: 0.5,
                    height: 0.5,
                    depth: 0.5
                }, scene);
                boundingBox.position = mesh.position.clone();
                boundingBox.parent = mesh;
                boundingBox.visibility = 0.0; // 完全に透明に
                boundingBox.isPickable = true;
                
                // 子メッシュにメタデータを追加して親メッシュを参照できるようにする
                if (mesh.getChildMeshes && typeof mesh.getChildMeshes === 'function') {
                    mesh.getChildMeshes().forEach(childMesh => {
                        childMesh.isPickable = true; // クリック検出のため選択可能に
                        childMesh.metadata = childMesh.metadata || {};
                        childMesh.metadata.parentAsset = mesh; // 親メッシュへの参照を保存
                    });
                }
            }
            
            // 確実に壁の前に表示されるようにする
            mesh.alwaysSelectAsActiveMesh = true;
            
            // 影を生成するオブジェクトとして登録
            if (shadowGenerator) {
                // 既に登録されているメッシュをクリア
                try {
                    shadowGenerator.removeShadowCaster(mesh);
                } catch (e) {
                    // 初回は存在しないのでエラーは無視
                }
                
                // 影を生成するメッシュとして登録
                shadowGenerator.addShadowCaster(mesh, true); // 子メッシュも含める
                
                console.log("影を生成するメッシュに追加:", mesh.name);
                
                // コールバック関数で確実に影を更新
                setTimeout(() => {
                    scene.render(); // シーンを再レンダリングして影を更新
                }, 100);
            }
            
            console.log("オブジェクトを配置しました:", {
                type: type,
                name: mesh.name,
                isPickable: mesh.isPickable,
                position: mesh.position,
                castsShadow: shadowGenerator ? true : false,
                receivesShadow: mesh.receiveShadows
            });
            
            try {
                // 配置エフェクト
                const emitter = position.clone();
                const particleSystem = new BABYLON.ParticleSystem("particles", 50, scene);
                particleSystem.particleTexture = new BABYLON.Texture("https://assets.babylonjs.com/textures/flare.png", scene);
                particleSystem.emitter = emitter;
                
                // アセットのタイプに応じてエフェクトのサイズを調整
                let scale = 1.0;
                if (type === "juiceBox") {
                    // ジュースボックスは小さいため、エフェクトを大きくする
                    scale = 3.0;
                } else if (type === "mikeDesk") {
                    // マイクデスクは大きいため、エフェクトも大きくする
                    scale = 4.0;
                } else if (type === "record") {
                    // レコードマシンは中くらいのサイズ
                    scale = 2.5;
                } else if (type === "sphere") {
                    // 球は小さめ
                    scale = 2.0;
                } else if (type === "burger") {
                    // バーガーは中くらいのサイズ
                    scale = 2.0;
                }
                
                // スケールに基づいてエフェクトの設定を調整
                particleSystem.minEmitBox = new BABYLON.Vector3(-0.5 * scale, 0, -0.5 * scale);
                particleSystem.maxEmitBox = new BABYLON.Vector3(0.5 * scale, 0, 0.5 * scale);
                particleSystem.color1 = new BABYLON.Color4(0.7, 0.8, 1.0, 1.0);
                particleSystem.color2 = new BABYLON.Color4(0.2, 0.5, 1.0, 1.0);
                particleSystem.blendMode = BABYLON.ParticleSystem.BLENDMODE_ONEONE;
                particleSystem.minSize = 0.1 * scale;
                particleSystem.maxSize = 0.3 * scale;
                particleSystem.minLifeTime = 0.3;
                particleSystem.maxLifeTime = 0.7;
                particleSystem.emitRate = 100;
                particleSystem.direction1 = new BABYLON.Vector3(-1, 2, -1);
                particleSystem.direction2 = new BABYLON.Vector3(1, 2, 1);
                particleSystem.minEmitPower = 1 * scale;
                particleSystem.maxEmitPower = 2 * scale;
                particleSystem.updateSpeed = 0.01;
                
                // 一時的にパーティクルを表示
                particleSystem.start();
                setTimeout(() => {
                    particleSystem.stop();
                    setTimeout(() => {
                        particleSystem.dispose();
                    }, 1000);
                }, 500);
            } catch (e) {
                console.error("パーティクルエフェクトの作成に失敗しました:", e);
                // エフェクトがなくてもオブジェクトは配置できる
            }
            
            // 配置後にシーンを再レンダリングして影を更新
            scene.render();
            
            return mesh;
        }
    } catch (e) {
        showError(new Error("オブジェクトの配置中にエラーが発生しました: " + e.message));
    }
    
    return null;
}

// オブジェクトの選択
function selectObject(mesh) {
    try {
        // 既存の選択を解除
        deselectObject();
        
        // 新しいメッシュを選択
        selectedMesh = mesh;
        
        // メッシュが存在し、まだ破棄されていないことを確認
        if (mesh && !mesh.isDisposed()) {
            // 再度選択可能であることを確認
            mesh.isPickable = true;
            
            // 子メッシュがある場合は、すべての子メッシュも選択可能に
            if (mesh.getChildMeshes && typeof mesh.getChildMeshes === 'function') {
                const childMeshes = mesh.getChildMeshes();
                childMeshes.forEach(childMesh => {
                    childMesh.isPickable = true;
                });
                console.log(`${mesh.name}の子メッシュ(${childMeshes.length}個)も選択可能に設定しました`);
            }
            
            // ハイライト効果を適用
            try {
                // 白色のハイライト効果
                highlightLayer.addMesh(mesh, BABYLON.Color3.White());
                
                // 子メッシュがある場合は、子メッシュもハイライト
                if (mesh.getChildMeshes && typeof mesh.getChildMeshes === 'function') {
                    mesh.getChildMeshes().forEach(childMesh => {
                        highlightLayer.addMesh(childMesh, BABYLON.Color3.White());
                    });
                }
            } catch (e) {
                console.warn("ハイライト効果の適用に失敗しました:", e);
            }
            
            // 選択時のフィードバック
            const originalScaling = mesh.scaling.clone();
            mesh.scaling = new BABYLON.Vector3(
                originalScaling.x * 1.05,
                originalScaling.y * 1.05,
                originalScaling.z * 1.05
            );
            
            setTimeout(() => {
                if (mesh && !mesh.isDisposed()) {
                    mesh.scaling = originalScaling;
                }
            }, 200);
            
            // アイテム選択時にカメラ操作を無効化
            if (camera) {
                camera.detachControl(canvas);
                console.log("アイテム選択中: カメラ操作を無効化しました");
            }
            
            console.log("オブジェクトを選択しました:", {
                name: mesh.name,
                isPickable: mesh.isPickable,
                position: mesh.position,
                childCount: mesh.getChildMeshes ? mesh.getChildMeshes().length : 0
            });
        }
    } catch (e) {
        console.error("オブジェクトの選択に失敗しました:", e);
    }
}

// オブジェクトの選択解除
function deselectObject() {
    try {
        if (selectedMesh) {
            // 選択中のメッシュのハイライトを解除
            try {
                highlightLayer.removeMesh(selectedMesh);
                
                // 子メッシュがある場合は、子メッシュのハイライトも解除
                if (selectedMesh.getChildMeshes && typeof selectedMesh.getChildMeshes === 'function') {
                    selectedMesh.getChildMeshes().forEach(childMesh => {
                        highlightLayer.removeMesh(childMesh);
                    });
                }
            } catch (e) {
                console.warn("ハイライト解除に失敗しました:", e);
            }
            
            selectedMesh = null;
            
            // アイテム選択解除時にカメラ操作を再度有効化
            if (camera && canvas) {
                camera.attachControl(canvas, true);
                console.log("アイテム選択解除: カメラ操作を有効化しました");
            }
        }
    } catch (e) {
        console.error("オブジェクトの選択解除に失敗しました:", e);
    }
}

// ボタンのリセット
function resetButtons() {
    cubeBtn.classList.remove("active");
    recordBtn.classList.remove("active");
    juiceBoxBtn.classList.remove("active");
    mikeDeskBtn.classList.remove("active");
    
    // プレビューメッシュも削除
    if (previewMesh) {
        console.log("ボタンリセット時にプレビューメッシュを削除:", previewMesh.name);
        previewMesh.dispose();
        previewMesh = null;
    }
    cleanupPreviewMesh();
}

// GLBアセットを指定した位置に読み込む
function loadAssetAtPosition(url, name, position) {
    // URLを確認
    console.log(`アセット ${name} のロードを開始します:`, url);
    console.log("配置位置:", position.toString());
    
    // 進行状況を表示するためのプレースホルダーを作成
    const placeholder = BABYLON.MeshBuilder.CreateBox("placeholder_" + Date.now(), {size: 0.2}, scene);
    placeholder.position = position.clone();
    placeholder.material = new BABYLON.StandardMaterial("placeholderMat", scene);
    placeholder.material.diffuseColor = new BABYLON.Color3(0.5, 0.5, 1);
    placeholder.material.alpha = 0.5;
    
    // 非同期ロード処理でGLBモデルをロード
    BABYLON.SceneLoader.ImportMesh("", url, "", scene, function(meshes) {
        console.log(`アセット ${name} をロードしました:`, meshes.length + "個のメッシュ");
        
        // プレースホルダーを削除
        placeholder.dispose();
        
        // 一時的なメッシュを探して削除（パーティクルエフェクト用に作成されたもの）
        const tempMeshes = scene.meshes.filter(m => 
            m.name.startsWith("juiceBox_temp_") || m.name.startsWith("record_temp_")
        );
        tempMeshes.forEach(m => {
            console.log("一時的なメッシュを削除:", m.name);
            m.dispose();
        });
        
        if (meshes.length > 0) {
            const rootMesh = meshes[0];
            
            // 高さの調整（床面より少し上に配置）
            const newPosition = position.clone();
            if (!window.lastWallNormal) { // 壁配置でない場合のみ
                newPosition.y += 0.05; // 床からの高さを調整
            }
            
            rootMesh.position = newPosition;
            rootMesh.name = name;
            
            // アセットのサイズを調整（モデルによって異なる調整が必要）
            if (name.includes("juiceBox")) {
                // ジュースボックスのサイズを小さくする
                rootMesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
            } else if (name.includes("mikeDesk")) {
                // マイクデスクはサイズを調整
                rootMesh.scaling = new BABYLON.Vector3(0.3, 0.3, 0.3);
            } else {
                // その他のアセットは標準サイズ
                rootMesh.scaling = new BABYLON.Vector3(0.1, 0.1, 0.1);
            }
            
            // すべてのメッシュが確実に表示されるように設定
            for (let mesh of meshes) {
                mesh.isVisible = true;
                mesh.receiveShadows = true;
                
                // 親メッシュのみ選択可能に、子メッシュは選択不可に
                if (mesh === rootMesh) {
                    mesh.isPickable = true; // 親メッシュは選択可能
                } else {
                    mesh.isPickable = false; // 子メッシュは選択不可
                }
                
                // レンダリンググループを設定して確実に表示されるようにする
                mesh.renderingGroupId = 0; // デフォルトレイヤーに統一
                mesh.alwaysSelectAsActiveMesh = true; // 常にアクティブに保つ
                
                // 深度バッファの処理を適切に設定
                if (mesh.material) {
                    mesh.material.needDepthPrePass = false;
                    mesh.material.separateCullingPass = true;
                    mesh.material.backFaceCulling = true;
                }
                mesh.alwaysSelectAsActiveMesh = true; // 常にアクティブなメッシュとして選択（深度バッファの問題を回避）
                
                // マテリアルの調整
                if (mesh.material) {
                    mesh.material.backFaceCulling = false; // 両面表示
                    mesh.material.needDepthPrePass = true; // 深度プリパスを有効化して前面に表示されるようにする
                    mesh.material.zOffset = 1; // 前面に表示するためのZ値オフセット
                    mesh.material.depthFunction = BABYLON.Engine.LEQUAL; // 深度比較関数を調整
                    mesh.material.forceDepthWrite = true; // 深度書き込みを強制
                }
                
                // フラスタムカリングを最適化
                mesh.alwaysSelectAsActiveMesh = true; // クリッピング問題を回避
                mesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION; // クリッピングを最適化
                
                // 影を生成するオブジェクトとして登録
                if (shadowGenerator) {
                    shadowGenerator.addShadowCaster(mesh);
                }
            }
            
            // 親メッシュを確実に表示
            rootMesh.alwaysSelectAsActiveMesh = true;
            rootMesh.renderingGroupId = 0; // デフォルトレイヤーに統一
            rootMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION; // クリッピングを最適化
            
            // 描画順序の問題を解決するために子メッシュも再設定
            rootMesh.getChildMeshes().forEach(childMesh => {
                childMesh.renderingGroupId = 0; // デフォルトレイヤーに統一
                childMesh.alwaysSelectAsActiveMesh = true;
                childMesh.cullingStrategy = BABYLON.AbstractMesh.CULLINGSTRATEGY_OPTIMISTIC_INCLUSION; // クリッピングを最適化
                
                if (childMesh.material) {
                    childMesh.material.backFaceCulling = false; // 両面表示
                    childMesh.material.needDepthPrePass = true; // 深度プリパスを有効化
                    childMesh.material.forceDepthWrite = true;  // 深度書き込みを強制
                }
            });
            
            // 壁配置の場合は回転を適用
            if (window.lastWallNormal) {
                const rotationQuaternion = BABYLON.Quaternion.FromUnitVectorsToRef(
                    new BABYLON.Vector3(0, 0, 1),
                    window.lastWallNormal,
                    new BABYLON.Quaternion()
                );
                rootMesh.rotationQuaternion = rotationQuaternion;
                window.lastWallNormal = null;
            }
            
            console.log(`アセット ${name} を配置しました:`, {
                position: rootMesh.position.toString(),
                scaling: rootMesh.scaling.toString(),
                meshCount: meshes.length,
                visible: rootMesh.isVisible
            });
            
            // シーンを強制的に再レンダリング
            scene.render();
        }
    }, null, function(scene, message) {
        // プレースホルダーを削除
        placeholder.dispose();
        
        console.error(`アセット ${name} のロードに失敗しました:`, message);
        showError(new Error(`アセット ${name} のロードに失敗しました: ${message}`));
    });
}

// 1人称モードの切り替え機能
function toggleFirstPersonMode() {
    const firstPersonBtn = document.getElementById("firstPersonBtn");
    const firstPersonGuide = document.querySelector(".first-person-guide");
    const cameraPositionDisplay = document.getElementById("cameraPositionDisplay");
    
    if (!firstPersonMode) {
        // 1人称モードを有効にする
        firstPersonMode = true;
        firstPersonBtn.classList.add("active");
        firstPersonBtn.textContent = "通常モード";
        
        // 元のカメラを保存
        originalCamera = camera;
        
        // 1人称カメラを作成 - 部屋の中心付近に配置、人間の平均的な目線の高さ(1.6m)に設定
        const eyeHeight = 1.6; // 人間の平均的な目線の高さ（メートル）
        firstPersonCamera = new BABYLON.UniversalCamera("firstPersonCamera", new BABYLON.Vector3(0, eyeHeight, -5), scene);
        
        // ターゲットを前方に設定
        const target = firstPersonCamera.position.clone();
        target.z += 1; // 前方を向く
        firstPersonCamera.setTarget(target);
        
        // カメラの設定
        firstPersonCamera.speed = 0.2;
        firstPersonCamera.angularSensibility = 500; // 感度を下げて調整
        firstPersonCamera.inertia = 0.5; // 慣性を追加して滑らかさを向上
        firstPersonCamera.minZ = 0.1;
        firstPersonCamera.maxZ = 100;
        
        // マウスでのカメラ操作を有効化
        firstPersonCamera.attachControl(canvas, true);
        
        // 移動制限を設定（部屋の境界内に制限）- 人間の体の大きさに合わせた当たり判定
        firstPersonCamera.checkCollisions = true;
        firstPersonCamera.ellipsoid = new BABYLON.Vector3(0.5, 0.8, 0.5); // 人間の体の大きさを表現
        firstPersonCamera.ellipsoidOffset = new BABYLON.Vector3(0, 0, 0); // オフセットを取り除き、正確な位置に配置
        
        // アクティブカメラを変更
        scene.activeCamera = firstPersonCamera;
        scene.activeCamera.attachControl(canvas, true);
        
        // カメラ位置表示パネルを表示
        if (cameraPositionDisplay) {
            cameraPositionDisplay.style.display = "block";
        } else {
            // カメラ位置情報表示用のディスプレイを追加
            const newCameraPositionDisplay = document.createElement("div");
            newCameraPositionDisplay.id = "cameraPositionDisplay";
            newCameraPositionDisplay.style.position = "fixed";
            newCameraPositionDisplay.style.bottom = "10px";
            newCameraPositionDisplay.style.right = "10px";
            newCameraPositionDisplay.style.padding = "10px";
            newCameraPositionDisplay.style.backgroundColor = "rgba(0, 0, 0, 0.7)";
            newCameraPositionDisplay.style.color = "white";
            newCameraPositionDisplay.style.fontFamily = "monospace";
            newCameraPositionDisplay.style.fontSize = "12px";
            newCameraPositionDisplay.style.borderRadius = "5px";
            newCameraPositionDisplay.style.zIndex = "1000";
            newCameraPositionDisplay.style.pointerEvents = "none";
            document.body.appendChild(newCameraPositionDisplay);
        }
        
        // カメラ位置情報の更新を開始
        scene.registerBeforeRender(updateCameraPositionDisplay);
        
        // カメラをキャンバスに接続
        console.log("1人称カメラを設定しました:", {
            position: firstPersonCamera.position.toString(),
            rotation: firstPersonCamera.rotation.toString(),
            target: firstPersonCamera.getTarget().toString()
        });
        
        // キーボードコントロールを有効化
        setupFirstPersonControls();
        
        // 標準のFPS制御を無効化（独自のキー処理を使用するため）
        firstPersonCamera.keysUp = [];
        firstPersonCamera.keysDown = [];
        firstPersonCamera.keysLeft = [];
        firstPersonCamera.keysRight = [];
        
        // 操作ガイドを表示
        if (!firstPersonGuide) {
            createFirstPersonGuide();
        } else {
            firstPersonGuide.style.display = "block";
        }
        
        // 床面と壁に衝突判定を設定して、歩行時に貫通しないようにする
        const meshesInScene = scene.meshes;
        meshesInScene.forEach(mesh => {
            if (mesh.name.includes("floor") || 
                mesh.name.includes("ground") || 
                mesh.name.includes("wall")) {
                mesh.checkCollisions = true;
            }
        });
        
        // アセット配置・移動機能を無効化
        disablePlacementInFirstPersonMode();
        
        console.log("1人称モードを有効にしました");
    } else {
        // 通常モードに戻る
        firstPersonMode = false;
        firstPersonBtn.classList.remove("active");
        firstPersonBtn.textContent = "1人称モード";
        
        // 元のカメラに戻す
        if (originalCamera) {
            scene.activeCamera = originalCamera;
            scene.activeCamera.attachToCanvas(canvas);
        }
        
        // 1人称カメラを削除
        if (firstPersonCamera) {
            firstPersonCamera.dispose();
            firstPersonCamera = null;
        }
        
        // キーボードイベントリスナーを削除
        removeFirstPersonControls();
        
        // カメラ位置表示を終了
        scene.unregisterBeforeRender(updateCameraPositionDisplay);
        
        // カメラ位置情報パネルを非表示
        if (cameraPositionDisplay) {
            cameraPositionDisplay.style.display = "none";
        }
        
        // 操作ガイドを非表示
        if (firstPersonGuide) {
            firstPersonGuide.style.display = "none";
        }
        
        // アセット配置・移動機能を再有効化
        enablePlacementAfterFirstPersonMode();
        
        console.log("通常モードに戻しました");
    }
}

// 1人称モード用の操作ガイドを作成
function createFirstPersonGuide() {
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
    document.body.appendChild(guide);
}

// 1人称モード用のキーボードコントロールを設定
function setupFirstPersonControls() {
    // キーボードイベントリスナーを追加
    window.addEventListener("keydown", onFirstPersonKeyDown);
    window.addEventListener("keyup", onFirstPersonKeyUp);
    
    // レンダーループでカメラ移動を処理
    scene.registerBeforeRender(updateFirstPersonMovement);
}

// 1人称モード用のキーボードコントロールを削除
function removeFirstPersonControls() {
    window.removeEventListener("keydown", onFirstPersonKeyDown);
    window.removeEventListener("keyup", onFirstPersonKeyUp);
    scene.unregisterBeforeRender(updateFirstPersonMovement);
    keys = {};
}

// キーダウンイベント処理
function onFirstPersonKeyDown(event) {
    if (!firstPersonMode) return;
    
    keys[event.code] = true;
    
    // カメラコントロールが誤作動しないようにイベントを止める
    // キー入力によるブラウザの挙動を防止（例えばWやSでスクロールするなど）
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft', 'ControlLeft', 'Space', 'KeyC'].includes(event.code)) {
        event.preventDefault();
    }
    
    // デバッグ情報
    console.log("キー押下:", event.code);
}

// キーアップイベント処理
function onFirstPersonKeyUp(event) {
    if (!firstPersonMode) return;
    
    keys[event.code] = false;
    console.log("キーアップ:", event.code);
}

// 1人称モードでの移動処理
function updateFirstPersonMovement() {
    if (!firstPersonMode || !firstPersonCamera) return;
    
    const speed = keys['ShiftLeft'] ? 8.0 : (keys['ControlLeft'] ? 2.0 : 4.0);
    const deltaTime = engine.getDeltaTime() / 1000;
    
    // カメラの向きに基づいて移動方向を計算（ただしY成分は無視）
    const forward = firstPersonCamera.getDirection(BABYLON.Vector3.Forward()).normalize();
    const right = firstPersonCamera.getDirection(BABYLON.Vector3.Right()).normalize();
    const up = BABYLON.Vector3.Up();
    
    // 水平面での移動のために、forwardとrightのY成分を0にして正規化
    const forwardHorizontal = new BABYLON.Vector3(forward.x, 0, forward.z).normalize();
    const rightHorizontal = new BABYLON.Vector3(right.x, 0, right.z).normalize();
    
    let movement = BABYLON.Vector3.Zero();
    
    // WASD移動 - カメラの向きに基づいて水平移動
    // W: カメラの前方向（水平）へ移動
    // S: カメラの後方向（水平）へ移動
    // A: カメラの左方向（水平）へ移動
    // D: カメラの右方向（水平）へ移動
    // Space: 上方へ移動
    // C: 下方へ移動
    if (keys['KeyW']) {
        movement = movement.add(forwardHorizontal.scale(-speed * deltaTime * 2.0)); // 前方移動は2倍速
    }
    if (keys['KeyS']) {
        movement = movement.add(forwardHorizontal.scale(speed * deltaTime * 2.0)); // 後方移動は2倍速
    }
    if (keys['KeyA']) {
        movement = movement.add(rightHorizontal.scale(-speed * deltaTime)); // 左移動
    }
    if (keys['KeyD']) {
        movement = movement.add(rightHorizontal.scale(speed * deltaTime)); // 右移動
    }
    if (keys['Space']) {
        movement = movement.add(up.scale(speed * deltaTime)); // 上昇
    }
    if (keys['KeyC']) {
        movement = movement.add(up.scale(-speed * deltaTime)); // 下降
    }
    
    // 移動量がゼロでない場合のみ処理
    if (!movement.equalsToFloats(0, 0, 0)) {
        // 新しい位置を計算
        const newPosition = firstPersonCamera.position.add(movement);
        
        // 部屋の境界内に制限（3D空間で移動可能）
        const boundary = {
            minX: -8.5,
            maxX: 8.5,
            minZ: -8.5,
            maxZ: 8.5,
            minY: 0.1,  // 床面より少し上
            maxY: 5.0   // 天井の高さ
        };
        
        if (newPosition.x >= boundary.minX && newPosition.x <= boundary.maxX &&
            newPosition.z >= boundary.minZ && newPosition.z <= boundary.maxZ &&
            newPosition.y >= boundary.minY && newPosition.y <= boundary.maxY) {
            
            // 3D位置を更新（X、Y、Z座標すべて更新）
            firstPersonCamera.position.x = newPosition.x;
            firstPersonCamera.position.z = newPosition.z;
            firstPersonCamera.position.y = newPosition.y;
        }
    }
}

// カメラの位置情報を表示する関数
function updateCameraPositionDisplay() {
    if (!firstPersonMode || !firstPersonCamera) return;
    
    const cameraPositionDisplay = document.getElementById("cameraPositionDisplay");
    if (!cameraPositionDisplay) return;
    
    const position = firstPersonCamera.position;
    const rotation = firstPersonCamera.rotation;
    const direction = firstPersonCamera.getDirection(BABYLON.Vector3.Forward());
    
    cameraPositionDisplay.innerHTML = `
        <div><strong>カメラ位置情報:</strong></div>
        <div>位置: X=${position.x.toFixed(2)}, Y=${position.y.toFixed(2)}, Z=${position.z.toFixed(2)}</div>
        <div>回転: X=${rotation.x.toFixed(2)}, Y=${rotation.y.toFixed(2)}, Z=${rotation.z.toFixed(2)}</div>
        <div>方向: X=${direction.x.toFixed(2)}, Y=${direction.y.toFixed(2)}, Z=${direction.z.toFixed(2)}</div>
    `;
    
    // コンソールにも出力
    console.log("カメラ位置情報:", {
        position: position.toString(),
        rotation: rotation.toString(),
        direction: direction.toString()
    });
}

// 1人称モードでアセット配置・移動機能を無効化する関数
function disablePlacementInFirstPersonMode() {
    // アセット配置ボタンを無効化
    const assetButtons = [cubeBtn, recordBtn, juiceBoxBtn, mikeDeskBtn];
    assetButtons.forEach(btn => {
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.style.cursor = "not-allowed";
        }
    });
    
    // 回転・削除・エクスポートボタンも無効化
    const actionButtons = [rotateBtn, deleteBtn, exportImageBtn];
    actionButtons.forEach(btn => {
        if (btn) {
            btn.disabled = true;
            btn.style.opacity = "0.5";
            btn.style.cursor = "not-allowed";
        }
    });
    
    // グリッド設定コントロールも無効化
    if (gridSizeSelect) gridSizeSelect.disabled = true;
    if (showGridCheck) showGridCheck.disabled = true;
    if (snapToGridCheck) snapToGridCheck.disabled = true;
    
    // 配置モードを強制的に終了
    isPlacing = false;
    currentMode = null;
    
    // アセットの選択も解除
    deselectObject();
    selectedMesh = null;
    
    // シーン内のすべてのメッシュを選択不可に設定（移動防止）
    scene.meshes.forEach(mesh => {
        // 特殊メッシュ（床、壁、グリッド）以外は選択不可に
        if (!mesh.name.includes("floor") && 
            !mesh.name.includes("ground") && 
            !mesh.name.includes("wall") && 
            !mesh.name.includes("grid") && 
            !mesh.name.includes("helper")) {
            mesh.isPickable = false;
            
            // 子メッシュも選択不可に
            if (mesh.getChildMeshes && typeof mesh.getChildMeshes === 'function') {
                mesh.getChildMeshes().forEach(childMesh => {
                    childMesh.isPickable = false;
                });
            }
        }
    });
    
    console.log("1人称モード: アセット配置・移動機能を無効化しました");
}

// 通常モードに戻ったときにアセット配置・移動機能を再有効化する関数
function enablePlacementAfterFirstPersonMode() {
    // アセット配置ボタンを再有効化
    const assetButtons = [cubeBtn, recordBtn, juiceBoxBtn, mikeDeskBtn];
    assetButtons.forEach(btn => {
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
        }
    });
    
    // 回転・削除・エクスポートボタンも再有効化
    const actionButtons = [rotateBtn, deleteBtn, exportImageBtn];
    actionButtons.forEach(btn => {
        if (btn) {
            btn.disabled = false;
            btn.style.opacity = "1";
            btn.style.cursor = "pointer";
        }
    });
    
    // グリッド設定コントロールも再有効化
    if (gridSizeSelect) gridSizeSelect.disabled = false;
    if (showGridCheck) showGridCheck.disabled = false;
    if (snapToGridCheck) snapToGridCheck.disabled = false;
    
    // シーン内のすべてのメッシュを選択可能に戻す
    scene.meshes.forEach(mesh => {
        // 特殊メッシュ（床、壁、グリッド）以外は選択可能に
        if (!mesh.name.includes("floor") && 
            !mesh.name.includes("ground") && 
            !mesh.name.includes("wall") && 
            !mesh.name.includes("grid") && 
            !mesh.name.includes("helper")) {
            mesh.isPickable = true;
            
            // 子メッシュも選択可能に
            if (mesh.getChildMeshes && typeof mesh.getChildMeshes === 'function') {
                mesh.getChildMeshes().forEach(childMesh => {
                    childMesh.isPickable = true;
                });
            }
        }
    });
    
    console.log("通常モード: アセット配置・移動機能を再有効化しました");
}