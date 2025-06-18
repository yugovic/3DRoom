// js/environment/GridSystem.js
/**
 * グリッドシステムの管理クラス
 */

import { GRID_SETTINGS } from '../config/constants.js';
import { DEFAULT_SETTINGS } from '../config/default-settings.js';

export class GridSystem {
    constructor(scene, errorHandler) {
        this.scene = scene;
        this.errorHandler = errorHandler;
        
        // グリッド設定
        this.settings = {
            size: DEFAULT_SETTINGS.grid.size,
            show: DEFAULT_SETTINGS.grid.show,
            snapToGrid: DEFAULT_SETTINGS.grid.snapToGrid
        };
        
        // グリッドメッシュと垂直ヘルパー
        this.gridMesh = null;
        this.verticalHelper = null;
        this.wallGridMeshes = [];
        
        // 床と壁の参照
        this.ground = null;
        this.walls = [];
    }

    /**
     * グリッドシステムを初期化
     * @param {BABYLON.Mesh} ground - 床メッシュ
     * @param {Array<BABYLON.Mesh>} walls - 壁メッシュの配列
     */
    initialize(ground, walls) {
        this.ground = ground;
        this.walls = walls;
        
        // 垂直ヘルパーを作成
        this.createVerticalHelper();
        
        // グリッドを作成
        this.createGrid();
        
        console.log("Grid system initialized");
    }

    /**
     * グリッドを作成
     */
    createGrid() {
        try {
            // 既存のグリッドがあれば削除
            this.disposeExistingGrid();
            
            if (!this.ground) {
                this.errorHandler.showWarning("床メッシュが見つかりません。グリッドを作成できません。");
                return;
            }
            
            // GridMaterialが利用可能か確認
            if (typeof BABYLON.GridMaterial === 'undefined') {
                this.errorHandler.showWarning("GridMaterialが利用できません。");
                this.createFallbackGrid();
                return;
            }
            
            // 床のオリジナルマテリアルを保存
            if (!this.ground._originalMaterial && this.ground.material) {
                this.ground._originalMaterial = this.ground.material.clone 
                    ? this.ground.material.clone("ground_original_material")
                    : this.ground.material;
                console.log("Saved original floor material:", this.ground._originalMaterial.name);
            }
            
            // グリッド表示の切り替え
            if (this.settings.show) {
                this.applyGridToFloor();
                this.createWallGrids();
            } else {
                this.restoreOriginalMaterials();
            }
            
            // グリッドの参照を保持
            this.gridMesh = this.ground;
            
        } catch (error) {
            this.errorHandler.showError("グリッドの作成に失敗しました: " + error.message);
        }
    }

    /**
     * 床にグリッドを適用
     */
    applyGridToFloor() {
        const floorGridMaterial = new BABYLON.GridMaterial(
            `floorGridMaterial_${Date.now()}`, 
            this.scene
        );
        
        // グリッド設定を適用
        floorGridMaterial.majorUnitFrequency = GRID_SETTINGS.MAJOR_UNIT_FREQUENCY;
        floorGridMaterial.minorUnitVisibility = GRID_SETTINGS.MINOR_UNIT_VISIBILITY;
        floorGridMaterial.gridRatio = this.settings.size;
        floorGridMaterial.mainColor = new BABYLON.Color3(
            GRID_SETTINGS.COLORS.MAIN.r,
            GRID_SETTINGS.COLORS.MAIN.g,
            GRID_SETTINGS.COLORS.MAIN.b
        );
        floorGridMaterial.lineColor = new BABYLON.Color3(
            GRID_SETTINGS.COLORS.SECONDARY.r,
            GRID_SETTINGS.COLORS.SECONDARY.g,
            GRID_SETTINGS.COLORS.SECONDARY.b
        );
        floorGridMaterial.opacity = GRID_SETTINGS.OPACITY;
        
        // 床にグリッドマテリアルを適用
        this.ground.material = floorGridMaterial;
        this.ground.isPickable = true;
        this.ground.setEnabled(true);
        this.ground.isVisible = true;
        
        console.log("Applied grid to floor");
    }

