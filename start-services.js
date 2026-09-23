const { spawn } = require('child_process');
const path = require('path');

const services = [
    { name: 'AUTH', dir: 'services/auth-service', color: '\x1b[34m' },
    { name: 'RECRUIT', dir: 'services/recruitment-service', color: '\x1b[35m' },
    { name: 'ANALYSIS', dir: 'services/analysis-service', color: '\x1b[33m' },
    { name: 'WORKER', dir: 'services/worker-service', color: '\x1b[36m' },
    { name: 'GATEWAY', dir: 'services/gateway', color: '\x1b[32m' }
];

const RESET = '\x1b[0m';
const processes = [];

console.log('🚀 Starting AnalyzeGit Microservices Cluster on Render...');

services.forEach(({ name, dir, color }) => {
    const cwd = path.join(__dirname, dir);
    const proc = spawn('npm', ['start'], {
        cwd,
        env: { ...process.env },
        shell: true
    });

    proc.stdout.on('data', (data) => {
        const text = data.toString().trim();
        if (text) {
            text.split('\n').forEach(line => console.log(`${color}[${name}]${RESET} ${line}`));
        }
    });

    proc.stderr.on('data', (data) => {
        const text = data.toString().trim();
        if (text) {
            text.split('\n').forEach(line => console.error(`${color}[${name}]${RESET} ${line}`));
        }
    });

    proc.on('close', (code) => {
        console.log(`${color}[${name}]${RESET} process exited with code ${code}`);
        if (name === 'GATEWAY' && code !== 0) {
            process.exit(code || 1);
        }
    });

    processes.push(proc);
});

// Handle termination signals for graceful container shutdown on Render
['SIGINT', 'SIGTERM'].forEach(sig => {
    process.on(sig, () => {
        console.log(`\n🛑 Received ${sig}, terminating all microservices...`);
        processes.forEach(p => {
            try {
                p.kill();
            } catch (e) {
                // ignore
            }
        });
        process.exit(0);
    });
});
