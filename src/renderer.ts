/**
 * Renderer: draws board, current piece, next piece, hold, and UI.
 * No game rules; only draws from GameState.
 * @module renderer
 */

import { COLS, ROWS } from './constants';
import { fits as boardFits } from './game';
import type { Board, GameState, PieceState } from './game';
import { getShape, getColor, type TetrominoType } from './tetrominoes';

export interface RendererConfig {
  canvas: HTMLCanvasElement;
  cellSize: number;
  padding?: number;
}

/** Draw a single cell (block) at grid (r, c) with color — modern flat look. */
function drawCell(
  ctx: CanvasRenderingContext2D,
  c: number,
  r: number,
  cellSize: number,
  color: string,
  padding: number
): void {
  const x = c * cellSize + padding;
  const y = r * cellSize + padding;
  const size = cellSize - padding * 2;
  const radius = Math.min(6, size / 5);

  // Base fill
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.fill();

  // Subtle top-edge highlight (modern bevel)
  const grad = ctx.createLinearGradient(x, y, x, y + size);
  grad.addColorStop(0, 'rgba(255,255,255,0.35)');
  grad.addColorStop(0.4, 'rgba(255,255,255,0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size * 0.5, radius);
  ctx.fill();

  // Clean border
  ctx.strokeStyle = 'rgba(255,255,255,0.2)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.stroke();
}

/** Draw a piece (ghost or solid) at (row, col) with rotation. */
function drawPiece(
  ctx: CanvasRenderingContext2D,
  piece: PieceState,
  cellSize: number,
  padding: number,
  alpha: number = 1
): void {
  const shape = getShape(piece.type, piece.rotation);
  const color = getColor(piece.type);
  ctx.save();
  ctx.globalAlpha = alpha;
  const h = shape.length;
  const w = shape[0].length;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (shape[r][c]) {
        drawCell(
          ctx,
          piece.col + c,
          piece.row + r,
          cellSize,
          color,
          padding
        );
      }
    }
  }
  ctx.restore();
}


/** Compute ghost row (lowest row where piece fits). */
function getGhostRow(board: Board, piece: PieceState): number {
  const shape = getShape(piece.type, piece.rotation);
  let row = piece.row;
  while (boardFits(board, shape, row + 1, piece.col)) {
    row++;
  }
  return row;
}

/**
 * Renders the full game state to the canvas.
 */
export function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  config: RendererConfig
): void {
  const { cellSize, padding = 2 } = config;
  const width = COLS * cellSize;
  const height = ROWS * cellSize;

  // Clear — dark modern background
  ctx.fillStyle = '#0f1117';
  ctx.fillRect(0, 0, config.canvas.width, config.canvas.height);

  // Board background — subtle panel
  ctx.save();
  ctx.translate(0, 0);
  ctx.fillStyle = '#151922';
  const boardPadding = 6;
  ctx.beginPath();
  ctx.roundRect(0, 0, width + boardPadding * 2, height + boardPadding * 2, 12);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.translate(boardPadding, boardPadding);

  // Grid cells (locked)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const cell = state.board[r][c];
      if (cell) {
        drawCell(ctx, c, r, cellSize, getColor(cell as TetrominoType), padding);
      }
    }
  }

  // Ghost piece (optional: show where piece will land)
  if (state.piece && state.status === 'playing') {
    const ghost = {
      ...state.piece,
      row: getGhostRow(state.board, state.piece),
    };
    drawPiece(ctx, ghost, cellSize, padding, 0.35);
  }

  // Current piece
  if (state.piece) {
    drawPiece(ctx, state.piece, cellSize, padding);
  }

  ctx.restore();
}

/**
 * Renders the "next" piece preview (small) in a given canvas context.
 * Expects ctx to be already translated to the top-left of the preview area.
 */
export function renderNextPiece(
  ctx: CanvasRenderingContext2D,
  nextType: TetrominoType | null,
  cellSize: number,
  padding: number = 2
): void {
  if (!nextType) return;
  const shape = getShape(nextType, 0);
  const color = getColor(nextType);
  const h = shape.length;
  const w = shape[0].length;
  const offsetX = (4 - w) / 2;
  const offsetY = (2 - h / 2) / 2;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (shape[r][c]) {
        drawCell(
          ctx,
          offsetX + c,
          offsetY + r,
          cellSize,
          color,
          padding
        );
      }
    }
  }
}

/**
 * Renders the "hold" piece preview.
 */
export function renderHoldPiece(
  ctx: CanvasRenderingContext2D,
  holdType: TetrominoType | null,
  cellSize: number,
  padding: number = 2
): void {
  if (!holdType) return;
  const shape = getShape(holdType, 0);
  const color = getColor(holdType);
  const h = shape.length;
  const w = shape[0].length;
  const offsetX = (4 - w) / 2;
  const offsetY = (2 - h / 2) / 2;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (shape[r][c]) {
        drawCell(
          ctx,
          offsetX + c,
          offsetY + r,
          cellSize,
          color,
          padding
        );
      }
    }
  }
}
