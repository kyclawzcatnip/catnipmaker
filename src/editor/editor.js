'use strict';

import {
    TILE_SIZE,
    DEFAULT_LEVEL_WIDTH,
    DEFAULT_LEVEL_HEIGHT,
    MIN_ZOOM,
    MAX_ZOOM,
    AUTOSAVE_INTERVAL
} from '../core/constants.js';

/**
 * Core editor class for Anticatite Maker.
 * Manages the level grid, entity placement, tool selection,
 * undo/redo history, clipboard, camera, and editing operations.
 */
export class Editor {
    constructor() {
        // Level data
        this.grid = [];                         // 2D array [row][col] of tile type numbers
        this.entities = [];                     // Array of {type, x, y, properties}
        this.levelWidth = DEFAULT_LEVEL_WIDTH;  // in tiles
        this.levelHeight = DEFAULT_LEVEL_HEIGHT;// in tiles (14)
        this.theme = 'overworld';
        this.levelName = 'Untitled Level';
        this.author = 'Anonymous';

        // Tool state
        this.currentTool = 'draw';      // 'draw', 'erase', 'select', 'entity', 'fill'
        this.selectedTile = 1;          // GROUND by default
        this.selectedEntity = 'coin';   // for entity placement tool

        // Camera
        this.camX = 0;
        this.camY = 0;
        this.zoom = 1;

        // Selection
        this.selection = null;  // {x1, y1, x2, y2} in tile coords, or null
        this.clipboard = null;  // {tiles: 2D array, entities: array, w, h}

        // Interaction state
        this.isPanning = false;
        this.isDrawing = false;
        this.isErasing = false;
        this.isSelecting = false;
        this.lastDrawCol = -1;
        this.lastDrawRow = -1;
        this.panStartX = 0;
        this.panStartY = 0;
        this.panStartCamX = 0;
        this.panStartCamY = 0;
        this.selectionStartCol = 0;
        this.selectionStartRow = 0;

        // History
        this.history = [];          // array of action objects {undo(), redo()}
        this.historyIndex = -1;     // points to current state in history
        this.maxHistory = 200;

        // Autosave
        this.modified = false;
        this.lastSave = Date.now();

        this.newLevel();
    }

    /**
     * Create a new empty level.
     * @param {number} [width] — width in tiles
     * @param {number} [height] — height in tiles
     * @param {string} [theme] — theme key
     */
    newLevel(width, height, theme) {
        this.levelWidth = width || DEFAULT_LEVEL_WIDTH;
        this.levelHeight = height || DEFAULT_LEVEL_HEIGHT;
        this.theme = theme || 'overworld';
        this.levelName = 'Untitled Level';
        this.author = 'Anonymous';

        // Build empty grid filled with air (0)
        this.grid = [];
        for (let r = 0; r < this.levelHeight; r++) {
            this.grid[r] = new Array(this.levelWidth).fill(0);
        }

        // Ground floor — bottom 2 rows
        for (let r = this.levelHeight - 2; r < this.levelHeight; r++) {
            for (let c = 0; c < this.levelWidth; c++) {
                this.grid[r][c] = 1;
            }
        }

        // Place spawn entity at col 2, row height-3
        this.entities = [
            { type: 'spawn', x: 2, y: this.levelHeight - 3, col: 2, row: this.levelHeight - 3 }
        ];

        // Reset camera
        this.camX = 0;
        this.camY = 0;
        this.zoom = 1;

        // Reset selection & clipboard
        this.selection = null;

        // Reset history
        this.history = [];
        this.historyIndex = -1;
        this.modified = false;
    }

    // ─── Tile Operations ──────────────────────────────────────────────

    /**
     * Set a tile at (col, row) to the given type, with undo support.
     */
    setTile(col, row, type) {
        if (col < 0 || col >= this.levelWidth || row < 0 || row >= this.levelHeight) return;
        const oldType = this.grid[row][col];
        if (oldType === type) return; // no change

        this.pushAction({
            undo: () => { this.grid[row][col] = oldType; },
            redo: () => { this.grid[row][col] = type; }
        });
        this.grid[row][col] = type;
        this.modified = true;
    }

