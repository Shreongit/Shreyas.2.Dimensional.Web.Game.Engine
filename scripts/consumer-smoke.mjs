
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..'
);

const temp = await fs.mkdtemp(
  path.join(os.tmpdir(), 's2dwge-consumer-')
);

const npmCli = process.env.npm_execpath;

function runNpm(args, options = {}) {
  if (!npmCli) {
    throw new Error(
      'npm_execpath is unavailable. Run this test with npm run test:consumer.'
    );
  }

  return execFileSync(
    process.execPath,
    [npmCli, ...args],
    {
      cwd: root,
      stdio: 'inherit',
      ...options
    }
  );
}

try {
  // Pack the project using npm and capture its JSON output.
  const packedOutput = runNpm(
    ['pack', '--json', '--pack-destination', temp],
    {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'inherit']
    }
  );

  const packResult = JSON.parse(packedOutput);

  // Support array, standard object, and the nested s2dwge format.
  const metadata = Array.isArray(packResult)
    ? packResult[0]
    : packResult.s2dwge ?? Object.values(packResult)[0];

  if (!metadata || typeof metadata.filename !== 'string') {
    throw new Error(
      `npm pack returned unexpected JSON:\n${JSON.stringify(
        packResult,
        null,
        2
      )}`
    );
  }

  const tarball = path.join(temp, metadata.filename);
  const consumer = path.join(temp, 'consumer');

  await fs.mkdir(consumer);

  await fs.writeFile(
    path.join(consumer, 'package.json'),
    JSON.stringify(
      {
        name: 's2dwge-consumer-smoke',
        private: true,
        type: 'module'
      },
      null,
      2
    )
  );

  // Install the packed package into an isolated consumer project.
  runNpm(
    [
      'install',
      '--offline',
      '--ignore-scripts',
      '--no-audit',
      '--no-fund',
      tarball
    ],
    {
      cwd: consumer
    }
  );

  // Import the package's public source entry point.
  const entry = path.join(
    consumer,
    'node_modules',
    's2dwge',
    'src',
    'index.js'
  );

  const api = await import(pathToFileURL(entry).href);

  const required = [
    'Engine',
    'Scene',
    'Entity',
    'Viewport',
    'PhysicsWorld'
  ];

  const missing = required.filter(
    name => !(name in api)
  );

  if (missing.length > 0) {
    throw new Error(
      `Packed consumer API is missing exports: ${missing.join(', ')}`
    );
  }

  console.log(
    `Consumer smoke passed: packed ${metadata.filename}, ` +
    `installed offline, imported ${required.join(', ')}.`
  );
} finally {
  await fs.rm(temp, {
    recursive: true,
    force: true
  });
}
