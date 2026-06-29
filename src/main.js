'use strict';

import { TILE_SIZE, CANVAS_W, CANVAS_H, MIN_ZOOM, MAX_ZOOM, AUTOSAVE_INTERVAL, DEFAULT_LEVEL_WIDTH, DEFAULT_LEVEL_HEIGHT } from './core/constants.js';
import { Editor } from './editor/editor.js';
import { PlayMode } from './play/playmode.js';
import { drawTile, TILE_TYPES, getTileName } from './renderer/tiles.js';
import { drawCat, drawRat, drawRatter, drawFlyRatter, drawArcher, drawCoin, drawOneUp, drawFireFlower, drawCheckpoint, drawSpawnPoint, drawGoalMarker, CAT_SKINS } from './renderer/sprites.js';
import { drawBackground, drawEditorGrid } from './renderer/backgrounds.js';

// ─── Initialization ───────────────────────────────────────────────────────────

const editorCanvas = document.getElementById('editorCanvas');
const playCanvas = document.getElementById('playCanvas');
const ctx = editorCanvas.getContext('2d');

function resizeCanvas() {
    const wrapper = document.getElementById('canvas-wrapper');
    const w = wrapper.clientWidth;
    const h = wrapper.clientHeight;
    editorCanvas.width = w;
    editorCanvas.height = h;
    playCanvas.width = w;
    playCanvas.height = h;
}
resizeCanvas();
window.addEventListener('resize', resizeCanvas);

const editor = new Editor();
const playMode = new PlayMode(playCanvas);
let mode = 'editor'; // 'editor' or 'play'
let showGrid = true;
let frameCount = 0;
let animId = null;

// ─── Palette Categories ───────────────────────────────────────────────────────

const PALETTE_CATEGORIES = {
    terrain: [
        { type: 'tile', id: 1, name: 'Ground', key: '1' },
        { type: 'tile', id: 9, name: 'Platform', key: '2' },
        { type: 'tile', id: 11, name: 'Castle Wall', key: '3' },
    ],
    blocks: [
        { type: 'tile', id: 2, name: 'Brick', key: '4' },
        { type: 'tile', id: 3, name: 'Question Block', key: '5' },
        { type: 'tile', id: 13, name: 'Rare Question', key: '6' },
        { type: 'tile', id: 8, name: 'Used Question', key: '7' },
        { type: 'tile', id: 10, name: 'Flag', key: '8' },
        { type: 'tile', id: 12, name: 'Castle Door', key: '9' },
    ],
    pipes: [
        { type: 'tile', id: 4, name: 'Pipe Top-Left' },
        { type: 'tile', id: 5, name: 'Pipe Top-Right' },
        { type: 'tile', id: 6, name: 'Pipe Body-Left' },
        { type: 'tile', id: 7, name: 'Pipe Body-Right' },
        { type: 'tile', id: 16, name: 'Silver Pipe TL' },
        { type: 'tile', id: 17, name: 'Silver Pipe TR' },
        { type: 'tile', id: 18, name: 'Silver Pipe BL' },
        { type: 'tile', id: 19, name: 'Silver Pipe BR' },
    ],
    special: [],
    entities: [
        { type: 'entity', id: 'spawn', name: 'Spawn Point' },
        { type: 'entity', id: 'coin', name: 'Coin' },
        { type: 'entity', id: 'rat', name: 'Rat' },
        { type: 'entity', id: 'ratter', name: 'Ratter' },
        { type: 'entity', id: 'flyratter', name: 'Fly Ratter' },
        { type: 'entity', id: 'archer', name: 'Archer' },
        { type: 'entity', id: 'oneup', name: '1-Up' },
        { type: 'entity', id: 'fireflower', name: 'Fire Flower' },
        { type: 'entity', id: 'checkpoint', name: 'Checkpoint' },
        { type: 'entity', id: 'goal', name: 'Goal' },
    ]
};

// ─── Palette Building ─────────────────────────────────────────────────────────

