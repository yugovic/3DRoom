// js/interaction/InteractionManager.js
/**
 * ユーザーインタラクションを管理するクラス
 */

import { ASSET_TYPES } from '../config/constants.js';
import { snapPositionToGrid, calculateRayFloorIntersection } from '../utils/math-utils.js';
import { PRESET_COLORS } from '../utils/color-utils.js';

export class InteractionManager {
    constructor(app, errorHandler) {
        this.app = app;
        this.errorHandler = errorHandler;
        
        // マネージャーの参照
        this.scene = null;
        this.canvas = null;
        this.camera = null;
        this.gridSystem = null;
        this.assetPlacer = null;
        this.selectionController = null;
        
        // インタラクション状態
        this.currentMode = null;
        this.isPlacing = false;
        this.isDragging = false;
        
        // ドラッグ用
        this.startingPoint = null;
        this.currentMesh = null;
        this.originalPosition = null;
        
        // プレビューメッシュ
        this.previewMesh = null;
        
        // イベントハンドラー
        this.onPointerDown = null;
        this.onPointerUp = null;
        this.onPointerMove = null;
    }

    /**
     * インタラクションシステムを初期化
     */
    initialize() {
        // マネージャーの参照を取得
        this.scene = this.app.getScene();
        this.canvas = this.app.getManager('scene').getCanvas();
        this.camera = this.app.getManager('camera');
        this.gridSystem = this.app.getManager('grid');
        this.assetPlacer = this.app.getManager('assetPlacer');
        this.selectionController = this.app.getManager('selection');
        
        // イベントハンドラーを設定
        this.setupEventHandlers();
        
        console.log("InteractionManager initialized");
    }

    /**
     * イベントハンドラーを設定
     */
    setupEventHandlers() {
        // 既存のイベントリスナーを削除
        this.removeEventHandlers();
        
        // ポインターダウン
        this.onPointerDown = (evt, pickResult) => {
            // 1人称モード中は無効
            if (this.camera.getCurrentMode() === 'firstPerson') return;
            
            this.handlePointerDown(pickResult);
        };
        
        // ポインターアップ
        this.onPointerUp = () => {
            // 1人称モード中は無効
            if (this.camera.getCurrentMode() === 'firstPerson') return;
            
            this.handlePointerUp();
        };
        
        // ポインター移動
        this.onPointerMove = (evt) => {
            // 1人称モード中は無効
            if (this.camera.getCurrentMode() === 'firstPerson') return;
            
            this.handlePointerMove();
        };
        
        // イベントを登録
        this.scene.onPointerDown = this.onPointerDown;
        this.scene.onPointerUp = this.onPointerUp;
        this.scene.onPointerMove = this.onPointerMove;
    }
    
    /**
     * イベントハンドラーを削除
     */
    removeEventHandlers() {
        // イベントリスナーを削除
        if (this.scene) {
            this.scene.onPointerDown = null;
            this.scene.onPointerUp = null;
            this.scene.onPointerMove = null;
        }
    }

    /**
     * ポインターダウン処理
     * @param {BABYLON.PickingInfo} pickResult
     */
    handlePointerDown(pickResult) {
        console.log("Pointer down:", {
            isPlacing: this.isPlacing,
            currentMode: this.currentMode,
            hit: pickResult.hit,
            meshName: pickResult.hit ? pickResult.pickedMesh.name : "no mesh"
        });
        
        if (this.isPlacing) {
            this.handlePlacement(pickResult);
        } else {
            this.handleSelection(pickResult);
        }
    }

