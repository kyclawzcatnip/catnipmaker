'use strict';

import {
    TILE_SIZE,
    GRAVITY,
    MAX_FALL,
    JUMP_FORCE,
    WALK_SPEED,
    ENEMY_SPEED,
    FRICTION,
    PLAYER_W,
    PLAYER_H,
    COYOTE_TIME,
    JUMP_BUFFER
} from '../core/constants.js';

// ── Tile helpers ─────────────────────────────────────────────────────────────

/**
 * Returns the tile type at the given pixel coordinates.
 * @param {number[][]} grid - 2-D tile grid (row-major).
 * @param {number} px - Pixel x.
 * @param {number} py - Pixel y.
 * @param {number} lw - Level width in tiles.
 * @param {number} lh - Level height in tiles.
 * @returns {number} Tile type (0 = empty).
 */
export function getTileAt(grid, px, py, lw, lh) {
    const col = Math.floor(px / TILE_SIZE);
    const row = Math.floor(py / TILE_SIZE);
    if (col < 0 || col >= lw || row < 0 || row >= lh) return 0;
    return grid[row]?.[col] ?? 0;
}

/**
 * Returns true when the tile type is fully solid (not a platform or empty).
 * Tile type 9 = platform (only solid from above), handled separately.
 * Solid types: 1 (ground), 2 (brick), 3 (question block), etc.
 * @param {number} type
 * @returns {boolean}
 */
function isSolid(type) {
    return type > 0 && type !== 9;
}

// ── Player factory ───────────────────────────────────────────────────────────

/**
 * Creates a new player object.
 * @param {number} x - Spawn x (pixels).
 * @param {number} y - Spawn y (pixels).
 * @returns {object} Player state.
 */
export function createPlayer(x, y) {
    return {
        x,
        y,
        vx: 0,
        vy: 0,
        w: PLAYER_W,
        h: PLAYER_H,
        dir: 1,
        grounded: false,
        walking: false,
        dead: false,
        coyoteTimer: 0,
        jumpBufferTimer: 0
    };
}

// ── Player update ────────────────────────────────────────────────────────────

/**
 * Runs a single physics frame for the player.
 * @param {object} player - Player state (mutated in place).
 * @param {object} keys - Map of currently-pressed key names → boolean.
 * @param {number[][]} grid - Level tile grid.
 * @param {number} levelWidth - Level width in tiles.
 * @param {number} levelHeight - Level height in tiles.
 */
export function updatePlayer(player, keys, grid, levelWidth, levelHeight) {
    if (player.dead) return;

    // ── 1. Horizontal input ──────────────────────────────────────────────
    const left  = keys['ArrowLeft']  || keys['a'] || keys['A'];
    const right = keys['ArrowRight'] || keys['d'] || keys['D'];
    const jump  = keys['ArrowUp']    || keys['w'] || keys['W'] || keys[' '];

    if (left) {
        player.vx = -WALK_SPEED;
        player.dir = -1;
    } else if (right) {
        player.vx = WALK_SPEED;
        player.dir = 1;
    } else {
        player.vx *= FRICTION;
        if (Math.abs(player.vx) < 0.1) player.vx = 0;
    }

    player.walking = Math.abs(player.vx) > 0.5 && player.grounded;

    // ── 2. Coyote time & jump buffer ─────────────────────────────────────
    if (player.grounded) {
        player.coyoteTimer = COYOTE_TIME;
    } else {
        player.coyoteTimer = Math.max(0, player.coyoteTimer - 1);
    }

    if (jump) {
        player.jumpBufferTimer = JUMP_BUFFER;
    } else {
        player.jumpBufferTimer = Math.max(0, player.jumpBufferTimer - 1);
    }

    // Initiate jump
    if (player.jumpBufferTimer > 0 && player.coyoteTimer > 0) {
        player.vy = JUMP_FORCE;
        player.grounded = false;
        player.coyoteTimer = 0;
        player.jumpBufferTimer = 0;
    }

    // Variable-height jump: cut upward velocity when jump key is released
    if (!jump && player.vy < 0) {
        player.vy *= 0.5;
    }

    // ── 3. Gravity ───────────────────────────────────────────────────────
    player.vy += GRAVITY;
    if (player.vy > MAX_FALL) player.vy = MAX_FALL;

    // ── 4. Move & resolve collisions ─────────────────────────────────────
    player.x += player.vx;
    resolveHorizontalCollisions(player, grid, levelWidth, levelHeight);

    player.y += player.vy;
    resolveVerticalCollisions(player, grid, levelWidth, levelHeight);

    // ── 5. Death & bounds clamping ───────────────────────────────────────
    if (player.y > levelHeight * TILE_SIZE + 64) {
        player.dead = true;
    }

    // Keep player inside level bounds horizontally
    if (player.x < 0) {
        player.x = 0;
        player.vx = 0;
    } else if (player.x + player.w > levelWidth * TILE_SIZE) {
        player.x = levelWidth * TILE_SIZE - player.w;
        player.vx = 0;
    }
}

