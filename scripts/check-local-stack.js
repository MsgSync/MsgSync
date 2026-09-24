const { execSync } = require('child_process');

function run(command) {
  return execSync(command, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim();
}

function main() {
  const checks = [];

  try {
    run('docker compose version');
    checks.push('docker-compose available');
  } catch (error) {
    console.error('Docker Compose is not available in this environment.');
    process.exit(1);
  }

  try {
    const output = run('docker compose ps --services');
    const services = output.split('\n').filter(Boolean);
    checks.push(`services detected: ${services.join(', ')}`);
  } catch (error) {
    console.error('Unable to inspect Docker Compose services.');
    process.exit(1);
  }

  console.log(checks.join('\n'));
}

main();
