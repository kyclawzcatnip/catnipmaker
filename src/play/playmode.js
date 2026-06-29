'use strict';

import { TILE_SIZE, CANVAS_W, CANVAS_H, GRAVITY, COIN_ANIM_SPEED } from '../core/constants.js';
import { createPlayer, updatePlayer, createEnemy, updateEnemies, checkPlayerEnemyCollision, checkCoinCollision, updateArrows, createArrow } from '../physics/physics.js';
import { drawTile, TILE_TYPES } from '../renderer/tiles.js';
import { drawCat, drawRat, drawRatter, drawFlyRatter, drawArcher, drawCoin, drawOneUp, drawFireFlower, drawCheckpoint, drawGoalMarker, CAT_SKINS } from '../renderer/sprites.js';
import { drawBackground } from '../renderer/backgrounds.js';

export class PlayMode {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.running = false;
        this.paused = false;

        // Game state
        this.player = null;
        this.level = null;      // {grid, entities, width, height, theme}
        this.enemies = [];
        this.coins = [];
        this.items = [];        // oneUps, fireFlowers
        this.checkpoints = [];
        this.arrows = [];
        this.particles = [];

        this.coinCount = 0;
        this.timer = 0;         // elapsed frames
        this.lives = 3;
        this.won = false;
        this.dead = false;
        this.deathTimer = 0;
        this.winTimer = 0;
        this.invincibleTimer = 0;
        this.activeCheckpoint = null;
        this.frameCount = 0;
        this.shakeTimer = 0;
        this.shakeAmt = 0;

        // Camera
        this.camX = 0;

        // Input
        this.keys = { left: false, right: false, jump: false, jumpPressed: false, down: false, fire: false, firePressed: false, scratch: false, scratchPressed: false };
        this._jumpWasPressed = false;
        this._fireWasPressed = false;
        this._scratchWasPressed = false;
        this.hasFire = false;
        this.fireballs = [];
        this.scratchTimer = 0;

        // Callbacks
        this.onExit = null;     // called when player exits back to editor
        this._prevVY = 0;       // for question block head-bump detection

        // Bind methods
        this._onKeyDown = this._onKeyDown.bind(this);
        this._onKeyUp = this._onKeyUp.bind(this);
        this._animFrame = this._animFrame.bind(this);

