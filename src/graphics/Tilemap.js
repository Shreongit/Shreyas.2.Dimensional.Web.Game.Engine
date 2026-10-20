/** Draws a tilemap from a 1D/2D grid and a tileset image. Tile ID 0 is empty by default. */
export class Tilemap {
  constructor({ data, tileWidth = 16, tileHeight = tileWidth, tileset, columns, emptyTile = 0, scale = 1 } = {}) {
    if (!Array.isArray(data)) throw new TypeError("Tilemap data must be an array.");
    if (!tileset) throw new TypeError("Tilemap requires a tileset image.");
    this.data = Array.isArray(data[0]) ? data : [data];
    this.tileWidth = tileWidth; this.tileHeight = tileHeight; this.tileset = tileset;
    this.columns = columns ?? Math.max(1, Math.floor(tileset.width / tileWidth));
    this.emptyTile = emptyTile; this.scale = scale;
    this.width = Math.max(0, ...this.data.map(row => row.length)) * tileWidth * scale;
    this.height = this.data.length * tileHeight * scale;
  }
  draw(ctx, { x = 0, y = 0, camera = null, viewportWidth = Infinity, viewportHeight = Infinity } = {}) {
    const tw = this.tileWidth * this.scale, th = this.tileHeight * this.scale;
    const left = camera ? Math.max(0, Math.floor((camera.x - viewportWidth / (2 * camera.zoom)) / tw)) : 0;
    const top = camera ? Math.max(0, Math.floor((camera.y - viewportHeight / (2 * camera.zoom)) / th)) : 0;
    const right = camera ? Math.min(this.data[0].length, Math.ceil((camera.x + viewportWidth / (2 * camera.zoom)) / tw) + 1) : this.data[0].length;
    const bottom = camera ? Math.min(this.data.length, Math.ceil((camera.y + viewportHeight / (2 * camera.zoom)) / th) + 1) : this.data.length;
    for (let row = top; row < bottom; row++) for (let col = left; col < right; col++) {
      const id = this.data[row]?.[col];
      if (id == null || id === this.emptyTile) continue;
      const index = id - 1, sx = (index % this.columns) * this.tileWidth, sy = Math.floor(index / this.columns) * this.tileHeight;
      ctx.drawImage(this.tileset, sx, sy, this.tileWidth, this.tileHeight, x + col * tw, y + row * th, tw, th);
    }
  }
}
