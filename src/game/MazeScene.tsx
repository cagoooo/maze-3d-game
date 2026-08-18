import { useRef, useEffect, useMemo, useCallback, memo } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { MazeData, type ItemType } from "./maze/MazeGenerator";
import { ParticleBurst, type ParticleBurstHandle } from "./ParticleBurst";

const CELL_SIZE = 4;
const WALL_UNIT = CELL_SIZE / 2;
const WALL_HEIGHT = 3.5;
const PLAYER_HEIGHT = 1.6;
const PLAYER_SPEED = 6;
const PLAYER_RADIUS = 0.6;
const ORB_COLLECT_DIST = 1.3;
const ENEMY_DAMAGE_DIST = 0.95;

function toWorld(gridPos: number) {
  return gridPos * WALL_UNIT;
}

function isWall(grid: number[][], gx: number, gz: number): boolean {
  if (gz < 0 || gz >= grid.length) return true;
  const row = grid[gz];
  if (!row || gx < 0 || gx >= row.length) return true;
  return row[gx] === 1;
}

function checkWallCollision(grid: number[][], x: number, z: number, r: number): boolean {
  const gx = Math.round(x / WALL_UNIT);
  const gz = Math.round(z / WALL_UNIT);
  const half = WALL_UNIT / 2;
  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const ngx = gx + dx;
      const ngz = gz + dz;
      if (isWall(grid, ngx, ngz)) {
        const wx = ngx * WALL_UNIT;
        const wz = ngz * WALL_UNIT;
        const nearX = Math.max(wx - half, Math.min(wx + half, x));
        const nearZ = Math.max(wz - half, Math.min(wz + half, z));
        const dist = Math.sqrt((x - nearX) ** 2 + (z - nearZ) ** 2);
        if (dist < r) return true;
      }
    }
  }
  return false;
}

function MazeWalls({ grid, width, height }: { grid: number[][]; width: number; height: number }) {
  const wallMesh = useRef<THREE.InstancedMesh>(null);

  const wallCount = useMemo(
    () => grid.flat().filter(v => v === 1).length,
    [grid]
  );

  const args = useMemo<[undefined, undefined, number]>(
    () => [undefined, undefined, wallCount],
    [wallCount]
  );

  const populateMatrices = useCallback((mesh: THREE.InstancedMesh) => {
    const matrix = new THREE.Matrix4();
    let idx = 0;
    for (let gz = 0; gz < height; gz++) {
      for (let gx = 0; gx < width; gx++) {
        if (grid[gz][gx] === 1) {
          matrix.setPosition(gx * WALL_UNIT, WALL_HEIGHT / 2, gz * WALL_UNIT);
          mesh.setMatrixAt(idx, matrix);
          idx++;
        }
      }
    }
    mesh.count = idx;
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
    mesh.computeBoundingBox();
  }, [grid, width, height]);

  const setWallMesh = useCallback((mesh: THREE.InstancedMesh | null) => {
    wallMesh.current = mesh;
    if (mesh) populateMatrices(mesh);
  }, [populateMatrices]);

  useEffect(() => {
    if (wallMesh.current) populateMatrices(wallMesh.current);
  }, [populateMatrices]);

  return (
    <group>
      <instancedMesh
        ref={setWallMesh}
        args={args}
        castShadow
        receiveShadow
        frustumCulled={false}
      >
        <boxGeometry args={[WALL_UNIT + 0.02, WALL_HEIGHT, WALL_UNIT + 0.02]} />
        <meshStandardMaterial
          color="#6a82b8"
          roughness={0.55}
          metalness={0.15}
          emissive="#2a3a66"
          emissiveIntensity={0.55}
        />
      </instancedMesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[toWorld((width - 1) / 2), -0.01, toWorld((height - 1) / 2)]} receiveShadow>
        <planeGeometry args={[toWorld(width) + 4, toWorld(height) + 4]} />
        <meshStandardMaterial color="#384a66" roughness={0.85} metalness={0.05} emissive="#0a1428" emissiveIntensity={0.5} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[toWorld((width - 1) / 2), WALL_HEIGHT + 0.01, toWorld((height - 1) / 2)]}>
        <planeGeometry args={[toWorld(width) + 4, toWorld(height) + 4]} />
        <meshStandardMaterial color="#1a2440" side={THREE.BackSide} emissive="#0a1428" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

