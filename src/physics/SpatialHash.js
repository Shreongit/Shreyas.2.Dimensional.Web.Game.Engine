/** Uniform-grid broad-phase index for AABB candidates, optimized to eliminate frame garbage collection. */
export class SpatialHash {
  constructor(cellSize = 128, { maxCellsPerEntry = 4096 } = {}) {
    if (!Number.isFinite(cellSize) || cellSize <= 0) throw new RangeError("cellSize must be a positive finite number");
    if (!Number.isInteger(maxCellsPerEntry) || maxCellsPerEntry < 1) throw new RangeError("maxCellsPerEntry must be a positive integer");
    
    this.cellSize = cellSize; 
    this.maxCellsPerEntry = maxCellsPerEntry;
    this.cells = new Map(); 
    this.entries = new Map(); 
    this.overflow = new Set();
    
    // Static reusable object cache to completely eliminate allocation overhead in loops
    this._sharedRange = { x0: 0, x1: 0, y0: 0, y1: 0 };
  }

  _fillRange(b) {
    if (!b || ![b.x, b.y, b.width, b.height].every(Number.isFinite) || b.width < 0 || b.height < 0) {
      throw new TypeError("SpatialHash bounds must have finite center coordinates and non-negative finite dimensions");
    }
    
    const r = this._sharedRange;
    r.x0 = Math.floor((b.x - b.width / 2) / this.cellSize);
    r.x1 = Math.floor((b.x + b.width / 2) / this.cellSize);
    r.y0 = Math.floor((b.y - b.height / 2) / this.cellSize);
    r.y1 = Math.floor((b.y + b.height / 2) / this.cellSize);
    return r;
  }

  /** Generates a 32-bit integer hash out of discrete 2D spatial coordinates */
  _key(x, y) { 
    // Bitwise operators keep hashing lightning-fast and integer-based, avoiding string allocations
    return ((x & 0xFFFF) << 16) | (y & 0xFFFF);
  }

  insert(item, bounds) {
    if (item == null) throw new TypeError("SpatialHash item cannot be null");
    this.remove(item);
    
    this._fillRange(bounds);
    const r = this._sharedRange;
    const nx = r.x1 - r.x0 + 1;
    const ny = r.y1 - r.y0 + 1;
    
    if (nx * ny > this.maxCellsPerEntry) { 
      this.entries.set(item, null); 
      this.overflow.add(item); 
      return item; 
    }
    
    const keys = [];
    for (let y = r.y0; y <= r.y1; y++) {
      for (let x = r.x0; x <= r.x1; x++) {
        const k = this._key(x, y);
        let cell = this.cells.get(k);
        if (!cell) {
          cell = new Set();
          this.cells.set(k, cell);
        }
        cell.add(item); 
        keys.push(k);
      }
    }
    this.entries.set(item, keys); 
    return item;
  }

  remove(item) {
    if (!this.entries.has(item)) return false;
    const keys = this.entries.get(item);
    
    if (keys === null) {
      this.overflow.delete(item);
    } else {
      for (let i = 0; i < keys.length; i++) {
        const k = keys[i];
        const cell = this.cells.get(k);
        if (cell) {
          cell.delete(item); 
          if (cell.size === 0) this.cells.delete(k);
        }
      }
    }
    this.entries.delete(item); 
    return true;
  }

  query(bounds) {
    this._fillRange(bounds);
    const r = this._sharedRange;
    const found = new Set(this.overflow);
    const nx = r.x1 - r.x0 + 1;
    const ny = r.y1 - r.y0 + 1;
    
    if (nx * ny > this.maxCellsPerEntry) return Array.from(this.entries.keys());
    
    for (let y = r.y0; y <= r.y1; y++) {
      for (let x = r.x0; x <= r.x1; x++) {
        const cell = this.cells.get(this._key(x, y));
        if (cell) {
          for (const item of cell) {
            found.add(item);
          }
        }
      }
    }
    return Array.from(found);
  }

  clear() { 
    this.cells.clear(); 
    this.entries.clear(); 
    this.overflow.clear(); 
  }
}
