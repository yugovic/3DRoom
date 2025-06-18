// js/environment/RoomManager.js
/**
 * 部屋の作成と管理を担当するクラス
 */

import { ASSET_URLS, ROOM_BOUNDARY, MODEL_SCALES } from '../config/constants.js';

export class RoomManager {
    constructor(scene, errorHandler) {
        this.scene = scene;
        this.errorHandler = errorHandler;
        
        // メッシュの参照
        this.ground = null;
        this.walls = [];
        this.roomMeshes = [];
        
        // 部屋の境界
        this.roomBoundary = { ...ROOM_BOUNDARY };
        
        // シャドウレシーバーとキャスター
        this.shadowReceivers = [];
        this.shadowCasters = [];
    }

    /**
     * 部屋をロード
     * @returns {Promise<void>}
     */
    async loadRoom() {
        try {
            console.log("Loading room model...");
            
            await this.loadRoomModel();
            
            // 床が見つからない場合は作成
            if (!this.ground) {
                this.createDefaultFloor();
            }
            
            // 影の受け取り用の透明床を作成
            this.createShadowFloor();
            
            console.log("Room loaded successfully");
            
        } catch (error) {
            this.errorHandler.handleCriticalError(error, 'RoomManager.loadRoom');
            throw error;
        }
    }

    /**
     * GLBモデルをロード
     * @returns {Promise<void>}
     */
    async loadRoomModel() {
        return new Promise((resolve, reject) => {
            BABYLON.SceneLoader.ImportMesh(
                "", 
                "", 
                ASSET_URLS.ROOM, 
                this.scene,
                (meshes) => {
                    console.log(`Room model loaded: ${meshes.length} meshes`);
                    
                    this.processRoomMeshes(meshes);
                    resolve();
                },
                null,
                (scene, message) => {
                    reject(new Error(`Failed to load room model: ${message}`));
                }
            );
        });
    }

    /**
     * ルームメッシュを処理
     * @param {Array<BABYLON.Mesh>} meshes - ロードされたメッシュ
     */
    processRoomMeshes(meshes) {
        const rootMesh = meshes[0];
        
        // スケールを設定
        rootMesh.scaling = new BABYLON.Vector3(
            MODEL_SCALES.ROOM.x,
            MODEL_SCALES.ROOM.y,
            MODEL_SCALES.ROOM.z
        );
        
        // モデル全体の位置を調整
        this.adjustRoomPosition(meshes, rootMesh);
        
        // 各メッシュを分類して処理
        meshes.forEach(mesh => {
            this.roomMeshes.push(mesh);
            
            // マテリアルの最適化
            this.optimizeMeshMaterial(mesh);
            
            // 床メッシュの検出
            if (this.isFloorMesh(mesh)) {
                this.setupFloor(mesh);
            }
            // 壁メッシュの検出
            else if (this.isWallMesh(mesh)) {
                this.setupWall(mesh);
            }
            // その他の装飾メッシュ
            else if (this.isDecorationMesh(mesh)) {
                this.setupDecoration(mesh);
            }
        });
        
        // 部屋の境界を計算
        this.calculateRoomBoundary();
    }

    /**
     * 部屋の位置を調整
     * @param {Array<BABYLON.Mesh>} meshes - メッシュ配列
     * @param {BABYLON.Mesh} rootMesh - ルートメッシュ
     */
    adjustRoomPosition(meshes, rootMesh) {
        // 床の高さを取得
        let floorY = 0;
        for (const mesh of meshes) {
            if (this.isFloorMesh(mesh)) {
                floorY = mesh.position.y;
                console.log("Floor original position:", floorY);
                break;
            }
        }
        
        // モデル全体の位置を調整して床がY=0になるようにする
        rootMesh.position.y = -floorY * rootMesh.scaling.y;
        console.log("Adjusted room position:", rootMesh.position.y);
    }

    /**
     * 床メッシュかどうか判定
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @returns {boolean}
     */
    isFloorMesh(mesh) {
        const name = mesh.name.toLowerCase();
        return name === "floor" || 
               name.includes("floor") || 
               name.includes("ground") || 
               name.includes("body");
    }

    /**
     * 壁メッシュかどうか判定
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @returns {boolean}
     */
    isWallMesh(mesh) {
        const name = mesh.name.toLowerCase();
        return name === "wall" || 
               name.includes("wall") || 
               name.includes("building") || 
               name.includes("structure");
    }

