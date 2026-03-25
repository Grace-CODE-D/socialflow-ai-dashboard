import { spawnSync } from 'child_process';
import path from 'path';

const backendPath = path.resolve(__dirname, '../backend');

const buildResult = spawnSync('npm', ['run', 'build'], {
  cwd: backendPath,
  stdio: 'inherit',
  shell: true,
});

if (buildResult.status !== 0) {
  process.exit(buildResult.status ?? 1);
}

const runResult = spawnSync('npm', ['run', 'data-pruning:run'], {
  cwd: backendPath,
  stdio: 'inherit',
  shell: true,
});

process.exit(runResult.status ?? 1);
