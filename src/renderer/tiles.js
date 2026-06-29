'use strict';

/**
 * Tile Rendering Module — Anticatite Maker Level Editor
 *
 * Procedurally draws every tile type on an HTML5 Canvas 2D context.
 * Tile size: 32×32 pixels.
 */

// ─── Constants ───────────────────────────────────────────────────────────────

export const TILE_SIZE = 32;

export const TILE_TYPES = {
  AIR: 0,
  GROUND: 1,
  BRICK: 2,
  QUESTION: 3,
  PIPE_TL: 4,
  PIPE_TR: 5,
  PIPE_BL: 6,
  PIPE_BR: 7,
  USED_QUESTION: 8,
  PLATFORM: 9,
  FLAG: 10,
  CASTLE_WALL: 11,
  CASTLE_DOOR: 12,
  RARE_QUESTION: 13,
};

// Green pipe palette
const PIPE_GREEN = {
  dark: '#1B8C3A',
  mid: '#22AA44',
  lip: '#2ECC55',
  highlight: '#44DD66',
  edge: '#147030',
};

// Silver pipe palette
const PIPE_SILVER = {
  dark: '#808890',
  mid: '#A0A8B0',
  lip: '#C0C8D0',
  highlight: '#D8E0E8',
  edge: '#606870',
};

// Castle wall shade array
const CASTLE_SHADES = ['#7A6A5E', '#6E5E52', '#746458'];

// Rainbow palette for rare question block
const RAINBOW = ['#FF4444', '#FF8800', '#FFFF00', '#44FF44', '#4488FF', '#AA44FF'];

// ─── Tile name map ───────────────────────────────────────────────────────────

const TILE_NAMES = {
  0: 'Air',
  1: 'Ground',
  2: 'Brick',
  3: 'Question Block',
  4: 'Pipe Top-Left',
  5: 'Pipe Top-Right',
  6: 'Pipe Body-Left',
  7: 'Pipe Body-Right',
  8: 'Used Question Block',
  9: 'Platform',
  10: 'Flag / Goal',
  11: 'Castle Wall',
  12: 'Castle Door',
  13: 'Rare Question Block',
  16: 'Silver Pipe Top-Left',
  17: 'Silver Pipe Top-Right',
  18: 'Silver Pipe Body-Left',
  19: 'Silver Pipe Body-Right',
};

// Solid tile set (type numbers)
const SOLID_TILES = new Set([1, 2, 3, 4, 5, 6, 7, 8, 11, 13, 16, 17, 18, 19]);

// ─── Exported helpers ────────────────────────────────────────────────────────

/**
 * Returns true for tiles that block movement from all sides.
 * Note: type 9 (platform) is semi-solid and handled separately.
 *       type 12 (castle door) is NOT solid.
 */
export function isSolidTile(type) {
  return SOLID_TILES.has(type);
}

/**
 * Returns true only for semi-solid platform tiles (type 9).
 */
export function isPlatformTile(type) {
  return type === 9;
}

/**
 * Returns a human-readable name for the given tile type number.
 */
export function getTileName(type) {
  return TILE_NAMES[type] || 'Unknown';
}

// ─── Internal drawing helpers ────────────────────────────────────────────────

