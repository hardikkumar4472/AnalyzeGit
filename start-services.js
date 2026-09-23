const { spawn } = require('child_process');
const path = require('path');

const services = [
    { name: 'AUTH', dir: 'services/auth-service', script: 'server.js', port: 5001, color: '\x1b[34m' },
    { name: 'RECRUIT', dir: 'services/recruitment-service', script: 'server.js', port: 5003, color: '\x1b[35m' },
    { name: 'ANALYSIS', dir: 'services/analysis-service', script: 'server.js', port: 5004, color: '\x1b[33m' },
    { name: 'WORKER', dir: 'services/worker-service', script: 'worker.js', port: null, color: '\x1b[36m' },
    { name: 'GATEWAY', dir: 'services/gateway', script: 'server.js', port: process.env.PORT || 5000, color: '\x1b[32m' }
];

const RESET = '\x1b[0m';
const processes = [];

console.log('🚀 Booting AnalyzeGit Microservices Cluster on Render...');

const mongoUri = process.env.MONGO_URI || process.env.MONGODB_URI;
const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

services.forEach(({ name, dir, script, color }) => {
    const cwd = path.join(__dirname, dir);
    const scriptPath = path.join(cwd, script);

    const env = {
        ...process.env,
        MONGO_URI: mongoUri,
        MONGODB_URI: mongoUri,
        REDIS_URL: redisUrl,
        PORT_AUTH: '5001',
        PORT_RECRUITMENT: '5003',
        PORT_ANALYSIS: '5004',
        AUTH_SERVICE_URL: 'http://127.0.0.1:5001',
        RECRUITMENT_SERVICE_URL: 'http://127.0.0.1:5003',
        ANALYSIS_SERVICE_URL: 'http://127.0.0.1:5004'
    };

    const proc = spawn(process.execPath, [scriptPath], {
        cwd,
        env,
        stdio: ['pipe', 'pipe', 'pipe']
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
//testing