// ── Collision resolution ─────────────────────────────────────────────────────

/**
 * Resolves horizontal AABB collisions between an entity and solid tiles.
 * @param {object} entity - Entity with x, y, w, h, vx.
 * @param {number[][]} grid - Level tile grid.
 * @param {number} lw - Level width in tiles.
 * @param {number} lh - Level height in tiles.
 */
export function resolveHorizontalCollisions(entity, grid, lw, lh) {
    const top    = Math.floor(entity.y / TILE_SIZE);
    const bottom = Math.floor((entity.y + entity.h - 1) / TILE_SIZE);
    const left   = Math.floor(entity.x / TILE_SIZE);
    const right  = Math.floor((entity.x + entity.w - 1) / TILE_SIZE);

    for (let row = top; row <= bottom; row++) {
        for (let col = left; col <= right; col++) {
            if (row < 0 || row >= lh || col < 0 || col >= lw) continue;
            const type = grid[row]?.[col] ?? 0;
            // Platforms (type 9) are NOT solid horizontally
            if (!isSolid(type)) continue;

            const tileLeft   = col * TILE_SIZE;
            const tileRight  = tileLeft + TILE_SIZE;
            const tileTop    = row * TILE_SIZE;
            const tileBottom = tileTop + TILE_SIZE;

            // AABB overlap check
            if (
                entity.x < tileRight &&
                entity.x + entity.w > tileLeft &&
                entity.y < tileBottom &&
                entity.y + entity.h > tileTop
            ) {
                if (entity.vx > 0) {
                    // Moving right → push left
                    entity.x = tileLeft - entity.w;
                    entity.vx = 0;
                } else if (entity.vx < 0) {
                    // Moving left → push right
                    entity.x = tileRight;
                    entity.vx = 0;
                }
            }
        }
    }
}

/**
 * Resolves vertical AABB collisions between an entity and solid tiles.
 * Also handles platform tiles (type 9) which are only solid from above.
 * @param {object} entity - Entity with x, y, w, h, vy, grounded.
 * @param {number[][]} grid - Level tile grid.
 * @param {number} lw - Level width in tiles.
 * @param {number} lh - Level height in tiles.
 */
export function resolveVerticalCollisions(entity, grid, lw, lh) {
    // Assume not grounded; set to true if we land on something
    let landed = false;

    const top    = Math.floor(entity.y / TILE_SIZE);
    const bottom = Math.floor((entity.y + entity.h - 1) / TILE_SIZE);
    const left   = Math.floor(entity.x / TILE_SIZE);
    const right  = Math.floor((entity.x + entity.w - 1) / TILE_SIZE);

    for (let row = top; row <= bottom; row++) {
        for (let col = left; col <= right; col++) {
            if (row < 0 || row >= lh || col < 0 || col >= lw) continue;
            const type = grid[row]?.[col] ?? 0;
            if (type === 0) continue;

            const tileLeft   = col * TILE_SIZE;
            const tileRight  = tileLeft + TILE_SIZE;
            const tileTop    = row * TILE_SIZE;
            const tileBottom = tileTop + TILE_SIZE;

            // AABB overlap check
            if (
                entity.x < tileRight &&
                entity.x + entity.w > tileLeft &&
                entity.y < tileBottom &&
                entity.y + entity.h > tileTop
            ) {
                const isPlatform = type === 9;

                if (entity.vy > 0) {
                    // Falling down
                    // For platforms, only collide if entity was previously above
                    if (isPlatform) {
                        const prevBottom = (entity.y + entity.h) - entity.vy;
                        if (prevBottom > tileTop) continue; // was already below top → pass through
                    }
                    entity.y = tileTop - entity.h;
                    entity.vy = 0;
                    landed = true;
                } else if (entity.vy < 0 && !isPlatform) {
                    // Moving up into a solid tile (not platforms)
                    entity.y = tileBottom;
                    entity.vy = 0;
                }
            }
        }
    }

    entity.grounded = landed;
}

// ── Enemy factories & update ─────────────────────────────────────────────────

/**
 * Creates a new enemy object.
 * @param {string} type - One of 'rat', 'ratter', 'flyratter', 'archer'.
 * @param {number} x - Spawn x (pixels).
 * @param {number} y - Spawn y (pixels).
 * @returns {object} Enemy state.
 */