    /**
     * 配置処理
     * @param {BABYLON.PickingInfo} pickResult
     */
    handlePlacement(pickResult) {
        console.log("=== 配置処理開始 ===");
        
        // 床と壁のみに配置可能
        const floorWallPredicate = (mesh) => {
            const isTarget = mesh.name.toLowerCase().includes("floor") || 
                           mesh.name.toLowerCase().includes("wall") ||
                           mesh.name.toLowerCase().includes("body") ||
                           (mesh.metadata && mesh.metadata.isFloor);
            
            console.log(`メッシュチェック: ${mesh.name} -> ${isTarget ? '有効' : '無視'}`);
            return isTarget;
        };
        
        // 床と壁のみに対するレイキャスト
        const ray = this.scene.createPickingRay(
            this.scene.pointerX, 
            this.scene.pointerY, 
            BABYLON.Matrix.Identity(), 
            this.camera.getActiveCamera()
        );
        
        console.log("レイキャスト実行前");
        const floorWallPickResult = this.scene.pickWithRay(ray, floorWallPredicate);
        
        if (!floorWallPickResult.hit) {
            console.log("エラー: 有効なオブジェクトにヒットしませんでした");
            this.errorHandler.showError("配置できません。床または壁をクリックしてください。");
            return;
        }
        
        console.log("ヒットしたオブジェクト:", {
            name: floorWallPickResult.pickedMesh?.name,
            position: floorWallPickResult.pickedPoint?.clone(),
            normal: floorWallPickResult.getNormal()?.clone()
        });
        
        const hitPoint = floorWallPickResult.pickedPoint.clone();
        const hitMesh = floorWallPickResult.pickedMesh;
        
        console.log("配置前の位置:", hitPoint.toString());
        
        // グリッドスナップが有効な場合は位置をスナップ
        if (this.gridSystem.isSnapEnabled()) {
            const gridSize = this.gridSystem.getGridSize();
            console.log(`グリッドスナップ有効 (サイズ: ${gridSize})`);
            const snappedPosition = snapPositionToGrid(hitPoint, gridSize);
            console.log("スナップ前:", hitPoint.toString());
            console.log("スナップ後:", snappedPosition.toString());
            hitPoint.copyFrom(snappedPosition);
        } else {
            console.log("グリッドスナップ無効");
        }
        
        // 法線を取得
        let normal = null;
        try {
            normal = floorWallPickResult.getNormal(true) || new BABYLON.Vector3(0, 1, 0);
        } catch (e) {
            console.warn("法線の取得に失敗しました。デフォルト値を使用します。", e);
            normal = new BABYLON.Vector3(0, 1, 0);
        }
        
        console.log("法線ベクトル:", normal.toString());
        
        // 壁に配置する場合の処理
        const isWall = Math.abs(normal.y) < 0.7;
        console.log(`配置タイプ: ${isWall ? '壁' : '床'}`);
        
        // 位置を調整
        if (isWall) {
            const offset = 0.1;  // 壁から少し離す
            console.log(`壁配置: オフセット適用前 -> ${hitPoint.toString()}`);
            hitPoint.x += normal.x * offset;
            hitPoint.z += normal.z * offset;
            
            // 壁の高さを調整（床から1.2m上）
            hitPoint.y = 1.2;
            console.log(`壁配置: オフセット適用後 -> ${hitPoint.toString()}`);
        } else {
            // 床配置の場合は少し上に配置
            console.log(`床配置: Y座標調整前 -> ${hitPoint.y}`);
            hitPoint.y += 0.01;
            console.log(`床配置: Y座標調整後 -> ${hitPoint.y}`);
        }
        
        // 配置位置が見つからない場合は床との交点を計算
        if (!hitPoint) {
            const ground = this.app.getManager('room').getGround();
            const floorY = ground ? ground.position.y : 0;
            const placementPosition = calculateRayFloorIntersection(ray, floorY);
            // グリッドスナップ
            const position = this.gridSystem.isSnapEnabled() 
                ? snapPositionToGrid(placementPosition, this.gridSystem.getGridSize())
                : placementPosition.clone();
            
            // 高さ調整
            if (!isWallPlacement) {
                position.y = placementPosition.y + 0.1;
            }
            
            console.log("Asset placement:", {
                original: placementPosition,
                snapped: position,
                gridEnabled: this.gridSystem.isSnapEnabled(),
                gridSize: this.gridSystem.getGridSize()
            });
            
            // アセットを配置
            this.assetPlacer.placeAsset(this.currentMode, position);
            
            // 配置モードを終了
            this.exitPlacementMode();
        }
    }

