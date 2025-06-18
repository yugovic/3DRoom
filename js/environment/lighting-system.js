// js/environment/LightingSystem.js
/**
 * 照明と影のシステムを管理するクラス
 */

import { LIGHTING_SETTINGS, SHADOW_SETTINGS } from '../config/constants.js';
import { DEFAULT_SETTINGS } from '../config/default-settings.js';
import { hexToColor3 } from '../utils/color-utils.js';

export class LightingSystem {
    constructor(scene, errorHandler) {
        this.scene = scene;
        this.errorHandler = errorHandler;
        
        // ライト
        this.ambientLight = null;
        this.directionalLight = null;
        this.pointLight1 = null;
        this.pointLight2 = null;
        
        // シャドウジェネレーター
        this.shadowGenerator = null;
        
        // 設定
        this.settings = {
            ambient: { ...DEFAULT_SETTINGS.lighting.ambient },
            directional: { ...DEFAULT_SETTINGS.lighting.directional },
            pointLight1: { ...DEFAULT_SETTINGS.lighting.pointLight1 },
            pointLight2: { ...DEFAULT_SETTINGS.lighting.pointLight2 },
            shadow: { ...DEFAULT_SETTINGS.lighting.shadow },
            reduceShininess: DEFAULT_SETTINGS.lighting.reduceShininess
        };
    }

    /**
     * ライティングをセットアップ
     */
    setupLights() {
        try {
            // 環境光を作成
            this.createAmbientLight();
            
            // 方向光源を作成
            this.createDirectionalLight();
            
            // ポイントライトを作成
            this.createPointLights();
            
            // 影の設定
            this.setupShadows();
            
            // メタリック効果を調整
            if (this.settings.reduceShininess) {
                setTimeout(() => {
                    this.adjustMaterialShininess(true);
                }, 1000);
            }
            
            console.log("Lighting system setup complete");
            
        } catch (error) {
            this.errorHandler.handleCriticalError(error, 'LightingSystem.setupLights');
        }
    }

    /**
     * 環境光を作成
     */
    createAmbientLight() {
        this.ambientLight = new BABYLON.HemisphericLight(
            "ambientLight", 
            new BABYLON.Vector3(0, 1, 0), 
            this.scene
        );
        
        const ambientSettings = LIGHTING_SETTINGS.AMBIENT;
        this.ambientLight.intensity = this.settings.ambient.intensity;
        this.ambientLight.diffuse = hexToColor3(this.settings.ambient.color);
        this.ambientLight.specular = new BABYLON.Color3(
            ambientSettings.SPECULAR.r,
            ambientSettings.SPECULAR.g,
            ambientSettings.SPECULAR.b
        );
        this.ambientLight.groundColor = new BABYLON.Color3(
            ambientSettings.GROUND_COLOR.r,
            ambientSettings.GROUND_COLOR.g,
            ambientSettings.GROUND_COLOR.b
        );
        
        console.log("Ambient light created");
    }

    /**
     * 方向光源を作成
     */
    createDirectionalLight() {
        const dirSettings = LIGHTING_SETTINGS.DIRECTIONAL;
        
        this.directionalLight = new BABYLON.DirectionalLight(
            "dirLight",
            new BABYLON.Vector3(
                dirSettings.DIRECTION.x,
                dirSettings.DIRECTION.y,
                dirSettings.DIRECTION.z
            ),
            this.scene
        );
        
        this.directionalLight.position = new BABYLON.Vector3(
            this.settings.directional.position.x,
            this.settings.directional.position.y,
            this.settings.directional.position.z
        );
        
        this.directionalLight.intensity = this.settings.directional.intensity;
        this.directionalLight.specular = new BABYLON.Color3(
            dirSettings.SPECULAR.r,
            dirSettings.SPECULAR.g,
            dirSettings.SPECULAR.b
        );
        
        // 影の投影設定
        this.directionalLight.shadowMinZ = 1;
        this.directionalLight.shadowMaxZ = 100;
        this.directionalLight.autoUpdateExtends = true;
        this.directionalLight.shadowOrthoScale = 0.5;
        
        console.log("Directional light created");
    }

