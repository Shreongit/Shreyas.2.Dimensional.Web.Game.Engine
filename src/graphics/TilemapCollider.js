import { Component } from "../core/Component.js";
/** Grid collision query for tilemaps. The caller defines which tile IDs are solid. */
export class TilemapCollider extends Component {
  constructor(tilemap, { solid = id => id !== 0 } = {}) { super(); this.tilemap = tilemap; this.solid = solid; }
  isSolidAtWorld(x, y) {
    const col = Math.floor(x / (this.tilemap.tileWidth * this.tilemap.scale));
    const row = Math.floor(y / (this.tilemap.tileHeight * this.tilemap.scale));
    return !!this.solid(this.tilemap.data[row]?.[col] ?? 0, col, row);
  }
  overlapsEntity(entity) {
    const left = entity.x - entity.width/2, right = entity.x + entity.width/2;
    const top = entity.y - entity.height/2, bottom = entity.y + entity.height/2;
    return this.isSolidAtWorld(left,top) || this.isSolidAtWorld(right,top) || this.isSolidAtWorld(left,bottom) || this.isSolidAtWorld(right,bottom);
  }
}