function drawPipePiece(ctx, x, y, part, palette) {
  const { dark, mid, lip, highlight, edge } = palette;

  switch (part) {
    // Top-left: wider lip with 2px overhang to the left
    case 'tl': {
      // Dark base (full tile + overhang)
      ctx.fillStyle = dark;
      ctx.fillRect(x - 2, y, 34, 32);

      // Mid inset body (lower portion below lip)
      ctx.fillStyle = mid;
      ctx.fillRect(x, y + 4, 30, 28);

      // Lip strip on top 4px (full width including overhang)
      ctx.fillStyle = lip;
      ctx.fillRect(x - 2, y, 34, 4);

      // Highlight stripe (vertical, 3px wide)
      ctx.fillStyle = highlight;
      ctx.fillRect(x + 4, y, 3, 32);

      // Left edge shadow
      ctx.fillStyle = edge;
      ctx.fillRect(x - 2, y, 2, 4);     // lip left edge
      ctx.fillRect(x, y + 4, 2, 28);    // body left edge

      break;
    }

    // Top-right: wider lip with 2px overhang to the right
    case 'tr': {
      // Dark base
      ctx.fillStyle = dark;
      ctx.fillRect(x, y, 34, 32);

      // Mid inset body
      ctx.fillStyle = mid;
      ctx.fillRect(x + 2, y + 4, 30, 28);

      // Lip strip on top
      ctx.fillStyle = lip;
      ctx.fillRect(x, y, 34, 4);

      // Highlight stripe
      ctx.fillStyle = highlight;
      ctx.fillRect(x + 4, y, 3, 32);

      // Right edge shadow
      ctx.fillStyle = edge;
      ctx.fillRect(x + 32, y, 2, 4);    // lip right edge
      ctx.fillRect(x + 30, y + 4, 2, 28); // body right edge

      break;
    }

    // Body-left: straight pipe section
    case 'bl': {
      ctx.fillStyle = dark;
      ctx.fillRect(x, y, 32, 32);

      // Mid fill inset 2px from each side
      ctx.fillStyle = mid;
      ctx.fillRect(x + 2, y, 28, 32);

      // Highlight stripe
      ctx.fillStyle = highlight;
      ctx.fillRect(x + 6, y, 3, 32);

      // Left edge
      ctx.fillStyle = edge;
      ctx.fillRect(x, y, 2, 32);

      break;
    }

    // Body-right: straight pipe section
    case 'br': {
      ctx.fillStyle = dark;
      ctx.fillRect(x, y, 32, 32);

      // Mid fill inset 2px
      ctx.fillStyle = mid;
      ctx.fillRect(x + 2, y, 28, 32);

      // Highlight stripe
      ctx.fillStyle = highlight;
      ctx.fillRect(x + 6, y, 3, 32);

      // Right edge
      ctx.fillStyle = edge;
      ctx.fillRect(x + 30, y, 2, 32);

      break;
    }
  }
}

// ─── Individual tile draw routines ───────────────────────────────────────────

function drawGround(ctx, x, y, theme, row, col) {
  if (theme === 'castle') {
    // Dark stone
    ctx.fillStyle = '#555';
    ctx.fillRect(x, y, 32, 32);
    ctx.fillStyle = '#666';
    ctx.fillRect(x + 1, y + 1, 30, 30);

    // Rock cracks
    ctx.strokeStyle = '#444';
    ctx.lineWidth = 1;

    ctx.beginPath();
    ctx.moveTo(x + 5, y + 8);
    ctx.lineTo(x + 14, y + 14);
    ctx.lineTo(x + 10, y + 22);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(x + 22, y + 4);
    ctx.lineTo(x + 26, y + 12);
    ctx.lineTo(x + 20, y + 18);
    ctx.stroke();

    // Random crystal sparkle
    if ((row * 7 + col * 13) % 17 === 0) {
      ctx.fillStyle = '#88FFFF';
      ctx.fillRect(x + 10, y + 8, 3, 3);
    }
  } else {
    // Overworld: brown dirt with green grass
    ctx.fillStyle = '#8B5E3C';
    ctx.fillRect(x, y, 32, 32);

    ctx.fillStyle = '#6B3F1F';
    ctx.fillRect(x + 2, y + 2, 28, 28);

    // Green grass strip on top
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(x, y, 32, 4);

    // Lighter grass highlight
    ctx.fillStyle = '#66BB6A';
    ctx.fillRect(x, y, 32, 2);

    // Dirt texture lines
    ctx.fillStyle = '#7A4E2C';
    ctx.fillRect(x + 4, y + 12, 24, 1);
    ctx.fillRect(x + 6, y + 22, 20, 1);
  }
}