    /**
     * ポイントライトを作成
     */
    createPointLights() {
        // ポイントライト1
        const pl1Settings = LIGHTING_SETTINGS.POINT_LIGHTS.LIGHT1;
        this.pointLight1 = new BABYLON.PointLight(
            "pointLight1",
            new BABYLON.Vector3(
                this.settings.pointLight1.position.x,
                this.settings.pointLight1.position.y,
                this.settings.pointLight1.position.z
            ),
            this.scene
        );
        
        this.pointLight1.diffuse = hexToColor3(this.settings.pointLight1.color);
        this.pointLight1.specular = new BABYLON.Color3(0.1, 0.1, 0.2);
        this.pointLight1.intensity = this.settings.pointLight1.intensity;
        this.pointLight1.radius = pl1Settings.RADIUS;
        
        // ポイントライト2
        const pl2Settings = LIGHTING_SETTINGS.POINT_LIGHTS.LIGHT2;
        this.pointLight2 = new BABYLON.PointLight(
            "pointLight2",
            new BABYLON.Vector3(
                this.settings.pointLight2.position.x,
                this.settings.pointLight2.position.y,
                this.settings.pointLight2.position.z
            ),
            this.scene
        );
        
        this.pointLight2.diffuse = hexToColor3(this.settings.pointLight2.color);
        this.pointLight2.specular = new BABYLON.Color3(0.1, 0.1, 0.2);
        this.pointLight2.intensity = this.settings.pointLight2.intensity;
        this.pointLight2.radius = pl2Settings.RADIUS;
        
        console.log("Point lights created");
    }

    /**
     * 影の設定
     */
    setupShadows() {
        try {
            const shadowSettings = SHADOW_SETTINGS;
            
            this.shadowGenerator = new BABYLON.ShadowGenerator(
                shadowSettings.RESOLUTION, 
                this.directionalLight
            );
            
            // シャドウマップの設定
            this.shadowGenerator.useBlurExponentialShadowMap = shadowSettings.USE_BLUR;
            this.shadowGenerator.usePoissonSampling = false;
            
            // PCFフィルタリング
            if (shadowSettings.USE_PCF) {
                this.shadowGenerator.usePercentageCloserFiltering = true;
                this.shadowGenerator.filteringQuality = BABYLON.ShadowGenerator.QUALITY_HIGH;
            }
            
            // パラメータ設定
            this.shadowGenerator.bias = shadowSettings.BIAS;
            this.shadowGenerator.normalBias = shadowSettings.NORMAL_BIAS;
            this.shadowGenerator.darkness = this.settings.shadow.darkness;
            this.shadowGenerator.depthScale = shadowSettings.DEPTH_SCALE;
            
            // その他の設定
            this.shadowGenerator.useContactHardeningShadow = false;
            this.shadowGenerator.useExponentialShadowMap = true;
            this.shadowGenerator.useKernelBlur = false;
            this.shadowGenerator.enableSoftTransparentShadow = true;
            this.shadowGenerator.transparencyShadow = true;
            this.shadowGenerator.forceBackFacesOnly = false;
            this.shadowGenerator.frustumEdgeFalloff = shadowSettings.FRUSTUM_EDGE_FALLOFF;
            
            console.log("Shadow generator setup complete");
            
            // 新しいメッシュが追加されたときの処理
            this.setupShadowCasterObserver();
            
        } catch (error) {
            this.errorHandler.showWarning("影の設定に失敗しました: " + error.message);
        }
    }

    /**
     * シャドウキャスターの監視を設定
     */
    setupShadowCasterObserver() {
        this.scene.onNewMeshAddedObservable.add(mesh => {
            // ユーザーが配置したオブジェクトかチェック
            if (this.isUserPlacedObject(mesh)) {
                this.addShadowCaster(mesh);
            }
        });
    }

    /**
     * ユーザーが配置したオブジェクトかチェック
     * @param {BABYLON.Mesh} mesh - メッシュ
     * @returns {boolean}
     */
    isUserPlacedObject(mesh) {
        return mesh.name.startsWith("cube_") || 
               mesh.name.startsWith("recordMachine_") ||
               mesh.name.startsWith("juiceBox_") || 
               mesh.name.startsWith("mikeDesk_") ||
               mesh.name.startsWith("burger_") ||
               (mesh.parent && (
                   mesh.parent.name.startsWith("recordMachine_") || 
                   mesh.parent.name.startsWith("juiceBox_") ||
                   mesh.parent.name.startsWith("burger_") ||
                   mesh.parent.name.startsWith("mikeDesk_")
               ));
    }

