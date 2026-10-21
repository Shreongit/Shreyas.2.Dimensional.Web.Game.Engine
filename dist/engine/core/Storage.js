/** Namespaced JSON storage with safe failure behavior for restricted browser contexts. */
export class Storage {
  constructor(namespace = "s2dwge", backend = globalThis.localStorage) { this.namespace = namespace; this.backend = backend; }
  _key(key) { return `${this.namespace}:${key}`; }
  set(key, value) { try { this.backend?.setItem(this._key(key), JSON.stringify(value)); return true; } catch { return false; } }
  get(key, fallback = null) { try { const value = this.backend?.getItem(this._key(key)); return value == null ? fallback : JSON.parse(value); } catch { return fallback; } }
  has(key) { try { return this.backend?.getItem(this._key(key)) != null; } catch { return false; } }
  remove(key) { try { this.backend?.removeItem(this._key(key)); return true; } catch { return false; } }
  clear() { try { for (let i = this.backend.length - 1; i >= 0; i--) { const k = this.backend.key(i); if (k?.startsWith(`${this.namespace}:`)) this.backend.removeItem(k); } return true; } catch { return false; } }
}
