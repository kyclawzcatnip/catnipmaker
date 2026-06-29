'use strict';

// ============================================================
// sprites.js — Procedural sprite rendering for SuperCatMaker
// All drawing is Canvas 2D, tile = 32px, no images.
// ============================================================

// ---- Cat Skins ----
export const CAT_SKINS = [
    { name: 'Orange Tabby', body: '#F5A623', highlight: '#F7BF56', legs: '#E8941E', ear: '#FF8FAB', nose: '#FF6B8A', paw: '#FFF' },
    { name: 'Tuxedo',       body: '#222222', highlight: '#333333', legs: '#1a1a1a', ear: '#FF8FAB', nose: '#FF6B8A', paw: '#FFFFFF' },
    { name: 'Calico',       body: '#E8A050', highlight: '#F0C080', legs: '#CC8833', ear: '#FFB6C1', nose: '#FF6B8A', paw: '#FFF' },
    { name: 'Shadow',       body: '#2a2a3e', highlight: '#3a3a50', legs: '#1a1a2e', ear: '#8866AA', nose: '#AA88CC', paw: '#4a4a5e' },
];

// ---- Cat ----
/**
 * Draw the player cat sprite procedurally.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x  - left edge (world px)
 * @param {number} y  - top edge (world px)
 * @param {number} skinIndex - index into CAT_SKINS
 * @param {number} dir - 1 = right, -1 = left
 * @param {boolean} grounded
 * @param {boolean} walking
 * @param {number} frameCount
 */
export function drawCat(ctx, x, y, skinIndex, dir, grounded, walking, frameCount) {
    const skin = CAT_SKINS[skinIndex] || CAT_SKINS[0];
    const f = dir === -1;

    function px(rx, ry, w, h, col) {
        ctx.fillStyle = col;
        ctx.fillRect(f ? x + 24 - rx - w : x + rx, y + ry, w, h);
    }

    // 1. Body
    px(2, 10, 20, 16, skin.body);
    px(4, 12, 16, 12, skin.highlight);

    // 2. Head
    px(6, 0, 16, 14, skin.body);
    px(8, 2, 12, 10, skin.highlight);

    // 3. Ears
    px(6, -4, 4, 6, skin.body);
    px(16, -4, 4, 6, skin.body);
    // inner ears
    px(7, -3, 2, 4, skin.ear);
    px(17, -3, 2, 4, skin.ear);

    // 4. Hat (red)
    px(4, -6, 18, 3, '#CC2222');   // brim
    px(8, -12, 10, 6, '#CC2222');  // crown
    px(8, -7, 10, 2, '#FFD700');   // band

    // 5. Eyes
    px(9, 4, 3, 3, '#FFF');
    px(14, 4, 3, 3, '#FFF');
    px(10, 5, 2, 2, '#1a1a2e');
    px(15, 5, 2, 2, '#1a1a2e');

    // 6. Nose
    px(12, 8, 2, 2, skin.nose);

    // 7. Whiskers
    px(2, 7, 4, 1, '#DDD');
    px(20, 7, 4, 1, '#DDD');
    px(2, 9, 5, 1, '#DDD');
    px(19, 9, 5, 1, '#DDD');

    // 8. Tail
    const tw = Math.sin(frameCount * 0.12) * 2;
    px(-4, 8 + tw, 6, 4, skin.body);
    px(-6, 5 + tw, 4, 5, skin.legs);

    // 9. Legs
    if (grounded && walking) {
        const lo = Math.sin(frameCount * 0.35) * 3;
        px(4,  26, 4, Math.max(2, 5 + lo), skin.legs);
        px(12, 26, 4, Math.max(2, 5 - lo), skin.legs);
        px(18, 26, 4, Math.max(2, 5 + lo), skin.legs);
        // paws
        px(4,  30 + lo, 5, 2, skin.paw);
        px(12, 30 - lo, 5, 2, skin.paw);
        px(18, 30 + lo, 5, 2, skin.paw);
    } else if (!grounded) {
        // jumping — shorter legs tucked up
        px(4,  24, 4, 4, skin.legs);
        px(12, 24, 4, 4, skin.legs);
        px(18, 24, 4, 4, skin.legs);
        px(4,  27, 5, 2, skin.paw);
        px(12, 27, 5, 2, skin.paw);
        px(18, 27, 5, 2, skin.paw);
    } else {
        // idle
        px(4,  26, 4, 5, skin.legs);
        px(12, 26, 4, 5, skin.legs);
        px(18, 26, 4, 5, skin.legs);
        px(4,  30, 5, 2, skin.paw);
        px(12, 30, 5, 2, skin.paw);
        px(18, 30, 5, 2, skin.paw);
    }
}