    /**
     * シャドウキャスターを追加
     * @param {BABYLON.Mesh} mesh - メッシュ
     */
    addShadowCaster(mesh) {
        if (!this.shadowGenerator) return;
        
        try {
            // 既に登録されている場合は削除
            this.shadowGenerator.removeShadowCaster(mesh);
        } catch (e) {
            // 初回は存在しないのでエラーは無視
        }
        
        // 影を生成するメッシュとして登録
        this.shadowGenerator.addShadowCaster(mesh, true);
        console.log("Added shadow caster:", mesh.name);
        
        // シーンを再レンダリング
        setTimeout(() => {
            this.scene.render();
        }, 100);
    }

    /**
     * シャドウレシーバーを設定
     * @param {Array<BABYLON.Mesh>} receivers - 影を受け取るメッシュの配列
     */
    setShadowReceivers(receivers) {
        receivers.forEach(mesh => {
            if (!mesh.receiveShadows) {
                mesh.receiveShadows = true;
                
                // 床用の最適化
                if (mesh.name === "ground" || mesh.name === "shadowFloor") {
                    mesh.useShadowDepthMaterial = true;
                }
            }
        });
        
        console.log(`Set ${receivers.length} shadow receivers`);
    }

    /**
     * シャドウキャスターを設定
     * @param {Array<BABYLON.Mesh>} casters - 影を生成するメッシュの配列
     */
    setShadowCasters(casters) {
        if (!this.shadowGenerator) return;
        
        casters.forEach(mesh => {
            this.addShadowCaster(mesh);
        });
        
        console.log(`Set ${casters.length} shadow casters`);
    }

    /**
     * マテリアルの反射を調整
     * @param {boolean} reduce - 反射を抑えるかどうか
     */
    adjustMaterialShininess(reduce) {
        this.scene.meshes.forEach(mesh => {
            if (!mesh.material) return;
            
            if (reduce) {
                // メタリック効果を抑える
                mesh.material.specularColor = new BABYLON.Color3(0.1, 0.1, 0.1);
                mesh.material.specularPower = 1;
                
                // PBRマテリアルの場合
                if (mesh.material.metallicF0Factor !== undefined) {
                    mesh.material.metallicF0Factor = 0.1;
                }
                if (mesh.material.roughness !== undefined) {
                    mesh.material.roughness = 0.9;
                }
            } else {
                // デフォルトの反射設定に戻す
                mesh.material.specularColor = new BABYLON.Color3(0.2, 0.2, 0.2);
                mesh.material.specularPower = 64;
                
                if (mesh.material.metallicF0Factor !== undefined) {
                    mesh.material.metallicF0Factor = 0.5;
                }
                if (mesh.material.roughness !== undefined) {
                    mesh.material.roughness = 0.4;
                }
            }
        });
        
        // 光源の反射も調整
        this.adjustLightSpecular(reduce);
    }

    /**
     * 光源の反射を調整
     * @param {boolean} reduce - 反射を抑えるかどうか
     */
    adjustLightSpecular(reduce) {
        if (this.ambientLight) {
            this.ambientLight.specular = reduce 
                ? new BABYLON.Color3(0.1, 0.1, 0.15) 
                : new BABYLON.Color3(0.2, 0.2, 0.3);
        }
        
        if (this.directionalLight) {
            this.directionalLight.specular = reduce 
                ? new BABYLON.Color3(0.1, 0.1, 0.15) 
                : new BABYLON.Color3(1, 1, 1);
        }
        
        [this.pointLight1, this.pointLight2].forEach(light => {
            if (light) {
                light.specular = reduce 
                    ? new BABYLON.Color3(0.1, 0.1, 0.2) 
                    : new BABYLON.Color3(1, 1, 1);
            }
        });
    }

