import { Engine, Scene, Entity, Component, RectangleRenderer } from "../../src/index.js";

class PlayerController extends Component {
  constructor() { super(); this.speed = 230; this.color = "#76e7a5"; this.elapsed = 0; }
  update(dt) {
    const engine = this.entity.scene?.engine;
    if (!engine) return;
    const input = engine.input;
    const fast = input.isDown("ShiftLeft") || input.isDown("ShiftRight");
    const speed = this.speed * (fast ? 1.65 : 1);
    let dx = Number(input.isDown("ArrowRight") || input.isDown("KeyD")) - Number(input.isDown("ArrowLeft") || input.isDown("KeyA"));
    let dy = Number(input.isDown("ArrowDown") || input.isDown("KeyS")) - Number(input.isDown("ArrowUp") || input.isDown("KeyW"));
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    this.entity.x = Math.max(22, Math.min(engine.width - 22, this.entity.x + dx * speed * dt));
    this.entity.y = Math.max(22, Math.min(engine.height - 22, this.entity.y + dy * speed * dt));
    this.elapsed += dt;
    this.color = fast ? "#f6c76d" : "#76e7a5";
  }
  render(ctx) {
    const e = this.entity;
    ctx.fillStyle = this.color;
    ctx.shadowColor = this.color; ctx.shadowBlur = 20;
    ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#e6fff0"; ctx.lineWidth = 2;
    ctx.strokeRect(-e.width / 2 + 4, -e.height / 2 + 4, e.width - 8, e.height - 8);
  }
}
class ArenaScene extends Scene {
  constructor() { super("Arena"); }
  onStart() {
    const player = new Entity({ name: "Player", x: 480, y: 270, width: 36, height: 36, tag: "player" });
    player.addComponent(new PlayerController());
    this.add(player);
    for (let i = 0; i < 28; i++) {
      const x = 50 + ((i * 137) % 860), y = 40 + ((i * 83) % 460);
      const dot = new Entity({ name: `Star ${i}`, x, y, width: 3 + (i % 3), height: 3 + (i % 3) });
      dot.addComponent(new RectangleRenderer({ color: i % 2 ? "#34465c" : "#516b7e" }));
      this.add(dot);
    }
  }
  render(ctx) {
    ctx.save();
    ctx.strokeStyle = "#253041"; ctx.lineWidth = 1;
    for (let x = 0; x <= 960; x += 48) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 540); ctx.stroke(); }
    for (let y = 0; y <= 540; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(960, y); ctx.stroke(); }
    ctx.restore();
    super.render(ctx);
  }
}

const canvas = document.querySelector("#game");
const readout = document.querySelector("#readout");
const overlay = document.querySelector("#overlay");
let engine;

function createGame() {
  engine?.dispose();
  engine = new Engine(canvas, { width: 960, height: 540, background: "#0d121b", debug: false, audio: false });
  engine.scenes.add("arena", new ArenaScene());
  engine.start("arena");
  canvas.focus();
}
canvas.addEventListener("pointerdown", () => { overlay.hidden = true; canvas.focus(); });
document.querySelector("#restart").addEventListener("click", createGame);
function updateReadout() {
  if (!engine || engine.disposed) return;
  const player = engine.scenes.current?.entities.find(e => e.tag === "player");
  if (player) readout.textContent = `X: ${Math.round(player.x)} · Y: ${Math.round(player.y)}`;
  overlay.hidden = engine.paused;
  overlay.textContent = engine.paused ? "PAUSED · Press P to resume" : "Click the game to dismiss this hint · WASD / Arrow Keys to move";
  requestAnimationFrame(updateReadout);
}
createGame();