'use strict';

/**
 * Dispatch to the correct theme background renderer.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {number} camX
 * @param {string} theme
 * @param {number} frameCount
 */
export function drawBackground(ctx, width, height, camX, theme, frameCount) {
    switch (theme) {
        case 'castle':
            drawCastleBG(ctx, width, height, camX, frameCount);
            break;
        case 'overworld':
        default:
            drawOverworldBG(ctx, width, height, camX, frameCount);
            break;
    }
}

/**
 * Draw the overworld background with sky gradient, parallax clouds, and hills.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {number} camX
 * @param {number} frameCount
 */
export function drawOverworldBG(ctx, w, h, camX, frameCount) {
    // 1. Sky gradient
    const skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    skyGrad.addColorStop(0, '#4A90D9');
    skyGrad.addColorStop(0.6, '#87CEEB');
    skyGrad.addColorStop(1, '#B8E6B8');
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Clouds (parallax 0.1x)
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    const cloudPositions = [
        [100, 40, 60],
        [300, 60, 50],
        [550, 30, 70],
        [750, 55, 45],
        [950, 35, 55]
    ];

    for (const [bx, by, bw] of cloudPositions) {
        const x2 = (bx + (-camX * 0.1)) % 1200 - 100;

        // Main ellipse
        ctx.beginPath();
        ctx.ellipse(x2, by, bw, bw * 0.4, 0, 0, Math.PI * 2);
        ctx.fill();

        // Left ellipse
        ctx.beginPath();
        ctx.ellipse(x2 - bw * 0.4, by + 5, bw * 0.5, bw * 0.3, 0, 0, Math.PI * 2);
        ctx.fill();

        // Right ellipse
        ctx.beginPath();
        ctx.ellipse(x2 + bw * 0.4, by + 5, bw * 0.6, bw * 0.35, 0, 0, Math.PI * 2);
        ctx.fill();
    }

    // 3. Hills (parallax 0.2x)
    ctx.fillStyle = '#5BAA5B';
    const ho = -camX * 0.2;

    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
        const hx = (i * 200 + ho) % 1600 - 200;
        const hh = 40 + Math.sin(i * 1.3) * 20;
        ctx.moveTo(hx + 80 - 120, h - 60 + 10);
        ctx.ellipse(hx + 80, h - 60 + 10, 120, hh, 0, Math.PI, 0);
    }
    ctx.fill();

    // 4. Near hills (parallax 0.28x)
    ctx.fillStyle = '#4A9A4A';

    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
        const hx = (i * 160 + ho * 1.4) % 1600 - 160;
        const hh = 30 + Math.sin(i * 2.1) * 10;
        ctx.moveTo(hx + 60 - 80, h - 60 + 15);
        ctx.ellipse(hx + 60, h - 60 + 15, 80, hh, 0, Math.PI, 0);
    }
    ctx.fill();
}

/**
 * Draw the castle/dungeon background with stone texture, torches, and dust motes.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} w
 * @param {number} h
 * @param {number} camX
 * @param {number} frameCount
 */
