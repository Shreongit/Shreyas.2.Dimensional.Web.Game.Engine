import test from "node:test";
import assert from "node:assert/strict";
import { Viewport } from "../src/graphics/Viewport.js";
import { Camera2D } from "../src/graphics/Camera2D.js";

function canvasFixture(rect = { left: 10, top: 20, width: 800, height: 600 }) {
  return { width: 0, height: 0, style: {}, getBoundingClientRect: () => rect };
}

test("viewport validates logical dimensions and DPR cap", () => {
  const canvas = canvasFixture();
  assert.throws(() => new Viewport(canvas, 0, 100), RangeError);
  assert.throws(() => new Viewport(canvas, 100, 100, { maxDPR: Infinity }), RangeError);
});

test("viewport fits logical resolution with centered letterboxing", () => {
  const canvas = canvasFixture();
  const viewport = new Viewport(canvas, 400, 300, { autoResize: false });
  assert.equal(viewport.scale, 2);
  assert.equal(viewport.offsetX, 0);
  assert.equal(viewport.offsetY, 0);
  const point = viewport.toLogical(20, 30);
  assert.equal(point.x, 5);
  assert.equal(point.y, 5);
  assert.equal(point.inside, true);
  viewport.dispose();
});

test("viewport marks letterbox coordinates outside logical game bounds and round-trips points", () => {
  const canvas = canvasFixture({ left: 0, top: 0, width: 1000, height: 500 });
  const viewport = new Viewport(canvas, 400, 300, { autoResize: false });
  const outside = viewport.toLogical(10, 250);
  assert.equal(outside.inside, false);
  const client = viewport.toClient(120, 90);
  const logical = viewport.toLogical(client.x, client.y);
  assert.ok(Math.abs(logical.x - 120) < 1e-9);
  assert.ok(Math.abs(logical.y - 90) < 1e-9);
  viewport.dispose();
});

test("viewport remains valid when canvas is temporarily zero-sized", () => {
  const canvas = canvasFixture({ left: 0, top: 0, width: 0, height: 0 });
  const viewport = new Viewport(canvas, 320, 180, { autoResize: false });
  assert.equal(canvas.width, 1);
  assert.equal(canvas.height, 1);
  assert.equal(viewport.toLogical(0, 0).inside, false);
  viewport.dispose();
});

test("camera world/screen conversion round-trips with zoom and rotation", () => {
  const camera = new Camera2D({ x: 100, y: -40, zoom: 1.75, rotation: 0.4 });
  const screen = camera.worldToScreen(123, 57, 800, 600);
  const world = camera.screenToWorld(screen.x, screen.y, 800, 600);
  assert.ok(Math.abs(world.x - 123) < 1e-9);
  assert.ok(Math.abs(world.y - 57) < 1e-9);
});
