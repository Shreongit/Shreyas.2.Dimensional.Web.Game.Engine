import { Component } from "../core/Component.js";
/** Grid collision query for tilemaps. The caller defines which tile IDs are solid. */
export class TilemapCollider extends Component {
  constructor(tilemap, { solid = id => id !== 0 } = {}) { 
    super(); 
    this.tilemap = tilemap; 
    this.solid = solid; 
  }

  isSolidAtWorld(x, y) {
    const tw = (this.tilemap.tileWidth || 32) * (this.tilemap.scale ?? 1);
    const th = (this.tilemap.tileHeight || 32) * (this.tilemap.scale ?? 1);
    if (tw <= 0 || th <= 0) return false;
    
    const col = Math.floor(x / tw);
    const row = Math.floor(y / th);
    
    if (!this.tilemap.data || !this.tilemap.data[row]) return false;
    return !!this.solid(this.tilemap.data[row][col] ?? 0, col, row);
  }

  overlapsEntity(entity) {
    if (!entity || !this.tilemap) return false;
    
    const tw = (this.tilemap.tileWidth || 32) * (this.tilemap.scale ?? 1);
    const th = (this.tilemap.tileHeight || 32) * (this.tilemap.scale ?? 1);
    if (tw <= 0 || th <= 0) return false;

    const halfW = (entity.width || 0) / 2;
    const halfH = (entity.height || 0) / 2;
    
    const left = entity.x - halfW;
    const right = entity.x + halfW;
    const top = entity.y - halfH;
    const bottom = entity.y + halfH;

    const startCol = Math.floor(left / tw);
    const endCol = Math.floor(right / tw);
    const startRow = Math.floor(top / th);
    const endRow = Math.floor(bottom / th);

    for (let r = startRow; r <= endRow; r++) {
      if (!this.tilemap.data || !this.tilemap.data[r]) continue;
      for (let c = startCol; c <= endCol; c++) {
        if (this.solid(this.tilemap.data[r][c] ?? 0, c, r)) {
          return true;
        }
      }
    }
    return false;
  }
}