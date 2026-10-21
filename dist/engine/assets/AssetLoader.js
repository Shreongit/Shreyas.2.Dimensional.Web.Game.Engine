/** Loads image/audio assets with deterministic progress and explicit failure reporting. */
export class AssetLoader {
  constructor() {
    this.assets = new Map();
    this.errors = [];
    this.loaded = 0;
    this.total = 0;
  }

  get progress() { return this.total === 0 ? 1 : this.loaded / this.total; }
  get(name) { return this.assets.get(name) ?? null; }

  async loadManifest(manifest, { onProgress = () => {}, continueOnError = true } = {}) {
    if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
      throw new TypeError("Asset manifest must be an object keyed by asset name.");
    }
    if (typeof onProgress !== "function") throw new TypeError("onProgress must be a function.");

    const entries = Object.entries(manifest);
    this.total = entries.length;
    this.loaded = 0;
    this.errors = [];
    const failures = [];

    // Run workers independently so one failed asset never leaves progress ambiguous.
    await Promise.all(entries.map(async ([name, item]) => {
      let assetError = null;
      try {
        if (!item || (typeof item !== "string" && typeof item !== "object")) {
          throw new TypeError(`Invalid manifest entry for asset "${name}"`);
        }
        const type = typeof item === "string" ? "image" : (item.type ?? "image");
        const url = typeof item === "string" ? item : item.url;
        if (typeof url !== "string" || url.trim() === "") throw new Error(`Missing URL for asset "${name}"`);

        let asset;
        if (type === "image") asset = await this._image(url);
        else if (type === "audio") {
          if (typeof fetch !== "function") throw new Error("Audio assets require fetch support.");
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Asset request failed (${response.status}): ${url}`);
          asset = await response.arrayBuffer();
        } else throw new Error(`Unsupported asset type "${type}"`);

        this.assets.set(name, asset);
      } catch (error) {
        assetError = error instanceof Error ? error : new Error(String(error));
        const failure = { name, error: assetError };
        this.errors.push(failure);
        failures.push(failure);
      } finally {
        this.loaded++;
        onProgress({
          name,
          loaded: this.loaded,
          total: this.total,
          progress: this.progress,
          error: assetError
        });
      }
    }));

    if (!continueOnError && failures.length) {
      const error = new AggregateError(failures.map(({ error }) => error), `Failed to load ${failures.length} asset(s).`);
      error.failures = failures;
      throw error;
    }
    return this;
  }

  _image(url) {
    if (typeof Image === "undefined") return Promise.reject(new Error("Image assets require a browser Image implementation."));
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Image failed to load: ${url}`));
      image.src = url;
    });
  }
}
