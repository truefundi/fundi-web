// Starts `next dev` and opens the browser once the server is ready.
import { spawn } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const port = process.env.PORT || '3001';
const url = `http://localhost:${port}`;
const nextBin = require.resolve('next/dist/bin/next');

const child = spawn(process.execPath, [nextBin, 'dev', '-p', port], {
  stdio: ['inherit', 'pipe', 'inherit'],
});

let opened = false;

function openBrowser() {
  if (process.platform === 'win32') {
    spawn('cmd', ['/c', 'start', '""', url], { stdio: 'ignore', detached: true });
  } else {
    const cmd = process.platform === 'darwin' ? 'open' : 'xdg-open';
    spawn(cmd, [url], { stdio: 'ignore', detached: true });
  }
}

child.stdout.on('data', (chunk) => {
  process.stdout.write(chunk);
  if (!opened && /Ready in/.test(chunk.toString())) {
    opened = true;
    openBrowser();
  }
});

child.on('exit', (code) => process.exit(code ?? 0));
process.on('SIGINT', () => child.kill('SIGINT'));
