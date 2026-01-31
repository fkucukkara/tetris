/**
 * Entry point: wires game, renderer, and input; initializes canvas and game loop.
 * @module main
 */

import { COLS, LINE_SCORES, ROWS } from './constants';
import { createInitialState, gameReducer, getFallDelayMs } from './game';
import type { GameAction, GameState } from './game';
import { attachKeyboard } from './input';
import { render } from './renderer';
import { getShape, getColor } from './tetrominoes';
import { playHardDrop, playLineClear, startBGM, stopBGM, setBGMVolume } from './audio';

const CELL_SIZE = 42;
const PADDING = 3;

let state: GameState = createInitialState();
let lastTick = 0;
let bgmEnabled = true;
const SCORE_POP_DURATION_MS = 700;
let scorePopValue = 0;
let scorePopStartTime = 0;

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
const ctx = canvas.getContext('2d');
if (!ctx) throw new Error('Canvas 2D not available');

const boardWidth = COLS * CELL_SIZE + 8;
const boardHeight = ROWS * CELL_SIZE + 8;
canvas.width = boardWidth;
canvas.height = boardHeight;

const nextCanvas = document.getElementById('next-canvas') as HTMLCanvasElement;
const nextCtx = nextCanvas.getContext('2d');
if (nextCtx) {
  nextCanvas.width = 4 * CELL_SIZE;
  nextCanvas.height = 2 * CELL_SIZE;
}

const holdCanvas = document.getElementById('hold-canvas') as HTMLCanvasElement;
const holdCtx = holdCanvas.getContext('2d');
if (holdCtx) {
  holdCanvas.width = 4 * CELL_SIZE;
  holdCanvas.height = 2 * CELL_SIZE;
}

function dispatch(action: GameAction): void {
  const prevScore = state.score;
  state = gameReducer(state, action);
  if (action.type === 'hard_drop' && state.status === 'playing') {
    playHardDrop();
  }
  if (state.score > prevScore && state.lastClearedLines > 0) {
    scorePopValue = LINE_SCORES[state.lastClearedLines] ?? 0;
    scorePopStartTime = performance.now();
    playLineClear(state.lastClearedLines);
  }
}

function drawNextPiece(): void {
  if (!nextCtx) return;
  nextCtx.fillStyle = '#16161e';
  nextCtx.fillRect(0, 0, nextCanvas.width, nextCanvas.height);
  if (!state.nextPiece) return;
  const smallCell = CELL_SIZE * 0.9;
  const s = getShape(state.nextPiece, 0);
  const color = getColor(state.nextPiece);
  const h = s.length;
  const w = s[0].length;
  const ox = (4 - w) * smallCell / 2 + CELL_SIZE * 0.5;
  const oy = (2 - h) * smallCell / 2 + CELL_SIZE * 0.25;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (s[r][c]) {
        nextCtx.fillStyle = color;
        nextCtx.fillRect(ox + c * smallCell, oy + r * smallCell, smallCell - 2, smallCell - 2);
      }
    }
  }
}

function drawHoldPiece(): void {
  if (!holdCtx) return;
  holdCtx.fillStyle = '#16161e';
  holdCtx.fillRect(0, 0, holdCanvas.width, holdCanvas.height);
  if (!state.holdPiece) return;
  const smallCell = CELL_SIZE * 0.9;
  const s = getShape(state.holdPiece, 0);
  const color = getColor(state.holdPiece);
  const h = s.length;
  const w = s[0].length;
  const ox = (4 - w) * smallCell / 2 + CELL_SIZE * 0.5;
  const oy = (2 - h) * smallCell / 2 + CELL_SIZE * 0.25;
  for (let r = 0; r < h; r++) {
    for (let c = 0; c < w; c++) {
      if (s[r][c]) {
        holdCtx.fillStyle = color;
        holdCtx.fillRect(ox + c * smallCell, oy + r * smallCell, smallCell - 2, smallCell - 2);
      }
    }
  }
}

function updateUI(): void {
  const scoreEl = document.getElementById('score');
  const levelEl = document.getElementById('level');
  const linesEl = document.getElementById('lines');
  const statusEl = document.getElementById('status');
  if (scoreEl) scoreEl.textContent = String(state.score);
  if (levelEl) levelEl.textContent = String(state.level);
  if (linesEl) linesEl.textContent = String(state.linesCleared);
  if (statusEl) {
    if (state.status === 'idle') statusEl.textContent = 'Press Enter to Start';
    else if (state.status === 'paused') statusEl.textContent = 'Paused';
    else if (state.status === 'gameover') statusEl.textContent = 'Game Over';
    else statusEl.textContent = '';
  }
}

function drawScorePop(ctx: CanvasRenderingContext2D): void {
  if (scorePopStartTime <= 0 || scorePopValue <= 0) return;
  const now = performance.now();
  const elapsed = now - scorePopStartTime;
  if (elapsed >= SCORE_POP_DURATION_MS) {
    scorePopStartTime = 0;
    scorePopValue = 0;
    return;
  }
  const t = elapsed / SCORE_POP_DURATION_MS;
  const scale = 1 + 0.4 * (1 - t);
  const alpha = 1 - t * t;
  const cx = canvas.width / 2;
  const y = canvas.height * 0.35;

  // Brief flash overlay when lines clear
  if (elapsed < 120) {
    const flashAlpha = (1 - elapsed / 120) * 0.25;
    ctx.save();
    ctx.fillStyle = `rgba(148, 184, 212, ${flashAlpha})`;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
  }

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(cx, y);
  ctx.scale(scale, scale);
  ctx.fillStyle = '#94b8d4';
  ctx.font = 'bold 36px system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(`+${scorePopValue}`, 0, 0);
  ctx.restore();
}

function draw(): void {
  if (!ctx) return;
  render(ctx, state, { canvas, cellSize: CELL_SIZE, padding: PADDING });
  drawScorePop(ctx);
  drawNextPiece();
  drawHoldPiece();
  updateUI();
}

function syncBGM(): void {
  if (!bgmEnabled) {
    stopBGM();
    return;
  }
  if (state.status === 'playing') {
    startBGM();
    setBGMVolume(0.12);
  } else if (state.status === 'paused') {
    setBGMVolume(0);
  } else {
    stopBGM();
  }
}

function gameLoop(now: number): void {
  requestAnimationFrame(gameLoop);
  if (state.status === 'playing' && state.piece) {
    const delay = getFallDelayMs(state.level);
    if (now - lastTick >= delay) {
      lastTick = now;
      dispatch({ type: 'tick' });
    }
  } else {
    lastTick = now;
  }
  syncBGM();
  draw();
}

const musicToggle = document.getElementById('music-toggle');
if (musicToggle) {
  musicToggle.addEventListener('click', () => {
    bgmEnabled = !bgmEnabled;
    musicToggle.setAttribute('aria-pressed', String(bgmEnabled));
    syncBGM();
  });
}

attachKeyboard({
  onAction(action) {
    if (action.type === 'start' && state.status === 'gameover') {
      dispatch({ type: 'restart' });
      dispatch({ type: 'start' });
      return;
    }
    if (action.type === 'pause') {
      dispatch(state.status === 'playing' ? { type: 'pause' } : { type: 'resume' });
      return;
    }
    dispatch(action);
  },
});

lastTick = performance.now();
  requestAnimationFrame(gameLoop);
draw();