function drawPalettePreview(item, canvas) {
    const pctx = canvas.getContext('2d');
    pctx.clearRect(0, 0, canvas.width, canvas.height);

    if (item.type === 'tile') {
        const scale = canvas.width / TILE_SIZE;
        pctx.save();
        pctx.scale(scale, scale);
        drawTile(pctx, 0, 0, item.id, editor.theme, frameCount, 0, 0);
        pctx.restore();
    } else if (item.type === 'entity') {
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        pctx.save();
        switch (item.id) {
            case 'spawn':
                drawSpawnPoint(pctx, cx - TILE_SIZE / 2, cy - TILE_SIZE / 2, frameCount);
                break;
            case 'coin':
                drawCoin(pctx, cx - 8, cy - 8, frameCount);
                break;
            case 'rat':
                drawRat(pctx, cx - TILE_SIZE / 2, cy - TILE_SIZE / 2, 1, frameCount, editor.theme);
                break;
            case 'ratter':
                drawRatter(pctx, cx - TILE_SIZE / 2, cy - TILE_SIZE / 2, 1, frameCount, false);
                break;
            case 'flyratter':
                drawFlyRatter(pctx, cx - TILE_SIZE / 2, cy - TILE_SIZE / 2, 1, frameCount);
                break;
            case 'archer':
                drawArcher(pctx, cx - TILE_SIZE / 2, cy - TILE_SIZE / 2, 1, frameCount, editor.theme);
                break;
            case 'oneup':
                drawOneUp(pctx, cx - 8, cy - 8, frameCount);
                break;
            case 'fireflower':
                drawFireFlower(pctx, cx - 8, cy - 8, frameCount);
                break;
            case 'checkpoint':
                drawCheckpoint(pctx, cx - TILE_SIZE / 2, cy - TILE_SIZE / 2, false, frameCount);
                break;
            case 'goal':
                drawGoalMarker(pctx, cx - TILE_SIZE / 2, cy - TILE_SIZE / 2, frameCount);
                break;
        }
        pctx.restore();
    }
}

function buildPalette(category) {
    const container = document.getElementById('palette-items');
    if (!container) return;
    container.innerHTML = '';

    const items = PALETTE_CATEGORIES[category];
    if (!items || items.length === 0) {
        container.innerHTML = '<div style="color:#888;padding:12px;text-align:center;grid-column:1/-1;">No items</div>';
        return;
    }

    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'palette-item';
        div.title = item.name + (item.key ? ' [' + item.key + ']' : '');

        // Check if currently selected
        if (item.type === 'tile' && editor.selectedTile === item.id && editor.currentTool === 'draw') {
            div.classList.add('selected');
        } else if (item.type === 'entity' && editor.selectedEntity === item.id && editor.currentTool === 'entity') {
            div.classList.add('selected');
        }

        // Mini preview canvas
        const miniCanvas = document.createElement('canvas');
        miniCanvas.width = 48;
        miniCanvas.height = 48;
        try {
            drawPalettePreview(item, miniCanvas);
        } catch (err) {
            console.error('Palette preview error for', item.name, err);
        }
        div.appendChild(miniCanvas);

        // Key hint
        if (item.key) {
            const keySpan = document.createElement('span');
            keySpan.className = 'key-hint';
            keySpan.textContent = item.key;
            div.appendChild(keySpan);
        }

        // Click handler
        div.addEventListener('click', () => {
            if (item.type === 'tile') {
                editor.selectedTile = item.id;
                editor.currentTool = 'draw';
            } else if (item.type === 'entity') {
                editor.selectedEntity = item.id;
                editor.currentTool = 'entity';
            }
            updateToolButtons();
            updatePaletteSelection();
            // Update info bar
            const nameEl = document.getElementById('palette-item-name');
            if (nameEl) nameEl.textContent = item.name;
        });

        container.appendChild(div);
    });
}

function updatePaletteSelection() {
    const items = document.querySelectorAll('.palette-item');
    items.forEach(div => div.classList.remove('selected'));

    // Re-select the correct one
    const container = document.getElementById('palette-items');
    if (!container) return;
    const children = container.children;
    const activeTab = document.querySelector('.palette-tab.active');
    const category = activeTab ? activeTab.dataset.tab : 'terrain';
    const categoryItems = PALETTE_CATEGORIES[category] || [];

    for (let i = 0; i < categoryItems.length; i++) {
        const item = categoryItems[i];
        if (item.type === 'tile' && editor.selectedTile === item.id && editor.currentTool === 'draw') {
            if (children[i]) children[i].classList.add('selected');
        } else if (item.type === 'entity' && editor.selectedEntity === item.id && editor.currentTool === 'entity') {
            if (children[i]) children[i].classList.add('selected');
        }
    }
}

// ─── Tab Switching ────────────────────────────────────────────────────────────