    /**
     * 壁用のグリッドを作成
     */
    createWallGrids() {
        if (!this.walls || this.walls.length === 0) {
            console.log("No walls found for grid application");
            return;
        }
        
        this.walls.forEach(wallMesh => {
            // オリジナルマテリアルを保存
            if (!wallMesh._originalMaterial && wallMesh.material) {
                wallMesh._originalMaterial = wallMesh.material.clone 
                    ? wallMesh.material.clone(`${wallMesh.name}_original_material`)
                    : wallMesh.material;
            }
            
            if (this.settings.show) {
                this.applyGridToWall(wallMesh);
            }
        });
        
        console.log(`Applied grid to ${this.walls.length} walls`);
    }

    /**
     * 壁にグリッドを適用
     * @param {BABYLON.Mesh} wallMesh - 壁メッシュ
     */
    applyGridToWall(wallMesh) {
        const wallGridMat = new BABYLON.GridMaterial(
            `${wallMesh.name}_gridMat_${Date.now()}`,
            this.scene
        );
        
        // グリッド設定
        wallGridMat.majorUnitFrequency = GRID_SETTINGS.MAJOR_UNIT_FREQUENCY;
        wallGridMat.minorUnitVisibility = GRID_SETTINGS.MINOR_UNIT_VISIBILITY - 0.1;
        wallGridMat.gridRatio = this.settings.size;
        wallGridMat.mainColor = new BABYLON.Color3(
            GRID_SETTINGS.COLORS.MAIN.r,
            GRID_SETTINGS.COLORS.MAIN.g,
            GRID_SETTINGS.COLORS.MAIN.b
        );
        wallGridMat.lineColor = new BABYLON.Color3(
            GRID_SETTINGS.COLORS.SECONDARY.r,
            GRID_SETTINGS.COLORS.SECONDARY.g,
            GRID_SETTINGS.COLORS.SECONDARY.b
        );
        wallGridMat.opacity = GRID_SETTINGS.OPACITY - 0.2;
        
        // 壁の向きに合わせてグリッドを調整
        this.adjustWallGridOrientation(wallMesh, wallGridMat);
        
        // マテリアルを適用
        wallMesh.material = wallGridMat;
        wallMesh.isPickable = true;
        wallMesh.setEnabled(true);
        wallMesh.isVisible = true;
    }

    /**
     * 壁グリッドの向きを調整
     * @param {BABYLON.Mesh} wallMesh - 壁メッシュ
     * @param {BABYLON.GridMaterial} gridMaterial - グリッドマテリアル
     */
    adjustWallGridOrientation(wallMesh, gridMaterial) {
        const boundingInfo = wallMesh.getBoundingInfo();
        const min = boundingInfo.boundingBox.minimumWorld;
        const max = boundingInfo.boundingBox.maximumWorld;
        
        // 壁の向きを判定
        if (Math.abs(max.z - min.z) < Math.abs(max.x - min.x)) {
            // X方向に長い壁
            gridMaterial.mainAxis = new BABYLON.Vector3(1, 0, 0);
            
            // 壁の法線方向を確認
            if (wallMesh.metadata && wallMesh.metadata.normalDirection) {
                gridMaterial.rotation = wallMesh.metadata.normalDirection.z > 0 ? 0 : Math.PI;
            }
        } else {
            // Z方向に長い壁
            gridMaterial.mainAxis = new BABYLON.Vector3(0, 0, 1);
            
            if (wallMesh.metadata && wallMesh.metadata.normalDirection) {
                gridMaterial.rotation = wallMesh.metadata.normalDirection.x > 0 
                    ? -Math.PI / 2 
                    : Math.PI / 2;
            }
        }
    }

    /**
     * 垂直ヘルパーラインを作成
     */
    createVerticalHelper() {
        try {
            if (this.verticalHelper) {
                this.verticalHelper.dispose();
            }
            
            this.verticalHelper = BABYLON.MeshBuilder.CreateLines(
                "verticalHelper", 
                {
                    points: [
                        new BABYLON.Vector3(0, 0, 0),
                        new BABYLON.Vector3(0, 2.5, 0)
                    ]
                }, 
                this.scene
            );
            
            this.verticalHelper.color = new BABYLON.Color3(0, 0.7, 1);
            this.verticalHelper.isVisible = false;
            this.verticalHelper.isPickable = false;
            this.verticalHelper.renderingGroupId = 0;
            this.verticalHelper.checkCollisions = false;
            this.verticalHelper.useOctreeForRenderingSelection = false;
            
            console.log("Vertical helper created");
            
        } catch (error) {
            this.errorHandler.showWarning("垂直ヘルパーの作成に失敗しました: " + error.message);
        }
    }

