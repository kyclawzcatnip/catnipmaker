'use strict';

export const TILE_SIZE = 32;
export const CANVAS_W = 800;
export const CANVAS_H = 448;
export const GRAVITY = 0.55;
export const MAX_FALL = 10;
export const JUMP_FORCE = -15;
export const WALK_SPEED = 3.5;
export const ENEMY_SPEED = 1.2;
export const COIN_ANIM_SPEED = 0.08;
export const FRICTION = 0.85;
export const DEFAULT_LEVEL_WIDTH = 100;
export const DEFAULT_LEVEL_HEIGHT = 14;
export const MAX_LEVEL_WIDTH = 500;
export const MIN_LEVEL_WIDTH = 20;
export const PLAYER_W = 24;
export const PLAYER_H = 32;
export const COYOTE_TIME = 6;
export const JUMP_BUFFER = 8;
export const MIN_ZOOM = 0.25;
export const MAX_ZOOM = 4;
export const GRID_COLOR = 'rgba(255,255,255,0.08)';
export const AUTOSAVE_INTERVAL = 30000;

export const THEMES = {
    overworld: { name: 'Overworld', sky: ['#4A90D9','#87CEEB','#B8E6B8'], ground: '#8B5E3C' },
    castle: { name: 'Castle', sky: ['#0A0A12','#141420','#1A1A28'], ground: '#555' }
};
