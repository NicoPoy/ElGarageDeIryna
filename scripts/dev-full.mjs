import { spawn } from 'node:child_process';

const commands = [
  {
    name: 'api',
    command: 'E:\\DESARROLLO\\Herramientas\\Python\\python.exe',
    args: ['-m', 'backend.local_server']
  },
  {
    name: 'front',
    command: 'vite',
    args: ['--host', 'localhost']
  }
];

const children = commands.map(({ name, command, args }) => {
  const child = spawn(command, args, {
    cwd: process.cwd(),
    env: process.env,
    shell: true,
    stdio: ['inherit', 'pipe', 'pipe']
  });

  child.stdout.on('data', (data) => process.stdout.write(`[${name}] ${data}`));
  child.stderr.on('data', (data) => process.stderr.write(`[${name}] ${data}`));
  child.on('exit', (code) => {
    if (code) {
      console.error(`[${name}] termino con codigo ${code}`);
      shutdown(code);
    }
  });

  return child;
});

function shutdown(code = 0) {
  for (const child of children) {
    if (!child.killed) child.kill();
  }
  process.exit(code);
}

process.on('SIGINT', () => shutdown(0));
process.on('SIGTERM', () => shutdown(0));
