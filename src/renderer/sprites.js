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
 * Draw a basic Rat enemy (authentic Anticatite style).
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} dir 1=right, -1=left
 * @param {number} frameCount
 * @param {string} theme 'overworld' | 'castle'
 */
export function drawRat(ctx, x, y, dir, frameCount, theme) {
    const isCave = theme === 'castle';
    const ex = x, ey = y;
    const frame = frameCount;

    ctx.save();
    if (dir === -1) {
        ctx.translate(ex + 16, ey + 16);
        ctx.scale(-1, 1);
        ctx.translate(-ex - 16, -ey - 16);
    }

    // Body
    ctx.fillStyle = isCave ? '#3a3a3a' : '#8B4513'; ctx.fillRect(ex + 4, ey + 8, 24, 18);
    ctx.fillStyle = isCave ? '#4a4a4a' : '#A0522D'; ctx.fillRect(ex + 6, ey + 10, 20, 14);
    // Head
    ctx.fillStyle = isCave ? '#3a3a3a' : '#8B4513'; ctx.fillRect(ex + 20, ey + 4, 10, 14);
    // Ears
    ctx.fillStyle = isCave ? '#2a2a2a' : '#6B3410'; ctx.fillRect(ex + 22, ey, 4, 6); ctx.fillRect(ex + 28, ey, 4, 6);
    // Eyes (glowing green for cave/castle rats)
    ctx.fillStyle = isCave ? '#00FF66' : '#FF0000'; ctx.fillRect(ex + 24, ey + 8, 3, 3);
    if (isCave) {
        ctx.globalAlpha = 0.3; ctx.fillStyle = '#00FF66';
        ctx.beginPath(); ctx.arc(ex + 25.5, ey + 9.5, 5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
    // Tail
    const tw2 = Math.sin(frame * 0.15) * 3;
    ctx.fillStyle = isCave ? '#2a2a2a' : '#6B3410'; ctx.fillRect(ex - 2, ey + 14 + tw2, 8, 3);
    if (isCave) {
        ctx.fillStyle = '#00FF66'; ctx.fillRect(ex - 4, ey + 13 + tw2, 3, 3);
    }
    // Legs
    const ll = Math.sin(frame * 0.25) * 2;
    ctx.fillStyle = isCave ? '#2a2a2a' : '#6B3410';
    ctx.fillRect(ex + 8, ey + 26, 4, 4 + ll); ctx.fillRect(ex + 18, ey + 26, 4, 4 - ll);

    ctx.restore();
}

/**
 * Draw a Koopa-rat (Ratter) - authentic Anticatite style.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} dir
 * @param {number} frameCount
 * @param {boolean} inShell
 */
export function drawRatter(ctx, x, y, dir, frameCount, inShell) {
    const ex = x, ey = y;
    const frame = frameCount;

    if (inShell) {
        // Shell mode — green spinning shell
        const spinAngle = frame * 0.2;
        ctx.save();
        ctx.translate(ex + 16, ey + 16);
        ctx.rotate(spinAngle);
        // Shell body
        ctx.fillStyle = '#2E8B57';
        ctx.beginPath(); ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2); ctx.fill();
        // Shell pattern
        ctx.fillStyle = '#1E6B3A';
        ctx.fillRect(-8, -4, 6, 8);
        ctx.fillRect(2, -4, 6, 8);
        // Shell highlight
        ctx.fillStyle = '#3CB371';
        ctx.fillRect(-6, -8, 4, 4);
        ctx.fillRect(4, -8, 4, 4);
        // Shell border
        ctx.strokeStyle = '#1a5a30';
        ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.ellipse(0, 0, 14, 12, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 1;
        ctx.restore();
        // Rat tail sticking out
        const tw = Math.sin(frame * 0.2) * 3;
        ctx.fillStyle = '#CD853F';
        ctx.fillRect(ex - 4, ey + 16 - 1 + tw, 8, 3);
        ctx.fillRect(ex - 7, ey + 16 + tw, 4, 2);
        return;
    }

    // Upright walking ratter
    const walk = Math.sin(frame * 0.25) * 2;
    const fx = ex;

    ctx.save();
    if (dir === -1) {
        ctx.translate(ex + 16, ey + 16);
        ctx.scale(-1, 1);
        ctx.translate(-ex - 16, -ey - 16);
    }

    // Green shell (back)
    ctx.fillStyle = '#2E8B57';
    ctx.beginPath();
    ctx.ellipse(fx + 16, ey + 18, 12, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // Shell pattern
    ctx.fillStyle = '#1E6B3A';
    ctx.fillRect(fx + 10, ey + 12, 5, 10);
    ctx.fillRect(fx + 17, ey + 12, 5, 10);
    // Shell highlight
    ctx.fillStyle = '#3CB371';
    ctx.fillRect(fx + 12, ey + 8, 3, 4);
    ctx.fillRect(fx + 19, ey + 8, 3, 4);
    // Shell border
    ctx.strokeStyle = '#1a5a30';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(fx + 16, ey + 18, 12, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Body/belly (tan)
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(fx + 10, ey + 14, 10, 14);

    // Head
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(fx + 14, ey + 2, 14, 14);
    // Snout
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(fx + 18, ey + 8, 8, 6);
    // Nose
    ctx.fillStyle = '#FF6B8A';
    ctx.fillRect(fx + 22, ey + 9, 3, 3);
    // Eyes
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(fx + 16, ey + 5, 3, 3);
    // Ear
    ctx.fillStyle = '#B8734A';
    ctx.fillRect(fx + 10, ey - 2, 5, 6);
    ctx.fillRect(fx + 18, ey - 2, 5, 6);
    // Inner ear
    ctx.fillStyle = '#FF8FAB';
    ctx.fillRect(fx + 11, ey - 1, 3, 4);
    ctx.fillRect(fx + 19, ey - 1, 3, 4);
    // Whiskers
    ctx.strokeStyle = '#999';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(fx + 24, ey + 10);
    ctx.lineTo(fx + 32, ey + 8);
    ctx.moveTo(fx + 24, ey + 12);
    ctx.lineTo(fx + 32, ey + 14);
    ctx.stroke();
    ctx.lineWidth = 1;

    // Feet (orange, walking animation)
    ctx.fillStyle = '#E8941E';
    ctx.fillRect(fx + 8, ey + 28, 6, 4 + walk);
    ctx.fillRect(fx + 18, ey + 28, 6, 4 - walk);
    // Toe claws
    ctx.fillStyle = '#FFF';
    ctx.fillRect(fx + 7, ey + 31 + walk, 3, 2);
    ctx.fillRect(fx + 17, ey + 31 - walk, 3, 2);

    // Tail
    const tw = Math.sin(frame * 0.15) * 4;
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(fx - 2, ey + 20 + tw, 6, 3);
    ctx.fillRect(fx - 6, ey + 18 + tw, 5, 3);
    ctx.fillRect(fx - 9, ey + 16 + tw, 4, 3);

    ctx.restore();
}

/**
 * Draw a flying Ratter (winged Koopa-style rat) - authentic Anticatite style.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} dir
 * @param {number} frameCount
 */
export function drawFlyRatter(ctx, x, y, dir, frameCount) {
    const ex = x, ey = y;
    const frame = frameCount;
    const fx = ex;

    ctx.save();
    if (dir === -1) {
        ctx.translate(ex + 16, ey + 16);
        ctx.scale(-1, 1);
        ctx.translate(-ex - 16, -ey - 16);
    }

    // Wings (behind body)
    const wingFlap = Math.sin(frame * 0.3) * 0.6;
    ctx.fillStyle = '#FFFFFF';
    ctx.save();
    // Left wing
    ctx.translate(fx + 4, ey + 10);
    ctx.rotate(-0.8 + wingFlap);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-18, -8); ctx.lineTo(-14, 4); ctx.lineTo(-4, 6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#EEEEFF';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-12, -4); ctx.lineTo(-10, 2);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.save();
    // Right wing
    ctx.fillStyle = '#FFFFFF';
    ctx.translate(fx + 28, ey + 10);
    ctx.rotate(0.8 - wingFlap);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(18, -8); ctx.lineTo(14, 4); ctx.lineTo(4, 6);
    ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#EEEEFF';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(12, -4); ctx.lineTo(10, 2);
    ctx.closePath(); ctx.fill();
    ctx.restore();

    // Green shell (back)
    ctx.fillStyle = '#2E8B57';
    ctx.beginPath(); ctx.ellipse(fx + 16, ey + 18, 12, 14, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1E6B3A';
    ctx.fillRect(fx + 10, ey + 12, 5, 10);
    ctx.fillRect(fx + 17, ey + 12, 5, 10);
    ctx.fillStyle = '#3CB371';
    ctx.fillRect(fx + 12, ey + 8, 3, 4);
    ctx.fillRect(fx + 19, ey + 8, 3, 4);
    ctx.strokeStyle = '#1a5a30'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.ellipse(fx + 16, ey + 18, 12, 14, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.lineWidth = 1;
    // Body/belly
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(fx + 10, ey + 14, 10, 14);
    // Head
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(fx + 14, ey + 2, 14, 14);
    ctx.fillStyle = '#DEB887';
    ctx.fillRect(fx + 18, ey + 8, 8, 6);
    ctx.fillStyle = '#FF6B8A';
    ctx.fillRect(fx + 22, ey + 9, 3, 3);
    ctx.fillStyle = '#FF0000';
    ctx.fillRect(fx + 16, ey + 5, 3, 3);
    // Ears
    ctx.fillStyle = '#B8734A';
    ctx.fillRect(fx + 10, ey - 2, 5, 6);
    ctx.fillRect(fx + 18, ey - 2, 5, 6);
    ctx.fillStyle = '#FF8FAB';
    ctx.fillRect(fx + 11, ey - 1, 3, 4);
    ctx.fillRect(fx + 19, ey - 1, 3, 4);
    // Feet (tucked up while flying)
    ctx.fillStyle = '#E8941E';
    ctx.fillRect(fx + 10, ey + 28, 5, 3);
    ctx.fillRect(fx + 18, ey + 28, 5, 3);
    // Tail
    const tw2 = Math.sin(frame * 0.15) * 4;
    ctx.fillStyle = '#CD853F';
    ctx.fillRect(fx - 2, ey + 20 + tw2, 6, 3);
    ctx.fillRect(fx - 6, ey + 18 + tw2, 5, 3);

    ctx.restore();
}

/**
 * Draw an Archer rat — authentic Anticatite style.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} x
 * @param {number} y
 * @param {number} dir
 * @param {number} frameCount
 * @param {string} theme 'overworld' | 'castle'
 */
export function drawArcher(ctx, x, y, dir, frameCount, theme) {
    const isCave = theme === 'castle';
    const ex = x, ey = y;
    const frame = frameCount;
    const bobArm = Math.sin(frame * 0.15) * 1.5;

    ctx.save();
    if (dir === -1) {
        ctx.translate(ex + 16, ey + 16);
        ctx.scale(-1, 1);
        ctx.translate(-ex - 16, -ey - 16);
    }

    // Body
    ctx.fillStyle = isCave ? '#3a3a3a' : '#6B4226';
    ctx.fillRect(ex + 6, ey + 8, 20, 18);
    ctx.fillStyle = isCave ? '#4a4a4a' : '#8B5A3C';
    ctx.fillRect(ex + 8, ey + 10, 16, 14);
    // Head
    ctx.fillStyle = isCave ? '#3a3a3a' : '#6B4226';
    ctx.fillRect(ex + 14, ey + 2, 12, 12);
    // Snout
    ctx.fillStyle = isCave ? '#555' : '#A07050';
    ctx.fillRect(ex + 20, ey + 6, 6, 5);
    // Nose
    ctx.fillStyle = '#FF6B8A';
    ctx.fillRect(ex + 23, ey + 7, 3, 3);
    // Eyes
    ctx.fillStyle = isCave ? '#00FF66' : '#FF0000';
    ctx.fillRect(ex + 18, ey + 5, 3, 3);
    // Ears
    ctx.fillStyle = isCave ? '#2a2a2a' : '#5A3418';
    ctx.fillRect(ex + 10, ey - 1, 4, 5);
    ctx.fillRect(ex + 18, ey - 1, 4, 5);
    ctx.fillStyle = '#FF8FAB';
    ctx.fillRect(ex + 11, ey, 2, 3);
    ctx.fillRect(ex + 19, ey, 2, 3);
    // Legs
    ctx.fillStyle = isCave ? '#2a2a2a' : '#5A3418';
    ctx.fillRect(ex + 10, ey + 26, 4, 5);
    ctx.fillRect(ex + 18, ey + 26, 4, 5);
    // Tail
    const tw = Math.sin(frame * 0.15) * 3;
    ctx.fillStyle = isCave ? '#2a2a2a' : '#5A3418';
    ctx.fillRect(ex - 2, ey + 16 + tw, 6, 2);
    // Bow (arc on the side they're facing)
    ctx.save();
    ctx.translate(ex + 28, ey + 14 + bobArm);
    ctx.strokeStyle = '#A0522D';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, 10, -Math.PI * 0.6, Math.PI * 0.6, false);
    ctx.stroke();
    // Bowstring
    ctx.strokeStyle = '#DDD';
    ctx.lineWidth = 1;
    ctx.beginPath();
    const bx1 = 10 * Math.cos(-Math.PI * 0.6);
    const by1 = 10 * Math.sin(-Math.PI * 0.6);
    const bx2 = 10 * Math.cos(Math.PI * 0.6);
    const by2 = 10 * Math.sin(Math.PI * 0.6);
    ctx.moveTo(bx1, by1); ctx.lineTo(bx2, by2);
    ctx.stroke();
    // Arrow nocked
    ctx.fillStyle = '#8B6914';
    ctx.fillRect(-2, -1, 12, 2);
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.moveTo(10, 0);
    ctx.lineTo(7, -2);
    ctx.lineTo(7, 2);
    ctx.closePath(); ctx.fill();
    ctx.restore();
    ctx.lineWidth = 1;
    // Glowing eye effect for cave
    if (isCave) {
        ctx.globalAlpha = 0.3; ctx.fillStyle = '#00FF66';
        ctx.beginPath(); ctx.arc(ex + 19.5, ey + 6.5, 5, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
    }
    // Bandana / headband
    ctx.fillStyle = '#CC2222';
    ctx.fillRect(ex + 13, ey + 1, 14, 3);
    // Bandana tail
    ctx.fillRect(ex + 8, ey + 2, 3, 5);

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
