/** Loads image/audio assets and reports deterministic progress/failures. */
export class AssetLoader {
  constructor() { this.assets = new Map(); this.errors = []; this.loaded = 0; this.total = 0; }
  get progress() { return this.total === 0 ? 1 : this.loaded / this.total; }
  get(name) { return this.assets.get(name) ?? null; }
  async loadManifest(manifest, { onProgress = () => {}, continueOnError = true } = {}) {
    const entries = Object.entries(manifest);
    this.total = entries.length; this.loaded = 0; this.errors = [];
    await Promise.all(entries.map(async ([name, item]) => {
      try {
        const type = typeof item === "string" ? "image" : item.type;
        const url = typeof item === "string" ? item : item.url;
        if (!url) throw new Error(`Missing URL for asset "${name}"`);
        let asset;
        if (type === "image") asset = await this._image(url);
        else if (type === "audio") {
          const response = await fetch(url);
          if (!response.ok) throw new Error(`Asset request failed (${response.status}): ${url}`);
          asset = await response.arrayBuffer();
        } else throw new Error(`Unsupported asset type "${type}"`);
        this.assets.set(name, asset);
      } catch (error) {
        this.errors.push({ name, error });
        if (!continueOnError) throw error;
      } finally {
        this.loaded++;
        onProgress({ name, loaded: this.loaded, total: this.total, progress: this.progress, error: this.errors.at(-1)?.name === name ? this.errors.at(-1).error : null });
      }
    }));
    return this;
  }
  _image(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Image failed to load: ${url}`));
      image.src = url;
    });
  }
}