export function createEnemy(type, x, y) {
    const base = {
        type,
        x,
        y,
        vx: -ENEMY_SPEED,
        vy: 0,
        w: TILE_SIZE,
        h: TILE_SIZE,
        dir: -1,
        grounded: false,
        dead: false,
        active: true
    };

    switch (type) {
        case 'rat':
            return base;

        case 'ratter':
            return {
                ...base,
                shell: false,
                shellSpeed: 6,
                shellVx: 0
            };

        case 'flyratter':
            return {
                ...base,
                vy: 0,
                baseY: y,
                sineOffset: 0,
                amplitude: 24,
                frequency: 0.04
            };

        case 'archer':
            return {
                ...base,
                vx: 0,
                shootTimer: 120,
                shootInterval: 120,
                facingPlayer: -1
            };

        default:
            return base;
    }
}

/**
 * Updates all enemies in the array for one physics frame.
 * @param {object[]} enemies - Array of enemy objects (mutated in place).
 * @param {number[][]} grid - Level tile grid.
 * @param {number} levelWidth - Level width in tiles.
 * @param {number} levelHeight - Level height in tiles.
 * @param {object} player - Player state (for archer targeting).
 */
export function updateEnemies(enemies, grid, levelWidth, levelHeight, player) {
    for (let i = enemies.length - 1; i >= 0; i--) {
        const e = enemies[i];
        if (!e.active || e.dead) continue;

        switch (e.type) {
            case 'rat':
                updateRat(e, grid, levelWidth, levelHeight);
                break;
            case 'ratter':
                updateRatter(e, grid, levelWidth, levelHeight);
                break;
            case 'flyratter':
                updateFlyratter(e, grid, levelWidth, levelHeight);
                break;
            case 'archer':
                updateArcher(e, player);
                break;
        }

        // Remove if fallen off level
        if (e.y > levelHeight * TILE_SIZE + 64) {
            e.dead = true;
            e.active = false;
        }
    }
}

/**
 * Rat AI: walk, apply gravity, reverse at walls / edges.
 */
function updateRat(e, grid, lw, lh) {
    // Apply gravity
    e.vy += GRAVITY;
    if (e.vy > MAX_FALL) e.vy = MAX_FALL;

    // Horizontal movement
    e.x += e.vx;
    resolveHorizontalCollisions(e, grid, lw, lh);

    // Check for wall ahead → reverse
    const probeX = e.dir === 1 ? e.x + e.w + 1 : e.x - 1;
    const probeY = e.y + e.h / 2;
    const wallTile = getTileAt(grid, probeX, probeY, lw, lh);
    if (isSolid(wallTile)) {
        e.dir *= -1;
        e.vx = ENEMY_SPEED * e.dir;
    }

    // Vertical
    e.y += e.vy;
    resolveVerticalCollisions(e, grid, lw, lh);

    // Edge detection: reverse if no floor ahead
    if (e.grounded) {
        const edgeX = e.dir === 1 ? e.x + e.w + 1 : e.x - 1;
        const edgeY = e.y + e.h + 1;
        const floorTile = getTileAt(grid, edgeX, edgeY, lw, lh);
        if (!isSolid(floorTile) && floorTile !== 9) {
            e.dir *= -1;
            e.vx = ENEMY_SPEED * e.dir;
        }
    }

    // Bounds
    if (e.x < 0) { e.x = 0; e.dir = 1; e.vx = ENEMY_SPEED; }
    if (e.x + e.w > lw * TILE_SIZE) { e.x = lw * TILE_SIZE - e.w; e.dir = -1; e.vx = -ENEMY_SPEED; }
}

/**
 * Ratter AI: same as rat + shell mode.
 * In shell mode the ratter slides at shellSpeed and bounces off walls.
 */
function updateRatter(e, grid, lw, lh) {
    if (e.shell) {
        // Shell mode: slide fast, bounce off walls
        e.vy += GRAVITY;
        if (e.vy > MAX_FALL) e.vy = MAX_FALL;

        e.x += e.shellVx;
        const prevVx = e.shellVx;
        resolveHorizontalCollisions(e, grid, lw, lh);
        // If velocity was zeroed by collision, bounce
        if (e.vx === 0 && prevVx !== 0) {
            e.shellVx = -prevVx;
        }

        // Wall bouncing at level edges
        if (e.x <= 0) { e.x = 0; e.shellVx = Math.abs(e.shellVx); }
        if (e.x + e.w >= lw * TILE_SIZE) { e.x = lw * TILE_SIZE - e.w; e.shellVx = -Math.abs(e.shellVx); }

        e.y += e.vy;
        resolveVerticalCollisions(e, grid, lw, lh);
        return;
    }

    // Normal mode → behave like rat
    updateRat(e, grid, lw, lh);
}

