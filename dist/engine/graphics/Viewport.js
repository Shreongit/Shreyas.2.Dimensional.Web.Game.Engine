/** Fits a logical game resolution into a canvas while preserving aspect ratio. */
export class Viewport {
  constructor(canvas, logicalWidth, logicalHeight, { pixelArt = false, autoResize = true, maxDPR = 3 } = {}) {
    if (!canvas?.getBoundingClientRect || !canvas?.style) throw new TypeError("Viewport requires a canvas element.");
    for (const [name, value] of Object.entries({ logicalWidth, logicalHeight, maxDPR })) {
      if (!Number.isFinite(value) || value <= 0) throw new RangeError(`${name} must be a positive finite number`);
    }
    this.canvas = canvas;
    this.width = logicalWidth;
    this.height = logicalHeight;
    this.pixelArt = Boolean(pixelArt);
    this.maxDPR = maxDPR;
    this.scale = 1;
    this.offsetX = 0;
    this.offsetY = 0;
    this.disposed = false;
    this._resize = () => this.resize();
    if (autoResize && typeof ResizeObserver !== "undefined") {
      this.observer = new ResizeObserver(this._resize);
      this.observer.observe(canvas);
    }
    this.resize();
  }

  resize() {
    if (this.disposed) return this;
    const rect = this.canvas.getBoundingClientRect();
    // Keep a valid backing store while hidden/zero-sized; the next resize restores the fit.
    const cssWidth = Math.max(0, rect.width);
    const cssHeight = Math.max(0, rect.height);
    const dpr = Math.max(1, Math.min(this.maxDPR, globalThis.devicePixelRatio || 1));
    const pixelWidth = Math.max(1, Math.round(cssWidth * dpr));
    const pixelHeight = Math.max(1, Math.round(cssHeight * dpr));
    if (this.canvas.width !== pixelWidth) this.canvas.width = pixelWidth;
    if (this.canvas.height !== pixelHeight) this.canvas.height = pixelHeight;
    if (cssWidth > 0 && cssHeight > 0) {
      this.scale = Math.min(pixelWidth / this.width, pixelHeight / this.height);
      this.offsetX = (pixelWidth - this.width * this.scale) / 2;
      this.offsetY = (pixelHeight - this.height * this.scale) / 2;
    }
    this.canvas.style.imageRendering = this.pixelArt ? "pixelated" : "auto";
    return this;
  }

  begin(ctx) {
    ctx.setTransform(this.scale, 0, 0, this.scale, this.offsetX, this.offsetY);
    return this;
  }

  /** Convert client coordinates to logical game coordinates (letterbox areas may be outside bounds). */
  toLogical(clientX, clientY) {
    const rect = this.canvas.getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0 || this.scale <= 0) return { x: 0, y: 0, inside: false };
    const px = (clientX - rect.left) * this.canvas.width / rect.width;
    const py = (clientY - rect.top) * this.canvas.height / rect.height;
    const x = (px - this.offsetX) / this.scale;
    const y = (py - this.offsetY) / this.scale;
    return { x, y, inside: x >= 0 && y >= 0 && x < this.width && y < this.height };
  }

  /** Convert logical game coordinates to CSS client coordinates. */
  toClient(x, y) {
    const rect = this.canvas.getBoundingClientRect();
    return {
      x: rect.left + (this.offsetX + x * this.scale) * rect.width / this.canvas.width,
      y: rect.top + (this.offsetY + y * this.scale) * rect.height / this.canvas.height
    };
  }

  dispose() {
    if (this.disposed) return;
    this.observer?.disconnect();
    this.disposed = true;
  }
}