    /**
     * 選択処理
     * @param {BABYLON.PickingInfo} pickResult
     */
    handleSelection(pickResult) {
        if (pickResult.hit) {
            const selectedMesh = this.selectionController.selectFromPickResult(pickResult);
            
            if (selectedMesh) {
                // ドラッグ開始
                this.currentMesh = selectedMesh;
                this.originalPosition = selectedMesh.position.clone();
                
                // 床との交点を計算
                const ground = this.app.getManager('room').getGround();
                const floorY = ground ? ground.position.y : 0;
                const ray = this.scene.createPickingRay(
                    this.scene.pointerX, 
                    this.scene.pointerY, 
                    BABYLON.Matrix.Identity(), 
                    this.camera.getActiveCamera()
                );
                
                this.startingPoint = calculateRayFloorIntersection(ray, floorY);
                this.isDragging = true;
                
                // カメラコントロールを無効化
                const activeCamera = this.camera.getActiveCamera();
                if (activeCamera) {
                    activeCamera.detachControl(this.canvas);
                }
            } else {
                // 選択解除
                this.selectionController.deselectAll();
                
                // カメラコントロールを有効化
                const activeCamera = this.camera.getActiveCamera();
                if (activeCamera && !this.selectionController.hasSelection()) {
                    activeCamera.attachControl(this.canvas, true);
                }
            }
        }
    }

    /**
     * ポインターアップ処理
     */
    handlePointerUp() {
        if (this.currentMesh && this.isDragging) {
            // 部屋の境界チェック
            const roomBoundary = this.app.getManager('room').getRoomBoundary();
            const isInside = this.isPositionInsideRoom(this.currentMesh.position, roomBoundary);
            
            if (!isInside) {
                // 元の位置に戻す
                if (this.originalPosition) {
                    this.currentMesh.position.copyFrom(this.originalPosition);
                }
                this.errorHandler.showError("オブジェクトを配置できません。部屋の中に配置してください。");
            } else {
                // グリッドスナップ
                if (this.gridSystem.isSnapEnabled()) {
                    const gridSize = this.gridSystem.getGridSize();
                    this.currentMesh.position.x = Math.round(this.currentMesh.position.x / gridSize) * gridSize;
                    this.currentMesh.position.z = Math.round(this.currentMesh.position.z / gridSize) * gridSize;
                }
            }
        }
        
        // ドラッグ終了
        this.isDragging = false;
        this.startingPoint = null;
        this.currentMesh = null;
        this.originalPosition = null;
        
        // カメラコントロールを有効化（選択中でない場合）
        if (!this.selectionController.hasSelection()) {
            const activeCamera = this.camera.getActiveCamera();
            if (activeCamera) {
                activeCamera.attachControl(this.canvas, true);
            }
        }
    }

    /**
     * ポインター移動処理
     */
    handlePointerMove() {
        if (this.isDragging && this.startingPoint && this.currentMesh) {
            this.handleDragging();
        } else if (this.isPlacing) {
            this.updatePreview();
        }
    }

    /**
     * ドラッグ処理
     */
    handleDragging() {
        // 床との交点を計算
        const ground = this.app.getManager('room').getGround();
        const floorY = ground ? ground.position.y : 0;
        const ray = this.scene.createPickingRay(
            this.scene.pointerX, 
            this.scene.pointerY, 
            BABYLON.Matrix.Identity(), 
            this.camera.getActiveCamera()
        );
        
        const current = calculateRayFloorIntersection(ray, floorY);
        
        if (!current) return;
        
        const diff = current.subtract(this.startingPoint);
        
        // 新しい位置を計算
        this.currentMesh.position.x += diff.x;
        this.currentMesh.position.z += diff.z;
        
        this.startingPoint = current;
    }

