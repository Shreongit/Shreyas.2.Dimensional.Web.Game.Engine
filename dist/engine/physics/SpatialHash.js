/** Uniform-grid broad-phase index for AABB candidates, including oversized entries. */
export class SpatialHash {
  constructor(cellSize = 128, { maxCellsPerEntry = 4096 } = {}) {
    if (!Number.isFinite(cellSize) || cellSize <= 0) throw new RangeError("cellSize must be a positive finite number");
    if (!Number.isInteger(maxCellsPerEntry) || maxCellsPerEntry < 1) throw new RangeError("maxCellsPerEntry must be a positive integer");
    this.cellSize = cellSize; this.maxCellsPerEntry = maxCellsPerEntry;
    this.cells = new Map(); this.entries = new Map(); this.overflow = new Set();
  }
  _range(b) {
    if (!b || ![b.x,b.y,b.width,b.height].every(Number.isFinite) || b.width < 0 || b.height < 0) {
      throw new TypeError("SpatialHash bounds must have finite center coordinates and non-negative finite dimensions");
    }
    return {x0:Math.floor((b.x-b.width/2)/this.cellSize),x1:Math.floor((b.x+b.width/2)/this.cellSize),y0:Math.floor((b.y-b.height/2)/this.cellSize),y1:Math.floor((b.y+b.height/2)/this.cellSize)};
  }
  _key(x,y) { return `${x},${y}`; }
  insert(item,bounds) {
    if (item == null) throw new TypeError("SpatialHash item cannot be null");
    this.remove(item);
    const r=this._range(bounds), nx=r.x1-r.x0+1, ny=r.y1-r.y0+1;
    if (nx*ny > this.maxCellsPerEntry) { this.entries.set(item,null); this.overflow.add(item); return item; }
    const keys=[];
    for(let y=r.y0;y<=r.y1;y++) for(let x=r.x0;x<=r.x1;x++) {
      const k=this._key(x,y); if(!this.cells.has(k)) this.cells.set(k,new Set());
      this.cells.get(k).add(item); keys.push(k);
    }
    this.entries.set(item,keys); return item;
  }
  remove(item) {
    if (!this.entries.has(item)) return false;
    const keys=this.entries.get(item);
    if (keys === null) this.overflow.delete(item);
    else for(const k of keys) { const set=this.cells.get(k); set?.delete(item); if(set?.size===0)this.cells.delete(k); }
    this.entries.delete(item); return true;
  }
  query(bounds) {
    const r=this._range(bounds), found=new Set(this.overflow);
    const nx=r.x1-r.x0+1, ny=r.y1-r.y0+1;
    if (nx*ny > this.maxCellsPerEntry) return [...this.entries.keys()];
    for(let y=r.y0;y<=r.y1;y++) for(let x=r.x0;x<=r.x1;x++) for(const item of this.cells.get(this._key(x,y))??[]) found.add(item);
    return [...found];
  }
  clear() { this.cells.clear(); this.entries.clear(); this.overflow.clear(); }
}