document.querySelectorAll('.palette-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        document.querySelectorAll('.palette-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        buildPalette(tab.dataset.tab);
    });
});

// ─── Editor Rendering Loop ────────────────────────────────────────────────────

function editorLoop() {
    if (mode !== 'editor') return;
    frameCount++;

    // Arrow key panning in editor mode
    if (document.activeElement.tagName !== 'INPUT' && document.activeElement.tagName !== 'TEXTAREA') {
        const panSpeed = 12 / editor.zoom;
        if (keysDown.has('ArrowLeft')) {
            editor.camX = Math.max(0, editor.camX - panSpeed);
        }
        if (keysDown.has('ArrowRight')) {
            const maxCamX = Math.max(0, editor.levelWidth * TILE_SIZE - editorCanvas.width / editor.zoom);
            editor.camX = Math.min(maxCamX, editor.camX + panSpeed);
        }
    }

    const W = editorCanvas.width;
    const H = editorCanvas.height;

    ctx.save();
    ctx.clearRect(0, 0, W, H);

    // Apply zoom and camera
    ctx.scale(editor.zoom, editor.zoom);
    ctx.translate(-editor.camX, -editor.camY);

    // Background — draw at screen level, undo world transform for BG
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawBackground(ctx, W, H, editor.camX * editor.zoom, editor.theme, frameCount);
    ctx.restore();

    // Tiles
    const visible = editor.getVisibleTileRange(W, H);
    for (let r = visible.startRow; r <= visible.endRow; r++) {
        for (let c = visible.startCol; c <= visible.endCol; c++) {
            if (r < 0 || r >= editor.levelHeight || c < 0 || c >= editor.levelWidth) continue;
            const type = editor.grid[r][c];
            if (type > 0) {
                drawTile(ctx, c * TILE_SIZE, r * TILE_SIZE, type, editor.theme, frameCount, r, c);
            }
        }
    }

    // Entities
    editor.entities.forEach(e => {
        const ex = e.col * TILE_SIZE;
        const ey = e.row * TILE_SIZE;
        switch (e.type) {
            case 'spawn': drawSpawnPoint(ctx, ex, ey, frameCount); break;
            case 'coin': drawCoin(ctx, ex + 8, ey + 4, frameCount); break;
            case 'rat': drawRat(ctx, ex, ey, 1, frameCount, editor.theme); break;
            case 'ratter': drawRatter(ctx, ex, ey, 1, frameCount, false); break;
            case 'flyratter': drawFlyRatter(ctx, ex, ey, 1, frameCount); break;
            case 'archer': drawArcher(ctx, ex, ey, 1, frameCount, editor.theme); break;
            case 'oneup': drawOneUp(ctx, ex + 4, ey + 4, frameCount); break;
            case 'fireflower': drawFireFlower(ctx, ex + 4, ey + 2, frameCount); break;
            case 'checkpoint': drawCheckpoint(ctx, ex, ey, false, frameCount); break;
            case 'goal': drawGoalMarker(ctx, ex, ey, frameCount); break;
        }
    });

    // Grid overlay
    if (showGrid) {
        drawEditorGrid(ctx, W, H, editor.camX, editor.camY, editor.zoom, editor.levelWidth, editor.levelHeight, TILE_SIZE);
    }

    // Selection rectangle
    if (editor.selection) {
        const s = editor.selection;
        const sx = Math.min(s.x1, s.x2) * TILE_SIZE;
        const sy = Math.min(s.y1, s.y2) * TILE_SIZE;
        const sw = (Math.abs(s.x2 - s.x1) + 1) * TILE_SIZE;
        const sh = (Math.abs(s.y2 - s.y1) + 1) * TILE_SIZE;
        ctx.strokeStyle = 'rgba(0, 221, 255, 0.8)';
        ctx.lineWidth = 2 / editor.zoom;
        ctx.setLineDash([6 / editor.zoom, 4 / editor.zoom]);
        ctx.strokeRect(sx, sy, sw, sh);
        ctx.fillStyle = 'rgba(0, 221, 255, 0.1)';
        ctx.fillRect(sx, sy, sw, sh);
        ctx.setLineDash([]);
    }

    // Cursor preview (ghost tile/entity at mouse position)
    if (editor.currentTool === 'draw' && editor._hoverCol !== undefined) {
        ctx.globalAlpha = 0.5;
        drawTile(ctx, editor._hoverCol * TILE_SIZE, editor._hoverRow * TILE_SIZE, editor.selectedTile, editor.theme, frameCount, editor._hoverRow, editor._hoverCol);
        ctx.globalAlpha = 1;
    }

    ctx.restore();

    // Coordinate display
    if (editor._hoverCol !== undefined) {
        const coordEl = document.getElementById('coord-display');
        if (coordEl) coordEl.textContent = `Col: ${editor._hoverCol}  Row: ${editor._hoverRow}`;
    }

    // Autosave check
    editor.autoSave();

    animId = requestAnimationFrame(editorLoop);
}

