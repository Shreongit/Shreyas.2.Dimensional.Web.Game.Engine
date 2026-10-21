/** Draws an image region with origin, tint-independent transforms and optional flips. */
export class Sprite {
  constructor(image, { x = 0, y = 0, width = image?.width ?? 0, height = image?.height ?? 0, anchorX = 0, anchorY = 0, flipX = false, flipY = false } = {}) {
    this.image = image; this.x = x; this.y = y; this.width = width; this.height = height;
    this.anchorX = anchorX; this.anchorY = anchorY; this.flipX = flipX; this.flipY = flipY;
  }
  draw(ctx, x, y, width = this.width, height = this.height) {
    if (!this.image || !this.image.complete && "complete" in this.image) return;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(this.flipX ? -1 : 1, this.flipY ? -1 : 1);
    ctx.drawImage(this.image, this.x, this.y, this.width, this.height, -width * this.anchorX, -height * this.anchorY, width, height);
    ctx.restore();
  }
}