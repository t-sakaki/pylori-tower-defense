/**
 * ピロリ菌タワーディフェンス 2D→3D移行サンプル (Three.js)
 *
 * 前提:
 *  - Blenderで生成した Stage_Tunnel / HPylori_Enemy / Tower_Antibiotic を
 *    glTF (.glb) でエクスポートし、loader で読み込んで使う想定。
 *  - 既存の2Dロジック(HP, 攻撃力, 出現ウェーブ制御など)は変更不要。
 *    変更が必要なのは「座標」「移動」「範囲判定」の3点のみ。
 *
 * npm install three
 */

import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { CatmullRomCurve3 } from "three";

// ---------------------------------------------------------------------------
// 1. 経路(Path)の定義: 2Dのウェイポイント配列を3Dスプラインに変換
// ---------------------------------------------------------------------------

// 2D版の元データ例: const path2D = [[-10,0], [-5,2], [0,-1], [5,3], [10,0]];
// これをBlenderのトンネル形状に沿うよう Z(高さ)を足して3D化する。
const waypoints2D = [
  [-10, 0], [-6, 1.5], [-2, -1], [2, 1], [6, -1.5], [10, 0],
];

function buildPathFromWaypoints2D(points2D, groundY = 0.4) {
  const points3D = points2D.map(([x, y]) => new THREE.Vector3(x, groundY, y));
  // Catmull-Romでスプライン補間 -> 敵はこの上をパラメータtで移動する
  return new CatmullRomCurve3(points3D, false, "catmullrom", 0.5);
}

const enemyPath = buildPathFromWaypoints2D(waypoints2D);

// ---------------------------------------------------------------------------
// 2. 敵の移動ロジック: 2Dの "t を進めて位置を求める" ロジックをそのまま流用
// ---------------------------------------------------------------------------

class Enemy3D {
  /**
   * @param {THREE.Object3D} mesh - Blenderからインポートした HPylori_Enemy
   * @param {THREE.Curve} path - 3D化された移動経路
   * @param {number} speed - 2D時代と同じ「進行度/秒」の値をそのまま使える
   */
  constructor(mesh, path, speed) {
    this.mesh = mesh;
    this.path = path;
    this.speed = speed; // 0〜1のt値を1秒あたりどれだけ進めるか
    this.t = 0;
    this.hp = 100; // 2Dロジックのステータスはそのまま持ち越し
    this.isDead = false;
  }

  update(deltaTime) {
    if (this.isDead) return;

    this.t += this.speed * deltaTime;
    if (this.t >= 1) {
      this.onReachEnd();
      return;
    }

    const position = this.path.getPointAt(this.t);
    this.mesh.position.copy(position);

    // 進行方向を向かせる(2Dでは不要だった処理、3Dでは接線ベクトルを使う)
    const tangent = this.path.getTangentAt(this.t);
    const lookTarget = position.clone().add(tangent);
    this.mesh.lookAt(lookTarget);
  }

  onReachEnd() {
    // 2D版と同じ「プレイヤーへのダメージ処理」をそのまま呼び出す
    console.log("敵が最深部に到達: プレイヤーへダメージ");
    this.isDead = true;
  }

  takeDamage(amount) {
    this.hp -= amount; // ロジックは2D時代と完全に同一
    if (this.hp <= 0) this.isDead = true;
  }
}

// ---------------------------------------------------------------------------
// 3. タワーの攻撃範囲判定: 2Dの円判定を3DのXZ平面距離判定に変換
// ---------------------------------------------------------------------------

class Tower3D {
  constructor(mesh, range, damage, fireInterval) {
    this.mesh = mesh;
    this.range = range;       // 2D時代のrange値をそのまま使用可能
    this.damage = damage;
    this.fireInterval = fireInterval;
    this.cooldown = 0;
    this.turret = mesh.getObjectByName("Tower_Antibiotic_Capsule") || mesh;
  }

  // 2D: distance(tower.xy, enemy.xy) < range
  // 3D: 高さ(Y)を無視してXZ平面のみで距離判定 = 2Dロジックとほぼ同じ式で書ける
  isInRange(enemy) {
    const dx = this.mesh.position.x - enemy.mesh.position.x;
    const dz = this.mesh.position.z - enemy.mesh.position.z;
    const distXZ = Math.sqrt(dx * dx + dz * dz);
    return distXZ <= this.range;
  }

  findTarget(enemies) {
    // 最も進行度(t)が高い敵を狙う、というロジックも2D版からそのまま移植可能
    let best = null;
    for (const enemy of enemies) {
      if (enemy.isDead) continue;
      if (this.isInRange(enemy) && (!best || enemy.t > best.t)) {
        best = enemy;
      }
    }
    return best;
  }

  update(deltaTime, enemies) {
    this.cooldown -= deltaTime;
    const target = this.findTarget(enemies);
    if (target) {
      // タレットを敵の方向へ回転(2Dでは不要だった視覚演出)
      this.turret.lookAt(target.mesh.position);
    }
    if (target && this.cooldown <= 0) {
      target.takeDamage(this.damage);
      this.cooldown = this.fireInterval;
      // ここでビーム/弾のVFXを再生
    }
  }
}

// ---------------------------------------------------------------------------
// 4. アセット読み込みとシーン構築
// ---------------------------------------------------------------------------

async function loadGLTF(loader, url) {
  return new Promise((resolve, reject) => {
    loader.load(url, (gltf) => resolve(gltf.scene), undefined, reject);
  });
}

async function initScene() {
  const scene = new THREE.Scene();
  const loader = new GLTFLoader();

  const stage = await loadGLTF(loader, "/assets/stage_tunnel.glb");
  scene.add(stage);

  const enemies = [];
  const enemyTemplate = await loadGLTF(loader, "/assets/hpylori_enemy.glb");
  for (let i = 0; i < 5; i++) {
    const mesh = enemyTemplate.clone(true);
    scene.add(mesh);
    enemies.push(new Enemy3D(mesh, enemyPath, 0.08 + i * 0.01));
  }

  const towers = [];
  const towerTemplate = await loadGLTF(loader, "/assets/tower_antibiotic.glb");
  const towerPositions = [
    [-6, 0.75, 3], [0, 0.75, -3], [6, 0.75, 3],
  ];
  for (const [x, y, z] of towerPositions) {
    const mesh = towerTemplate.clone(true);
    mesh.position.set(x, y, z);
    scene.add(mesh);
    towers.push(new Tower3D(mesh, /*range=*/4, /*damage=*/15, /*fireInterval=*/0.6));
  }

  return { scene, enemies, towers };
}

// ---------------------------------------------------------------------------
// 5. メインループ
// ---------------------------------------------------------------------------

function animate(state) {
  const clock = new THREE.Clock();

  function tick() {
    const dt = clock.getDelta();
    for (const tower of state.towers) tower.update(dt, state.enemies);
    for (const enemy of state.enemies) enemy.update(dt);

    requestAnimationFrame(tick);
  }
  tick();
}

// 使用例:
// initScene().then((state) => animate(state));

export { buildPathFromWaypoints2D, Enemy3D, Tower3D, initScene, animate };
