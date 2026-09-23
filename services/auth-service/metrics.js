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

// Custom HTTP Request Counter
const httpRequestCounter = new client.Counter({
    name: 'analyzegit_http_requests_total',
    help: 'Total number of HTTP requests processed by AnalyzeGit services',
    labelNames: ['method', 'route', 'status_code', 'service'],
    registers: [register]
});

// Custom HTTP Request Duration Histogram
const httpRequestDurationHistogram = new client.Histogram({
    name: 'analyzegit_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status_code', 'service'],
    buckets: [0.01, 0.05, 0.1, 0.3, 0.5, 1, 2, 5, 10],
    registers: [register]
});

// Custom AI Audit Queue Jobs Gauge / Counter
const auditJobsCounter = new client.Counter({
    name: 'analyzegit_audit_jobs_total',
    help: 'Total count of GitHub repository and candidate analysis jobs',
    labelNames: ['status', 'type'],
    registers: [register]
});

// Express Middleware to measure metrics
const metricsMiddleware = (serviceName = 'service') => {
    return (req, res, next) => {
        if (req.path === '/metrics') {
            return next();
        }

        const start = process.hrtime();

        res.on('finish', () => {
            const diff = process.hrtime(start);
            const durationInSeconds = diff[0] + diff[1] / 1e9;
            const route = req.baseUrl || req.path || 'unknown';

            httpRequestCounter.inc({
                method: req.method,
                route: route,
                status_code: res.statusCode,
                service: serviceName
            });

            httpRequestDurationHistogram.observe({
                method: req.method,
                route: route,
                status_code: res.statusCode,
                service: serviceName
            }, durationInSeconds);
        });

        next();
    };
};

module.exports = {
    register,
    metricsMiddleware,
    httpRequestCounter,
    httpRequestDurationHistogram,
    auditJobsCounter
};
