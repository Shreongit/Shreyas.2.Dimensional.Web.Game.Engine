import { Engine, Scene, Entity, Component, RectangleRenderer } from "../engine/index.js";

const WIDTH = 960;
const HEIGHT = 540;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

class PlayerControl extends Component {
  constructor(scene) { super(); this.game = scene; this.speed = 310; }
  update(dt) {
    if (this.game.over || this.game.engine?.paused) return;
    const input = this.game.engine.input;
    let dx = Number(input.isDown("ArrowRight") || input.isDown("KeyD")) - Number(input.isDown("ArrowLeft") || input.isDown("KeyA"));
    let dy = Number(input.isDown("ArrowDown") || input.isDown("KeyS")) - Number(input.isDown("ArrowUp") || input.isDown("KeyW"));
    if (dx && dy) { dx *= Math.SQRT1_2; dy *= Math.SQRT1_2; }
    this.entity.x = clamp(this.entity.x + dx * this.speed * dt, 22, WIDTH - 22);
    this.entity.y = clamp(this.entity.y + dy * this.speed * dt, 22, HEIGHT - 22);
    for (const hazard of this.game.hazards) {
      const dx = this.entity.x - hazard.x, dy = this.entity.y - hazard.y;
      const radius = 20 + hazard.width * 0.42;
      if (dx * dx + dy * dy < radius * radius) { this.game.finish(); break; }
    }
  }
}

class MeteorMotion extends Component {
  constructor(scene, speed) { super(); this.game = scene; this.speed = speed; }
  update(dt) {
    if (this.game.over || this.game.engine?.paused) return;
    this.entity.y += this.speed * dt;
    this.entity.rotation += dt * 0.7;
    if (this.entity.y > HEIGHT + 50) this.game.removeHazard(this.entity);
  }
}

class Starfield extends Component {
  constructor(seed) { super(); this.seed = seed; }
  render(ctx) {
    const e = this.entity;
    ctx.fillStyle = `rgba(174,205,255,${0.25 + (this.seed % 6) * 0.1})`;
    ctx.fillRect(-e.width / 2, -e.height / 2, e.width, e.height);
  }
}

class SurvivalScene extends Scene {
  constructor() {
    super("survival");
    this.elapsed = 0; this.spawnIn = 0.4; this.over = false; this.hazards = []; this.best = 0;
  }
  onStart() {
    this.elapsed = 0; this.spawnIn = 0.35; this.over = false; this.hazards = [];
    const player = new Entity({ name: "Pilot", x: WIDTH / 2, y: HEIGHT * 0.78, width: 30, height: 30, tag: "player", renderOrder: 3 });
    player.addComponent(new RectangleRenderer({ color: "#7fe8c3", stroke: "#e9fff7" }));
    player.addComponent(new PlayerControl(this)); this.add(player); this.player = player;
    for (let i = 0; i < 70; i++) {
      const x = (i * 137.5 + 29) % WIDTH, y = (i * 83.7 + 17) % HEIGHT;
      const star = new Entity({ name: `Star ${i}`, x, y, width: i % 7 === 0 ? 3 : 2, height: i % 7 === 0 ? 3 : 2, renderOrder: 0 });
      star.addComponent(new Starfield(i)); this.add(star);
    }
  }
  update(dt) {
    super.update(dt);
    if (this.over || this.engine?.paused) return;
    this.elapsed += dt;
    this.spawnIn -= dt;
    if (this.spawnIn <= 0) {
      this.spawnHazard();
      this.spawnIn = Math.max(0.22, 0.82 - this.elapsed * 0.008) * (0.7 + Math.random() * 0.6);
    }
    status.textContent = `Survival: ${this.elapsed.toFixed(1)}s · Meteors: ${this.hazards.length}${this.engine?.paused ? " · Paused" : ""}`;
  }
  spawnHazard() {
    const size = 18 + Math.random() * 24;
    const hazard = new Entity({ name: "Meteor", x: size + Math.random() * (WIDTH - size * 2), y: -size, width: size, height: size, tag: "hazard", renderOrder: 2 });
    hazard.addComponent(new RectangleRenderer({ color: Math.random() > 0.5 ? "#ff7a72" : "#ffb36b", stroke: "#ffe0b2" }));
    hazard.addComponent(new MeteorMotion(this, 115 + Math.random() * 100 + this.elapsed * 2));
    this.hazards.push(hazard); this.add(hazard);
  }
  removeHazard(hazard) {
    const index = this.hazards.indexOf(hazard);
    if (index >= 0) this.hazards.splice(index, 1);
    this.remove(hazard);
  }
  finish() {
    if (this.over) return;
    this.over = true; this.best = Math.max(this.best, this.elapsed);
    status.textContent = `Run ended at ${this.elapsed.toFixed(1)}s. Press Restart run to try again.`;
  }
  render(ctx) {
    super.render(ctx);
    ctx.save();
    ctx.fillStyle = "#eaf2ff"; ctx.font = "700 18px system-ui"; ctx.textAlign = "left";
    ctx.fillText(`TIME ${this.elapsed.toFixed(1)}s`, 20, 30);
    if (this.engine?.paused) {
      ctx.fillStyle = "#080d18cc"; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.textAlign = "center"; ctx.font = "800 44px system-ui"; ctx.fillStyle = "#ffffff"; ctx.fillText("PAUSED", WIDTH / 2, HEIGHT / 2);
    } else if (this.over) {
      ctx.fillStyle = "#080d18d9"; ctx.fillRect(0, 0, WIDTH, HEIGHT);
      ctx.textAlign = "center"; ctx.font = "800 42px system-ui"; ctx.fillStyle = "#ffb36b"; ctx.fillText("METEOR HIT!", WIDTH / 2, HEIGHT / 2 - 18);
      ctx.font = "18px system-ui"; ctx.fillStyle = "#eaf2ff"; ctx.fillText("Choose Restart run to play again", WIDTH / 2, HEIGHT / 2 + 24);
    }
    ctx.restore();
  }
}

const canvas = document.querySelector("#game");
const status = document.querySelector("#status");
let engine;
function startGame() {
  engine?.dispose();
  engine = new Engine(canvas, { width: WIDTH, height: HEIGHT, background: "#090f1d", viewport: { autoResize: true, maxDPR: 2 }, audio: false });
  engine.scenes.add("survival", new SurvivalScene());
  engine.start("survival");
  canvas.focus();
  status.textContent = "Dodge the meteors · WASD / arrows · P to pause";
}
document.querySelector("#restart").addEventListener("click", startGame);
canvas.addEventListener("pointerdown", () => canvas.focus());
startGame();