    /**
     * Erase a tile at (col, row) — set to air (0) and remove any entity there.
     */
    eraseTile(col, row) {
        if (col < 0 || col >= this.levelWidth || row < 0 || row >= this.levelHeight) return;

        const oldType = this.grid[row][col];
        const entityIdx = this.entities.findIndex(e => e.col === col && e.row === row);
        const oldEntity = entityIdx >= 0 ? this.entities[entityIdx] : null;

        // Nothing to erase
        if (oldType === 0 && entityIdx < 0) return;

        this.pushAction({
            undo: () => {
                this.grid[row][col] = oldType;
                if (oldEntity && entityIdx >= 0) {
                    this.entities.splice(entityIdx, 0, oldEntity);
                }
            },
            redo: () => {
                this.grid[row][col] = 0;
                if (oldEntity) {
                    const idx = this.entities.findIndex(e => e.col === col && e.row === row);
                    if (idx >= 0) this.entities.splice(idx, 1);
                }
            }
        });

        this.grid[row][col] = 0;
        if (entityIdx >= 0) {
            this.entities.splice(entityIdx, 1);
        }
        this.modified = true;
    }

    // ─── Entity Operations ────────────────────────────────────────────

    /**
     * Place an entity at (col, row). Replaces existing entity at that position.
     */
    placeEntity(type, col, row) {
        if (col < 0 || col >= this.levelWidth || row < 0 || row >= this.levelHeight) return;

        const existing = this.entities.findIndex(e => e.col === col && e.row === row);
        if (existing >= 0) {
            // Replace existing
            const old = this.entities[existing];
            this.pushAction({
                undo: () => { this.entities[existing] = old; },
                redo: () => {
                    this.entities[existing] = {
                        type, x: col * TILE_SIZE, y: row * TILE_SIZE, col, row
                    };
                }
            });
            this.entities[existing] = {
                type, x: col * TILE_SIZE, y: row * TILE_SIZE, col, row
            };
        } else {
            const entity = { type, x: col * TILE_SIZE, y: row * TILE_SIZE, col, row };
            this.pushAction({
                undo: () => { this.entities.pop(); },
                redo: () => { this.entities.push(entity); }
            });
            this.entities.push(entity);
        }
        this.modified = true;
    }

    /**
     * Remove entity at (col, row) with undo support.
     */
    removeEntity(col, row) {
        const idx = this.entities.findIndex(e => e.col === col && e.row === row);
        if (idx < 0) return;

        const removed = this.entities[idx];
        this.pushAction({
            undo: () => { this.entities.splice(idx, 0, removed); },
            redo: () => {
                const i = this.entities.findIndex(e => e.col === col && e.row === row);
                if (i >= 0) this.entities.splice(i, 1);
            }
        });
        this.entities.splice(idx, 1);
        this.modified = true;
    }

    // ─── Fill Tool ────────────────────────────────────────────────────

    /**
     * Flood fill from (col, row) with the given tile type using BFS.
     * Only fills tiles matching the original tile. Capped at 5000 tiles.
     */
    fillTool(col, row, type) {
        if (col < 0 || col >= this.levelWidth || row < 0 || row >= this.levelHeight) return;

        const targetType = this.grid[row][col];
        if (targetType === type) return; // already that type

        const filled = []; // track changes for undo: [{col, row, oldType}]
        const visited = new Set();
        const queue = [{ col, row }];
        const maxFill = 5000;

        const key = (c, r) => r * this.levelWidth + c;

        visited.add(key(col, row));

        while (queue.length > 0 && filled.length < maxFill) {
            const { col: c, row: r } = queue.shift();

            if (c < 0 || c >= this.levelWidth || r < 0 || r >= this.levelHeight) continue;
            if (this.grid[r][c] !== targetType) continue;

            filled.push({ col: c, row: r, oldType: this.grid[r][c] });
            this.grid[r][c] = type;

            // Check 4 neighbours
            const neighbors = [
                { col: c - 1, row: r },
                { col: c + 1, row: r },
                { col: c, row: r - 1 },
                { col: c, row: r + 1 }
            ];
            for (const n of neighbors) {
                if (n.col >= 0 && n.col < this.levelWidth &&
                    n.row >= 0 && n.row < this.levelHeight &&
                    !visited.has(key(n.col, n.row)) &&
                    this.grid[n.row][n.col] === targetType) {
                    visited.add(key(n.col, n.row));
                    queue.push(n);
                }
            }
        }

        if (filled.length === 0) return;

        // Record as single batch undo action
        this.pushAction({
            undo: () => {
                for (const f of filled) {
                    this.grid[f.row][f.col] = f.oldType;
                }
            },
            redo: () => {
                for (const f of filled) {
                    this.grid[f.row][f.col] = type;
                }
            }
        });
        this.modified = true;
    }