        // Mobile touch state
        this._touches = {};
    }

    startLevel(levelData) {
        this._initialLevelData = levelData;
        this.level = {
            grid: levelData.grid.map(row => [...row]), // deep copy
            width: levelData.width,
            height: levelData.height,
            theme: levelData.theme
        };

        // Find spawn point
        let spawnX = 2, spawnY = this.level.height - 3;
        this.enemies = [];
        this.coins = [];
        this.items = [];
        this.checkpoints = [];
        this.arrows = [];
        this.fireballs = [];
        this.particles = [];
        this.scratchTimer = 0;

        // Parse entities
        levelData.entities.forEach(e => {
            const px = e.col * TILE_SIZE;
            const py = e.row * TILE_SIZE;
            switch (e.type) {
                case 'spawn':
                    spawnX = e.col;
                    spawnY = e.row;
                    break;
                case 'coin':
                    this.coins.push({ x: px + 8, y: py + 4, w: 16, h: 24, collected: false, anim: Math.random() * Math.PI * 2 });
                    break;
                case 'rat':
                    this.enemies.push(createEnemy('rat', px, py));
                    break;
                case 'ratter':
                    this.enemies.push(createEnemy('ratter', px, py));
                    break;
                case 'flyratter':
                    this.enemies.push(createEnemy('flyratter', px, py));
                    break;
                case 'archer':
                    this.enemies.push(createEnemy('archer', px, py));
                    break;
                case 'oneup':
                    this.items.push({ type: 'oneup', x: px + 4, y: py + 4, w: 24, h: 24, collected: false, bob: Math.random() * Math.PI * 2 });
                    break;
                case 'fireflower':
                    this.items.push({ type: 'fireflower', x: px + 4, y: py + 2, w: 24, h: 28, collected: false, anim: Math.random() * Math.PI * 2 });
                    break;
                case 'checkpoint':
                    this.checkpoints.push({ x: px, y: py, col: e.col, row: e.row, active: false });
                    break;
                case 'goal':
                    // Goal uses the flag tile, but also mark position
                    this.goalX = px;
                    this.goalY = py;
                    break;
            }
        });

        // Create player
        this.player = createPlayer(spawnX * TILE_SIZE, spawnY * TILE_SIZE);
        this.camX = Math.max(0, this.player.x - CANVAS_W / 2);

        this.coinCount = 0;
        this.timer = 0;
        this.won = false;
        this.dead = false;
        this.deathTimer = 0;
        this.winTimer = 0;
        this.invincibleTimer = 0;
        this.activeCheckpoint = null;
        this.frameCount = 0;
        this.lives = 3;
        this.shakeTimer = 0;

        this.running = true;
        this.paused = false;

        // Store spawn for respawning
        this._spawnCol = spawnX;
        this._spawnRow = spawnY;

        // Start input listeners
        window.addEventListener('keydown', this._onKeyDown);
        window.addEventListener('keyup', this._onKeyUp);

        // Setup mobile controls
        this._setupMobileControls();

        // Start game loop
        this._animFrame();
    }

    resetLevel() {
        if (this._initialLevelData) {
            this.startLevel(this._initialLevelData);
        }
    }

    stop() {
        this.running = false;
        window.removeEventListener('keydown', this._onKeyDown);
        window.removeEventListener('keyup', this._onKeyUp);
        this._cleanupMobileControls();
        if (this.onExit) this.onExit();
    }

    _animFrame() {
        if (!this.running) return;
        requestAnimationFrame(this._animFrame);
        if (this.paused) return;
        this.frameCount++;
        this.timer++;

        // Handle key edge detection
        const jumpNow = this.keys.jump;
        this.keys.jumpPressed = jumpNow && !this._jumpWasPressed;
        this._jumpWasPressed = jumpNow;

        const fireNow = this.keys.fire;
        this.keys.firePressed = fireNow && !this._fireWasPressed;
        this._fireWasPressed = fireNow;

        const scratchNow = this.keys.scratch;
        this.keys.scratchPressed = scratchNow && !this._scratchWasPressed;
        this._scratchWasPressed = scratchNow;

        this._update();
        this._draw();
    }

    _update() {
        if (this.won) {
            this.winTimer++;
            if (this.winTimer > 180) this.stop(); // 3 seconds then back to editor
            return;
        }

        if (this.dead) {
            this.deathTimer++;
            if (this.deathTimer > 90) {
                // Respawn
                this._respawn();
            }
            return;
        }

        if (this.invincibleTimer > 0) this.invincibleTimer--;
        if (this.shakeTimer > 0) this.shakeTimer--;

        // Update player physics
        updatePlayer(this.player, this.keys, this.level.grid, this.level.width, this.level.height);

        // Question block hit detection (hitting from below)
        if (this.player.vy >= 0 && this._prevVY < 0) {
            // Player was moving up, now stopped or moving down = hit head
            const headRow = Math.floor((this.player.y - 1) / TILE_SIZE);
            const leftCol = Math.floor((this.player.x + 4) / TILE_SIZE);
            const rightCol = Math.floor((this.player.x + this.player.w - 4) / TILE_SIZE);
            for (let col = leftCol; col <= rightCol; col++) {
                if (headRow >= 0 && headRow < this.level.height && col >= 0 && col < this.level.width) {
                    const tileType = this.level.grid[headRow][col];
                    if (tileType === 3) {
                        // Normal question block → used block + spawn coin
                        this.level.grid[headRow][col] = 8;
                        this.coinCount++;
                        this._addParticles(col * TILE_SIZE + 16, headRow * TILE_SIZE, '#FFD700', 5);
                    } else if (tileType === 13) {
                        // Rare question block → used block + extra reward
                        this.level.grid[headRow][col] = 8;
                        this.coinCount += 5;
                        this._addParticles(col * TILE_SIZE + 16, headRow * TILE_SIZE, '#FF44FF', 8);
                    } else if (tileType === 2) {
                        // Brick block → break it
                        this.level.grid[headRow][col] = 0;
                        this._addParticles(col * TILE_SIZE + 16, headRow * TILE_SIZE + 16, '#C84B31', 6);
                    }
                }
            }
        }
        this._prevVY = this.player.vy;

        // Castle door interaction (touch to win)
        const pCenterCol = Math.floor((this.player.x + this.player.w / 2) / TILE_SIZE);
        const pCenterRow = Math.floor((this.player.y + this.player.h / 2) / TILE_SIZE);
        if (pCenterCol >= 0 && pCenterCol < this.level.width && pCenterRow >= 0 && pCenterRow < this.level.height) {
            if (this.level.grid[pCenterRow][pCenterCol] === 12) {
                this.won = true;
                this.winTimer = 0;
            }
        }

        // Camera follow
        const targetCam = this.player.x - CANVAS_W / 2;
        this.camX += (targetCam - this.camX) * 0.1; // smooth follow
        this.camX = Math.max(0, Math.min(this.level.width * TILE_SIZE - CANVAS_W, this.camX));

        // Update enemies
        updateEnemies(this.enemies, this.level.grid, this.level.width, this.level.height, this.player);

        // Archer arrow spawning (aim at player)
        this.enemies.forEach(e => {
            if (e.type === 'archer' && e.active && !e.dead && e.shootTimer <= 0) {
                this.arrows.push(createArrow(e.x + 16, e.y + 14, this.player.x + 12, this.player.y + 16));
                e.shootTimer = e.shootInterval || 120;
            }
        });

        // Update arrows
        updateArrows(this.arrows, this.level.grid, this.level.width, this.level.height);

        // Fireball Spawning (Key E)
        if (this.keys.firePressed && this.hasFire) {
            this.fireballs.push({
                x: this.player.dir === 1 ? this.player.x + this.player.w : this.player.x - 12,
                y: this.player.y + 10,
                vx: this.player.dir * 7,
                vy: 2,
                w: 12,
                h: 12,
                active: true
            });
        }

        // Update Fireballs
        this.fireballs.forEach(f => {
            if (!f.active) return;
            f.x += f.vx;
            f.vy += 0.3;
            f.y += f.vy;

            const col = Math.floor((f.x + 6) / TILE_SIZE);
            const row = Math.floor((f.y + 6) / TILE_SIZE);
            if (col >= 0 && col < this.level.width && row >= 0 && row < this.level.height) {
                const tile = this.level.grid[row][col];
                if (tile > 0 && tile !== 9 && tile !== 10 && tile !== 12) {
                    if (f.vy > 0 && Math.floor(f.y / TILE_SIZE) <= row) {
                        f.vy = -4.5;
                    } else {
                        f.active = false;
                        this._addParticles(f.x + 6, f.y + 6, '#FF4400', 5);
                    }
                }
            }

            this.enemies.forEach(e => {
                if (!e.active || e.dead || !f.active) return;
                if (f.x < e.x + e.w && f.x + f.w > e.x &&
                    f.y < e.y + e.h && f.y + f.h > e.y) {
                    f.active = false;
                    e.dead = true;
                    e.active = false;
                    this._addParticles(e.x + e.w / 2, e.y + e.h / 2, '#FF4400', 8);
                }
            });

            if (f.x < -40 || f.x > this.level.width * TILE_SIZE + 40 || f.y > this.level.height * TILE_SIZE + 40) {
                f.active = false;
            }
        });

        // Cat Scratch Attack (Key F)
        if (this.keys.scratchPressed && this.scratchTimer <= 0) {
            this.scratchTimer = 14;
        }
        if (this.scratchTimer > 0) {
            this.scratchTimer--;
            const sw = 28, sh = this.player.h;
            const sx = this.player.dir === 1 ? this.player.x + this.player.w : this.player.x - sw;
            const sy = this.player.y;

            this.enemies.forEach(e => {
                if (!e.active || e.dead) return;
                if (sx < e.x + e.w && sx + sw > e.x &&
                    sy < e.y + e.h && sy + sh > e.y) {
                    if (e.type === 'ratter' && !e.shell) {
                        e.shell = true;
                        e.shellVx = this.player.dir * 8;
                    } else if (e.type === 'ratter' && e.shell) {
                        e.shellVx = this.player.dir * 8;
                    } else {
                        e.dead = true;
                        e.active = false;
                    }
                    this._addParticles(e.x + e.w / 2, e.y + e.h / 2, '#00FFFF', 6);
                }
            });
        }

        // Ratter shell sliding knockouts against other enemies
        this.enemies.forEach(e1 => {
            if (e1.type === 'ratter' && e1.shell && e1.shellVx !== 0 && e1.active && !e1.dead) {
                this.enemies.forEach(e2 => {
                    if (e1 !== e2 && e2.active && !e2.dead) {
                        if (e1.x < e2.x + e2.w && e1.x + e1.w > e2.x &&
                            e1.y < e2.y + e2.h && e1.y + e1.h > e2.y) {
                            e2.dead = true;
                            e2.active = false;
                            this._addParticles(e2.x + e2.w / 2, e2.y + e2.h / 2, '#FFD700', 6);
                        }
                    }
                });
            }
        });

        // Player-enemy collisions
        this.enemies.forEach(e => {
            if (!e.active || e.dead) return;
            const result = checkPlayerEnemyCollision(this.player, e);
            if (result === 'stomp') {
                if (e.type === 'ratter' || e.type === 'flyratter') {
                    if (e.type === 'flyratter') {
                        e.type = 'ratter';
                        e.shell = false;
                    } else if (!e.shell) {
                        e.shell = true;
                        e.shellVx = 0;
                        e.vx = 0;
                    } else {
                        e.shellVx = this.player.x < e.x ? 6 : -6;
                    }
                } else {
                    e.dead = true;
                    e.active = false;
                }
                this.player.vy = -8;
                this._addParticles(e.x + e.w / 2, e.y, '#FFD700', 5);
            } else if (result === 'hit' && this.invincibleTimer <= 0) {
                if (e.type === 'ratter' && e.shell && e.shellVx === 0) {
                    e.shellVx = this.player.dir * 6;
                } else {
                    this._playerHit();
                }
            }
        });

        // Arrow-player collision
        this.arrows.forEach(a => {
            if (!a.active) return;
            if (this.invincibleTimer <= 0 &&
                a.x < this.player.x + this.player.w && a.x + 8 > this.player.x &&
                a.y < this.player.y + this.player.h && a.y + 4 > this.player.y) {
                a.active = false;
                this._playerHit();
            }
        });

        // Coin collection
        this.coins.forEach(c => {
            if (c.collected) return;
            c.anim += COIN_ANIM_SPEED;
            if (checkCoinCollision(this.player, c)) {
                c.collected = true;
                this.coinCount++;
                this._addParticles(c.x + 8, c.y + 12, '#FFD700', 3);
            }
        });

        // Item collection (oneups, fire flowers)
        this.items.forEach(item => {
            if (item.collected) return;
            if (item.type === 'oneup') item.bob += 0.05;
            if (item.type === 'fireflower') item.anim += 0.08;
            // AABB check
            if (this.player.x < item.x + item.w && this.player.x + this.player.w > item.x &&
                this.player.y < item.y + item.h && this.player.y + this.player.h > item.y) {
                item.collected = true;
                if (item.type === 'oneup') {
                    this.lives++;
                    this._addParticles(item.x + 12, item.y + 12, '#00FF88', 4);
                } else if (item.type === 'fireflower') {
                    this.hasFire = true;
                    this.invincibleTimer = 180; // 3 seconds of invincibility
                    this._addParticles(item.x + 12, item.y + 12, '#FF4400', 8);
                } else {
                    this._addParticles(item.x + 12, item.y + 12, '#00FF88', 4);
                }
            }
        });

        // Checkpoint activation
        this.checkpoints.forEach(cp => {
            if (cp.active) return;
            const dx = Math.abs(this.player.x + this.player.w / 2 - cp.x - TILE_SIZE / 2);
            const dy = Math.abs(this.player.y + this.player.h / 2 - cp.y - TILE_SIZE / 2);
            if (dx < TILE_SIZE && dy < TILE_SIZE) {
                cp.active = true;
                this.activeCheckpoint = { x: cp.x, y: cp.y, col: cp.col, row: cp.row };
                this._addParticles(cp.x + 16, cp.y + 16, '#00FF88', 6);
            }
        });

        // Goal check - check if player overlaps any flag tile (type 10)
        const playerCol = Math.floor((this.player.x + this.player.w / 2) / TILE_SIZE);
        const playerRow = Math.floor((this.player.y + this.player.h / 2) / TILE_SIZE);
        if (playerCol >= 0 && playerCol < this.level.width && playerRow >= 0 && playerRow < this.level.height) {
            if (this.level.grid[playerRow][playerCol] === 10) {
                this.won = true;
                this.winTimer = 0;
            }
        }
        // Also check goal entity position
        if (this.goalX !== undefined) {
            const dx = Math.abs(this.player.x - this.goalX);
            const dy = Math.abs(this.player.y - this.goalY);
            if (dx < TILE_SIZE && dy < TILE_SIZE) {
                this.won = true;
                this.winTimer = 0;
            }
        }

        // Silver pipe exit — press S or Down on silver pipe top (type 16 or 17)
        if (this.keys.down && this.player.grounded) {
            const feetRow = Math.floor((this.player.y + this.player.h + 1) / TILE_SIZE);
            const feetCol = Math.floor((this.player.x + this.player.w / 2) / TILE_SIZE);
            if (feetRow >= 0 && feetRow < this.level.height && feetCol >= 0 && feetCol < this.level.width) {
                const belowTile = this.level.grid[feetRow][feetCol];
                if (belowTile === 16 || belowTile === 17) {
                    this.won = true;
                    this.winTimer = 0;
                }
            }
        }

        // Player death check
        if (this.player.dead) {
            this._playerDie();
        }

        // Update particles
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.15;
            p.life--;
        });
        this.particles = this.particles.filter(p => p.life > 0);
    }

    _draw() {
        const ctx = this.ctx;
        const W = this.canvas.width;
        const H = this.canvas.height;

        ctx.save();

        // Screen shake
        if (this.shakeTimer > 0) {
            const sx = (Math.random() - 0.5) * this.shakeAmt;
            const sy = (Math.random() - 0.5) * this.shakeAmt;
            ctx.translate(sx, sy);
        }

        // Background
        drawBackground(ctx, W, H, this.camX, this.level.theme, this.frameCount);

        // Tiles (only visible ones)
        const startCol = Math.max(0, Math.floor(this.camX / TILE_SIZE) - 1);
        const endCol = Math.min(this.level.width, startCol + Math.ceil(W / TILE_SIZE) + 3);
        for (let r = 0; r < this.level.height; r++) {
            for (let c = startCol; c < endCol; c++) {
                const type = this.level.grid[r][c];
                if (type > 0) {
                    drawTile(ctx, c * TILE_SIZE - this.camX, r * TILE_SIZE, type, this.level.theme, this.frameCount, r, c);
                }
            }
        }

        // Coins
        this.coins.forEach(c => {
            if (c.collected) return;
            const sx = c.x - this.camX;
            if (sx < -20 || sx > W + 20) return;
            drawCoin(ctx, sx, c.y, this.frameCount);
        });

        // Goal marker
        if (this.goalX !== undefined) {
            const gsx = this.goalX - this.camX;
            if (gsx > -TILE_SIZE * 2 && gsx < W + TILE_SIZE * 2) {
                drawGoalMarker(ctx, gsx, this.goalY, this.frameCount);
            }
        }

        // Items
        this.items.forEach(item => {
            if (item.collected) return;
            const sx = item.x - this.camX;
            if (sx < -30 || sx > W + 30) return;
            if (item.type === 'oneup') drawOneUp(ctx, sx, item.y, this.frameCount);
            else if (item.type === 'fireflower') drawFireFlower(ctx, sx, item.y, this.frameCount);
        });

        // Checkpoints
        this.checkpoints.forEach(cp => {
            const sx = cp.x - this.camX;
            if (sx < -TILE_SIZE || sx > W + TILE_SIZE) return;
            drawCheckpoint(ctx, sx, cp.y, cp.active, this.frameCount);
        });

        // Enemies
        this.enemies.forEach(e => {
            if (!e.active || e.dead) return;
            const sx = e.x - this.camX;
            if (sx < -TILE_SIZE * 2 || sx > W + TILE_SIZE * 2) return;
            const dir = e.vx >= 0 ? 1 : (e.vx < 0 ? -1 : (e.dir || 1));
            switch (e.type) {
                case 'rat': drawRat(ctx, sx, e.y, dir, this.frameCount, this.level.theme); break;
                case 'ratter': drawRatter(ctx, sx, e.y, dir, this.frameCount, e.shell); break;
                case 'flyratter': drawFlyRatter(ctx, sx, e.y, dir, this.frameCount); break;
                case 'archer': drawArcher(ctx, sx, e.y, e.dir || 1, this.frameCount, this.level.theme); break;
            }
        });

        // Arrows
        this.arrows.forEach(a => {
            if (!a.active) return;
            const sx = a.x - this.camX;
            if (sx < -20 || sx > W + 20) return;
            ctx.fillStyle = '#8B6914';
            ctx.fillRect(sx, a.y, 12, 2);
            ctx.fillStyle = '#555';
            ctx.beginPath();
            const dir = a.vx > 0 ? 1 : -1;
            ctx.moveTo(sx + (dir > 0 ? 12 : 0), a.y + 1);
            ctx.lineTo(sx + (dir > 0 ? 8 : 4), a.y - 2);
            ctx.lineTo(sx + (dir > 0 ? 8 : 4), a.y + 4);
            ctx.closePath();
            ctx.fill();
        });

        // Fireballs
        this.fireballs.forEach(f => {
            if (!f.active) return;
            const sx = f.x - this.camX;
            if (sx < -20 || sx > W + 20) return;
            ctx.fillStyle = '#FF4400';
            ctx.beginPath();
            ctx.arc(sx + 6, f.y + 6, 6, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#FFFF00';
            ctx.beginPath();
            ctx.arc(sx + 6, f.y + 6, 3, 0, Math.PI * 2);
            ctx.fill();
        });

        // Player
        if (!this.dead || this.deathTimer < 30) {
            if (this.invincibleTimer <= 0 || this.frameCount % 4 >= 2) {
                drawCat(ctx, this.player.x - this.camX, this.player.y, 0, this.player.dir, this.player.grounded, this.player.walking, this.frameCount);
            }
        }

        // Scratch Attack Arc Visual
        if (this.scratchTimer > 0) {
            const cx = (this.player.dir === 1 ? this.player.x + this.player.w + 10 : this.player.x - 10) - this.camX;
            const cy = this.player.y + 16;
            ctx.strokeStyle = '#00FFFF';
            ctx.lineWidth = 3;
            for (let i = -1; i <= 1; i++) {
                ctx.beginPath();
                ctx.arc(cx, cy + i * 8, 14, (this.player.dir === 1 ? -0.4 : 0.6) * Math.PI, (this.player.dir === 1 ? 0.4 : 1.4) * Math.PI);
                ctx.stroke();
            }
        }

        // Particles
        this.particles.forEach(p => {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x - this.camX, p.y, p.size, p.size);
        });
        ctx.globalAlpha = 1;

        ctx.restore();

        // HUD updates (outside save/restore)
        this._updateHUD();

        // Win overlay
        if (this.won) {
            ctx.fillStyle = 'rgba(0,0,0,0.5)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#FFD700';
            ctx.font = 'bold 24px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText('LEVEL CLEAR!', W / 2, H / 2 - 20);
            ctx.fillStyle = '#FFF';
            ctx.font = '10px "Press Start 2P", monospace';
            ctx.fillText('Coins: ' + this.coinCount + '  Time: ' + this._formatTime(), W / 2, H / 2 + 20);
            ctx.textAlign = 'left';
        }

        // Death overlay
        if (this.dead && this.deathTimer > 30) {
            ctx.fillStyle = 'rgba(0,0,0,0.6)';
            ctx.fillRect(0, 0, W, H);
            ctx.fillStyle = '#FF4444';
            ctx.font = 'bold 18px "Press Start 2P", monospace';
            ctx.textAlign = 'center';
            ctx.fillText(this.lives > 0 ? 'OOPS!' : 'GAME OVER', W / 2, H / 2);
            ctx.textAlign = 'left';
        }
    }

    _playerHit() {
        if (this.invincibleTimer > 0) return;
        this.shakeTimer = 10;
        this.shakeAmt = 6;
        this._addParticles(this.player.x + this.player.w / 2, this.player.y + this.player.h / 2, '#FF4444', 5);
        this.lives--;
        if (this.lives <= 0) {
            this._playerDie();
        } else {
            this.invincibleTimer = 90; // 1.5 seconds
        }
    }

    _playerDie() {
        if (this.dead) return;
        this.dead = true;
        this.deathTimer = 0;
    }

    _respawn() {
        this.dead = false;
        this.deathTimer = 0;
        if (this.lives <= 0) {
            this.stop();
            return;
        }
        const spawn = this._findSpawn();
        const spawnCol = this.activeCheckpoint ? this.activeCheckpoint.col : spawn.col;
        const spawnRow = this.activeCheckpoint ? this.activeCheckpoint.row : spawn.row;
        this.player = createPlayer(spawnCol * TILE_SIZE, spawnRow * TILE_SIZE);
        this.invincibleTimer = 90;
    }

    _findSpawn() {
        return { col: this._spawnCol, row: this._spawnRow };
    }

    _addParticles(x, y, color, count) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + (Math.random() - 0.5) * 0.5;
            const speed = 1.5 + Math.random() * 2.5;
            const life = 20 + Math.floor(Math.random() * 15);
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                color: color,
                size: 2 + Math.random() * 3,
                life: life,
                maxLife: life
            });
        }
    }

    _formatTime() {
        const totalSeconds = Math.floor(this.timer / 60);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return minutes + ':' + (seconds < 10 ? '0' : '') + seconds;
    }

    _updateHUD() {
        const coinEl = document.getElementById('hud-coins');
        if (coinEl) coinEl.textContent = this.coinCount;

        const livesEl = document.getElementById('hud-lives');
        if (livesEl) livesEl.textContent = this.lives;

        const timerEl = document.getElementById('hud-timer');
        if (timerEl) timerEl.textContent = this._formatTime();
    }

    _onKeyDown(e) {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = true;
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = true;
                e.preventDefault();
                break;
            case 'Space':
            case 'ArrowUp':
            case 'KeyW':
                this.keys.jump = true;
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = true;
                e.preventDefault();
                break;
            case 'KeyE':
                this.keys.fire = true;
                e.preventDefault();
                break;
            case 'KeyF':
                this.keys.scratch = true;
                e.preventDefault();
                break;
            case 'KeyR':
                this.resetLevel();
                e.preventDefault();
                break;
            case 'Escape':
                this.stop();
                e.preventDefault();
                break;
        }
    }

    _onKeyUp(e) {
        switch (e.code) {
            case 'ArrowLeft':
            case 'KeyA':
                this.keys.left = false;
                e.preventDefault();
                break;
            case 'ArrowRight':
            case 'KeyD':
                this.keys.right = false;
                e.preventDefault();
                break;
            case 'Space':
            case 'ArrowUp':
            case 'KeyW':
                this.keys.jump = false;
                e.preventDefault();
                break;
            case 'ArrowDown':
            case 'KeyS':
                this.keys.down = false;
                e.preventDefault();
                break;
            case 'KeyE':
                this.keys.fire = false;
                e.preventDefault();
                break;
            case 'KeyF':
                this.keys.scratch = false;
                e.preventDefault();
                break;
        }
    }

    _setupMobileControls() {
        this._mobileHandlers = {};

        const btnLeft = document.getElementById('btn-left');
        const btnRight = document.getElementById('btn-right');
        const btnJump = document.getElementById('btn-jump');

        if (btnLeft) {
            const onDown = (e) => { e.preventDefault(); this.keys.left = true; };
            const onUp = (e) => { e.preventDefault(); this.keys.left = false; };
            btnLeft.addEventListener('touchstart', onDown, { passive: false });
            btnLeft.addEventListener('touchend', onUp, { passive: false });
            btnLeft.addEventListener('touchcancel', onUp, { passive: false });
            this._mobileHandlers.left = { el: btnLeft, onDown, onUp };
        }

        if (btnRight) {
            const onDown = (e) => { e.preventDefault(); this.keys.right = true; };
            const onUp = (e) => { e.preventDefault(); this.keys.right = false; };
            btnRight.addEventListener('touchstart', onDown, { passive: false });
            btnRight.addEventListener('touchend', onUp, { passive: false });
            btnRight.addEventListener('touchcancel', onUp, { passive: false });
            this._mobileHandlers.right = { el: btnRight, onDown, onUp };
        }

        if (btnJump) {
            const onDown = (e) => { e.preventDefault(); this.keys.jump = true; };
            const onUp = (e) => { e.preventDefault(); this.keys.jump = false; };
            btnJump.addEventListener('touchstart', onDown, { passive: false });
            btnJump.addEventListener('touchend', onUp, { passive: false });
            btnJump.addEventListener('touchcancel', onUp, { passive: false });
            this._mobileHandlers.jump = { el: btnJump, onDown, onUp };
        }
    }

    _cleanupMobileControls() {
        if (!this._mobileHandlers) return;

        for (const key of Object.keys(this._mobileHandlers)) {
            const h = this._mobileHandlers[key];
            if (h && h.el) {
                h.el.removeEventListener('touchstart', h.onDown);
                h.el.removeEventListener('touchend', h.onUp);
                h.el.removeEventListener('touchcancel', h.onUp);
            }
        }

        this._mobileHandlers = {};
    }
}