    /**
     * 装飾メッシュかどうか判定
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @returns {boolean}
     */
    isDecorationMesh(mesh) {
        return !mesh.name.includes("helper") && 
               !mesh.name.includes("grid") && 
               !mesh.name.includes("preview");
    }

    /**
     * 床をセットアップ
     * @param {BABYLON.Mesh} mesh - 床メッシュ
     */
    setupFloor(mesh) {
        if (!this.ground) {
            this.ground = mesh;
        }
        
        mesh.isPickable = true;
        mesh.receiveShadows = true;
        
        // メタデータを追加
        mesh.metadata = mesh.metadata || {};
        mesh.metadata.isFloor = true;
        
        // 影を受け取るリストに追加
        this.shadowReceivers.push(mesh);
        
        console.log("Floor mesh setup:", mesh.name);
    }

    /**
     * 壁をセットアップ
     * @param {BABYLON.Mesh} mesh - 壁メッシュ
     */
    setupWall(mesh) {
        this.walls.push(mesh);
        
        mesh.isPickable = true;
        mesh.receiveShadows = true;
        mesh.isVisible = true;
        
        // 不透明マテリアルを作成
        this.createOpaqueWallMaterial(mesh);
        
        // メタデータを追加
        const normalDirection = this.calculateWallNormal(mesh);
        mesh.metadata = {
            isInteriorWall: true,
            normalDirection: normalDirection
        };
        
        // 影を受け取るリストに追加
        this.shadowReceivers.push(mesh);
        
        console.log("Wall mesh setup:", mesh.name);
    }

    /**
     * 装飾をセットアップ
     * @param {BABYLON.Mesh} mesh - 装飾メッシュ
     */
    setupDecoration(mesh) {
        // 大きなオブジェクトは影を落とす
        if (this.isLargeObject(mesh)) {
            this.shadowCasters.push(mesh);
            console.log("Shadow caster added:", mesh.name);
        }
        
        // すべてのオブジェクトは影を受け取る
        mesh.receiveShadows = true;
        this.shadowReceivers.push(mesh);
    }

    /**
     * メッシュのマテリアルを最適化
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    optimizeMeshMaterial(mesh) {
        if (!mesh.material) return;
        
        // 反射を抑える
        mesh.material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        mesh.material.specularPower = 1;
        
        // 環境反射を抑える
        if (mesh.material.reflectionTexture) {
            mesh.material.reflectionTexture.level = 0.1;
        }
        
        // PBRマテリアルの場合
        if (mesh.material.metallic !== undefined) {
            mesh.material.metallic = 0.1;
            mesh.material.roughness = 0.9;
        }
    }

    /**
     * 壁用の不透明マテリアルを作成
     * @param {BABYLON.Mesh} wallMesh - 壁メッシュ
     */
    createOpaqueWallMaterial(wallMesh) {
        const material = new BABYLON.StandardMaterial(
            "wallMaterial_" + wallMesh.name, 
            this.scene
        );
        
        // 元のマテリアルの色を保持
        if (wallMesh.material && wallMesh.material.diffuseColor) {
            material.diffuseColor = wallMesh.material.diffuseColor.clone();
        } else {
            material.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        }
        
        // 完全に不透明な設定
        material.alpha = 1.0;
        material.transparencyMode = BABYLON.Material.MATERIAL_OPAQUE;
        material.backFaceCulling = true;
        material.twoSidedLighting = false;
        material.needDepthPrePass = true;
        material.disableDepthWrite = false;
        material.zOffset = -10;
        
        // 反射を抑制
        material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        material.specularPower = 1;
        material.reflectionTexture = null;
        
        // オリジナルマテリアルを保存
        if (!wallMesh._originalMaterial) {
            wallMesh._originalMaterial = wallMesh.material;
        }
        
        wallMesh.material = material;
    }

    /**
     * 壁の法線方向を計算
     * @param {BABYLON.Mesh} wallMesh - 壁メッシュ
     * @returns {BABYLON.Vector3} 法線方向
     */
    calculateWallNormal(wallMesh) {
        const boundingInfo = wallMesh.getBoundingInfo();
        const min = boundingInfo.boundingBox.minimumWorld;
        const max = boundingInfo.boundingBox.maximumWorld;
        
        // 壁の中心位置
        const center = new BABYLON.Vector3(
            (min.x + max.x) / 2,
            (min.y + max.y) / 2,
            (min.z + max.z) / 2
        );
        
        // 部屋の中心位置
        const roomCenter = new BABYLON.Vector3(
            (this.roomBoundary.MIN_X + this.roomBoundary.MAX_X) / 2,
            center.y,
            (this.roomBoundary.MIN_Z + this.roomBoundary.MAX_Z) / 2
        );
        
        // 壁の法線方向（部屋の中心に向かう方向）
        return roomCenter.subtract(center).normalize();
    }

