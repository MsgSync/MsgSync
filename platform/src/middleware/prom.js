const client = require('prom-client');

// Register default metrics
client.collectDefaultMetrics({ prefix: 'msgsync_platform_' });

const httpRequestsTotal = new client.Counter({
    name: 'msgsync_platform_http_requests_total',
    help: 'Total number of HTTP requests',
    labelNames: ['method', 'route', 'status']
});

const httpRequestDurationSeconds = new client.Histogram({
    name: 'msgsync_platform_http_request_duration_seconds',
    help: 'Duration of HTTP requests in seconds',
    labelNames: ['method', 'route', 'status'],
    buckets: [0.1, 0.3, 0.5, 0.7, 1, 3, 5, 7, 10]
});

const messagesProcessedTotal = new client.Counter({
    name: 'msgsync_platform_messages_processed_total',
    help: 'Total number of messages processed by the platform',
    labelNames: ['status', 'provider']
});

module.exports = {
    client,
    middleware: (req, res, next) => {
        const start = Date.now();
        res.on('finish', () => {
            const duration = (Date.now() - start) / 1000;
            const route = req.route ? req.route.path : req.path;

            httpRequestsTotal.inc({
                method: req.method,
                route,
                status: res.statusCode
            });

            httpRequestDurationSeconds.observe({
                method: req.method,
                route,
                status: res.statusCode
            }, duration);
        });
        next();
    },
    trackMessage: (status, provider) => {
        messagesProcessedTotal.inc({ status, provider });
    }
};