function drawBrick(ctx, x, y, theme) {
  if (theme === 'castle') {
    // Mineshaft / Castle style: dark reinforced wooden planks
    ctx.fillStyle = '#5C3A1E'; ctx.fillRect(x, y, 32, 32);
    ctx.fillStyle = '#6E4C2C'; ctx.fillRect(x + 1, y + 1, 30, 30);
    // Wood grain (horizontal)
    ctx.strokeStyle = '#4A2E16'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 2, y + 8); ctx.lineTo(x + 30, y + 8); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 2, y + 18); ctx.lineTo(x + 30, y + 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 2, y + 28); ctx.lineTo(x + 30, y + 28); ctx.stroke();
    // Iron bolt corners
    ctx.fillStyle = '#777';
    ctx.beginPath(); ctx.arc(x + 5, y + 5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 27, y + 5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 5, y + 27, 2, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + 27, y + 27, 2, 0, Math.PI * 2); ctx.fill();
    // Bolt shine
    ctx.fillStyle = '#999';
    ctx.fillRect(x + 5, y + 4, 1, 1);
    ctx.fillRect(x + 27, y + 4, 1, 1);
  } else {
    // Overworld: authentic wooden ship plank brick texture
    ctx.fillStyle = '#6B4226'; ctx.fillRect(x, y, 32, 32);
    ctx.fillStyle = '#8B5A2B'; ctx.fillRect(x + 1, y + 1, 30, 30);
    // Wood grain lines
    ctx.strokeStyle = '#5C3317'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x + 2, y + 6); ctx.lineTo(x + 30, y + 6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 2, y + 16); ctx.lineTo(x + 30, y + 16); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x + 2, y + 26); ctx.lineTo(x + 30, y + 26); ctx.stroke();
    // Nail details
    ctx.fillStyle = '#444';
    ctx.fillRect(x + 3, y + 3, 2, 2);
    ctx.fillRect(x + 27, y + 3, 2, 2);
    ctx.fillRect(x + 3, y + 27, 2, 2);
    ctx.fillRect(x + 27, y + 27, 2, 2);
  }
}

function drawQuestionBlock(ctx, x, y, frameCount) {
  // Subtle bounce animation
  let dy = 0;
  if (frameCount !== undefined && frameCount !== null) {
    dy = Math.sin(frameCount * 0.1) * 1;
  }

  const ty = y + dy;

  ctx.fillStyle = '#FFD700';
  ctx.fillRect(x, ty, 32, 32);

  ctx.fillStyle = '#DAA520';
  ctx.fillRect(x + 2, ty + 2, 28, 28);

  // White "?" character
  ctx.fillStyle = '#FFF8DC';
  ctx.font = 'bold 18px monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('?', x + 9, ty + 23);
}

function drawUsedQuestionBlock(ctx, x, y) {
  ctx.fillStyle = '#8B7355';
  ctx.fillRect(x, y, 32, 32);

  ctx.fillStyle = '#6B5335';
  ctx.fillRect(x + 2, y + 2, 28, 28);
}

function drawPlatform(ctx, x, y) {
  ctx.fillStyle = '#A0826D';
  ctx.fillRect(x, y, 32, 32);

  ctx.fillStyle = '#8B6F5C';
  ctx.fillRect(x + 2, y + 2, 28, 28);

  // Highlight line on top
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(x + 1, y, 30, 2);
}

function drawFlag(ctx, x, y) {
  // Gray pole
  ctx.fillStyle = '#C0C0C0';
  ctx.fillRect(x + 14, y, 4, 32);

  // Flag triangle
  ctx.fillStyle = '#FF4444';
  ctx.beginPath();
  ctx.moveTo(x + 18, y + 2);
  ctx.lineTo(x + 30, y + 8);
  ctx.lineTo(x + 18, y + 14);
  ctx.closePath();
  ctx.fill();

  // Gold ball on top
  ctx.fillStyle = '#FFD700';
  ctx.beginPath();
  ctx.arc(x + 16, y + 2, 3, 0, Math.PI * 2);
  ctx.fill();
}