    /**
     * 大きなオブジェクトかどうか判定
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @returns {boolean}
     */
    isLargeObject(mesh) {
        if (!mesh.getBoundingInfo) return false;
        
        const boundingBox = mesh.getBoundingInfo().boundingBox;
        return boundingBox.extendSize.y > 1;
    }

    /**
     * デフォルトの床を作成
     */
    createDefaultFloor() {
        console.log("Creating default floor...");
        
        this.ground = BABYLON.MeshBuilder.CreateGround(
            "ground", 
            { width: 20, height: 20 }, 
            this.scene
        );
        
        const groundMat = new BABYLON.StandardMaterial("groundMaterial", this.scene);
        groundMat.diffuseColor = new BABYLON.Color3(0.4, 0.4, 0.4);
        groundMat.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
        
        this.ground.material = groundMat;
        this.ground.position.y = 0;
        this.ground.receiveShadows = true;
        this.ground.isPickable = true;
        
        this.shadowReceivers.push(this.ground);
    }

    /**
     * 影受け取り用の透明床を作成
     */
    createShadowFloor() {
        const shadowFloor = BABYLON.MeshBuilder.CreateGround(
            "shadowFloor",
            { width: 20, height: 20 },
            this.scene
        );
        
        const shadowFloorMat = new BABYLON.StandardMaterial("shadowFloorMat", this.scene);
        shadowFloorMat.alpha = 0.01;
        shadowFloorMat.diffuseColor = new BABYLON.Color3(1, 1, 1);
        shadowFloorMat.specularColor = new BABYLON.Color3(0, 0, 0);
        shadowFloorMat.emissiveColor = new BABYLON.Color3(0, 0, 0);
        shadowFloorMat.ambientColor = new BABYLON.Color3(0, 0, 0);
        shadowFloorMat.backFaceCulling = false;
        
        shadowFloor.material = shadowFloorMat;
        shadowFloor.receiveShadows = true;
        shadowFloor.position.y = 0.02;
        shadowFloor.isPickable = false;
        
        this.shadowReceivers.push(shadowFloor);
    }

    /**
     * 部屋の境界を計算
     */
    calculateRoomBoundary() {
        if (this.walls.length === 0) {
            console.log("No walls found, using default room boundary");
            return;
        }
        
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        
        this.walls.forEach(wall => {
            const boundingInfo = wall.getBoundingInfo();
            const min = boundingInfo.boundingBox.minimumWorld;
            const max = boundingInfo.boundingBox.maximumWorld;
            
            minX = Math.min(minX, min.x);
            maxX = Math.max(maxX, max.x);
            minZ = Math.min(minZ, min.z);
            maxZ = Math.max(maxZ, max.z);
        });
        
        // 少し内側に調整
        const margin = 1.0;
        this.roomBoundary.MIN_X = minX + margin;
        this.roomBoundary.MAX_X = maxX - margin;
        this.roomBoundary.MIN_Z = minZ + margin;
        this.roomBoundary.MAX_Z = maxZ - margin;
        
        console.log("Room boundary calculated:", this.roomBoundary);
    }

    /**
     * 床メッシュを取得
     * @returns {BABYLON.Mesh}
     */
    getGround() {
        return this.ground;
    }

    /**
     * 壁メッシュの配列を取得
     * @returns {Array<BABYLON.Mesh>}
     */
    getWalls() {
        return this.walls;
    }

    /**
     * 部屋の境界を取得
     * @returns {Object}
     */
    getRoomBoundary() {
        return { ...this.roomBoundary };
    }

    /**
     * 影を受け取るメッシュの配列を取得
     * @returns {Array<BABYLON.Mesh>}
     */
    getShadowReceivers() {
        return this.shadowReceivers;
    }

    /**
     * 影を生成するメッシュの配列を取得
     * @returns {Array<BABYLON.Mesh>}
     */
    getShadowCasters() {
        return this.shadowCasters;
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing RoomManager...");
        
        // すべてのルームメッシュを破棄
        this.roomMeshes.forEach(mesh => {
            if (mesh && !mesh.isDisposed()) {
                mesh.dispose();
            }
        });
        
        this.ground = null;
        this.walls = [];
        this.roomMeshes = [];
        this.shadowReceivers = [];
        this.shadowCasters = [];
    }
}