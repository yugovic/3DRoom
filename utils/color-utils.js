// js/utils/ColorUtils.js
/**
 * カラー関連のユーティリティ関数
 */

/**
 * 16進カラーコードをBabylon.jsのColor3に変換
 * @param {string} hexColor - #RRGGBBフォーマットの16進カラーコード
 * @returns {BABYLON.Color3} Babylon.jsのColor3オブジェクト
 */
export function hexToColor3(hexColor) {
    const r = parseInt(hexColor.substr(1, 2), 16) / 255;
    const g = parseInt(hexColor.substr(3, 2), 16) / 255;
    const b = parseInt(hexColor.substr(5, 2), 16) / 255;
    return new BABYLON.Color3(r, g, b);
}

/**
 * RGBをHEXカラーコードに変換
 * @param {number} r - 赤色成分 (0-1)
 * @param {number} g - 緑色成分 (0-1)
 * @param {number} b - 青色成分 (0-1)
 * @returns {string} #RRGGBBフォーマットの16進カラーコード
 */
export function rgbToHex(r, g, b) {
    r = Math.floor(r * 255);
    g = Math.floor(g * 255);
    b = Math.floor(b * 255);
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Color3オブジェクトをHEXカラーコードに変換
 * @param {BABYLON.Color3} color3 - Babylon.jsのColor3オブジェクト
 * @returns {string} #RRGGBBフォーマットの16進カラーコード
 */
export function color3ToHex(color3) {
    return rgbToHex(color3.r, color3.g, color3.b);
}

/**
 * 色を暗くする
 * @param {BABYLON.Color3} color - 元の色
 * @param {number} factor - 暗くする係数 (0-1, 0で黒)
 * @returns {BABYLON.Color3} 暗くした色
 */
export function darkenColor(color, factor = 0.8) {
    return new BABYLON.Color3(
        color.r * factor,
        color.g * factor,
        color.b * factor
    );
}

/**
 * 色を明るくする
 * @param {BABYLON.Color3} color - 元の色
 * @param {number} factor - 明るくする係数 (1以上)
 * @returns {BABYLON.Color3} 明るくした色（最大値1でクランプ）
 */
export function brightenColor(color, factor = 1.2) {
    return new BABYLON.Color3(
        Math.min(1, color.r * factor),
        Math.min(1, color.g * factor),
        Math.min(1, color.b * factor)
    );
}

/**
 * Color3をColor4に変換（アルファ値付き）
 * @param {BABYLON.Color3} color3 - Color3オブジェクト
 * @param {number} alpha - アルファ値 (0-1)
 * @returns {BABYLON.Color4} Color4オブジェクト
 */
export function color3ToColor4(color3, alpha = 1.0) {
    return new BABYLON.Color4(color3.r, color3.g, color3.b, alpha);
}

/**
 * プリセットカラー定義
 */
export const PRESET_COLORS = {
    // アセットカラー
    BURGER: new BABYLON.Color3(0.4, 0.6, 0.9),
    RECORD: new BABYLON.Color3(0.7, 0.3, 0.8),
    JUICE_BOX: new BABYLON.Color3(0.9, 0.7, 0.3),
    MIKE_DESK: new BABYLON.Color3(0.3, 0.8, 0.6),
    
    // UI関連カラー
    HIGHLIGHT: BABYLON.Color3.White(),
    PREVIEW_VALID: new BABYLON.Color3(0, 0.7, 1),
    PREVIEW_INVALID: new BABYLON.Color3(0.9, 0.2, 0.2),
    
    // 環境カラー
    AMBIENT_LIGHT: new BABYLON.Color3(0.7, 0.8, 1.0),
    GRID_MAIN: new BABYLON.Color3(0.2, 0.8, 0.8),
    GRID_SECONDARY: new BABYLON.Color3(0.2, 0.4, 0.8),
    
    // マテリアルカラー
    FLOOR_DEFAULT: new BABYLON.Color3(0.5, 0.5, 0.5),
    WALL_DEFAULT: new BABYLON.Color3(0.8, 0.8, 0.8),
    PLACEHOLDER: new BABYLON.Color3(0.5, 0.5, 1.0)
};