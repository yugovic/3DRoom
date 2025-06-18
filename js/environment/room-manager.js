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
        const roomScale = MODEL_SCALES.ROOM || MODEL_SCALES.DEFAULT;
        rootMesh.scaling = new BABYLON.Vector3(
            roomScale.x,
            roomScale.y,
            roomScale.z
        );
        
        // ルートメッシュをroom meshリストに追加
        this.roomMeshes.push(rootMesh);
        
        // 全メッシュを処理
        meshes.forEach((mesh, index) => {
            if (!mesh) return;
            
            console.log(`Processing mesh ${index}: ${mesh.name}`);
            
            // メッシュの設定
            mesh.isPickable = true;
            mesh.receiveShadows = true;
            
            // 名前に基づいて床と壁を識別
            const meshNameLower = mesh.name.toLowerCase();
            
            if (meshNameLower.includes('floor') || 
                meshNameLower.includes('ground') || 
                meshNameLower.includes('床')) {
                this.setupFloorMesh(mesh);
            } else if (meshNameLower.includes('wall') || 
                       meshNameLower.includes('壁')) {
                this.setupWallMesh(mesh);
            }
            
            // 子メッシュも処理
            if (mesh.getChildMeshes) {
                mesh.getChildMeshes().forEach(childMesh => {
                    this.processChildMesh(childMesh);
                });
            }
        });
        
        // 影のキャスター/レシーバーを設定
        this.setupShadows();
    }

    /**
     * 子メッシュを処理
     * @param {BABYLON.Mesh} mesh - 処理するメッシュ
     */
    processChildMesh(mesh) {
        if (!mesh) return;
        
        const meshNameLower = mesh.name.toLowerCase();
        
        if (meshNameLower.includes('floor') || 
            meshNameLower.includes('ground')) {
            this.setupFloorMesh(mesh);
        } else if (meshNameLower.includes('wall')) {
            this.setupWallMesh(mesh);
        }
        
        // デフォルトの設定
        mesh.isPickable = true;
        mesh.receiveShadows = true;
    }

    /**
     * 床メッシュをセットアップ
     * @param {BABYLON.Mesh} mesh - 床メッシュ
     */
    setupFloorMesh(mesh) {
        console.log(`Setting up floor mesh: ${mesh.name}`);
        
        this.ground = mesh;
        mesh.metadata = { isFloor: true };
        mesh.receiveShadows = true;
        mesh.checkCollisions = true;
        
        // インタラクション用のタグを設定
        mesh.metadata.interactionTag = 'floor';
        
        this.shadowReceivers.push(mesh);
    }

    /**
     * 壁メッシュをセットアップ
     * @param {BABYLON.Mesh} mesh - 壁メッシュ
     */
    setupWallMesh(mesh) {
        console.log(`Setting up wall mesh: ${mesh.name}`);
        
        this.walls.push(mesh);
        mesh.metadata = { isWall: true };
        mesh.receiveShadows = true;
        mesh.checkCollisions = true;
        
        // インタラクション用のタグを設定
        mesh.metadata.interactionTag = 'wall';
        
        // 壁の透明度を設定
        if (mesh.material) {
            mesh.material.alpha = 0.8;
            mesh.material.transparencyMode = BABYLON.Material.MATERIAL_ALPHABLEND;
        }
        
        this.shadowReceivers.push(mesh);
    }

    /**
     * デフォルトの床を作成
     */
    createDefaultFloor() {
        console.log("Creating default floor...");
        
        this.ground = BABYLON.MeshBuilder.CreateGround(
            "defaultGround",
            {
                width: Math.abs(this.roomBoundary.MAX_X - this.roomBoundary.MIN_X),
                height: Math.abs(this.roomBoundary.MAX_Z - this.roomBoundary.MIN_Z),
                subdivisions: 4
            },
            this.scene
        );
        
        this.ground.position.y = 0;
        this.ground.metadata = { 
            isFloor: true,
            interactionTag: 'floor'
        };
        
        // デフォルトマテリアル
        const groundMaterial = new BABYLON.StandardMaterial("groundMaterial", this.scene);
        groundMaterial.diffuseColor = new BABYLON.Color3(0.8, 0.8, 0.8);
        groundMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
        this.ground.material = groundMaterial;
        
        this.ground.receiveShadows = true;
        this.ground.checkCollisions = true;
        
        this.shadowReceivers.push(this.ground);
        this.roomMeshes.push(this.ground);
    }

    /**
     * 影受け取り用の透明床を作成
     */
    createShadowFloor() {
        const shadowGround = BABYLON.MeshBuilder.CreateGround(
            "shadowGround",
            {
                width: 50,
                height: 50,
                subdivisions: 4
            },
            this.scene
        );
        
        shadowGround.position.y = 0.001;
        shadowGround.isPickable = false;
        
        // 透明なマテリアル
        const shadowMaterial = new BABYLON.StandardMaterial("shadowMaterial", this.scene);
        shadowMaterial.alpha = 0.01;
        shadowMaterial.diffuseColor = new BABYLON.Color3(1, 1, 1);
        shadowMaterial.backFaceCulling = false;
        shadowGround.material = shadowMaterial;
        
        shadowGround.receiveShadows = true;
        this.shadowReceivers.push(shadowGround);
    }

    /**
     * 影の設定
     */
    setupShadows() {
        // 床以外のオブジェクトは影を落とす
        this.roomMeshes.forEach(mesh => {
            if (mesh !== this.ground && !mesh.metadata?.isFloor) {
                this.shadowCasters.push(mesh);
            }
        });
    }

    /**
     * 境界ヘルパーを作成（デバッグ用）
     */
    createBoundaryHelper() {
        const boundaryLines = [];
        
        // 床面の境界線
        const points = [
            new BABYLON.Vector3(this.roomBoundary.MIN_X, this.roomBoundary.MIN_Y, this.roomBoundary.MIN_Z),
            new BABYLON.Vector3(this.roomBoundary.MAX_X, this.roomBoundary.MIN_Y, this.roomBoundary.MIN_Z),
            new BABYLON.Vector3(this.roomBoundary.MAX_X, this.roomBoundary.MIN_Y, this.roomBoundary.MAX_Z),
            new BABYLON.Vector3(this.roomBoundary.MIN_X, this.roomBoundary.MIN_Y, this.roomBoundary.MAX_Z),
            new BABYLON.Vector3(this.roomBoundary.MIN_X, this.roomBoundary.MIN_Y, this.roomBoundary.MIN_Z)
        ];
        
        const boundaryLine = BABYLON.MeshBuilder.CreateLines(
            "boundaryLine",
            { points: points },
            this.scene
        );
        
        boundaryLine.color = new BABYLON.Color3(1, 0, 0);
        boundaryLine.isPickable = false;
        
        return boundaryLine;
    }

    // ゲッターメソッド
    getGround() { return this.ground; }
    getWalls() { return this.walls; }
    getRoomMeshes() { return this.roomMeshes; }
    getRoomBoundary() { return this.roomBoundary; }
    getShadowReceivers() { return this.shadowReceivers; }
    getShadowCasters() { return this.shadowCasters; }
}