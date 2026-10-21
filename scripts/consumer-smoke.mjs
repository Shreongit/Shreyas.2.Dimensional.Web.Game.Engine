import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const temp = await fs.mkdtemp(path.join(os.tmpdir(), 's2dwge-consumer-'));

function run(command, args, options = {}) {
  execFileSync(command, args, { cwd: root, stdio: 'inherit', ...options });
}

try {
  const packed = execFileSync('npm', ['pack', '--json', '--pack-destination', temp], {
    cwd: root,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'inherit']
  });
  const [{ filename }] = JSON.parse(packed);
  const tarball = path.join(temp, filename);
  const consumer = path.join(temp, 'consumer');
  await fs.mkdir(consumer);
  await fs.writeFile(path.join(consumer, 'package.json'), JSON.stringify({ name: 's2dwge-consumer-smoke', private: true, type: 'module' }, null, 2));
  run('npm', ['install', '--offline', '--ignore-scripts', '--no-audit', '--no-fund', tarball], { cwd: consumer });

  const entry = path.join(consumer, 'node_modules', 's2dwge', 'src', 'index.js');
  const api = await import(pathToFileURL(entry).href);
  const required = ['Engine', 'Scene', 'Entity', 'Viewport', 'PhysicsWorld'];
  const missing = required.filter((name) => !(name in api));
  if (missing.length) throw new Error(`Packed consumer API is missing exports: ${missing.join(', ')}`);

  console.log(`Consumer smoke passed: packed ${filename}, installed offline, imported ${required.join(', ')}.`);
} finally {
  await fs.rm(temp, { recursive: true, force: true });
}
