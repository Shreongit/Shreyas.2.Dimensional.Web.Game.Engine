#!/usr/bin/env python3
"""Local Chromium validation runner. Requires Python Playwright and a Chromium executable."""
import json, os, sys, time
from playwright.sync_api import sync_playwright

BASE = os.environ.get("S2DWGE_BASE_URL", "http://127.0.0.1:8765")
CHROMIUM = os.environ.get("CHROMIUM_PATH", "/usr/bin/chromium")
configurations = [(800, 600, 1), (1365, 768, 1), (1920, 1080, 1), (390, 844, 2), (1440, 900, 3)]
summary = {"browser": "Chromium", "runs": [], "errors": []}
with sync_playwright() as p:
    browser = p.chromium.launch(headless=True, executable_path=CHROMIUM, args=["--no-sandbox", "--disable-dev-shm-usage"])
    for width, height, dpr in configurations:
        context = browser.new_context(viewport={"width": width, "height": height}, device_scale_factor=dpr)
        page = context.new_page()
        page_errors = []
        page.on("pageerror", lambda exc: page_errors.append(str(exc)))
        page.goto(f"{BASE}/scripts/browser/validation.html", wait_until="load")
        page.wait_for_function("document.documentElement.dataset.validation !== undefined", timeout=15000)
        data = json.loads(page.locator("#results").inner_text())
        data["requestedViewport"] = {"width": width, "height": height, "dpr": dpr}
        data["pageErrors"] = page_errors
        summary["runs"].append(data)
        if data["failed"] or page_errors:
            summary["errors"].append({"viewport": data["requestedViewport"], "failed": data["failed"], "pageErrors": page_errors})
        context.close()
    # Repeatable workload benchmark: report, don't enforce machine-specific thresholds.
    context = browser.new_context(viewport={"width": 1280, "height": 720}, device_scale_factor=1)
    page = context.new_page()
    page.goto(f"{BASE}/scripts/browser/validation.html", wait_until="load")
    page.wait_for_function("document.documentElement.dataset.validation !== undefined")
    benchmark = page.evaluate("""async () => {
      const { PhysicsWorld, Scene, Entity, Collider, PhysicsBody } = await import('/src/index.js');
      const samples=[]; let bodyCount=100; const world=new PhysicsWorld({gravityY:500,cellSize:64,solverIterations:4}); const scene=new Scene('benchmark');scene.physics=world;
      const floor=new Entity({x:0,y:700,width:4000,height:40});floor.addComponent(new Collider());scene.add(floor);
      for(let i=0;i<bodyCount;i++){const e=new Entity({x:(i%20)*30,y:Math.floor(i/20)*30,width:20,height:20});e.addComponent(new PhysicsBody());e.addComponent(new Collider());scene.add(e)}
      for(let sample=0;sample<5;sample++){const t=performance.now();for(let step=0;step<240;step++){for(const e of scene.entities)e.update(1/120);world.step()}samples.push(performance.now()-t)}
      const sorted=[...samples].sort((a,b)=>a-b);return {bodies:bodyCount,stepsPerSample:240,samplesMs:samples.map(v=>+v.toFixed(2)),medianMs:+sorted[2].toFixed(2),heapUsedBytes:performance.memory?.usedJSHeapSize??null,heapLimitBytes:performance.memory?.jsHeapSizeLimit??null};
    }""")
    summary["benchmark"] = benchmark
    browser.close()
print(json.dumps(summary, indent=2))
if summary["errors"]: sys.exit(1)