// ─── Mouse Event Handlers ─────────────────────────────────────────────────────

editorCanvas.addEventListener('mousemove', (e) => {
    const rect = editorCanvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const tile = editor.screenToTile(screenX, screenY);
    editor._hoverCol = tile.col;
    editor._hoverRow = tile.row;

    editor.handleMouseMove(screenX, screenY);

    // Update palette info display
    if (tile.col >= 0 && tile.col < editor.levelWidth && tile.row >= 0 && tile.row < editor.levelHeight) {
        const tileType = editor.grid[tile.row][tile.col];
        const infoEl = document.getElementById('palette-item-name');
        if (infoEl) {
            infoEl.textContent = getTileName(tileType) + ` (${tile.col}, ${tile.row})`;
        }
    }
});

editorCanvas.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const rect = editorCanvas.getBoundingClientRect();
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;
    const spaceKey = keysDown.has(' ');
    editor.handleMouseDown(screenX, screenY, e.button, e.shiftKey, spaceKey);
});

editorCanvas.addEventListener('mouseup', () => editor.handleMouseUp());
editorCanvas.addEventListener('mouseleave', () => editor.handleMouseUp());

editorCanvas.addEventListener('wheel', (e) => {
    e.preventDefault();
    const rect = editorCanvas.getBoundingClientRect();
    editor.handleWheel(e.deltaY, e.clientX - rect.left, e.clientY - rect.top);
    const zoomLabel = document.getElementById('zoom-label');
    if (zoomLabel) zoomLabel.textContent = Math.round(editor.zoom * 100) + '%';
}, { passive: false });

editorCanvas.addEventListener('contextmenu', (e) => e.preventDefault());

// ─── Touch Events (mobile support) ───────────────────────────────────────────

let lastTouchX = 0;
let lastTouchY = 0;
let touchStartDist = 0;
let touchStartZoom = 1;

editorCanvas.addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = editorCanvas.getBoundingClientRect();
        lastTouchX = touch.clientX - rect.left;
        lastTouchY = touch.clientY - rect.top;
        editor.handleMouseDown(lastTouchX, lastTouchY, 0, false, false);
    } else if (e.touches.length === 2) {
        // Pinch-to-zoom start
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartDist = Math.sqrt(dx * dx + dy * dy);
        touchStartZoom = editor.zoom;
    }
}, { passive: false });

editorCanvas.addEventListener('touchmove', (e) => {
    e.preventDefault();
    if (e.touches.length === 1) {
        const touch = e.touches[0];
        const rect = editorCanvas.getBoundingClientRect();
        const tx = touch.clientX - rect.left;
        const ty = touch.clientY - rect.top;
        editor.handleMouseMove(tx, ty);
        lastTouchX = tx;
        lastTouchY = ty;
    } else if (e.touches.length === 2) {
        // Pinch-to-zoom
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (touchStartDist > 0) {
            const scale = dist / touchStartDist;
            editor.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, touchStartZoom * scale));
            const zoomLabel = document.getElementById('zoom-label');
            if (zoomLabel) zoomLabel.textContent = Math.round(editor.zoom * 100) + '%';
        }
    }
}, { passive: false });

editorCanvas.addEventListener('touchend', (e) => {
    e.preventDefault();
    editor.handleMouseUp();
    if (e.touches.length === 0) {
        touchStartDist = 0;
    }
}, { passive: false });

// ─── Keyboard Shortcuts ──────────────────────────────────────────────────────

const keysDown = new Set();