// ============================================================
// Enemy Sprites
// ============================================================

/**
 * Draw a basic rat enemy.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} dir  1=right, -1=left
 * @param {number} frameCount
 * @param {string} theme  'overworld' | 'castle'
 */
export function drawRat(ctx, x, y, dir, frameCount, theme) {
    const castle = theme === 'castle';
    const bodyCol   = castle ? '#3a3a3a' : '#8B4513';
    const innerCol  = castle ? '#4a4a4a' : '#A0522D';
    const bellyCol  = castle ? '#555555' : '#D2B48C';
    const eyeCol    = castle ? '#00FF66' : '#FF0000';
    const tailCol   = castle ? '#2a2a2a' : '#6B3410';

    const flip = dir === -1;

    function px(rx, ry, w, h, col) {
        ctx.fillStyle = col;
        ctx.fillRect(flip ? x + 32 - rx - w : x + rx, y + ry, w, h);
    }

    // Body
    px(4, 8, 24, 18, bodyCol);
    px(6, 10, 20, 14, innerCol);
    px(8, 16, 16, 8, bellyCol);

    // Head
    px(20, 4, 10, 14, bodyCol);
    px(22, 6, 8, 10, innerCol);

    // Snout
    px(28, 10, 4, 4, bellyCol);

    // Ears
    px(22, 0, 4, 6, bodyCol);
    px(28, 1, 4, 5, bodyCol);
    px(23, 1, 2, 4, '#FFB6C1');
    px(29, 2, 2, 3, '#FFB6C1');

    // Eyes
    px(24, 7, 3, 3, '#FFF');
    px(25, 8, 2, 2, eyeCol);

    // Castle glow effect
    if (castle) {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(frameCount * 0.1) * 0.15;
        px(23, 6, 5, 5, '#00FF66');
        ctx.restore();
    }

    // Whiskers
    px(30, 9, 2, 1, '#AAA');
    px(30, 12, 2, 1, '#AAA');

    // Tail (animated wave)
    const tw = Math.sin(frameCount * 0.15) * 3;
    px(-2, 12 + tw, 8, 3, tailCol);
    px(-4, 10 + tw, 4, 3, tailCol);
    px(-6, 8 + tw, 3, 3, tailCol);

    // Legs (animated)
    const lo = Math.sin(frameCount * 0.3) * 2;
    px(6,  26, 4, Math.max(2, 5 + lo), bodyCol);
    px(14, 26, 4, Math.max(2, 5 - lo), bodyCol);
    px(22, 26, 4, Math.max(2, 5 + lo), bodyCol);

    // Feet
    px(5,  30 + lo, 6, 2, castle ? '#444' : '#6B3410');
    px(13, 30 - lo, 6, 2, castle ? '#444' : '#6B3410');
    px(21, 30 + lo, 6, 2, castle ? '#444' : '#6B3410');
}

/**
 * Draw a Koopa-rat (Ratter).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} dir
 * @param {number} frameCount
 * @param {boolean} inShell
 */
export function drawRatter(ctx, x, y, dir, frameCount, inShell) {
    if (inShell) {
        _drawRatterShell(ctx, x, y, frameCount);
        return;
    }
    _drawRatterWalking(ctx, x, y, dir, frameCount);
}