function drawCastleWall(ctx, x, y, row, col) {
  // Base stone
  ctx.fillStyle = '#6B5B4F';
  ctx.fillRect(x, y, 32, 32);

  // Inner with shade variation
  const shadeIndex = (col * 7 + row * 13) % 3;
  ctx.fillStyle = CASTLE_SHADES[shadeIndex];
  ctx.fillRect(x + 1, y + 1, 30, 30);

  // Mortar lines
  ctx.strokeStyle = '#3A3028';
  ctx.lineWidth = 1;

  // Horizontal line at y+16 across full width
  ctx.beginPath();
  ctx.moveTo(x, y + 16);
  ctx.lineTo(x + 32, y + 16);
  ctx.stroke();

  // Vertical lines with brick offset
  const offset = (row % 2 === 0) ? 0 : 16;

  // Top half verticals
  ctx.beginPath();
  ctx.moveTo(x + 8 + offset, y);
  ctx.lineTo(x + 8 + offset, y + 16);
  ctx.stroke();

  if (x + 24 + offset <= x + 32 + 16) {
    ctx.beginPath();
    ctx.moveTo(x + 24 + offset, y);
    ctx.lineTo(x + 24 + offset, y + 16);
    ctx.stroke();
  }

  // Bottom half verticals (no offset)
  ctx.beginPath();
  ctx.moveTo(x + 8, y + 16);
  ctx.lineTo(x + 8, y + 32);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(x + 24, y + 16);
  ctx.lineTo(x + 24, y + 32);
  ctx.stroke();

  // Top highlight
  ctx.fillStyle = 'rgba(255,240,220,0.12)';
  ctx.fillRect(x + 1, y + 1, 30, 2);
  ctx.fillRect(x + 1, y + 17, 30, 2);

  // Bottom shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.fillRect(x + 1, y + 14, 30, 2);
  ctx.fillRect(x + 1, y + 30, 30, 2);
}