window.addEventListener('keydown', (e) => {
    if (mode !== 'editor') return;
    keysDown.add(e.key);
    if (e.key.startsWith('Arrow')) e.preventDefault();

    // Ctrl / Cmd shortcuts
    if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z' && !e.shiftKey) { e.preventDefault(); editor.undo(); return; }
        if (e.key === 'z' && e.shiftKey) { e.preventDefault(); editor.redo(); return; }
        if (e.key === 'Z') { e.preventDefault(); editor.redo(); return; }
        if (e.key === 'c') { e.preventDefault(); editor.copySelection(); showToast('Copied!'); return; }
        if (e.key === 'v') {
            e.preventDefault();
            if (editor._hoverCol !== undefined) editor.pasteClipboard(editor._hoverCol, editor._hoverRow);
            return;
        }
        if (e.key === 'x') { e.preventDefault(); editor.cutSelection(); showToast('Cut!'); return; }
        if (e.key === 's') { e.preventDefault(); editor.saveToLocalStorage(); showToast('Saved!'); return; }
        if (e.key === 'n') { e.preventDefault(); showNewLevelModal(); return; }
        if (e.key === 'o') { e.preventDefault(); editor.importFromFile(); return; }
        if (e.key === 'Enter') { e.preventDefault(); switchToPlay(); return; }
        return;
    }

    // Tool shortcuts
    switch (e.key.toLowerCase()) {
        case 'd': setTool('draw'); break;
        case 'e': setTool('erase'); break;
        case 's': setTool('select'); break;
        case 'n': setTool('entity'); break;
        case 'f': setTool('fill'); break;
        case 'g': showGrid = !showGrid; updateGridButton(); break;
        case 'delete': case 'backspace': editor.deleteSelection(); break;
        case '?': toggleHelp(); break;
    }

    // Number keys for quick tile selection
    const num = parseInt(e.key);
    if (num >= 1 && num <= 9) {
        const allItems = Object.values(PALETTE_CATEGORIES).flat();
        const item = allItems.find(i => i.key === e.key);
        if (item) {
            if (item.type === 'tile') {
                editor.selectedTile = item.id;
                editor.currentTool = 'draw';
            } else {
                editor.selectedEntity = item.id;
                editor.currentTool = 'entity';
            }
            updateToolButtons();
            updatePaletteSelection();
        }
    }
});

window.addEventListener('keyup', (e) => {
    keysDown.delete(e.key);
});

// ─── Toolbar Button Handlers ─────────────────────────────────────────────────

// Tool buttons
document.querySelectorAll('[data-tool]').forEach(btn => {
    btn.addEventListener('click', () => setTool(btn.dataset.tool));
});

function setTool(tool) {
    editor.currentTool = tool;
    updateToolButtons();
}

function updateToolButtons() {
    document.querySelectorAll('[data-tool]').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tool === editor.currentTool);
    });
}

// Undo / Redo
document.getElementById('btn-undo').addEventListener('click', () => editor.undo());
document.getElementById('btn-redo').addEventListener('click', () => editor.redo());

// Zoom
document.getElementById('btn-zoom-in').addEventListener('click', () => {
    editor.zoom = Math.min(MAX_ZOOM, editor.zoom * 1.2);
    const zoomLabel = document.getElementById('zoom-label');
    if (zoomLabel) zoomLabel.textContent = Math.round(editor.zoom * 100) + '%';
});
document.getElementById('btn-zoom-out').addEventListener('click', () => {
    editor.zoom = Math.max(MIN_ZOOM, editor.zoom / 1.2);
    const zoomLabel = document.getElementById('zoom-label');
    if (zoomLabel) zoomLabel.textContent = Math.round(editor.zoom * 100) + '%';
});

// Grid toggle
document.getElementById('btn-grid').addEventListener('click', () => {
    showGrid = !showGrid;
    updateGridButton();
});

function updateGridButton() {
    const btn = document.getElementById('btn-grid');
    if (btn) btn.classList.toggle('active', showGrid);
}

// Theme
document.getElementById('theme-select').addEventListener('change', (e) => {
    editor.theme = e.target.value;
});

// File operations
document.getElementById('btn-new').addEventListener('click', showNewLevelModal);
document.getElementById('btn-clear').addEventListener('click', () => {
    editor.newLevel();
    showToast('Canvas reset to default!');
});

document.getElementById('btn-save').addEventListener('click', () => {
    editor.saveToLocalStorage();
    showToast('Level saved!');
});

document.getElementById('btn-load').addEventListener('click', () => {
    if (editor.loadFromLocalStorage()) showToast('Level loaded!');
    else showToast('No saved level found');
});

