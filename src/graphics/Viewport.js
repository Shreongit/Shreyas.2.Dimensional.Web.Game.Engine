/** Fits a logical game resolution into a canvas while preserving aspect ratio. */
export class Viewport {
  constructor(canvas, logicalWidth, logicalHeight, { pixelArt = false, autoResize = true } = {}) {
    this.canvas=canvas; this.width=logicalWidth; this.height=logicalHeight; this.pixelArt=pixelArt;
    this.scale=1; this.offsetX=0; this.offsetY=0;
    this._resize=()=>this.resize();
    if(autoResize && typeof ResizeObserver!=="undefined") { this.observer=new ResizeObserver(this._resize); this.observer.observe(canvas); }
    this.resize();
  }
  resize() {
    const r=this.canvas.getBoundingClientRect(), dpr=Math.max(1,Math.min(3,globalThis.devicePixelRatio||1));
    this.canvas.width=Math.max(1,Math.round(r.width*dpr)); this.canvas.height=Math.max(1,Math.round(r.height*dpr));
    this.scale=Math.min(this.canvas.width/this.width,this.canvas.height/this.height);
    this.offsetX=(this.canvas.width-this.width*this.scale)/2; this.offsetY=(this.canvas.height-this.height*this.scale)/2;
    this.canvas.style.imageRendering=this.pixelArt?"pixelated":"auto";
    return this;
  }
  begin(ctx) { ctx.setTransform(this.scale,0,0,this.scale,this.offsetX,this.offsetY); }
  toLogical(clientX,clientY) {
    const r=this.canvas.getBoundingClientRect(), px=(clientX-r.left)*this.canvas.width/r.width, py=(clientY-r.top)*this.canvas.height/r.height;
    return {x:(px-this.offsetX)/this.scale,y:(py-this.offsetY)/this.scale};
  }
  dispose() { this.observer?.disconnect(); }
}