    /**
     * プレビューを更新
     */
    updatePreview() {
        const pickInfo = this.scene.pick(
            this.scene.pointerX,
            this.scene.pointerY,
            null,
            false,
            this.camera.getActiveCamera()
        );
        
        if (!pickInfo.hit || !pickInfo.pickedPoint) {
            this.hidePreview();
            return;
        }
        
        // 配置可能な場所かチェック
        const meshName = pickInfo.pickedMesh.name.toLowerCase();
        const isFloor = meshName.includes("floor") || meshName.includes("body") || 
                       (pickInfo.pickedMesh.metadata && pickInfo.pickedMesh.metadata.isFloor);
        const isWall = meshName.includes("wall");
        
        if (!isFloor && !isWall) {
            this.hidePreview();
            return;
        }
        
        // プレビュー位置を計算
        let position = pickInfo.pickedPoint.clone();
        if (this.gridSystem.isSnapEnabled()) {
            position = snapPositionToGrid(position, this.gridSystem.getGridSize());
        }
        
        // 法線を取得
        let normal = null;
        try {
            normal = pickInfo.getNormal(true) || new BABYLON.Vector3(0, 1, 0);
        } catch (e) {
            normal = new BABYLON.Vector3(0, 1, 0);
        }
        
        const isWallHit = Math.abs(normal.y) < 0.7;
        
        // 位置調整
        if (isWallHit) {
            const offset = 0.1;
            position.x += normal.x * offset;
            position.z += normal.z * offset;
        } else {
            position.y = pickInfo.pickedPoint.y + 0.1;
        }
        
        // プレビューメッシュを作成または更新
        this.showPreview(position, isWallHit ? normal : null);
        
        // 垂直ヘルパーを表示
        if (!isWallHit) {
            const color = this.getPreviewColor();
            this.gridSystem.showVerticalHelper(position, color);
        } else {
            this.gridSystem.hideVerticalHelper();
        }
    }

    /**
     * プレビューを表示
     * @param {BABYLON.Vector3} position - 位置
     * @param {BABYLON.Vector3|null} wallNormal - 壁の法線
     */
    showPreview(position, wallNormal) {
        if (!this.previewMesh) {
            this.createPreviewMesh();
        }
        
        if (this.previewMesh) {
            this.previewMesh.position = position;
            
            // 壁配置の場合は回転
            if (wallNormal) {
                const rotationQuaternion = BABYLON.Quaternion.FromUnitVectorsToRef(
                    new BABYLON.Vector3(0, 0, 1),
                    wallNormal,
                    new BABYLON.Quaternion()
                );
                this.previewMesh.rotationQuaternion = rotationQuaternion;
            } else {
                this.previewMesh.rotation = BABYLON.Vector3.Zero();
                this.previewMesh.rotationQuaternion = null;
            }
        }
    }

    /**
     * プレビューメッシュを作成
     */
    createPreviewMesh() {
        this.cleanupPreview();
        
        let mesh = null;
        
        switch (this.currentMode) {
            case ASSET_TYPES.CUBE:
                // バーガーのプレビュー
                if (this.app.getManager('assetLoader').isModelAvailable('burger')) {
                    mesh = this.app.getManager('assetLoader').cloneModel('burger', 'preview_burger');
                    if (mesh) {
                        mesh.setEnabled(true);
                        this.makeTransparent(mesh);
                    }
                } else {
                    mesh = this.createSimplePreview(PRESET_COLORS.BURGER);
                }
                break;
                
            case ASSET_TYPES.RECORD:
                if (this.app.getManager('assetLoader').isModelAvailable('record')) {
                    mesh = this.app.getManager('assetLoader').cloneModel('record', 'preview_record');
                    if (mesh) {
                        mesh.setEnabled(true);
                        this.makeTransparent(mesh);
                    }
                } else {
                    mesh = this.createSimplePreview(PRESET_COLORS.RECORD);
                }
                break;
                
            case ASSET_TYPES.JUICE_BOX:
                if (this.app.getManager('assetLoader').isModelAvailable('juiceBox')) {
                    mesh = this.app.getManager('assetLoader').cloneModel('juiceBox', 'preview_juiceBox');
                    if (mesh) {
                        mesh.setEnabled(true);
                        this.makeTransparent(mesh);
                    }
                } else {
                    mesh = this.createSimplePreview(PRESET_COLORS.JUICE_BOX);
                }
                break;
                
            case ASSET_TYPES.MIKE_DESK:
                mesh = BABYLON.MeshBuilder.CreateCylinder("preview_mikeDesk", { 
                    diameterTop: 0, 
                    diameterBottom: 0.6,
                    height: 0.9,
                    tessellation: 4
                }, this.scene);
                
                const material = new BABYLON.StandardMaterial("previewMaterial", this.scene);
                material.diffuseColor = PRESET_COLORS.MIKE_DESK;
                material.alpha = 0.5;
                mesh.material = material;
                break;
        }
        
        if (mesh) {
            mesh.isPickable = false;
            mesh.checkCollisions = false;
            
            if (mesh.getChildMeshes) {
                mesh.getChildMeshes().forEach(child => {
                    child.isPickable = false;
                });
            }
            
            this.previewMesh = mesh;
        }
    }

