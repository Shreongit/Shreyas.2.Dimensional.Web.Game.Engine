/** Configurable namespaced logger. */
export class Logger {
  static levels = { debug: 10, info: 20, warn: 30, error: 40, silent: Infinity };
  constructor(namespace = "S2DWGE", level = "warn", sink = console) { this.namespace = namespace; this.sink = sink; this.setLevel(level); }
  setLevel(level) {
    if (!(level in Logger.levels)) throw new RangeError(`Unknown log level: ${level}`);
    this.level = Logger.levels[level]; return this;
  }
  _write(level, args) { if (Logger.levels[level] >= this.level) this.sink[level]?.(`[${this.namespace}]`, ...args); }
  debug(...args) { this._write("debug", args); }
  info(...args) { this._write("info", args); }
  warn(...args) { this._write("warn", args); }
  error(...args) { this._write("error", args); }
}
