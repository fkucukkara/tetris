/**
 * Tetromino shapes, colors, and rotation helpers.
 * Standard 7 pieces: I, O, T, S, Z, J, L.
 * @module tetrominoes
 */

export type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

/** Shape as 4x4 grid: 1 = cell filled, 0 = empty. Each element is a row. */
export type ShapeMatrix = readonly (readonly number[])[];

/** Single modern block color (all pieces same). */
export const BLOCK_COLOR = '#94b8d4';

/** Standard colors — all same for modern monochrome look. */
export const TETROMINO_COLORS: Record<TetrominoType, string> = {
  I: BLOCK_COLOR,
  O: BLOCK_COLOR,
  T: BLOCK_COLOR,
  S: BLOCK_COLOR,
  Z: BLOCK_COLOR,
  J: BLOCK_COLOR,
  L: BLOCK_COLOR,
};

/** Shapes in default rotation (index 0). CW rotation = next index. */
const SHAPES: Record<TetrominoType, ShapeMatrix[]> = {
  I: [
    [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
    [[0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0], [0, 0, 1, 0]],
    [[0, 0, 0, 0], [0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0]],
    [[0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0], [0, 1, 0, 0]],
  ],
  O: [
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
    [[1, 1], [1, 1]],
  ],
  T: [
    [[0, 1, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 1, 0]],
    [[0, 1, 0], [1, 1, 0], [0, 1, 0]],
  ],
  S: [
    [[0, 1, 1], [1, 1, 0], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 1], [0, 0, 1]],
    [[0, 0, 0], [0, 1, 1], [1, 1, 0]],
    [[1, 0, 0], [1, 1, 0], [0, 1, 0]],
  ],
  Z: [
    [[1, 1, 0], [0, 1, 1], [0, 0, 0]],
    [[0, 0, 1], [0, 1, 1], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 0], [0, 1, 1]],
    [[0, 1, 0], [1, 1, 0], [1, 0, 0]],
  ],
  J: [
    [[1, 0, 0], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 1], [0, 1, 0], [0, 1, 0]],
    [[0, 0, 0], [1, 1, 1], [0, 0, 1]],
    [[0, 1, 0], [0, 1, 0], [1, 1, 0]],
  ],
  L: [
    [[0, 0, 1], [1, 1, 1], [0, 0, 0]],
    [[0, 1, 0], [0, 1, 0], [0, 1, 1]],
    [[0, 0, 0], [1, 1, 1], [1, 0, 0]],
    [[1, 1, 0], [0, 1, 0], [0, 1, 0]],
  ],
};

const TETROMINO_TYPES: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/**
 * Returns the shape matrix for a tetromino at a given rotation (0–3).
 */
export function getShape(type: TetrominoType, rotation: number): ShapeMatrix {
  const shapes = SHAPES[type];
  return shapes[rotation % shapes.length];
}

/**
 * Returns the color for a tetromino type.
 */
export function getColor(type: TetrominoType): string {
  return TETROMINO_COLORS[type];
}

/**
 * Returns a random tetromino type (uniform over I, O, T, S, Z, J, L).
 */
export function randomType(): TetrominoType {
  return TETROMINO_TYPES[Math.floor(Math.random() * TETROMINO_TYPES.length)];
}

/**
 * All tetromino types (for iteration / bags if needed later).
 */
export function allTypes(): readonly TetrominoType[] {
  return TETROMINO_TYPES;
}
