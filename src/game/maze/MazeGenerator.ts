export type ItemType = "heart" | "time" | "stealth" | "map" | "speed";

export interface ItemPlacement {
  x: number;
  z: number;
  type: ItemType;
}

export interface MazeData {
  grid: number[][];
  width: number;
  height: number;
  startX: number;
  startZ: number;
  orbPositions: { x: number; z: number }[];
  enemyPaths: { x: number; z: number }[][];
  items: ItemPlacement[];
}

export interface MazeGenOptions {
  /** 上限光球數；不足會依迷宮大小自動取較少者 */
  orbCount?: number;
  /** 敵人巡邏路徑數 */
  enemyCount?: number;
  /** 道具數（隨機 5 種混合） */
  itemCount?: number;
  /** 確定性隨機種子（D6 班級共享：相同 seed = 相同迷宮）*/
  seed?: string;
}

/**
 * 輕量級確定性 PRNG（Mulberry32）— 比 seedrandom 套件小很多（0 byte vs ~3 KB），
 * 對教學遊戲足夠用。從 string seed 轉成 uint32。
 */
function mulberry32(seed: number): () => number {
  let s = seed >>> 0;
  return function () {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function stringToSeed(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

const DEFAULT_ITEM_POOL: ItemType[] = [
  "heart",
  "time",
  "stealth",
  "map",
  "speed",
];

function makeShuffle(rng: () => number) {
  return function <T>(arr: T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
}

export function generateMaze(
  cols: number,
  rows: number,
  options: MazeGenOptions = {},
): MazeData {
  const rng = options.seed ? mulberry32(stringToSeed(options.seed)) : Math.random;
  const shuffle = makeShuffle(rng);
  const W = cols * 2 + 1;
  const H = rows * 2 + 1;
  const grid: number[][] = Array.from({ length: H }, () => Array(W).fill(1));

  const visited: boolean[][] = Array.from({ length: rows }, () =>
    Array(cols).fill(false),
  );

  function cellToGrid(cx: number, cy: number) {
    return { gx: cx * 2 + 1, gy: cy * 2 + 1 };
  }

  function carve(cx: number, cy: number) {
    visited[cy][cx] = true;
    const { gx, gy } = cellToGrid(cx, cy);
    grid[gy][gx] = 0;

    const dirs = shuffle([
      [0, -1],
      [0, 1],
      [-1, 0],
      [1, 0],
    ]);

    for (const [dx, dy] of dirs) {
      const nx = cx + dx;
      const ny = cy + dy;
      if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && !visited[ny][nx]) {
        const wallGx = gx + dx;
        const wallGy = gy + dy;
        grid[wallGy][wallGx] = 0;
        carve(nx, ny);
      }
    }
  }

  carve(0, 0);

  const openCells: { x: number; z: number }[] = [];
  for (let cy = 0; cy < rows; cy++) {
    for (let cx = 0; cx < cols; cx++) {
      const { gx, gy } = cellToGrid(cx, cy);
      if (grid[gy][gx] === 0 && !(cx === 0 && cy === 0)) {
        openCells.push({ x: gx, z: gy });
      }
    }
  }

  const shuffledCells = shuffle(openCells);
  const targetOrb = options.orbCount ?? 12;
  const orbCnt = Math.min(targetOrb, Math.floor(openCells.length * 0.3));
  const orbPositions = shuffledCells.slice(0, orbCnt);

  const enemyTarget = options.enemyCount ?? 4;
  const enemyCells = shuffledCells.slice(orbCnt, orbCnt + enemyTarget);
  const enemyPaths: { x: number; z: number }[][] = enemyCells.map((cell) => {
    const neighbors: { x: number; z: number }[] = [];
    const dirs = [
      [2, 0],
      [-2, 0],
      [0, 2],
      [0, -2],
    ];
    for (const [dx, dz] of dirs) {
      const nx = cell.x + dx;
      const nz = cell.z + dz;
      if (
        nx > 0 &&
        nx < W - 1 &&
        nz > 0 &&
        nz < H - 1 &&
        grid[nz][nx] === 0
      ) {
        neighbors.push({ x: nx, z: nz });
      }
    }
    if (neighbors.length === 0) return [cell];
    const picked = neighbors[Math.floor(rng() * neighbors.length)];
    return [cell, picked];
  });

  // 道具放在 enemy 之後的空格
  const itemTarget = options.itemCount ?? 3;
  const itemCells = shuffledCells.slice(
    orbCnt + enemyTarget,
    orbCnt + enemyTarget + itemTarget,
  );
  const items: ItemPlacement[] = itemCells.map((c) => ({
    ...c,
    type: DEFAULT_ITEM_POOL[Math.floor(rng() * DEFAULT_ITEM_POOL.length)],
  }));

  return {
    grid,
    width: W,
    height: H,
    startX: 1,
    startZ: 1,
    orbPositions,
    enemyPaths,
    items,
  };
}