document.getElementById('btn-export').addEventListener('click', () => {
    editor.exportToFile();
    showToast('Level exported!');
});

document.getElementById('btn-import').addEventListener('click', async () => {
    const success = await editor.importFromFile();
    if (success) {
        showToast('Level imported!');
        const themeSelect = document.getElementById('theme-select');
        if (themeSelect) themeSelect.value = editor.theme;
    }
});

// Play / Stop / Reset
document.getElementById('btn-play').addEventListener('click', switchToPlay);
document.getElementById('btn-stop').addEventListener('click', switchToEditor);
document.getElementById('btn-reset').addEventListener('click', () => playMode.resetLevel());

// ─── Mode Switching ──────────────────────────────────────────────────────────

function switchToPlay() {
    mode = 'play';
    cancelAnimationFrame(animId);

    editorCanvas.classList.add('hidden');
    playCanvas.classList.remove('hidden');
    document.getElementById('play-hud').classList.remove('hidden');
    document.getElementById('toolbar').style.display = 'none';
    document.getElementById('palette').style.display = 'none';

    // Show mobile controls if touch device
    if ('ontouchstart' in window) {
        document.getElementById('mobile-play-controls').classList.remove('hidden');
    }

    // Set play canvas to standard game resolution
    playCanvas.width = CANVAS_W;
    playCanvas.height = CANVAS_H;

    const levelData = {
        grid: editor.grid,
        entities: editor.entities,
        width: editor.levelWidth,
        height: editor.levelHeight,
        theme: editor.theme
    };

    playMode.onExit = switchToEditor;
    playMode.startLevel(levelData);
}

function switchToEditor() {
    mode = 'editor';
    playMode.running = false;

    editorCanvas.classList.remove('hidden');
    playCanvas.classList.add('hidden');
    document.getElementById('play-hud').classList.add('hidden');
    document.getElementById('play-overlay').classList.add('hidden');
    document.getElementById('toolbar').style.display = '';
    document.getElementById('palette').style.display = '';
    document.getElementById('mobile-play-controls').classList.add('hidden');

    resizeCanvas();
    editorLoop();
}

// ─── New Level Modal ─────────────────────────────────────────────────────────

function showNewLevelModal() {
    document.getElementById('modal-backdrop').classList.remove('hidden');
    document.getElementById('input-name').value = 'Untitled Level';
    document.getElementById('input-width').value = DEFAULT_LEVEL_WIDTH;
}

document.getElementById('modal-cancel').addEventListener('click', () => {
    document.getElementById('modal-backdrop').classList.add('hidden');
});

document.getElementById('modal-confirm').addEventListener('click', () => {
    const name = document.getElementById('input-name').value || 'Untitled Level';
    const author = document.getElementById('input-author').value || 'Anonymous';
    const width = Math.max(20, Math.min(500, parseInt(document.getElementById('input-width').value) || 100));
    const theme = document.getElementById('input-theme').value;

    editor.newLevel(width, DEFAULT_LEVEL_HEIGHT, theme);
    editor.levelName = name;
    editor.author = author;
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) themeSelect.value = theme;
    document.getElementById('modal-backdrop').classList.add('hidden');
    showToast('New level created!');
});

// Close modal on backdrop click
document.getElementById('modal-backdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) {
        document.getElementById('modal-backdrop').classList.add('hidden');
    }
});

// ─── Help Modal ──────────────────────────────────────────────────────────────

function toggleHelp() {
    document.getElementById('help-backdrop').classList.toggle('hidden');
}

document.getElementById('help-close').addEventListener('click', toggleHelp);

document.getElementById('help-backdrop').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) toggleHelp();
});

// ─── Toast Notifications ─────────────────────────────────────────────────────

function showToast(msg) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 3000);
}

// ─── Startup ─────────────────────────────────────────────────────────────────

// Add coordinate display element
const coordDiv = document.createElement('div');
coordDiv.id = 'coord-display';
document.getElementById('canvas-wrapper').appendChild(coordDiv);

// Try loading autosave
if (editor.loadFromLocalStorage()) {
    const themeSelect = document.getElementById('theme-select');
    if (themeSelect) themeSelect.value = editor.theme;
    showToast('Autosave loaded!');
}

// Ensure draw tool is active
setTool('draw');

// Build initial palette
buildPalette('terrain');

// Start editor loop
editorLoop();
