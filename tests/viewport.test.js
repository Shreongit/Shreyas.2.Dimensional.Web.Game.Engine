import test from 'node:test';
import assert from 'node:assert/strict';
import { Viewport } from '../src/graphics/Viewport.js';

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
  viewport.dispose();
});

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
