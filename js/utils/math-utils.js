// js/utils/MathUtils.js
/**
 * 数学関連のユーティリティ関数
 */

import { ROOM_BOUNDARY } from '../config/constants.js';

/**
 * 位置をグリッドにスナップする
 * @param {BABYLON.Vector3} position - 元の位置
 * @param {number} gridSize - グリッドサイズ
 * @returns {BABYLON.Vector3} スナップされた位置
 */
export function snapPositionToGrid(position, gridSize) {
    if (gridSize <= 0) return position.clone();
    
    const snappedPosition = position.clone();
    snappedPosition.x = Math.round(position.x / gridSize) * gridSize;
    snappedPosition.z = Math.round(position.z / gridSize) * gridSize;
    return snappedPosition;
}

/**
 * 位置が部屋の内側にあるかチェック
 * @param {BABYLON.Vector3} position - チェックする位置
 * @param {boolean} isWallPlacement - 壁配置かどうか
 * @param {Object} roomBoundary - 部屋の境界（オプション）
 * @returns {boolean} 部屋の内側にあるかどうか
 */
export function isPositionInsideRoom(position, isWallPlacement = false, roomBoundary = ROOM_BOUNDARY) {
    console.log("位置チェック:", {
        position: position,
        roomBoundary: roomBoundary,
        isWallPlacement: isWallPlacement
    });
    
    // 壁に配置する場合は特別な判定を行う
    if (isWallPlacement) {
        const wallTolerance = 0.5;
        
        // X方向の壁に近いか
        const nearXWall = 
            Math.abs(position.x - roomBoundary.MIN_X) <= wallTolerance || 
            Math.abs(position.x - roomBoundary.MAX_X) <= wallTolerance;
            
        // Z方向の壁に近いか
        const nearZWall = 
            Math.abs(position.z - roomBoundary.MIN_Z) <= wallTolerance || 
            Math.abs(position.z - roomBoundary.MAX_Z) <= wallTolerance;
        
        // Y座標が適切な範囲内か
        const validYPos = position.y >= 0 && position.y <= 15;
        
        if ((nearXWall || nearZWall) && validYPos) {
            console.log("壁配置のための特別な室内判定を行いました:", position);
            return true;
        }
    }
    
    // 通常の判定
    const isInside = position.x > roomBoundary.MIN_X && 
                     position.x < roomBoundary.MAX_X && 
                     position.z > roomBoundary.MIN_Z && 
                     position.z < roomBoundary.MAX_Z;
    
    console.log("境界チェック結果:", {
        isInside: isInside,
        x: position.x,
        z: position.z,
        xRange: [roomBoundary.MIN_X, roomBoundary.MAX_X],
        zRange: [roomBoundary.MIN_Z, roomBoundary.MAX_Z]
    });
    
    return isInside;
}

/**
 * 位置を部屋の境界内に制限する
 * @param {BABYLON.Vector3} position - 元の位置
 * @param {Object} roomBoundary - 部屋の境界（オプション）
 * @returns {BABYLON.Vector3} 制限された位置
 */
export function constrainPositionToRoomBoundary(position, roomBoundary = ROOM_BOUNDARY) {
    const constrained = position.clone();
    
    // X座標を境界内に制限
    constrained.x = Math.max(roomBoundary.MIN_X, Math.min(roomBoundary.MAX_X, constrained.x));
    
    // Z座標を境界内に制限
    constrained.z = Math.max(roomBoundary.MIN_Z, Math.min(roomBoundary.MAX_Z, constrained.z));
    
    return constrained;
}

/**
 * レイと床平面の交点を計算
 * @param {BABYLON.Ray} ray - レイ
 * @param {number} floorY - 床のY座標
 * @returns {BABYLON.Vector3|null} 交点または null
 */
export function calculateRayFloorIntersection(ray, floorY = 0) {
    const worldOrigin = ray.origin;
    const worldDirection = ray.direction;
    
    // ゼロ除算を防ぐ
    if (Math.abs(worldDirection.y) < 0.001) {
        return null;
    }
    
    const t = (floorY - worldOrigin.y) / worldDirection.y;
    
    // 視点より前方
    if (t >= 0) {
        return worldOrigin.add(worldDirection.scale(t));
    }
    
    return null;
}

/**
 * 2つのベクトル間の角度を計算（ラジアン）
 * @param {BABYLON.Vector3} v1 - ベクトル1
 * @param {BABYLON.Vector3} v2 - ベクトル2
 * @returns {number} 角度（ラジアン）
 */
export function angleBetweenVectors(v1, v2) {
    const dot = BABYLON.Vector3.Dot(v1.normalize(), v2.normalize());
    return Math.acos(Math.max(-1, Math.min(1, dot)));
}

/**
 * ベクトルを水平面に投影
 * @param {BABYLON.Vector3} vector - 元のベクトル
 * @returns {BABYLON.Vector3} 水平面に投影されたベクトル
 */
export function projectToHorizontalPlane(vector) {
    return new BABYLON.Vector3(vector.x, 0, vector.z).normalize();
}

/**
 * 度をラジアンに変換
 * @param {number} degrees - 度
 * @returns {number} ラジアン
 */
export function degreesToRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * ラジアンを度に変換
 * @param {number} radians - ラジアン
 * @returns {number} 度
 */
export function radiansToDegrees(radians) {
    return radians * (180 / Math.PI);
}

/**
 * 値を指定範囲内に制限
 * @param {number} value - 値
 * @param {number} min - 最小値
 * @param {number} max - 最大値
 * @returns {number} 制限された値
 */
export function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

/**
 * 線形補間
 * @param {number} start - 開始値
 * @param {number} end - 終了値
 * @param {number} t - 補間係数 (0-1)
 * @returns {number} 補間された値
 */
export function lerp(start, end, t) {
    return start + (end - start) * t;
}

/**
 * Vector3の線形補間
 * @param {BABYLON.Vector3} start - 開始位置
 * @param {BABYLON.Vector3} end - 終了位置
 * @param {number} t - 補間係数 (0-1)
 * @returns {BABYLON.Vector3} 補間された位置
 */
export function lerpVector3(start, end, t) {
    return new BABYLON.Vector3(
        lerp(start.x, end.x, t),
        lerp(start.y, end.y, t),
        lerp(start.z, end.z, t)
    );
}