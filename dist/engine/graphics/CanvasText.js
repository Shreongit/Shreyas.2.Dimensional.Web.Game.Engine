import { Component } from "../core/Component.js";
/** World-space text rendering component. */
export class CanvasText extends Component {
  constructor(text, { color = "#fff", font = "16px sans-serif", align = "center", baseline = "middle", maxWidth } = {}) {
    super(); this.text = text; this.color = color; this.font = font; this.align = align; this.baseline = baseline; this.maxWidth = maxWidth;
  }
  render(ctx) { ctx.fillStyle=this.color; ctx.font=this.font; ctx.textAlign=this.align; ctx.textBaseline=this.baseline; ctx.fillText(typeof this.text === "function" ? this.text(this.entity) : this.text, 0, 0, this.maxWidth); }
}