    /**
     * 設定を更新
     * @param {string} lightType - ライトの種類
     * @param {string} property - プロパティ名
     * @param {any} value - 値
     */
    updateSetting(lightType, property, value) {
        if (!this.settings[lightType]) return;
        
        this.settings[lightType][property] = value;
        
        // 実際のライトに反映
        switch (lightType) {
            case 'ambient':
                this.updateAmbientLight(property, value);
                break;
            case 'directional':
                this.updateDirectionalLight(property, value);
                break;
            case 'pointLight1':
                this.updatePointLight(this.pointLight1, property, value);
                break;
            case 'pointLight2':
                this.updatePointLight(this.pointLight2, property, value);
                break;
            case 'shadow':
                this.updateShadow(property, value);
                break;
        }
    }

    /**
     * 環境光を更新
     */
    updateAmbientLight(property, value) {
        if (!this.ambientLight) return;
        
        if (property === 'intensity') {
            this.ambientLight.intensity = value;
        } else if (property === 'color') {
            this.ambientLight.diffuse = hexToColor3(value);
        }
    }

    /**
     * 方向光を更新
     */
    updateDirectionalLight(property, value) {
        if (!this.directionalLight) return;
        
        if (property === 'intensity') {
            this.directionalLight.intensity = value;
        } else if (property === 'position') {
            this.directionalLight.position = new BABYLON.Vector3(
                value.x, value.y, value.z
            );
            this.updateShadowCaster();
        }
    }

    /**
     * ポイントライトを更新
     */
    updatePointLight(light, property, value) {
        if (!light) return;
        
        if (property === 'intensity') {
            light.intensity = value;
        } else if (property === 'color') {
            light.diffuse = hexToColor3(value);
        } else if (property === 'position') {
            light.position = new BABYLON.Vector3(value.x, value.y, value.z);
        }
    }

    /**
     * 影を更新
     */
    updateShadow(property, value) {
        if (!this.shadowGenerator) return;
        
        if (property === 'darkness') {
            this.shadowGenerator.darkness = value;
        }
    }

    /**
     * シャドウキャスターを更新
     */
    updateShadowCaster() {
        if (!this.shadowGenerator || !this.directionalLight) return;
        
        // 方向光の投影方向を更新
        const lightDirection = new BABYLON.Vector3(
            LIGHTING_SETTINGS.DIRECTIONAL.DIRECTION.x,
            LIGHTING_SETTINGS.DIRECTIONAL.DIRECTION.y,
            LIGHTING_SETTINGS.DIRECTIONAL.DIRECTION.z
        );
        this.directionalLight.direction = lightDirection;
        
        // 影のパラメーターを調整
        const dirLightPosition = this.directionalLight.position;
        const distanceFromCenter = Math.sqrt(
            dirLightPosition.x * dirLightPosition.x + 
            dirLightPosition.z * dirLightPosition.z
        );
        
        const distanceFactor = Math.min(1, 20 / Math.max(10, distanceFromCenter));
        const heightFactor = Math.min(1, 40 / Math.max(20, dirLightPosition.y));
        
        this.shadowGenerator.darkness = this.settings.shadow.darkness * distanceFactor;
        this.shadowGenerator.bias = SHADOW_SETTINGS.BIAS * (1 / heightFactor);
        
        console.log("Shadow caster updated");
    }

    /**
     * 現在の設定を取得
     * @returns {Object} 設定オブジェクト
     */
    getSettings() {
        return JSON.parse(JSON.stringify(this.settings));
    }

    /**
     * シャドウジェネレーターを取得
     * @returns {BABYLON.ShadowGenerator}
     */
    getShadowGenerator() {
        return this.shadowGenerator;
    }

    /**
     * クリーンアップ
     */
    dispose() {
        console.log("Disposing LightingSystem...");
        
        // シャドウジェネレーターを破棄
        if (this.shadowGenerator) {
            this.shadowGenerator.dispose();
            this.shadowGenerator = null;
        }
        
        // ライトを破棄
        [this.ambientLight, this.directionalLight, this.pointLight1, this.pointLight2]
            .forEach(light => {
                if (light) {
                    light.dispose();
                }
            });
        
        this.ambientLight = null;
        this.directionalLight = null;
        this.pointLight1 = null;
        this.pointLight2 = null;
    }
}