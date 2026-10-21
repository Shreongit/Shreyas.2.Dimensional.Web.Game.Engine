import { performance } from 'node:perf_hooks';
import { Scene, Entity, Collider, PhysicsBody, PhysicsWorld } from '../src/index.js';
const bodyCount = Number(process.env.S2DWGE_BENCH_BODIES ?? 100);
const steps = Number(process.env.S2DWGE_BENCH_STEPS ?? 240);
if (!Number.isInteger(bodyCount) || bodyCount < 1 || bodyCount > 2000 || !Number.isInteger(steps) || steps < 1) throw new RangeError('Use 1–2000 bodies and at least 1 step.');
const world = new PhysicsWorld({ gravityY: 500, cellSize: 64, solverIterations: 4 });
const scene = new Scene('benchmark'); scene.physics = world;
const floor = new Entity({ x: 0, y: 700, width: 4000, height: 40 }); floor.addComponent(new Collider()); scene.add(floor);
for (let i=0;i<bodyCount;i++) { const e=new Entity({x:(i%40)*30,y:Math.floor(i/40)*30,width:20,height:20});e.addComponent(new PhysicsBody());e.addComponent(new Collider());scene.add(e); }
const samples=[];
for(let sample=0;sample<7;sample++){const start=performance.now();for(let i=0;i<steps;i++){for(const e of scene.entities)e.update(1/120);world.step();}samples.push(performance.now()-start);}
const sorted=[...samples.slice(1)].sort((a,b)=>a-b);const report={runtime:process.version,bodies:bodyCount,stepsPerSample:steps,warmupSamples:1,measuredSamples:6,samplesMs:samples.slice(1).map(x=>+x.toFixed(2)),medianMs:+sorted[Math.floor(sorted.length/2)].toFixed(2),heapUsedBytes:process.memoryUsage().heapUsed,rssBytes:process.memoryUsage().rss};
console.log(JSON.stringify(report,null,2));