    // ─── History ──────────────────────────────────────────────────────

    /**
     * Push an undo/redo action onto the history stack.
     */
    pushAction(action) {
        // Truncate any future redo states
        this.history = this.history.slice(0, this.historyIndex + 1);
        this.history.push(action);
        if (this.history.length > this.maxHistory) {
            this.history.shift();
        } else {
            this.historyIndex++;
        }
    }

    /**
     * Undo the last action.
     */
    undo() {
        if (this.historyIndex >= 0) {
            this.history[this.historyIndex].undo();
            this.historyIndex--;
            this.modified = true;
        }
    }

    /**
     * Redo the next action.
     */
    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.history[this.historyIndex].redo();
            this.modified = true;
        }
    }

    // ─── Selection & Clipboard ────────────────────────────────────────

    /**
     * Copy the tiles and entities within the current selection to the clipboard.
     */
    copySelection() {
        if (!this.selection) return;

        const { x1, y1, x2, y2 } = this._normalizeSelection();
        const w = x2 - x1 + 1;
        const h = y2 - y1 + 1;

        // Copy tiles
        const tiles = [];
        for (let r = 0; r < h; r++) {
            tiles[r] = [];
            for (let c = 0; c < w; c++) {
                const gr = y1 + r;
                const gc = x1 + c;
                if (gr >= 0 && gr < this.levelHeight && gc >= 0 && gc < this.levelWidth) {
                    tiles[r][c] = this.grid[gr][gc];
                } else {
                    tiles[r][c] = 0;
                }
            }
        }

        // Copy entities within selection
        const entities = this.entities
            .filter(e => e.col >= x1 && e.col <= x2 && e.row >= y1 && e.row <= y2)
            .map(e => ({ type: e.type, col: e.col - x1, row: e.row - y1 }));

        this.clipboard = { tiles, entities, w, h };
    }

    /**
     * Paste clipboard contents at (col, row). Records as batch undo action.
     */
    pasteClipboard(col, row) {
        if (!this.clipboard) return;

        const { tiles, entities, w, h } = this.clipboard;
        const changes = [];     // {col, row, oldType, newType}
        const addedEntities = [];

        // Paste tiles
        for (let r = 0; r < h; r++) {
            for (let c = 0; c < w; c++) {
                const destCol = col + c;
                const destRow = row + r;
                if (destCol < 0 || destCol >= this.levelWidth ||
                    destRow < 0 || destRow >= this.levelHeight) continue;

                const oldType = this.grid[destRow][destCol];
                const newType = tiles[r][c];
                if (oldType !== newType) {
                    changes.push({ col: destCol, row: destRow, oldType, newType });
                    this.grid[destRow][destCol] = newType;
                }
            }
        }

        // Paste entities
        for (const e of entities) {
            const destCol = col + e.col;
            const destRow = row + e.row;
            if (destCol < 0 || destCol >= this.levelWidth ||
                destRow < 0 || destRow >= this.levelHeight) continue;

            const entity = {
                type: e.type,
                x: destCol * TILE_SIZE,
                y: destRow * TILE_SIZE,
                col: destCol,
                row: destRow
            };

            // Remove any existing entity at destination
            const existIdx = this.entities.findIndex(
                ex => ex.col === destCol && ex.row === destRow
            );
            if (existIdx >= 0) {
                this.entities.splice(existIdx, 1);
            }

            this.entities.push(entity);
            addedEntities.push(entity);
        }

        if (changes.length === 0 && addedEntities.length === 0) return;

        this.pushAction({
            undo: () => {
                for (const ch of changes) {
                    this.grid[ch.row][ch.col] = ch.oldType;
                }
                for (const ae of addedEntities) {
                    const idx = this.entities.findIndex(
                        e => e.col === ae.col && e.row === ae.row && e.type === ae.type
                    );
                    if (idx >= 0) this.entities.splice(idx, 1);
                }
            },
            redo: () => {
                for (const ch of changes) {
                    this.grid[ch.row][ch.col] = ch.newType;
                }
                for (const ae of addedEntities) {
                    this.entities.push(ae);
                }
            }
        });
        this.modified = true;
    }

    /**
     * Cut selection: copy then erase.
     */
    cutSelection() {
        this.copySelection();
        this.deleteSelection();
    }

    /**
     * Delete (erase) all tiles within the selection, setting them to air.
     */
    deleteSelection() {
        if (!this.selection) return;

        const { x1, y1, x2, y2 } = this._normalizeSelection();
        const changes = [];
        const removedEntities = [];

        for (let r = y1; r <= y2; r++) {
            for (let c = x1; c <= x2; c++) {
                if (c < 0 || c >= this.levelWidth || r < 0 || r >= this.levelHeight) continue;
                const oldType = this.grid[r][c];
                if (oldType !== 0) {
                    changes.push({ col: c, row: r, oldType });
                    this.grid[r][c] = 0;
                }
            }
        }

        // Remove entities in selection area
        for (let i = this.entities.length - 1; i >= 0; i--) {
            const e = this.entities[i];
            if (e.col >= x1 && e.col <= x2 && e.row >= y1 && e.row <= y2) {
                removedEntities.push({ entity: e, index: i });
                this.entities.splice(i, 1);
            }
        }

        if (changes.length === 0 && removedEntities.length === 0) return;

        this.pushAction({
            undo: () => {
                for (const ch of changes) {
                    this.grid[ch.row][ch.col] = ch.oldType;
                }
                // Re-insert entities in reverse order to preserve indices
                for (let i = removedEntities.length - 1; i >= 0; i--) {
                    const { entity, index } = removedEntities[i];
                    this.entities.splice(index, 0, entity);
                }
            },
            redo: () => {
                for (const ch of changes) {
                    this.grid[ch.row][ch.col] = 0;
                }
                for (const { entity } of removedEntities) {
                    const idx = this.entities.findIndex(
                        e => e.col === entity.col && e.row === entity.row
                    );
                    if (idx >= 0) this.entities.splice(idx, 1);
                }
            }
        });
        this.modified = true;
    }

    /**
     * Normalize selection so x1<=x2 and y1<=y2.
     */
    _normalizeSelection() {
        const s = this.selection;
        return {
            x1: Math.min(s.x1, s.x2),
            y1: Math.min(s.y1, s.y2),
            x2: Math.max(s.x1, s.x2),
            y2: Math.max(s.y1, s.y2)
        };
    }

    // ─── Coordinate Conversion ────────────────────────────────────────

    /**
     * Convert screen coordinates to world coordinates accounting for camera and zoom.
     */
    screenToWorld(screenX, screenY) {
        return {
            x: (screenX / this.zoom) + this.camX,
            y: (screenY / this.zoom) + this.camY
        };
    }

    /**
     * Convert screen coordinates to tile column/row.
     */
    screenToTile(screenX, screenY) {
        const world = this.screenToWorld(screenX, screenY);
        return {
            col: Math.floor(world.x / TILE_SIZE),
            row: Math.floor(world.y / TILE_SIZE)
        };
    }

    // ─── Mouse / Input Handling ───────────────────────────────────────

    /**
     * Handle mouse-down events on the editor canvas.
     * @param {number} screenX
     * @param {number} screenY
     * @param {number} button — 0=left, 1=middle, 2=right
     * @param {boolean} shiftKey
     * @param {boolean} spaceKey
     */
    handleMouseDown(screenX, screenY, button, shiftKey, spaceKey) {
        const { col, row } = this.screenToTile(screenX, screenY);

        // Panning — spacebar held or middle-click
        if (spaceKey || button === 1) {
            this.isPanning = true;
            this.panStartX = screenX;
            this.panStartY = screenY;
            this.panStartCamX = this.camX;
            this.panStartCamY = this.camY;
            return;
        }

        // Right-click always erases
        if (button === 2) {
            this.isErasing = true;
            this.eraseTile(col, row);
            this.lastDrawCol = col;
            this.lastDrawRow = row;
            return;
        }

        // Left-click — depends on current tool
        if (button === 0) {
            switch (this.currentTool) {
                case 'draw':
                    this.isDrawing = true;
                    this.setTile(col, row, this.selectedTile);
                    this.lastDrawCol = col;
                    this.lastDrawRow = row;
                    break;

                case 'erase':
                    this.isErasing = true;
                    this.eraseTile(col, row);
                    this.lastDrawCol = col;
                    this.lastDrawRow = row;
                    break;

                case 'entity':
                    this.placeEntity(this.selectedEntity, col, row);
                    break;

                case 'fill':
                    this.fillTool(col, row, this.selectedTile);
                    break;

                case 'select':
                    this.isSelecting = true;
                    this.selectionStartCol = col;
                    this.selectionStartRow = row;
                    this.selection = { x1: col, y1: row, x2: col, y2: row };
                    break;
            }
        }
    }

    /**
     * Handle mouse-move events.
     */
    handleMouseMove(screenX, screenY) {
        // Panning
        if (this.isPanning) {
            const dx = (screenX - this.panStartX) / this.zoom;
            const dy = (screenY - this.panStartY) / this.zoom;
            this.camX = this.panStartCamX - dx;
            this.camY = this.panStartCamY - dy;
            return;
        }

        const { col, row } = this.screenToTile(screenX, screenY);

        // Drawing — use Bresenham line from last position for smooth painting
        if (this.isDrawing) {
            this._drawLine(this.lastDrawCol, this.lastDrawRow, col, row, (c, r) => {
                this.setTile(c, r, this.selectedTile);
            });
            this.lastDrawCol = col;
            this.lastDrawRow = row;
            return;
        }

        // Erasing — use Bresenham line
        if (this.isErasing) {
            this._drawLine(this.lastDrawCol, this.lastDrawRow, col, row, (c, r) => {
                this.eraseTile(c, r);
            });
            this.lastDrawCol = col;
            this.lastDrawRow = row;
            return;
        }

        // Selecting — update selection rectangle
        if (this.isSelecting) {
            this.selection = {
                x1: this.selectionStartCol,
                y1: this.selectionStartRow,
                x2: col,
                y2: row
            };
            return;
        }
    }

    /**
     * Handle mouse-up — end all interaction states.
     */
    handleMouseUp() {
        this.isPanning = false;
        this.isDrawing = false;
        this.isErasing = false;
        this.isSelecting = false;
        this.lastDrawCol = -1;
        this.lastDrawRow = -1;
    }

    /**
     * Handle mouse wheel for zoom, centered on cursor position.
     */
    handleWheel(deltaY, screenX, screenY) {
        const oldZoom = this.zoom;
        const zoomFactor = deltaY > 0 ? 0.9 : 1.1;
        this.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, this.zoom * zoomFactor));

        // Adjust camera to zoom toward cursor
        const worldX = screenX / oldZoom + this.camX;
        const worldY = screenY / oldZoom + this.camY;
        this.camX = worldX - screenX / this.zoom;
        this.camY = worldY - screenY / this.zoom;
    }

    /**
     * Bresenham line algorithm — invokes callback(col, row) for each cell along the line.
     */
    _drawLine(x0, y0, x1, y1, callback) {
        const dx = Math.abs(x1 - x0);
        const dy = Math.abs(y1 - y0);
        const sx = x0 < x1 ? 1 : -1;
        const sy = y0 < y1 ? 1 : -1;
        let err = dx - dy;

        while (true) {
            callback(x0, y0);

            if (x0 === x1 && y0 === y1) break;

            const e2 = 2 * err;
            if (e2 > -dy) {
                err -= dy;
                x0 += sx;
            }
            if (e2 < dx) {
                err += dx;
                y0 += sy;
            }
        }
    }

    // ─── Visibility ───────────────────────────────────────────────────

    /**
     * Get the range of tiles currently visible on screen.
     * @returns {{startCol: number, endCol: number, startRow: number, endRow: number}}
     */
    getVisibleTileRange(canvasWidth, canvasHeight) {
        const startCol = Math.max(0, Math.floor(this.camX / TILE_SIZE));
        const startRow = Math.max(0, Math.floor(this.camY / TILE_SIZE));
        const endCol = Math.min(
            this.levelWidth - 1,
            Math.floor((this.camX + canvasWidth / this.zoom) / TILE_SIZE)
        );
        const endRow = Math.min(
            this.levelHeight - 1,
            Math.floor((this.camY + canvasHeight / this.zoom) / TILE_SIZE)
        );
        return { startCol, endCol, startRow, endRow };
    }

    // ─── Serialization ───────────────────────────────────────────────

    /**
     * Serialize the level to a plain JSON-compatible object.
     */
    toJSON() {
        return {
            name: this.levelName,
            author: this.author,
            version: 1,
            theme: this.theme,
            width: this.levelWidth,
            height: this.levelHeight,
            grid: this.grid,
            entities: this.entities.map(e => ({ type: e.type, col: e.col, row: e.row })),
            metadata: {
                created: new Date().toISOString(),
                modified: new Date().toISOString()
            }
        };
    }

    /**
     * Load a level from a JSON object. Validates fields, sets all properties, resets history.
     */
    fromJSON(data) {
        if (!data || typeof data !== 'object') {
            console.error('fromJSON: invalid data');
            return;
        }

        this.levelName = data.name || 'Untitled Level';
        this.author = data.author || 'Anonymous';
        this.theme = data.theme || 'overworld';
        this.levelWidth = data.width || DEFAULT_LEVEL_WIDTH;
        this.levelHeight = data.height || DEFAULT_LEVEL_HEIGHT;

        // Load grid
        if (Array.isArray(data.grid) && data.grid.length === this.levelHeight) {
            this.grid = data.grid.map(row => [...row]);
        } else {
            // Fallback: create empty grid
            this.grid = [];
            for (let r = 0; r < this.levelHeight; r++) {
                this.grid[r] = new Array(this.levelWidth).fill(0);
            }
        }

        // Load entities
        if (Array.isArray(data.entities)) {
            this.entities = data.entities.map(e => ({
                type: e.type,
                col: e.col,
                row: e.row,
                x: e.col * TILE_SIZE,
                y: e.row * TILE_SIZE
            }));
        } else {
            this.entities = [];
        }

        // Reset state
        this.camX = 0;
        this.camY = 0;
        this.zoom = 1;
        this.selection = null;
        this.history = [];
        this.historyIndex = -1;
        this.modified = false;
    }

    // ─── File I/O ─────────────────────────────────────────────────────

    /**
     * Trigger download of level as a .json file.
     */
    exportToFile() {
        const json = JSON.stringify(this.toJSON(), null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = (this.levelName || 'level') + '.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    /**
     * Open file picker, read JSON, call fromJSON.
     * @returns {Promise<boolean>} true on success, false on failure
     */
    importFromFile() {
        return new Promise((resolve) => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) {
                    resolve(false);
                    return;
                }
                const reader = new FileReader();
                reader.onload = (ev) => {
                    try {
                        const data = JSON.parse(ev.target.result);
                        this.fromJSON(data);
                        resolve(true);
                    } catch (err) {
                        console.error('Failed to import level:', err);
                        resolve(false);
                    }
                };
                reader.readAsText(file);
            };
            input.click();
        });
    }

    // ─── Local Storage ────────────────────────────────────────────────

    /**
     * Save level to localStorage.
     */
    saveToLocalStorage() {
        try {
            const data = JSON.stringify(this.toJSON());
            localStorage.setItem('anticatiteMaker_autosave', data);
            this.lastSave = Date.now();
            this.modified = false;
        } catch (err) {
            console.error('Failed to save to localStorage:', err);
        }
    }

    /**
     * Load level from localStorage if an autosave exists.
     * @returns {boolean} true if loaded successfully
     */
    loadFromLocalStorage() {
        try {
            const raw = localStorage.getItem('anticatiteMaker_autosave');
            if (!raw) return false;
            const data = JSON.parse(raw);
            this.fromJSON(data);
            return true;
        } catch (err) {
            console.error('Failed to load from localStorage:', err);
            return false;
        }
    }

    /**
     * Autosave: if modified and enough time has passed since last save,
     * persist to localStorage.
     */
    autoSave() {
        if (this.modified && (Date.now() - this.lastSave) >= AUTOSAVE_INTERVAL) {
            this.saveToLocalStorage();
        }
    }
}
