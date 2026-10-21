/** Small typed-event emitter. Listener exceptions are re-thrown asynchronously after other listeners run. */
export class EventEmitter {
  constructor() { this._events = new Map(); }
  on(type, listener) {
    if (typeof listener !== "function") throw new TypeError("listener must be a function");
    if (!this._events.has(type)) this._events.set(type, new Set());
    this._events.get(type).add(listener);
    return () => this.off(type, listener);
  }
  once(type, listener) {
    const off = this.on(type, (...args) => { off(); listener(...args); });
    return off;
  }
  off(type, listener) {
    const listeners = this._events.get(type);
    if (!listeners) return false;
    const removed = listeners.delete(listener);
    if (!listeners.size) this._events.delete(type);
    return removed;
  }
  emit(type, ...args) {
    const listeners = [...(this._events.get(type) ?? [])];
    const errors = [];
    for (const listener of listeners) { try { listener(...args); } catch (e) { errors.push(e); } }
    for (const error of errors) queueMicrotask(() => { throw error; });
    return listeners.length > 0;
  }
  removeAllListeners(type) { type === undefined ? this._events.clear() : this._events.delete(type); }
  listenerCount(type) { return this._events.get(type)?.size ?? 0; }
}