    /**
     * フォールバックグリッドを作成（GridMaterialが使えない場合）
     */
    createFallbackGrid() {
        const gridSize = 20;
        this.gridMesh = BABYLON.MeshBuilder.CreateGround(
            "gridMesh", 
            { width: gridSize, height: gridSize }, 
            this.scene
        );
        
        const gridMat = new BABYLON.StandardMaterial("gridMat", this.scene);
        gridMat.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        gridMat.wireframe = true;
        
        this.gridMesh.material = gridMat;
        this.gridMesh.position.y = this.ground ? this.ground.position.y + 0.01 : 0.01;
        this.gridMesh.isPickable = false;
        this.gridMesh.receiveShadows = false;
        this.gridMesh.setEnabled(this.settings.show);
        
        console.log("Created fallback grid mesh");
    }

    /**
     * オリジナルマテリアルを復元
     */
    restoreOriginalMaterials() {
        // 床のマテリアルを復元
        if (this.ground && this.ground._originalMaterial) {
            this.ground.material = this.ground._originalMaterial;
            this.ground.isPickable = true;
            console.log("Restored original floor material");
        }
        
        // 壁のマテリアルを復元
        this.walls.forEach(wallMesh => {
            if (wallMesh._originalMaterial) {
                wallMesh.material = wallMesh._originalMaterial;
                wallMesh.isPickable = true;
                console.log("Restored original wall material:", wallMesh.name);
            }
        });
    }

    /**
     * 既存のグリッドを破棄
     */
    disposeExistingGrid() {
        // グリッドマテリアルをクリーンアップ
        const materials = this.scene.materials.filter(mat => 
            (mat.name.includes("gridMat") || mat.name.includes("GridMaterial")) &&
            !mat.name.includes("_original")
        );
        
        materials.forEach(mat => {
            console.log("Disposing grid material:", mat.name);
            mat.dispose();
        });
        
        // 既存の壁グリッドメッシュを削除
        const existingGrids = this.scene.meshes.filter(mesh => 
            mesh.name.startsWith("wallGrid")
        );
        
        existingGrids.forEach(mesh => {
            console.log("Disposing wall grid mesh:", mesh.name);
            mesh.dispose();
        });
    }

    /**
     * グリッドサイズを設定
     * @param {number} size - グリッドサイズ
     */
    setGridSize(size) {
        this.settings.size = parseFloat(size) || 1.0;
        this.createGrid();
    }

    /**
     * グリッド表示を切り替え
     * @param {boolean} show - 表示するかどうか
     */
    setShowGrid(show) {
        this.settings.show = show;
        this.createGrid();
        
        // シーンを強制的に再レンダリング
        if (this.scene) {
            this.scene.render();
        }
    }

    /**
     * スナップ設定を切り替え
     * @param {boolean} snap - スナップするかどうか
     */
    setSnapToGrid(snap) {
        this.settings.snapToGrid = snap;
    }

    /**
     * 垂直ヘルパーを表示
     * @param {BABYLON.Vector3} position - 表示位置
     * @param {BABYLON.Color3} color - 色（オプション）
     */
    showVerticalHelper(position, color = null) {
        if (!this.verticalHelper) return;
        
        this.verticalHelper.isVisible = true;
        this.verticalHelper.position.x = position.x;
        this.verticalHelper.position.z = position.z;
        
        if (color) {
            this.verticalHelper.color = color;
        }
    }

    /**
     * 垂直ヘルパーを非表示
     */
    hideVerticalHelper() {
        if (this.verticalHelper) {
            this.verticalHelper.isVisible = false;
        }
    }

    /**
     * 現在の設定を取得
     * @returns {Object} 設定オブジェクト
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * グリッドサイズを取得
     * @returns {number} グリッドサイズ
     */
    getGridSize() {
        return this.settings.size;
    }

    /**
     * スナップが有効かどうか
     * @returns {boolean}
     */
    isSnapEnabled() {
        return this.settings.snapToGrid;
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing GridSystem...");
        
        // オリジナルマテリアルを復元
        this.restoreOriginalMaterials();
        
        // グリッドを破棄
        this.disposeExistingGrid();
        
        // 垂直ヘルパーを破棄
        if (this.verticalHelper) {
            this.verticalHelper.dispose();
            this.verticalHelper = null;
        }
        
        this.gridMesh = null;
        this.wallGridMeshes = [];
        this.ground = null;
        this.walls = [];
    }
}