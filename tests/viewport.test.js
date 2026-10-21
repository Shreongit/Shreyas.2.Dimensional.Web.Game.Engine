import test from 'node:test';
import assert from 'node:assert/strict';
import { Viewport } from '../src/graphics/Viewport.js';

<<<<<<< Updated upstream
// Setup global mock behaviors for headless Node environments
const createMockCanvas = (rect) => ({
  width: 0,
  height: 0,
  style: {},
  getBoundingClientRect: () => rect
});

test('viewport validation - baseline configuration initialization', () => {
  const mockCanvas = createMockCanvas({ left: 0, top: 0, width: 800, height: 600 });
  const viewport = new Viewport(mockCanvas, 400, 300);

  assert.equal(viewport.width, 400);
  assert.equal(viewport.height, 300);
  assert.equal(viewport.disposed, false);
  viewport.dispose();
});

test('viewport validation - backing store buffer scaling under high-DPI (2x Retina)', () => {
  // Mock device layout environment attributes
  globalThis.devicePixelRatio = 2;
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };

  const mockCanvas = createMockCanvas({ left: 10, top: 20, width: 800, height: 600 });
  const viewport = new Viewport(mockCanvas, 400, 300);

  // Layout math evaluations: 800 layout width * 2 DPR = 1600 internal buffer resolution
  assert.equal(mockCanvas.width, 1600);
  assert.equal(mockCanvas.height, 1200);

  viewport.dispose();
  delete globalThis.devicePixelRatio;
  delete globalThis.ResizeObserver;
});

test('viewport validation - maxDPR ceiling constraints handling', () => {
  globalThis.devicePixelRatio = 5; // Simulating extreme screen matrix densities
  globalThis.ResizeObserver = class { observe() {} disconnect() {} };

  const mockCanvas = createMockCanvas({ left: 0, top: 0, width: 800, height: 600 });
  const viewport = new Viewport(mockCanvas, 400, 300, { maxDPR: 3 });

  // Resolution output must clamp to maxDPR value ceiling (800 * 3 = 2400)
  assert.equal(mockCanvas.width, 2400);
  assert.equal(mockCanvas.height, 1800);

  viewport.dispose();
  delete globalThis.devicePixelRatio;
  delete globalThis.ResizeObserver;
});

