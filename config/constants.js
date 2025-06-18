// js/config/Constants.js
/**
 * アプリケーション全体で使用する定数
 */

// アセットのURL
export const ASSET_URLS = {
    ROOM: "https://raw.githubusercontent.com/yugovic/test/main/RoomEmpty.glb",
    BURGER: "https://raw.githubusercontent.com/yugovic/test/main/Burger.glb",
    RECORD_MACHINE: "https://raw.githubusercontent.com/yugovic/test/main/RecordMachine.glb",
    JUICE_BOX: "https://raw.githubusercontent.com/yugovic/test/main/juice_boxv3.glb",
    FLARE_TEXTURE: "https://assets.babylonjs.com/textures/flare.png"
};

// アセットタイプ
export const ASSET_TYPES = {
    CUBE: 'cube',       // バーガー
    RECORD: 'record',   // レコードマシン
    JUICE_BOX: 'juiceBox',
    MIKE_DESK: 'mikeDesk'
};

// 部屋の境界
export const ROOM_BOUNDARY = {
    MIN_X: -9,
    MAX_X: 9,
    MIN_Z: -9,
    MAX_Z: 9,
    MIN_Y: 0.1,  // 床面より少し上
    MAX_Y: 5.0   // 天井の高さ
};

// カメラ設定
export const CAMERA_SETTINGS = {
    // デフォルトカメラ設定（アイソメトリック）
    DEFAULT: {
        ALPHA: -Math.PI / 4,    // -45度
        BETA: Math.PI / 4,      // 45度
        RADIUS: 20,             // 最大値に設定
        TARGET: { x: 0, y: 1, z: 0 }  // Y座標を上げて画面中央に表示
    },
    
    // カメラ制限
    LIMITS: {
        MIN_RADIUS: 10,
        MAX_RADIUS: 25,
        MIN_BETA: 0.1,
        MAX_BETA: Math.PI / 2,
        MIN_Z: 0.01,
        MAX_Z: 1000
    },
    
    // 1人称カメラ設定
    FIRST_PERSON: {
        EYE_HEIGHT: 1.6,  // 人間の平均的な目線の高さ（メートル）
        SPEED: 0.2,
        ANGULAR_SENSIBILITY: 500,
        INERTIA: 0.5,
        ELLIPSOID: { x: 0.5, y: 0.8, z: 0.5 }  // 人間の体の大きさ
    }
};

// グリッド設定
export const GRID_SETTINGS = {
    SIZE: 2,  // グリッドのサイズ
    MAJOR_UNIT_FREQUENCY: 5,
    MINOR_UNIT_VISIBILITY: 0.45,
    OPACITY: 0.5,
    COLORS: {
        MAIN: { r: 0.2, g: 0.8, b: 0.8 },
        SECONDARY: { r: 0.2, g: 0.4, b: 0.8 }
    }
};

// 照明設定
export const LIGHTING_SETTINGS = {
    AMBIENT: {
        INTENSITY: 0.6,
        DIFFUSE: { r: 0.7, g: 0.8, b: 1.0 },
        SPECULAR: { r: 0.1, g: 0.1, b: 0.15 },
        GROUND_COLOR: { r: 0.2, g: 0.2, b: 0.3 }
    },
    DIRECTIONAL: {
        INTENSITY: 1.0,
        POSITION: { x: -20, y: 40, z: -20 },
        DIRECTION: { x: -0.329292799969871, y: -0.768349381992783325, z: -0.548821299944517 },
        SPECULAR: { r: 0.1, g: 0.1, b: 0.15 }
    },
    POINT_LIGHTS: {
        LIGHT1: {
            POSITION: { x: 5, y: 8, z: 5 },
            DIFFUSE: { r: 0.2, g: 0.4, b: 0.8 },
            INTENSITY: 0.3,
            RADIUS: 20
        },
        LIGHT2: {
            POSITION: { x: -5, y: 8, z: -5 },
            DIFFUSE: { r: 0.8, g: 0.2, b: 0.5 },
            INTENSITY: 0.3,
            RADIUS: 20
        }
    }
};

// 影の設定
export const SHADOW_SETTINGS = {
    RESOLUTION: 4096,
    USE_BLUR: false,
    USE_PCF: true,
    QUALITY: 'HIGH',
    BIAS: 0.0001,
    NORMAL_BIAS: 0.005,
    DARKNESS: 0.7,
    DEPTH_SCALE: 30,
    FRUSTUM_EDGE_FALLOFF: 0.1
};

// モデルのスケール設定
export const MODEL_SCALES = {
    ROOM: { x: 0.1, y: 0.1, z: 0.1 },
    BURGER: { x: 0.5, y: 0.5, z: 0.5 },
    RECORD: { x: 0.1, y: 0.1, z: 0.1 },
    JUICE_BOX: { x: 0.1, y: 0.1, z: 0.1 },
    MIKE_DESK: { x: 0.3, y: 0.3, z: 0.3 }
};

// UI設定
export const UI_SETTINGS = {
    ZOOM: {
        MIN: 0.5,
        MAX: 2.0,
        STEP: 0.1,
        DEFAULT: 1.0
    },
    PARTICLE_EFFECT: {
        COUNT: 50,
        MIN_LIFETIME: 0.3,
        MAX_LIFETIME: 0.7,
        EMIT_RATE: 100,
        UPDATE_SPEED: 0.01
    }
};

// キーボード設定
export const KEYBOARD_SETTINGS = {
    FORWARD: 'KeyW',
    BACKWARD: 'KeyS',
    LEFT: 'KeyA',
    RIGHT: 'KeyD',
    UP: 'Space',
    DOWN: 'KeyC',
    SPRINT: 'ShiftLeft',
    WALK: 'ControlLeft'
};

// 移動速度
export const MOVEMENT_SPEEDS = {
    NORMAL: 4.0,
    SPRINT: 8.0,
    WALK: 2.0,
    FORWARD_MULTIPLIER: 2.0  // 前後移動は左右より速い
};