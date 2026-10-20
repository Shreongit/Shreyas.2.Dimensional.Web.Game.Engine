/** Uniform-grid broad-phase index for AABB candidates. */
export class SpatialHash {
  constructor(cellSize = 128) { if (!(cellSize > 0)) throw new RangeError("cellSize must be positive"); this.cellSize=cellSize; this.cells=new Map(); this.entries=new Map(); }
  _range(bounds) {
    return { x0:Math.floor((bounds.x-bounds.width/2)/this.cellSize), x1:Math.floor((bounds.x+bounds.width/2)/this.cellSize),
      y0:Math.floor((bounds.y-bounds.height/2)/this.cellSize), y1:Math.floor((bounds.y+bounds.height/2)/this.cellSize) };
  }
  _key(x,y) { return `${x},${y}`; }
  insert(item,bounds) {
    this.remove(item);
    const r=this._range(bounds), keys=[];
    for(let y=r.y0;y<=r.y1;y++) for(let x=r.x0;x<=r.x1;x++) {
      const k=this._key(x,y); if(!this.cells.has(k)) this.cells.set(k,new Set());
      this.cells.get(k).add(item); keys.push(k);
    }
    this.entries.set(item,keys); return item;
  }
  remove(item) {
    const keys=this.entries.get(item); if(!keys) return false;
    for(const k of keys) { const s=this.cells.get(k); s?.delete(item); if(s?.size===0)this.cells.delete(k); }
    this.entries.delete(item); return true;
  }
  query(bounds) {
    const r=this._range(bounds), found=new Set();
    for(let y=r.y0;y<=r.y1;y++) for(let x=r.x0;x<=r.x1;x++) for(const item of this.cells.get(this._key(x,y))??[]) found.add(item);
    return [...found];
  }
  clear() { this.cells.clear(); this.entries.clear(); }
}