/**
 * Flyratter AI: sine-wave flight pattern, no gravity, reverse at walls.
 */
function updateFlyratter(e, grid, lw, lh) {
    e.sineOffset += e.frequency;

    // Horizontal
    e.x += e.vx;
    const probeX = e.dir === 1 ? e.x + e.w + 1 : e.x - 1;
    const probeY = e.y + e.h / 2;
    const wallTile = getTileAt(grid, probeX, probeY, lw, lh);
    if (isSolid(wallTile) || e.x <= 0 || e.x + e.w >= lw * TILE_SIZE) {
        e.dir *= -1;
        e.vx = ENEMY_SPEED * e.dir;
    }

    // Vertical: sine wave
    e.y = e.baseY + Math.sin(e.sineOffset) * e.amplitude;

    // Bounds
    if (e.x < 0) e.x = 0;
    if (e.x + e.w > lw * TILE_SIZE) e.x = lw * TILE_SIZE - e.w;
}

/**
 * Archer AI: stationary, decrement shoot timer, face player.
 */
function updateArcher(e, player) {
    if (!player || player.dead) return;

    // Face the player
    e.facingPlayer = player.x < e.x ? -1 : 1;
    e.dir = e.facingPlayer;

    // Decrement shoot timer
    if (e.shootTimer > 0) {
        e.shootTimer--;
    }
    // When timer reaches 0 the game loop should spawn an arrow and reset shootTimer
}

// ── Player-enemy collision ───────────────────────────────────────────────────

/**
 * Checks collision between the player and an enemy.
 * @param {object} player - Player state.
 * @param {object} enemy - Enemy state.
 * @returns {'stomp'|'hit'|null} Result of the collision.
 */
export function checkPlayerEnemyCollision(player, enemy) {
    if (player.dead || enemy.dead || !enemy.active) return null;

    // AABB overlap
    const overlaps =
        player.x < enemy.x + enemy.w &&
        player.x + player.w > enemy.x &&
        player.y < enemy.y + enemy.h &&
        player.y + player.h > enemy.y;

    if (!overlaps) return null;

    // Stomp: player is falling and feet are above enemy's vertical midpoint
    const playerBottom = player.y + player.h;
    const enemyMid = enemy.y + enemy.h / 2;

    if (player.vy > 0 && playerBottom - player.vy <= enemyMid) {
        return 'stomp';
    }

    return 'hit';
}

// ── Coin collision ───────────────────────────────────────────────────────────

/**
 * Checks AABB overlap between the player and a coin.
 * @param {object} player - Player state.
 * @param {object} coin - Coin with x, y, w, h.
 * @returns {boolean} True if overlapping.
 */
export function checkCoinCollision(player, coin) {
    if (player.dead || !coin.active) return false;

    return (
        player.x < coin.x + coin.w &&
        player.x + player.w > coin.x &&
        player.y < coin.y + coin.h &&
        player.y + player.h > coin.y
    );
}

// ── Arrow projectiles ────────────────────────────────────────────────────────

/**
 * Creates an arrow projectile.
 * @param {number} x - Spawn x (pixels).
 * @param {number} y - Spawn y (pixels).
 * @param {number} dir - Direction (-1 = left, 1 = right).
 * @returns {object} Arrow state.
 */
export function createArrow(x, y, dir) {
    return {
        x,
        y,
        vx: 5 * dir,
        vy: 0,
        w: 16,
        h: 4,
        dir,
        active: true
    };
}

/**
 * Updates all arrow projectiles. Deactivates arrows that hit a wall.
 * @param {object[]} arrows - Array of arrow objects (mutated in place).
 * @param {number[][]} grid - Level tile grid.
 * @param {number} lw - Level width in tiles.
 * @param {number} lh - Level height in tiles.
 */
export function updateArrows(arrows, grid, lw, lh) {
    for (let i = arrows.length - 1; i >= 0; i--) {
        const a = arrows[i];
        if (!a.active) continue;

        a.x += a.vx;
        a.vy += GRAVITY * 0.3; // slight arc
        a.y += a.vy;

        // Check wall collision at arrow tip
        const tipX = a.dir === 1 ? a.x + a.w : a.x;
        const tipY = a.y + a.h / 2;
        const tile = getTileAt(grid, tipX, tipY, lw, lh);

        if (isSolid(tile) || tile === 9) {
            a.active = false;
            continue;
        }

        // Out of level bounds
        if (a.x < -TILE_SIZE || a.x > lw * TILE_SIZE + TILE_SIZE ||
            a.y < -TILE_SIZE || a.y > lh * TILE_SIZE + TILE_SIZE) {
            a.active = false;
        }
    }
}
