import { Engine, Scene, Entity, Component, RectangleRenderer } from "../engine/index.js";

class PlayerController extends Component {
  constructor() { super(); this.speed = 220; }
  update(dt) {
    const engine = this.entity.scene?.engine;
    if (!engine) return;
    const keys = engine.input;
    let x = Number(keys.isDown("ArrowRight") || keys.isDown("KeyD")) - Number(keys.isDown("ArrowLeft") || keys.isDown("KeyA"));
    let y = Number(keys.isDown("ArrowDown") || keys.isDown("KeyS")) - Number(keys.isDown("ArrowUp") || keys.isDown("KeyW"));
    if (x && y) { x *= Math.SQRT1_2; y *= Math.SQRT1_2; }
    this.entity.x = Math.max(18, Math.min(engine.width - 18, this.entity.x + x * this.speed * dt));
    this.entity.y = Math.max(18, Math.min(engine.height - 18, this.entity.y + y * this.speed * dt));
  }
}

class MainScene extends Scene {
  constructor() { super("main"); }
  onStart() {
    const player = new Entity({ name: "Player", x: 480, y: 270, width: 36, height: 36, tag: "player" });
    player.addComponent(new PlayerController());
    this.add(player);
    for (let i = 0; i < 32; i++) {
      const star = new Entity({ name: `Star ${i}`, x: 24 + (i * 173) % 912, y: 24 + (i * 97) % 492, width: 3, height: 3 });
      star.addComponent(new RectangleRenderer({ color: "#34465c" }));
      this.add(star);
    }
  }
}

const canvas = document.querySelector("#game");
const status = document.querySelector("#status");
let engine;
function startGame() {
  engine?.dispose();
  engine = new Engine(canvas, { width: 960, height: 540, background: "#101722", viewport: { autoResize: true, maxDPR: 2 }, audio: false });
  engine.scenes.add("main", new MainScene());
  engine.start("main");
  canvas.focus();
  status.textContent = "Ready · WASD / arrow keys to move · P to pause";
}
document.querySelector("#restart").addEventListener("click", startGame);
canvas.addEventListener("pointerdown", () => canvas.focus());
startGame();