export function drawCastleBG(ctx, w, h, camX, frameCount) {
    // 1. Dark gradient
    const darkGrad = ctx.createLinearGradient(0, 0, 0, h);
    darkGrad.addColorStop(0, '#0A0A12');
    darkGrad.addColorStop(0.4, '#141420');
    darkGrad.addColorStop(1, '#1A1A28');
    ctx.fillStyle = darkGrad;
    ctx.fillRect(0, 0, w, h);

    // 2. Stone texture (subtle brick pattern)
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.fillStyle = '#445';

    const cellSize = 32;
    const parallaxOffset = (-camX * 0.05) % cellSize;

    const startCol = Math.floor(-parallaxOffset / cellSize) - 1;
    const endCol = Math.ceil(w / cellSize) + 1;
    const endRow = Math.ceil(h / (cellSize / 2)) + 1;

    for (let row = 0; row < endRow; row++) {
        const rowOffset = (row % 2 === 1) ? 16 : 0;
        const y = row * (cellSize / 2);
        for (let col = startCol; col < endCol; col++) {
            const x = col * cellSize + parallaxOffset + rowOffset;
            ctx.fillRect(x, y, 31, 15);
        }
    }
    ctx.restore();

    // 3. Wall torches
    const torchXPositions = [200, 500, 800];

    for (let i = 0; i < torchXPositions.length; i++) {
        const torchParallax = (-camX * 0.08) % w;
        const tx = (torchXPositions[i] + torchParallax + w) % w;
        const ty = h * 0.35;
        const flicker = Math.sin(frameCount * 0.15 + i) * 1.5;

        // Brown bracket
        ctx.fillStyle = '#5C3A1E';
        ctx.fillRect(tx - 2, ty, 4, 12);

        // Flame - outer layer
        ctx.save();
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#FF4500';
        ctx.beginPath();
        ctx.arc(tx, ty - 2, 6 + flicker, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Flame - middle layer
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.arc(tx, ty - 2, 4 + flicker * 0.6, 0, Math.PI * 2);
        ctx.fill();

        // Flame - inner layer
        ctx.fillStyle = '#FFD700';
        ctx.beginPath();
        ctx.arc(tx, ty - 2, 2 + flicker * 0.3, 0, Math.PI * 2);
        ctx.fill();

        // Glow halo
        ctx.save();
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = '#FF6600';
        ctx.beginPath();
        ctx.arc(tx, ty - 2, 30 + flicker * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    // 4. Dust motes
    for (let i = 0; i < 8; i++) {
        // Pseudo-random but deterministic positions based on index
        const seed1 = Math.sin(i * 127.1 + 311.7);
        const seed2 = Math.sin(i * 269.5 + 183.3);
        const baseX = (seed1 - Math.floor(seed1)) * w;
        const baseY = (seed2 - Math.floor(seed2)) * h;

        // Slow drift using sin/cos based on frameCount
        const driftX = Math.sin(frameCount * 0.008 + i * 1.7) * 20;
        const driftY = Math.cos(frameCount * 0.006 + i * 2.3) * 15;

        const mx = (baseX + driftX + w) % w;
        const my = (baseY + driftY + h) % h;
        const size = 1 + (i % 2);

        ctx.fillStyle = '#888';
        ctx.fillRect(mx, my, size, size);
    }
}

/**
 * Draw the editor grid overlay with tile lines and level boundary.
 * @param {CanvasRenderingContext2D} ctx
 * @param {number} width
 * @param {number} height
 * @param {number} camX
 * @param {number} camY
 * @param {number} zoom
 * @param {number} levelW   - level width in tiles
 * @param {number} levelH   - level height in tiles
 * @param {number} tileSize - size of each tile in pixels
 */
export function drawEditorGrid(ctx, width, height, camX, camY, zoom, levelW, levelH, tileSize) {
    // Calculate visible tile range based on camera and zoom
    const startTileX = Math.floor(camX / tileSize);
    const startTileY = Math.floor(camY / tileSize);
    const visibleTilesX = Math.ceil(width / (tileSize * zoom)) + 1;
    const visibleTilesY = Math.ceil(height / (tileSize * zoom)) + 1;

    const endTileX = startTileX + visibleTilesX + 1;
    const endTileY = startTileY + visibleTilesY + 1;

    // Grid lines
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1 / zoom;

    ctx.beginPath();

    // Vertical lines
    for (let tx = startTileX; tx <= endTileX; tx++) {
        const x = tx * tileSize;
        ctx.moveTo(x, startTileY * tileSize);
        ctx.lineTo(x, endTileY * tileSize);
    }

    // Horizontal lines
    for (let ty = startTileY; ty <= endTileY; ty++) {
        const y = ty * tileSize;
        ctx.moveTo(startTileX * tileSize, y);
        ctx.lineTo(endTileX * tileSize, y);
    }

    ctx.stroke();

    // Level boundary
    ctx.strokeStyle = 'rgba(255,215,0,0.3)';
    ctx.lineWidth = 2 / zoom;
    ctx.strokeRect(0, 0, levelW * tileSize, levelH * tileSize);
}