function drawCastleDoor(ctx, x, y, frameCount) {
  const fc = frameCount || 0;

  // Surrounding stone
  ctx.fillStyle = '#6B5B4F';
  ctx.fillRect(x, y, 32, 32);

  // Door opening
  ctx.fillStyle = '#1A0A00';
  ctx.fillRect(x + 3, y + 2, 26, 30);

  // Warm inner glow
  const glowAlpha = 0.25 + Math.sin(fc * 0.04) * 0.08;
  ctx.fillStyle = `rgba(255,160,40,${glowAlpha.toFixed(3)})`;
  ctx.fillRect(x + 4, y + 4, 24, 28);

  // Wooden planks
  ctx.fillStyle = '#5C3A1E';
  ctx.fillRect(x + 4, y + 6, 24, 26);

  // Vertical plank lines
  ctx.strokeStyle = '#4A2E16';
  ctx.lineWidth = 1;
  for (let px = x + 8; px <= x + 28; px += 6) {
    ctx.beginPath();
    ctx.moveTo(px, y + 6);
    ctx.lineTo(px, y + 32);
    ctx.stroke();
  }

  // Arch top (outer)
  ctx.fillStyle = '#3A3028';
  ctx.beginPath();
  ctx.arc(x + 16, y + 10, 13, Math.PI, 0);
  ctx.fill();

  // Arch top (inner — wood fill)
  ctx.fillStyle = '#5C3A1E';
  ctx.beginPath();
  ctx.arc(x + 16, y + 10, 11, Math.PI, 0);
  ctx.fill();

  // Iron studs
  ctx.fillStyle = '#888';
  const studPositions = [
    [x + 8, y + 16],
    [x + 24, y + 16],
    [x + 8, y + 26],
    [x + 24, y + 26],
  ];
  for (const [sx, sy] of studPositions) {
    ctx.beginPath();
    ctx.arc(sx, sy, 2, 0, Math.PI * 2);
    ctx.fill();
  }

  // Door handle
  ctx.fillStyle = '#DAA520';
  ctx.beginPath();
  ctx.arc(x + 22, y + 20, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

function drawRareQuestionBlock(ctx, x, y, frameCount) {
  const fc = frameCount || 0;
  const ci = Math.floor(fc / 4) % 6;

  // Rainbow fill
  ctx.fillStyle = RAINBOW[ci];
  ctx.fillRect(x, y, 32, 32);

  ctx.fillStyle = RAINBOW[(ci + 2) % 6];
  ctx.fillRect(x + 2, y + 2, 28, 28);

  // Sparkle border
  const alpha = 0.4 + Math.sin(fc * 0.1) * 0.3;
  ctx.strokeStyle = '#FFF';
  ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 1, y + 1, 30, 30);
  ctx.globalAlpha = 1.0;

  // Star icon
  ctx.fillStyle = '#FFF';
  ctx.font = 'bold 16px monospace';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText('\u2605', x + 8, y + 22);
}

// ─── Main draw function ──────────────────────────────────────────────────────

/**
 * Draw a single tile at the given pixel position.
 *
 * @param {CanvasRenderingContext2D} ctx  - Canvas 2D rendering context
 * @param {number} x      - Pixel X (top-left of tile)
 * @param {number} y      - Pixel Y (top-left of tile)
 * @param {number} type   - Tile type number (see TILE_TYPES)
 * @param {string} theme  - 'overworld' or 'castle'
 * @param {number} frameCount - Current animation frame
 * @param {number} row    - Grid row (for deterministic procedural variation)
 * @param {number} col    - Grid column
 */
export function drawTile(ctx, x, y, type, theme, frameCount, row, col) {
  // Air — nothing to draw
  if (type === TILE_TYPES.AIR) return;

  ctx.save();

  switch (type) {
    case TILE_TYPES.GROUND:
      drawGround(ctx, x, y, theme, row, col);
      break;

    case TILE_TYPES.BRICK:
      drawBrick(ctx, x, y, theme);
      break;

    case TILE_TYPES.QUESTION:
      drawQuestionBlock(ctx, x, y, frameCount);
      break;

    // Green pipe pieces
    case TILE_TYPES.PIPE_TL:
      drawPipePiece(ctx, x, y, 'tl', PIPE_GREEN);
      break;
    case TILE_TYPES.PIPE_TR:
      drawPipePiece(ctx, x, y, 'tr', PIPE_GREEN);
      break;
    case TILE_TYPES.PIPE_BL:
      drawPipePiece(ctx, x, y, 'bl', PIPE_GREEN);
      break;
    case TILE_TYPES.PIPE_BR:
      drawPipePiece(ctx, x, y, 'br', PIPE_GREEN);
      break;

    case TILE_TYPES.USED_QUESTION:
      drawUsedQuestionBlock(ctx, x, y);
      break;

    case TILE_TYPES.PLATFORM:
      drawPlatform(ctx, x, y);
      break;

    case TILE_TYPES.FLAG:
      drawFlag(ctx, x, y);
      break;

    case TILE_TYPES.CASTLE_WALL:
      drawCastleWall(ctx, x, y, row, col);
      break;

    case TILE_TYPES.CASTLE_DOOR:
      drawCastleDoor(ctx, x, y, frameCount);
      break;

    case TILE_TYPES.RARE_QUESTION:
      drawRareQuestionBlock(ctx, x, y, frameCount);
      break;

    // Silver pipe pieces (types 16–19)
    case 16:
      drawPipePiece(ctx, x, y, 'tl', PIPE_SILVER);
      break;
    case 17:
      drawPipePiece(ctx, x, y, 'tr', PIPE_SILVER);
      break;
    case 18:
      drawPipePiece(ctx, x, y, 'bl', PIPE_SILVER);
      break;
    case 19:
      drawPipePiece(ctx, x, y, 'br', PIPE_SILVER);
      break;

    default:
      // Unknown tile type — draw debug placeholder
      ctx.fillStyle = '#FF00FF';
      ctx.fillRect(x, y, 32, 32);
      ctx.fillStyle = '#000';
      ctx.font = '10px monospace';
      ctx.textBaseline = 'top';
      ctx.fillText(`?${type}`, x + 4, y + 10);
      break;
  }

  ctx.restore();
}