test('viewport validation - spatial uniform mapping scales and canvas offsets calculation', () => {
  const mockCanvas = createMockCanvas({ left: 0, top: 0, width: 800, height: 600 });
  const viewport = new Viewport(mockCanvas, 400, 300);
  
  let captureArgs = null;
  const mockCtx = {
    setTransform: (...args) => { captureArgs = args; }
  };

  viewport.begin(mockCtx);

  // Engine targets 400x300 canvas layout drawn in a physical 800x600 wrapper -> Uniform scale factor is 2
  assert.equal(viewport.scale, 2);
  assert.deepEqual(captureArgs, [2, 0, 0, 2, 0, 0]);
=======
const createMockCanvas = (initialRect) => {
  let rect = { ...initialRect };
  return {
    width: 0,
    height: 0,
    style: {},
    getBoundingClientRect: () => ({ ...rect }),
    setRect: (nextRect) => { rect = { ...nextRect }; }
  };
};

// Keep each test isolated even when an assertion fails. Preserve pre-existing
// global descriptors instead of deleting globals supplied by another runner.
async function withBrowserGlobals({ dpr = 1, ResizeObserverMock = class { observe() {} disconnect() {} } } = {}, run) {
  const descriptors = new Map();
  for (const key of ['devicePixelRatio', 'ResizeObserver']) {
    descriptors.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
  }
  Object.defineProperty(globalThis, 'devicePixelRatio', { configurable: true, writable: true, value: dpr });
  Object.defineProperty(globalThis, 'ResizeObserver', { configurable: true, writable: true, value: ResizeObserverMock });
  try {
    await run();
  } finally {
    for (const [key, descriptor] of descriptors) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else delete globalThis[key];
    }
  }
}

test('viewport initializes logical dimensions and disposes idempotently', () => {
  const canvas = createMockCanvas({ left: 0, top: 0, width: 800, height: 600 });
  const viewport = new Viewport(canvas, 400, 300, { autoResize: false });
  assert.equal(viewport.width, 400);
  assert.equal(viewport.height, 300);
  assert.equal(viewport.disposed, false);
>>>>>>> Stashed changes
  viewport.dispose();
  viewport.dispose();
  assert.equal(viewport.disposed, true);
});

<<<<<<< Updated upstream
test('viewport validation - pixel coordinate transformation math', () => {
  const mockCanvas = createMockCanvas({ left: 10, top: 10, width: 800, height: 600 });
  const viewport = new Viewport(mockCanvas, 400, 300);

  // Simulating a click at the absolute physical center of the canvas component wrapper matrix
  const logicalCoords = viewport.toLogical(410, 310);
  
  assert.equal(logicalCoords.x, 200);
  assert.equal(logicalCoords.y, 150);
  assert.equal(logicalCoords.inside, true);
  viewport.dispose();
});
=======
test('viewport scales the backing store for a 2x device pixel ratio', async () => {
  await withBrowserGlobals({ dpr: 2 }, () => {
    const canvas = createMockCanvas({ left: 10, top: 20, width: 800, height: 600 });
    const viewport = new Viewport(canvas, 400, 300, { autoResize: false });
    try {
      assert.equal(canvas.width, 1600);
      assert.equal(canvas.height, 1200);
      assert.equal(viewport.scale, 4, 'render transform is expressed in backing-store pixels');
    } finally { viewport.dispose(); }
  });
});

test('viewport clamps high device pixel ratios to maxDPR', async () => {
  await withBrowserGlobals({ dpr: 5 }, () => {
    const canvas = createMockCanvas({ left: 0, top: 0, width: 800, height: 600 });
    const viewport = new Viewport(canvas, 400, 300, { maxDPR: 3, autoResize: false });
    try {
      assert.equal(canvas.width, 2400);
      assert.equal(canvas.height, 1800);
      assert.equal(viewport.scale, 6);
    } finally { viewport.dispose(); }
  });
});

test('viewport letterboxes wide layouts and applies the expected context transform', () => {
  const canvas = createMockCanvas({ left: 0, top: 0, width: 1000, height: 500 });
  const viewport = new Viewport(canvas, 400, 300, { autoResize: false });
  try {
    let transform;
    viewport.begin({ setTransform: (...args) => { transform = args; } });
    assert.equal(viewport.scale, 500 / 300);
    assert.ok(Math.abs(viewport.offsetX - (1000 - 400 * viewport.scale) / 2) < 1e-9);
    assert.equal(viewport.offsetY, 0);
    assert.deepEqual(transform, [viewport.scale, 0, 0, viewport.scale, viewport.offsetX, viewport.offsetY]);
  } finally { viewport.dispose(); }
});

test('client coordinates map to logical coordinates using the CSS rectangle', () => {
  const canvas = createMockCanvas({ left: 10, top: 10, width: 800, height: 600 });
  const viewport = new Viewport(canvas, 400, 300, { autoResize: false });
  try {
    assert.deepEqual(viewport.toLogical(410, 310), { x: 200, y: 150, inside: true });
  } finally { viewport.dispose(); }
});

test('letterbox coordinates are reported outside the logical game area', () => {
  const canvas = createMockCanvas({ left: 20, top: 30, width: 1000, height: 500 });
  const viewport = new Viewport(canvas, 400, 300, { autoResize: false });
  try {
    const inLetterbox = viewport.toLogical(25, 280);
    assert.equal(inLetterbox.inside, false);
    const center = viewport.toLogical(520, 280);
    assert.equal(center.inside, true);
    assert.ok(Math.abs(center.x - 200) < 1e-9);
    assert.ok(Math.abs(center.y - 150) < 1e-9);
  } finally { viewport.dispose(); }
});

test('toClient and toLogical round-trip at high DPI', async () => {
  await withBrowserGlobals({ dpr: 2 }, () => {
    const canvas = createMockCanvas({ left: 40, top: 25, width: 800, height: 600 });
    const viewport = new Viewport(canvas, 400, 300, { autoResize: false });
    try {
      const client = viewport.toClient(123.5, 87.25);
      const logical = viewport.toLogical(client.x, client.y);
      assert.ok(Math.abs(logical.x - 123.5) < 1e-9);
      assert.ok(Math.abs(logical.y - 87.25) < 1e-9);
      assert.equal(logical.inside, true);
    } finally { viewport.dispose(); }
  });
});

test('zero-sized canvas keeps a valid backing store and recovers after resize', () => {
  const canvas = createMockCanvas({ left: 0, top: 0, width: 0, height: 0 });
  const viewport = new Viewport(canvas, 400, 300, { autoResize: false });
  try {
    assert.equal(canvas.width, 1);
    assert.equal(canvas.height, 1);
    canvas.setRect({ left: 0, top: 0, width: 800, height: 600 });
    viewport.resize();
    assert.equal(canvas.width, 800);
    assert.equal(canvas.height, 600);
    assert.equal(viewport.scale, 2);
  } finally { viewport.dispose(); }
});

test('viewport disconnects ResizeObserver on disposal', async () => {
  let instances = 0;
  let disconnects = 0;
  class ResizeObserverMock {
    constructor(callback) { this.callback = callback; instances += 1; }
    observe() {}
    disconnect() { disconnects += 1; }
  }
  await withBrowserGlobals({ ResizeObserverMock }, () => {
    const viewport = new Viewport(createMockCanvas({ left: 0, top: 0, width: 800, height: 600 }), 400, 300);
    assert.equal(instances, 1);
    viewport.dispose();
    viewport.dispose();
    assert.equal(disconnects, 1);
  });
});

test('viewport rejects invalid logical dimensions and maxDPR', () => {
  const canvas = createMockCanvas({ left: 0, top: 0, width: 800, height: 600 });
  assert.throws(() => new Viewport(canvas, 0, 300), RangeError);
  assert.throws(() => new Viewport(canvas, 400, 300, { maxDPR: 0 }), RangeError);
});
>>>>>>> Stashed changes
