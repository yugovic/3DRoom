// js/config/DefaultSettings.js
/**
 * アプリケーションのデフォルト設定
 */

export const DEFAULT_SETTINGS = {
    // グリッド設定
    grid: {
        size: 1.0,
        show: true,
        snapToGrid: true
    },
    
    // ズーム設定
    zoom: {
        level: 1.0
    },
    
    // ライティング設定
    lighting: {
        ambient: {
            intensity: 0.8,
            color: '#b3ccff'
        },
        directional: {
            intensity: 0.6,
            position: { x: -20, y: 40, z: -20 }
        },
        pointLight1: {
            intensity: 0.4,
            color: '#3366cc',
            position: { x: 5, y: 8, z: 5 }
        },
        pointLight2: {
            intensity: 0.4,
            color: '#cc3380',
            position: { x: -5, y: 8, z: -5 }
        },
        shadow: {
            darkness: 0.2
        },
        reduceShininess: true
    },
    
    // カメラ設定
    camera: {
        mode: 'isometric',  // 'isometric' or 'firstPerson'
        wheelPrecision: 10,
        panningSensibility: 0
    },
    
    // 環境設定
    environment: {
        backgroundColor: { r: 0, g: 0, b: 0, a: 0 },  // 透明
        ambientColor: { r: 0.3, g: 0.3, b: 0.3 },
        useRightHandedSystem: true
    },
    
    // エンジン設定
    engine: {
        antialiasing: true,
        hardwareScalingLevel: 1.0,
        alphaMode: 'DISABLE'
    },
    
    // デバッグ設定
    debug: {
        showCameraInfo: false,
        showBoundaryHelper: false,
        logPerformance: false
    }
};