const Orb = memo(function Orb({ position, index, collectedRef }: {
  position: [number, number, number];
  index: number;
  collectedRef: React.MutableRefObject<boolean[]>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const t = useRef(index * 0.7);

  useFrame((_, delta) => {
    const isCollected = collectedRef.current[index];
    if (groupRef.current && groupRef.current.visible === isCollected) {
      groupRef.current.visible = !isCollected;
    }
    if (isCollected) return;
    t.current += delta;
    if (meshRef.current) {
      meshRef.current.position.y = position[1] + Math.sin(t.current * 1.8) * 0.18 + 0.55;
      meshRef.current.rotation.y += delta * 1.2;
      meshRef.current.rotation.x += delta * 0.5;
    }
  });

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[0.22, 1]} />
        <meshStandardMaterial
          color="#00ccff"
          emissive="#0099ff"
          emissiveIntensity={3}
          roughness={0.05}
          metalness={0.9}
          transparent
          opacity={0.92}
        />
      </mesh>
    </group>
  );
});

const ITEM_VISUAL: Record<
  ItemType,
  { color: string; emissive: string; shape: "box" | "tetra" | "octa" | "sphere" }
> = {
  heart: { color: "#ff4477", emissive: "#aa1144", shape: "box" },
  time: { color: "#88ddff", emissive: "#3399cc", shape: "octa" },
  stealth: { color: "#cccccc", emissive: "#888888", shape: "sphere" },
  map: { color: "#ffcc55", emissive: "#cc8800", shape: "tetra" },
  speed: { color: "#ffee44", emissive: "#aa8800", shape: "octa" },
};

const Item = memo(function Item({
  position,
  index,
  type,
  collectedRef,
}: {
  position: [number, number, number];
  index: number;
  type: ItemType;
  collectedRef: React.MutableRefObject<boolean[]>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const t = useRef(index * 0.4 + Math.PI / 3);

  const visual = ITEM_VISUAL[type];

  useFrame((_, delta) => {
    const isCollected = collectedRef.current[index];
    if (groupRef.current && groupRef.current.visible === isCollected) {
      groupRef.current.visible = !isCollected;
    }
    if (isCollected) return;
    t.current += delta;
    if (meshRef.current) {
      meshRef.current.position.y =
        position[1] + Math.sin(t.current * 2) * 0.14 + 0.45;
      meshRef.current.rotation.y += delta * 1.5;
      meshRef.current.rotation.x += delta * 0.6;
    }
    if (lightRef.current) {
      lightRef.current.intensity = 0.9 + Math.sin(t.current * 5) * 0.25;
    }
  });

  const geometry = (() => {
    switch (visual.shape) {
      case "box":
        return <boxGeometry args={[0.28, 0.28, 0.28]} />;
      case "tetra":
        return <tetrahedronGeometry args={[0.28, 0]} />;
      case "octa":
        return <octahedronGeometry args={[0.28, 0]} />;
      case "sphere":
        return <sphereGeometry args={[0.24, 16, 12]} />;
    }
  })();

  return (
    <group ref={groupRef}>
      <mesh ref={meshRef} position={position}>
        {geometry}
        <meshStandardMaterial
          color={visual.color}
          emissive={visual.emissive}
          emissiveIntensity={2.5}
          roughness={0.15}
          metalness={0.7}
          transparent
          opacity={type === "stealth" ? 0.55 : 0.95}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={position}
        color={visual.color}
        intensity={0.9}
        distance={4}
      />
    </group>
  );
});

/**
 * 直線視線檢查：Bresenham 風格采樣，遇到牆 (grid[z][x]===1) 就回 false。
 * 從敵人位置採樣到玩家位置，每 0.25 公尺取一點。
 */
function hasLineOfSight(
  grid: number[][],
  from: THREE.Vector3,
  to: THREE.Vector3,
): boolean {
  const dx = to.x - from.x;
  const dz = to.z - from.z;
  const dist = Math.sqrt(dx * dx + dz * dz);
  if (dist > 12) return false; // 太遠看不到
  const steps = Math.max(2, Math.ceil(dist / 0.25));
  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const x = from.x + dx * t;
    const z = from.z + dz * t;
    const gx = Math.round(x / WALL_UNIT);
    const gz = Math.round(z / WALL_UNIT);
    if (grid[gz]?.[gx] === 1) return false;
  }
  return true;
}