function _drawRatterShell(ctx, x, y, frameCount) {
    const cx = x + 16;
    const cy = y + 20;

    ctx.save();
    // spinning rotation
    const rot = frameCount * 0.15;

    // Shell body (green ellipse)
    ctx.beginPath();
    ctx.ellipse(cx, cy, 14, 12, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#228B22';
    ctx.fill();

    // Shell inner highlight
    ctx.beginPath();
    ctx.ellipse(cx, cy - 1, 11, 9, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2EA82E';
    ctx.fill();

    // Shell pattern — rotating lines
    ctx.strokeStyle = '#1a6b1a';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 4; i++) {
        const a = rot + (i * Math.PI / 2);
        const sx = cx + Math.cos(a) * 6;
        const sy = cy + Math.sin(a) * 5;
        const ex = cx + Math.cos(a) * 13;
        const ey = cy + Math.sin(a) * 11;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        ctx.lineTo(ex, ey);
        ctx.stroke();
    }

    // Shell rim highlight
    ctx.beginPath();
    ctx.ellipse(cx, cy - 3, 12, 4, 0, Math.PI, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fill();

    // Specular dot
    ctx.beginPath();
    ctx.arc(cx - 4, cy - 6, 2, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();

    ctx.restore();
}

function _drawRatterWalking(ctx, x, y, dir, frameCount) {
    const flip = dir === -1;

    function px(rx, ry, w, h, col) {
        ctx.fillStyle = col;
        ctx.fillRect(flip ? x + 32 - rx - w : x + rx, y + ry, w, h);
    }

    // Shell on back
    ctx.save();
    const shellCx = flip ? x + 16 : x + 16;
    const shellCy = y + 10;
    ctx.beginPath();
    ctx.ellipse(shellCx, shellCy, 12, 10, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#228B22';
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(shellCx, shellCy, 9, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#2EA82E';
    ctx.fill();

    // Shell pattern lines
    ctx.strokeStyle = '#1a6b1a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 3; i++) {
        const a = (i * Math.PI / 3) - Math.PI / 6;
        ctx.beginPath();
        ctx.moveTo(shellCx, shellCy);
        ctx.lineTo(shellCx + Math.cos(a) * 11, shellCy + Math.sin(a) * 9);
        ctx.stroke();
    }
    ctx.restore();

    // Belly
    px(6, 14, 20, 14, '#D2B48C');
    px(8, 16, 16, 10, '#E8D5B0');

    // Head
    px(20, 4, 12, 12, '#8B4513');
    px(22, 6, 8, 8, '#A0522D');

    // Nose
    px(30, 8, 3, 3, '#FFB6C1');

    // Eyes
    px(24, 6, 3, 3, '#FFF');
    px(25, 7, 2, 2, '#FF0000');

    // Ears
    px(22, 0, 4, 5, '#8B4513');
    px(28, 1, 4, 4, '#8B4513');
    px(23, 1, 2, 3, '#FFB6C1');
    px(29, 2, 2, 2, '#FFB6C1');

    // Whiskers
    px(31, 7, 2, 1, '#DDD');
    px(31, 10, 2, 1, '#DDD');

    // Tail
    const tw = Math.sin(frameCount * 0.12) * 2;
    px(-3, 16 + tw, 6, 3, '#8B4513');
    px(-5, 14 + tw, 4, 3, '#6B3410');

    // Legs (animated)
    const lo = Math.sin(frameCount * 0.3) * 3;
    px(8,  28, 5, Math.max(3, 8 + lo), '#8B4513');
    px(20, 28, 5, Math.max(3, 8 - lo), '#8B4513');

    // Feet (orange)
    px(7,  35 + lo, 7, 3, '#FF8C00');
    px(19, 35 - lo, 7, 3, '#FF8C00');
}

/**
 * Draw a flying Ratter (Ratter with wings).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} dir
 * @param {number} frameCount
 */
export function drawFlyRatter(ctx, x, y, dir, frameCount) {
    // Draw base ratter (walking pose, not in shell)
    _drawRatterWalking(ctx, x, y, dir, frameCount);

    // Animated wings
    const flapAngle = Math.sin(frameCount * 0.25) * 0.6;
    const flip = dir === -1;

    ctx.save();

    // Left wing
    const lwx = flip ? x + 24 : x + 8;
    const lwy = y + 4;
    ctx.save();
    ctx.translate(lwx, lwy);
    ctx.rotate(-0.3 + flapAngle);
    ctx.beginPath();
    ctx.ellipse(0, -6, 6, 10, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Wing vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-2, -12);
    ctx.strokeStyle = 'rgba(180, 180, 180, 0.5)';
    ctx.stroke();
    ctx.restore();

    // Right wing
    const rwx = flip ? x + 8 : x + 24;
    const rwy = y + 4;
    ctx.save();
    ctx.translate(rwx, rwy);
    ctx.rotate(0.3 - flapAngle);
    ctx.beginPath();
    ctx.ellipse(0, -6, 6, 10, 0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(200, 200, 200, 0.6)';
    ctx.lineWidth = 1;
    ctx.stroke();
    // Wing vein
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(2, -12);
    ctx.strokeStyle = 'rgba(180, 180, 180, 0.5)';
    ctx.stroke();
    ctx.restore();

    ctx.restore();
}

/**
 * Draw an Archer rat — stationary rat with a bow.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} dir
 * @param {number} frameCount
 * @param {string} theme 'overworld' | 'castle'
 */
export function drawArcher(ctx, x, y, dir, frameCount, theme) {
    const castle = theme === 'castle';
    const bodyCol  = castle ? '#3a3a3a' : '#8B4513';
    const innerCol = castle ? '#4a4a4a' : '#A0522D';
    const bellyCol = castle ? '#555' : '#D2B48C';
    const eyeCol   = castle ? '#00FF66' : '#FF0000';
    const flip = dir === -1;

    function px(rx, ry, w, h, col) {
        ctx.fillStyle = col;
        ctx.fillRect(flip ? x + 32 - rx - w : x + rx, y + ry, w, h);
    }

    // Body
    px(6, 8, 20, 18, bodyCol);
    px(8, 10, 16, 14, innerCol);
    px(10, 14, 12, 8, bellyCol);

    // Head
    px(18, 2, 12, 12, bodyCol);
    px(20, 4, 8, 8, innerCol);

    // Bandana (red)
    px(18, 2, 12, 3, '#CC2222');
    px(16, 3, 3, 5, '#CC2222');  // bandana tail

    // Ears
    px(20, -2, 4, 5, bodyCol);
    px(27, -1, 4, 4, bodyCol);
    px(21, -1, 2, 3, '#FFB6C1');
    px(28, 0, 2, 2, '#FFB6C1');

    // Eyes
    px(22, 5, 3, 3, '#FFF');
    px(23, 6, 2, 2, eyeCol);

    // Castle glow
    if (castle) {
        ctx.save();
        ctx.globalAlpha = 0.3 + Math.sin(frameCount * 0.1) * 0.15;
        px(21, 4, 5, 5, '#00FF66');
        ctx.restore();
    }

    // Nose
    px(29, 7, 2, 2, '#FFB6C1');

    // Whiskers
    px(30, 6, 2, 1, '#AAA');
    px(30, 9, 2, 1, '#AAA');

    // Legs (stationary)
    px(8,  26, 5, 6, bodyCol);
    px(20, 26, 5, 6, bodyCol);
    px(7,  30, 7, 2, castle ? '#444' : '#6B3410');
    px(19, 30, 7, 2, castle ? '#444' : '#6B3410');

    // Tail
    const tw = Math.sin(frameCount * 0.1) * 1.5;
    px(-2, 14 + tw, 6, 3, bodyCol);
    px(-4, 12 + tw, 4, 3, castle ? '#2a2a2a' : '#6B3410');

    // Bow — draw as an arc on the front side
    ctx.save();
    const bowX = flip ? x + 4 : x + 28;
    const bowY = y + 10;

    // Bow arc (wooden)
    ctx.beginPath();
    ctx.arc(bowX, bowY, 10, -Math.PI * 0.7, Math.PI * 0.7);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Bowstring
    ctx.beginPath();
    const topX = bowX + Math.cos(-Math.PI * 0.7) * 10;
    const topY = bowY + Math.sin(-Math.PI * 0.7) * 10;
    const botX = bowX + Math.cos(Math.PI * 0.7) * 10;
    const botY = bowY + Math.sin(Math.PI * 0.7) * 10;
    ctx.moveTo(topX, topY);
    ctx.lineTo(botX, botY);
    ctx.strokeStyle = '#DDD';
    ctx.lineWidth = 1;
    ctx.stroke();

    // Arrow nocked
    const pull = Math.sin(frameCount * 0.05) * 2;
    const arrowStartX = flip ? bowX + 3 + pull : bowX - 3 - pull;
    const arrowEndX   = flip ? bowX - 12 : bowX + 12;
    ctx.beginPath();
    ctx.moveTo(arrowStartX, bowY);
    ctx.lineTo(arrowEndX, bowY);
    ctx.strokeStyle = '#8B6914';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Arrowhead
    ctx.beginPath();
    if (flip) {
        ctx.moveTo(arrowEndX, bowY);
        ctx.lineTo(arrowEndX + 4, bowY - 3);
        ctx.lineTo(arrowEndX + 4, bowY + 3);
    } else {
        ctx.moveTo(arrowEndX, bowY);
        ctx.lineTo(arrowEndX - 4, bowY - 3);
        ctx.lineTo(arrowEndX - 4, bowY + 3);
    }
    ctx.closePath();
    ctx.fillStyle = '#888';
    ctx.fill();

    ctx.restore();
}

// ============================================================
// Items
// ============================================================

/**
 * Draw a spinning gold coin.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} frameCount
 */
export function drawCoin(ctx, x, y, frameCount) {
    const cx = x + 16;
    const cy = y + 16;
    const scaleX = Math.abs(Math.cos(frameCount * 0.08));
    const rx = Math.max(1, 8 * scaleX);  // horizontal radius, min 1
    const ry = 12; // vertical radius

    ctx.save();

    // Outer gold
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.strokeStyle = '#DAA520';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner highlight when facing enough
    if (scaleX > 0.3) {
        ctx.beginPath();
        ctx.ellipse(cx, cy, rx * 0.6, ry * 0.6, 0, 0, Math.PI * 2);
        ctx.fillStyle = '#FFF0A0';
        ctx.fill();

        // $ symbol
        if (scaleX > 0.5) {
            ctx.fillStyle = '#DAA520';
            ctx.font = 'bold 10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('$', cx, cy + 1);
        }
    }

    // Shine
    ctx.beginPath();
    ctx.ellipse(cx - rx * 0.3, cy - ry * 0.35, Math.max(1, rx * 0.25), ry * 0.2, -0.3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fill();

    ctx.restore();
}

/**
 * Draw a 1-Up mushroom with a cat face.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} frameCount
 */
export function drawOneUp(ctx, x, y, frameCount) {
    const bob = Math.sin(frameCount * 0.08) * 2;
    const cx = x + 16;
    const cy = y + 16 + bob;

    ctx.save();

    // Mushroom cap (green dome)
    ctx.beginPath();
    ctx.ellipse(cx, cy - 2, 12, 10, 0, Math.PI, Math.PI * 2);
    ctx.fillStyle = '#22AA44';
    ctx.fill();

    // Cap spots
    ctx.beginPath();
    ctx.arc(cx - 5, cy - 8, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FAFAFA';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx + 4, cy - 6, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FAFAFA';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cx, cy - 10, 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FAFAFA';
    ctx.fill();

    // Mushroom stem / face area
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 2);
    ctx.lineTo(cx - 6, cy + 10);
    ctx.lineTo(cx + 6, cy + 10);
    ctx.lineTo(cx + 8, cy - 2);
    ctx.closePath();
    ctx.fillStyle = '#FFF5E0';
    ctx.fill();

    // Cat face on stem — eyes
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(cx - 5, cy + 1, 2, 2);
    ctx.fillRect(cx + 3, cy + 1, 2, 2);

    // Cat nose
    ctx.beginPath();
    ctx.moveTo(cx, cy + 4);
    ctx.lineTo(cx - 1.5, cy + 5.5);
    ctx.lineTo(cx + 1.5, cy + 5.5);
    ctx.closePath();
    ctx.fillStyle = '#FF6B8A';
    ctx.fill();

    // Cat mouth
    ctx.beginPath();
    ctx.moveTo(cx, cy + 5.5);
    ctx.lineTo(cx - 2, cy + 7.5);
    ctx.moveTo(cx, cy + 5.5);
    ctx.lineTo(cx + 2, cy + 7.5);
    ctx.strokeStyle = '#1a1a2e';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Cat whiskers
    ctx.beginPath();
    ctx.moveTo(cx - 5, cy + 4);
    ctx.lineTo(cx - 10, cy + 3);
    ctx.moveTo(cx - 5, cy + 5.5);
    ctx.lineTo(cx - 10, cy + 6);
    ctx.moveTo(cx + 5, cy + 4);
    ctx.lineTo(cx + 10, cy + 3);
    ctx.moveTo(cx + 5, cy + 5.5);
    ctx.lineTo(cx + 10, cy + 6);
    ctx.strokeStyle = '#AAA';
    ctx.lineWidth = 0.6;
    ctx.stroke();

    // Cat ears on cap
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy - 7);
    ctx.lineTo(cx - 12, cy - 14);
    ctx.lineTo(cx - 4, cy - 9);
    ctx.closePath();
    ctx.fillStyle = '#22AA44';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 8, cy - 7);
    ctx.lineTo(cx + 12, cy - 14);
    ctx.lineTo(cx + 4, cy - 9);
    ctx.closePath();
    ctx.fillStyle = '#22AA44';
    ctx.fill();

    // Inner ears
    ctx.beginPath();
    ctx.moveTo(cx - 7, cy - 8);
    ctx.lineTo(cx - 10, cy - 12);
    ctx.lineTo(cx - 5, cy - 9);
    ctx.closePath();
    ctx.fillStyle = '#FFB6C1';
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(cx + 7, cy - 8);
    ctx.lineTo(cx + 10, cy - 12);
    ctx.lineTo(cx + 5, cy - 9);
    ctx.closePath();
    ctx.fillStyle = '#FFB6C1';
    ctx.fill();

    ctx.restore();
}

/**
 * Draw a fire flower: green stem + concentric petal circles (red/gold/white).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} frameCount
 */
export function drawFireFlower(ctx, x, y, frameCount) {
    const cx = x + 16;
    const cy = y + 16;
    const pulse = 1.0 + Math.sin(frameCount * 0.1) * 0.1;

    ctx.save();

    // Stem
    ctx.fillStyle = '#228B22';
    ctx.fillRect(cx - 2, cy + 4, 4, 12);

    // Leaves
    ctx.beginPath();
    ctx.ellipse(cx - 5, cy + 10, 5, 2.5, -0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#2EA82E';
    ctx.fill();

    ctx.beginPath();
    ctx.ellipse(cx + 5, cy + 12, 5, 2.5, 0.4, 0, Math.PI * 2);
    ctx.fillStyle = '#2EA82E';
    ctx.fill();

    // Outer petals (red)
    const petalCount = 8;
    for (let i = 0; i < petalCount; i++) {
        const angle = (i / petalCount) * Math.PI * 2 + frameCount * 0.02;
        const px = cx + Math.cos(angle) * 8 * pulse;
        const py = cy - 2 + Math.sin(angle) * 8 * pulse;
        ctx.beginPath();
        ctx.arc(px, py, 4 * pulse, 0, Math.PI * 2);
        ctx.fillStyle = '#FF3333';
        ctx.fill();
    }

    // Mid circle (gold)
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 5 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();

    // Inner circle (white)
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 3 * pulse, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();

    // Center dot
    ctx.beginPath();
    ctx.arc(cx, cy - 2, 1.5, 0, Math.PI * 2);
    ctx.fillStyle = '#FF6600';
    ctx.fill();

    ctx.restore();
}

/**
 * Draw a checkpoint flag on a pole.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {boolean} active - true=green flag, false=red flag
 * @param {number} frameCount
 */
export function drawCheckpoint(ctx, x, y, active, frameCount) {
    ctx.save();

    const poleX = x + 16;

    // Pole
    ctx.fillStyle = '#888';
    ctx.fillRect(poleX - 1, y + 2, 3, 30);

    // Pole top ball
    ctx.beginPath();
    ctx.arc(poleX + 0.5, y + 2, 3, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();

    // Flag
    const wave = Math.sin(frameCount * 0.1) * 2;
    const flagColor = active ? '#22CC44' : '#CC2222';
    const flagHighlight = active ? '#44EE66' : '#EE4444';

    ctx.beginPath();
    ctx.moveTo(poleX + 2, y + 4);
    ctx.lineTo(poleX + 16 + wave, y + 8);
    ctx.lineTo(poleX + 14 + wave * 0.5, y + 12);
    ctx.lineTo(poleX + 16 + wave, y + 16);
    ctx.lineTo(poleX + 2, y + 18);
    ctx.closePath();
    ctx.fillStyle = flagColor;
    ctx.fill();

    // Flag highlight stripe
    ctx.beginPath();
    ctx.moveTo(poleX + 4, y + 7);
    ctx.lineTo(poleX + 12 + wave * 0.7, y + 9);
    ctx.lineTo(poleX + 12 + wave * 0.7, y + 11);
    ctx.lineTo(poleX + 4, y + 9);
    ctx.closePath();
    ctx.fillStyle = flagHighlight;
    ctx.fill();

    // Active glow
    if (active) {
        ctx.globalAlpha = 0.2 + Math.sin(frameCount * 0.15) * 0.1;
        ctx.beginPath();
        ctx.arc(poleX + 8, y + 11, 12, 0, Math.PI * 2);
        ctx.fillStyle = '#22CC44';
        ctx.fill();
    }

    ctx.restore();
}

/**
 * Draw a spawn point marker (editor only).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} frameCount
 */
export function drawSpawnPoint(ctx, x, y, frameCount) {
    const cx = x + 16;
    const cy = y + 16;

    ctx.save();

    // Pulsing gold ring
    const pulse = 1.0 + Math.sin(frameCount * 0.12) * 0.15;
    ctx.beginPath();
    ctx.arc(cx, cy, 12 * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.6 + Math.sin(frameCount * 0.12) * 0.3;
    ctx.stroke();

    // Inner ring
    ctx.beginPath();
    ctx.arc(cx, cy, 8 * pulse, 0, Math.PI * 2);
    ctx.strokeStyle = '#FFC107';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.globalAlpha = 1.0;

    // Down arrow
    ctx.beginPath();
    ctx.moveTo(cx, cy + 6);
    ctx.lineTo(cx - 5, cy - 1);
    ctx.lineTo(cx - 2, cy - 1);
    ctx.lineTo(cx - 2, cy - 7);
    ctx.lineTo(cx + 2, cy - 7);
    ctx.lineTo(cx + 2, cy - 1);
    ctx.lineTo(cx + 5, cy - 1);
    ctx.closePath();
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.strokeStyle = '#B8860B';
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // 'SPAWN' label
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 6px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('SPAWN', cx, y + 28);

    ctx.restore();
}

/**
 * Draw a goal marker (editor only).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} frameCount
 */
export function drawGoalMarker(ctx, x, y, frameCount) {
    const cx = x + 16;
    const cy = y + 16;

    ctx.save();

    // Outer border
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, 28, 24);

    // Checkered pattern (4x3 grid of 7px squares)
    const squareW = 7;
    const squareH = 8;
    for (let row = 0; row < 3; row++) {
        for (let col = 0; col < 4; col++) {
            const isBlack = (row + col) % 2 === 0;
            ctx.fillStyle = isBlack ? '#1a1a2e' : '#FFFFFF';
            ctx.fillRect(x + 2 + col * squareW, y + 2 + row * squareH, squareW, squareH);
        }
    }

    // Redraw border on top
    ctx.strokeStyle = '#FFD700';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 2, y + 2, 28, 24);

    // Animated shimmer
    const shimmerX = ((frameCount * 2) % 40) - 6;
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#FFD700';
    ctx.fillRect(x + 2 + shimmerX, y + 2, 6, 24);
    ctx.globalAlpha = 1.0;

    // 'GOAL' label
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 7px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('GOAL', cx, y + 26);

    ctx.restore();
}