    /**
     * シンプルなプレビューを作成
     * @param {BABYLON.Color3} color - 色
     * @returns {BABYLON.Mesh}
     */
    createSimplePreview(color) {
        const mesh = BABYLON.MeshBuilder.CreateBox("preview_simple", { size: 0.2 }, this.scene);
        const material = new BABYLON.StandardMaterial("previewMaterial", this.scene);
        material.diffuseColor = color;
        material.alpha = 0.5;
        mesh.material = material;
        return mesh;
    }

    /**
     * メッシュを半透明にする
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    makeTransparent(mesh) {
        if (mesh.material) {
            mesh.material.alpha = 0.5;
        }
        
        if (mesh.getChildMeshes) {
            mesh.getChildMeshes().forEach(childMesh => {
                if (childMesh.material) {
                    childMesh.material.alpha = 0.5;
                }
            });
        }
    }

    /**
     * プレビューを非表示
     */
    hidePreview() {
        if (this.previewMesh) {
            this.previewMesh.isVisible = false;
        }
        this.gridSystem.hideVerticalHelper();
    }

    /**
     * プレビューをクリーンアップ
     */
    cleanupPreview() {
        if (this.previewMesh) {
            this.previewMesh.dispose();
            this.previewMesh = null;
        }
        
        // 残っているプレビューメッシュも削除
        const previewMeshes = this.scene.meshes.filter(mesh => 
            mesh.name.startsWith("preview")
        );
        
        previewMeshes.forEach(mesh => mesh.dispose());
    }

    /**
     * プレビューの色を取得
     * @returns {BABYLON.Color3}
     */
    getPreviewColor() {
        switch (this.currentMode) {
            case ASSET_TYPES.CUBE:
                return PRESET_COLORS.BURGER;
            case ASSET_TYPES.RECORD:
                return PRESET_COLORS.RECORD;
            case ASSET_TYPES.JUICE_BOX:
                return PRESET_COLORS.JUICE_BOX;
            case ASSET_TYPES.MIKE_DESK:
                return PRESET_COLORS.MIKE_DESK;
            default:
                return new BABYLON.Color3(0, 0.7, 1);
        }
    }

    /**
     * 配置モードを設定
     * @param {string} mode - アセットタイプ
     */
    setPlacementMode(mode) {
        this.exitPlacementMode();
        
        this.currentMode = mode;
        this.isPlacing = true;
        
        // 選択を解除
        this.selectionController.deselectAll();
        
        console.log(`Placement mode set: ${mode}`);
    }

    /**
     * 配置モードを終了
     */
    exitPlacementMode() {
        this.isPlacing = false;
        this.currentMode = null;
        this.cleanupPreview();
        this.gridSystem.hideVerticalHelper();
    }

    /**
     * モードをリセット
     */
    resetMode() {
        this.exitPlacementMode();
        this.selectionController.deselectAll();
    }

    /**
     * 現在のモードを取得
     * @returns {string|null}
     */
    getCurrentMode() {
        return this.currentMode;
    }

    /**
     * 配置中かどうか
     * @returns {boolean}
     */
    isInPlacementMode() {
        return this.isPlacing;
    }

    /**
     * 位置が部屋の内側かチェック
     * @param {BABYLON.Vector3} position - 位置
     * @param {Object} roomBoundary - 部屋の境界
     * @returns {boolean}
     */
    isPositionInsideRoom(position, roomBoundary) {
        return position.x > roomBoundary.MIN_X && 
               position.x < roomBoundary.MAX_X && 
               position.z > roomBoundary.MIN_Z && 
               position.z < roomBoundary.MAX_Z;
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing InteractionManager...");
        
        // イベントハンドラーを削除
        if (this.scene) {
            this.scene.onPointerDown = null;
            this.scene.onPointerUp = null;
            this.scene.onPointerMove = null;
        }
        
        // プレビューをクリーンアップ
        this.cleanupPreview();
        
        // 状態をリセット
        this.resetMode();
    }
}