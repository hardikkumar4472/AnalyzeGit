const client = require('prom-client');

// Create a Registry
const register = new client.Registry();

// Enable collection of default Node.js and system metrics
client.collectDefaultMetrics({
    app: 'analyzegit',
    prefix: 'analyzegit_',
    timeout: 10000,
    register
});

// Custom AI Audit Queue Jobs Gauge / Counter
const auditJobsCounter = new client.Counter({
    name: 'analyzegit_audit_jobs_total',
    help: 'Total count of GitHub repository and candidate analysis jobs',
    labelNames: ['status', 'type'],
    registers: [register]
});

module.exports = {
    register,
    auditJobsCounter
};