const CHASE_DURATION_MS = 3000;
const CHASE_SPEED = 3.4;
const PATROL_SPEED = 2.5;
const LOS_CHECK_INTERVAL = 0.4;

function Enemy({
  path,
  playerPos,
  onDamage,
  gameActive,
  grid,
  chaseEnabled,
  stealthActive,
}: {
  path: { x: number; z: number }[];
  playerPos: React.MutableRefObject<THREE.Vector3>;
  onDamage: () => void;
  gameActive: boolean;
  grid: number[][];
  chaseEnabled: boolean;
  stealthActive: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  const matRef = useRef<THREE.MeshStandardMaterial>(null);
  const glowMatRef = useRef<THREE.MeshStandardMaterial>(null);
  const posRef = useRef(
    new THREE.Vector3(toWorld(path[0].x), 0.5, toWorld(path[0].z)),
  );
  const targetIdx = useRef(0);
  const direction = useRef(1);
  const damageCooldown = useRef(2);
  const t = useRef(Math.random() * Math.PI * 2);
  const losTimer = useRef(0);
  const chaseUntil = useRef(0);

  useFrame((_, delta) => {
    if (!gameActive) {
      if (meshRef.current) meshRef.current.position.copy(posRef.current);
      if (glowRef.current) glowRef.current.position.copy(posRef.current);
      return;
    }
    t.current += delta;
    damageCooldown.current = Math.max(0, damageCooldown.current - delta);

    // 視線追蹤偵測（每 LOS_CHECK_INTERVAL 秒）
    if (chaseEnabled && !stealthActive) {
      losTimer.current -= delta;
      if (losTimer.current <= 0) {
        losTimer.current = LOS_CHECK_INTERVAL;
        if (hasLineOfSight(grid, posRef.current, playerPos.current)) {
          chaseUntil.current = Date.now() + CHASE_DURATION_MS;
        }
      }
    }
    const isChasing =
      chaseEnabled && !stealthActive && Date.now() < chaseUntil.current;

    if (isChasing) {
      // 朝玩家直線追擊
      const dir = playerPos.current.clone().sub(posRef.current);
      dir.y = 0;
      const dist = dir.length();
      if (dist > 0.1) {
        dir.normalize().multiplyScalar(CHASE_SPEED * delta);
        // 簡易牆面避撞：分軸測試
        const nx = posRef.current.x + dir.x;
        const nz = posRef.current.z + dir.z;
        if (!checkWallCollision(grid, nx, posRef.current.z, 0.35))
          posRef.current.x = nx;
        if (!checkWallCollision(grid, posRef.current.x, nz, 0.35))
          posRef.current.z = nz;
      }
    } else if (path.length >= 2) {
      // 巡邏模式（原本邏輯）
      const target = path[targetIdx.current];
      const targetPos = new THREE.Vector3(
        toWorld(target.x),
        0.5,
        toWorld(target.z),
      );
      const dir = targetPos.clone().sub(posRef.current);
      const dist = dir.length();

      if (dist < 0.08) {
        targetIdx.current += direction.current;
        if (targetIdx.current >= path.length) {
          direction.current = -1;
          targetIdx.current = path.length - 1;
        } else if (targetIdx.current < 0) {
          direction.current = 1;
          targetIdx.current = 0;
        }
      } else {
        dir.normalize().multiplyScalar(PATROL_SPEED * delta);
        posRef.current.add(dir);
      }
    }

    if (meshRef.current) {
      meshRef.current.position.copy(posRef.current);
      meshRef.current.position.y = 0.5 + Math.sin(t.current * 5) * 0.06;
    }
    if (glowRef.current) {
      glowRef.current.position.copy(posRef.current);
      glowRef.current.position.y = 0.5;
      const s = (isChasing ? 1.15 : 1) + Math.sin(t.current * 3) * 0.15;
      glowRef.current.scale.set(s, s, s);
    }

    // 追擊時材質變更紅
    if (matRef.current) {
      matRef.current.emissiveIntensity = isChasing ? 1.6 : 0.8;
    }
    if (glowMatRef.current) {
      glowMatRef.current.emissiveIntensity = isChasing ? 2.4 : 1.5;
      glowMatRef.current.opacity = isChasing ? 0.32 : 0.18;
    }

    // 隱身道具生效時跳過傷害
    if (stealthActive) return;

    const toPlayer = playerPos.current.clone().sub(posRef.current);
    toPlayer.y = 0;
    if (toPlayer.length() < ENEMY_DAMAGE_DIST && damageCooldown.current <= 0) {
      damageCooldown.current = 1.5;
      onDamage();
    }
  });

  return (
    <group>
      <mesh ref={meshRef} castShadow>
        <boxGeometry args={[0.55, 1.1, 0.55]} />
        <meshStandardMaterial
          ref={matRef}
          color="#cc0033"
          emissive="#ff1144"
          emissiveIntensity={0.8}
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>
      <mesh ref={glowRef}>
        <sphereGeometry args={[0.55, 8, 8]} />
        <meshStandardMaterial
          ref={glowMatRef}
          color="#ff0044"
          emissive="#ff0044"
          emissiveIntensity={1.5}
          transparent
          opacity={0.18}
          roughness={1}
        />
      </mesh>
    </group>
  );
}

export interface TouchInput {
  /** -1 ~ 1，左 / 右 */
  moveX: number;
  /** -1 ~ 1，前(負) / 後(正)（拖曳螢幕往下是正 y，等同往後） */
  moveZ: number;
  /** 累積待消費的 yaw 增量（弧度）*/
  lookYaw: number;
  /** 累積待消費的 pitch 增量（弧度）*/
  lookPitch: number;
}

function PlayerController({
  mazeData,
  orbPositions,
  collectedRef,
  onOrbCollect,
  onItem,
  onDamage,
  enemyPaths,
  onLockChange,
  gameActive,
  playerStateRef,
  exploredGridRef,
  burstRef,
  touchInputRef,
  isTouchDevice,
  itemsCollectedRef,
  playerSpeedMultiplier,
  stealthActive,
  enemyChase,
}: {
  mazeData: MazeData;
  orbPositions: { x: number; z: number }[];
  collectedRef: React.MutableRefObject<boolean[]>;
  onOrbCollect: (i: number) => void;
  onItem: (type: ItemType) => void;
  onDamage: () => void;
  enemyPaths: { x: number; z: number }[][];
  onLockChange: (locked: boolean) => void;
  gameActive: boolean;
  playerStateRef: React.MutableRefObject<{ gx: number; gz: number; yaw: number }>;
  exploredGridRef: React.MutableRefObject<boolean[][]>;
  burstRef: React.MutableRefObject<ParticleBurstHandle | null>;
  touchInputRef: React.MutableRefObject<TouchInput>;
  isTouchDevice: boolean;
  itemsCollectedRef: React.MutableRefObject<boolean[]>;
  playerSpeedMultiplier: number;
  stealthActive: boolean;
  enemyChase: boolean;
}) {
  const { camera, gl } = useThree();
  const playerPos = useRef(
    new THREE.Vector3(toWorld(mazeData.startX), PLAYER_HEIGHT, toWorld(mazeData.startZ))
  );
  const yaw = useRef(0);
  const pitch = useRef(0);
  const isLocked = useRef(false);
  const torchRef = useRef<THREE.SpotLight>(null);
  const torchFillRef = useRef<THREE.PointLight>(null);
  const keys = useRef({ forward: false, back: false, left: false, right: false });

  useEffect(() => {
    camera.position.copy(playerPos.current);
    camera.rotation.set(0, 0, 0);
  }, [camera]);

  useEffect(() => {
    const codeToKey = (code: string): keyof typeof keys.current | null => {
      switch (code) {
        case "KeyW": case "ArrowUp": return "forward";
        case "KeyS": case "ArrowDown": return "back";
        case "KeyA": case "ArrowLeft": return "left";
        case "KeyD": case "ArrowRight": return "right";
        default: return null;
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      const k = codeToKey(e.code);
      if (k) { keys.current[k] = true; e.preventDefault(); }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      const k = codeToKey(e.code);
      if (k) { keys.current[k] = false; e.preventDefault(); }
    };
    const onBlur = () => {
      keys.current.forward = keys.current.back = keys.current.left = keys.current.right = false;
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, []);

  useEffect(() => {
    const canvas = gl.domElement;

    const handleLockChange = () => {
      const locked = document.pointerLockElement === canvas;
      isLocked.current = locked;
      onLockChange(locked);
    };

    const MOUSE_SENSITIVITY = 0.004;
    const MAX_PITCH = 1.4;
    const MAX_DELTA_RAD = 0.1;
    const handleMouseMove = (e: MouseEvent) => {
      if (!isLocked.current) return;
      const dx = Number.isFinite(e.movementX) ? e.movementX : 0;
      const dy = Number.isFinite(e.movementY) ? e.movementY : 0;
      let yawDelta = -dx * MOUSE_SENSITIVITY;
      let pitchDelta = -dy * MOUSE_SENSITIVITY;
      if (yawDelta > MAX_DELTA_RAD) yawDelta = MAX_DELTA_RAD;
      else if (yawDelta < -MAX_DELTA_RAD) yawDelta = -MAX_DELTA_RAD;
      if (pitchDelta > MAX_DELTA_RAD) pitchDelta = MAX_DELTA_RAD;
      else if (pitchDelta < -MAX_DELTA_RAD) pitchDelta = -MAX_DELTA_RAD;
      yaw.current += yawDelta;
      const nextPitch = pitch.current + pitchDelta;
      pitch.current =
        nextPitch > MAX_PITCH ? MAX_PITCH : nextPitch < -MAX_PITCH ? -MAX_PITCH : nextPitch;
    };

    const handleClick = () => {
      // 觸控裝置不啟用 pointer lock（沒有滑鼠）
      if (isTouchDevice) return;
      if (!isLocked.current) {
        canvas.requestPointerLock();
      }
    };

    document.addEventListener("pointerlockchange", handleLockChange);
    document.addEventListener("mousemove", handleMouseMove);
    canvas.addEventListener("click", handleClick);

    return () => {
      document.removeEventListener("pointerlockchange", handleLockChange);
      document.removeEventListener("mousemove", handleMouseMove);
      canvas.removeEventListener("click", handleClick);
    };
  }, [gl, onLockChange, isTouchDevice]);

  useFrame((_, delta) => {
    const euler = new THREE.Euler(pitch.current, yaw.current, 0, "YXZ");
    camera.quaternion.setFromEuler(euler);

    const updateTorch = () => {
      const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
      if (torchRef.current) {
        torchRef.current.position.copy(camera.position);
        torchRef.current.target.position.copy(camera.position).add(forward.multiplyScalar(8));
        torchRef.current.target.updateMatrixWorld();
      }
      if (torchFillRef.current) torchFillRef.current.position.copy(camera.position);
    };

    if (!gameActive) {
      camera.position.copy(playerPos.current);
      updateTorch();
      return;
    }

    // 消費觸控視角累積（TouchLook 一直累加，這裡 frame-tick 套用）
    const MAX_PITCH = 1.4;
    const tin = touchInputRef.current;
    if (tin.lookYaw !== 0 || tin.lookPitch !== 0) {
      yaw.current += tin.lookYaw;
      const nextPitch = pitch.current + tin.lookPitch;
      pitch.current =
        nextPitch > MAX_PITCH
          ? MAX_PITCH
          : nextPitch < -MAX_PITCH
            ? -MAX_PITCH
            : nextPitch;
      tin.lookYaw = 0;
      tin.lookPitch = 0;
    }

    const k = keys.current;
    const sinY = Math.sin(yaw.current);
    const cosY = Math.cos(yaw.current);

    let mx = 0;
    let mz = 0;
    // 鍵盤
    if (k.forward) { mx -= sinY; mz -= cosY; }
    if (k.back)    { mx += sinY; mz += cosY; }
    if (k.right)   { mx += cosY; mz -= sinY; }
    if (k.left)    { mx -= cosY; mz += sinY; }
    // 搖桿：moveZ<0 = 上推 = 往前；moveX>0 = 右推 = 向右
    const jx = tin.moveX;
    const jz = tin.moveZ;
    if (jx !== 0 || jz !== 0) {
      // 搖桿的 moveZ 已經沿用畫面座標：往上為負值，也就是往前。
      // 直接套用相機的 Y 軸旋轉，避免把前後方向再反相一次。
      mx += jz * sinY + jx * cosY;
      mz += jz * cosY - jx * sinY;
    }

    const len = Math.sqrt(mx * mx + mz * mz);
    if (len > 0) {
      const speed = PLAYER_SPEED * playerSpeedMultiplier * delta;
      const normX = mx / len;
      const normZ = mz / len;
      const nx = playerPos.current.x + normX * speed;
      const nz = playerPos.current.z + normZ * speed;

      if (!checkWallCollision(mazeData.grid, nx, playerPos.current.z, PLAYER_RADIUS)) {
        playerPos.current.x = nx;
      }
      if (!checkWallCollision(mazeData.grid, playerPos.current.x, nz, PLAYER_RADIUS)) {
        playerPos.current.z = nz;
      }
    }

    camera.position.set(playerPos.current.x, playerPos.current.y, playerPos.current.z);
    updateTorch();

    const gx = Math.round(playerPos.current.x / WALL_UNIT);
    const gz = Math.round(playerPos.current.z / WALL_UNIT);
    playerStateRef.current.gx = gx;
    playerStateRef.current.gz = gz;
    playerStateRef.current.yaw = yaw.current;

    const eg = exploredGridRef.current;
    if (eg.length) {
      const H = eg.length;
      for (let dz = -1; dz <= 1; dz++) {
        const nz = gz + dz;
        if (nz < 0 || nz >= H) continue;
        const row = eg[nz];
        if (!row) continue;
        const W = row.length;
        for (let dx = -1; dx <= 1; dx++) {
          const nx = gx + dx;
          if (nx < 0 || nx >= W) continue;
          row[nx] = true;
        }
      }
    }

    const collected = collectedRef.current;
    orbPositions.forEach((orb, i) => {
      if (collected[i]) return;
      const wx = toWorld(orb.x);
      const wz = toWorld(orb.z);
      const dx = playerPos.current.x - wx;
      const dz = playerPos.current.z - wz;
      if (dx * dx + dz * dz < ORB_COLLECT_DIST * ORB_COLLECT_DIST) {
        burstRef.current?.spawn(wx, 0.6, wz);
        onOrbCollect(i);
      }
    });

    // 道具碰撞
    const itemsCollected = itemsCollectedRef.current;
    mazeData.items.forEach((item, i) => {
      if (itemsCollected[i]) return;
      const wx = toWorld(item.x);
      const wz = toWorld(item.z);
      const dx = playerPos.current.x - wx;
      const dz = playerPos.current.z - wz;
      if (dx * dx + dz * dz < ORB_COLLECT_DIST * ORB_COLLECT_DIST) {
        itemsCollected[i] = true;
        burstRef.current?.spawn(wx, 0.6, wz);
        onItem(item.type);
      }
    });
  });

  return (
    <>
      <spotLight
        ref={torchRef}
        color="#fff4d6"
        intensity={28}
        distance={22}
        angle={Math.PI / 3.2}
        penumbra={0.55}
        decay={1.4}
      />
      <pointLight ref={torchFillRef} color="#ffd9a0" intensity={2.2} distance={6} decay={2} />
      {enemyPaths.map((path, i) => (
        <Enemy
          key={i}
          path={path}
          playerPos={playerPos}
          onDamage={onDamage}
          gameActive={gameActive}
          grid={mazeData.grid}
          chaseEnabled={enemyChase}
          stealthActive={stealthActive}
        />
      ))}
    </>
  );
}

interface MazeSceneProps {
  mazeData: MazeData;
  gameActive: boolean;
  onOrbCollect: (i: number) => void;
  onItem: (type: ItemType) => void;
  onDamage: () => void;
  collectedRef: React.MutableRefObject<boolean[]>;
  itemsCollectedRef: React.MutableRefObject<boolean[]>;
  onLockChange: (locked: boolean) => void;
  playerStateRef: React.MutableRefObject<{ gx: number; gz: number; yaw: number }>;
  exploredGridRef: React.MutableRefObject<boolean[][]>;
  touchInputRef: React.MutableRefObject<TouchInput>;
  isTouchDevice: boolean;
  playerSpeedMultiplier: number;
  stealthActive: boolean;
  enemyChase: boolean;
}

export const MazeScene = memo(function MazeScene({
  mazeData,
  gameActive,
  onOrbCollect,
  onItem,
  onDamage,
  collectedRef,
  itemsCollectedRef,
  onLockChange,
  playerStateRef,
  exploredGridRef,
  touchInputRef,
  isTouchDevice,
  playerSpeedMultiplier,
  stealthActive,
  enemyChase,
}: MazeSceneProps) {
  const centerX = toWorld((mazeData.width - 1) / 2);
  const centerZ = toWorld((mazeData.height - 1) / 2);
  const burstRef = useRef<ParticleBurstHandle | null>(null);

  return (
    <Canvas
        camera={{ fov: 80, near: 0.1, far: 120 }}
        style={{ width: "100%", height: "100%" }}
        shadows
        gl={{ antialias: true }}
      >
        <color attach="background" args={["#0a1428"]} />
        <fog attach="fog" args={["#0a1428", 14, 55]} />

        <ambientLight intensity={0.08} color="#2a3a66" />
        <hemisphereLight args={["#2a3a66", "#050a14", 0.12]} />
        <pointLight
          position={[toWorld(mazeData.startX), 2.8, toWorld(mazeData.startZ)]}
          color="#88aaff"
          intensity={3}
          distance={8}
          decay={1.8}
        />
        <pointLight
          position={[centerX, 2.8, centerZ]}
          color="#ffcc88"
          intensity={4}
          distance={10}
          decay={1.8}
        />
        <pointLight
          position={[toWorld(mazeData.width - 2), 2.8, toWorld(1)]}
          color="#aa88ff"
          intensity={3}
          distance={7}
          decay={1.8}
        />
        <pointLight
          position={[toWorld(1), 2.8, toWorld(mazeData.height - 2)]}
          color="#88ffcc"
          intensity={3}
          distance={7}
          decay={1.8}
        />

        <MazeWalls
          grid={mazeData.grid}
          width={mazeData.width}
          height={mazeData.height}
        />

        {mazeData.orbPositions.map((orb, i) => (
          <Orb
            key={i}
            index={i}
            position={[toWorld(orb.x), 0.6, toWorld(orb.z)]}
            collectedRef={collectedRef}
          />
        ))}

        {mazeData.items.map((item, i) => (
          <Item
            key={`item-${i}`}
            index={i}
            type={item.type}
            position={[toWorld(item.x), 0.55, toWorld(item.z)]}
            collectedRef={itemsCollectedRef}
          />
        ))}

        <PlayerController
          mazeData={mazeData}
          orbPositions={mazeData.orbPositions}
          collectedRef={collectedRef}
          itemsCollectedRef={itemsCollectedRef}
          onOrbCollect={onOrbCollect}
          onItem={onItem}
          onDamage={onDamage}
          enemyPaths={mazeData.enemyPaths}
          onLockChange={onLockChange}
          gameActive={gameActive}
          playerStateRef={playerStateRef}
          exploredGridRef={exploredGridRef}
          burstRef={burstRef}
          touchInputRef={touchInputRef}
          isTouchDevice={isTouchDevice}
          playerSpeedMultiplier={playerSpeedMultiplier}
          stealthActive={stealthActive}
          enemyChase={enemyChase}
        />

        <ParticleBurst ref={burstRef} />
    </Canvas>
  );
});
