const express = require('express');
const dotenv = require('dotenv');
const { triggerAggregation, getSources, addSource, getAnalytics } = require('./controllers/api');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
const { handleWebhook } = require('./controllers/webhooks');

// API Routes
app.post('/api/aggregate', triggerAggregation);
app.get('/api/sources', getSources);
app.post('/api/sources', addSource);
app.get('/api/analytics', getAnalytics);

// Webhook Receiver
app.post('/api/webhooks/:source', handleWebhook);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Start server
if (require.main === module) {
    app.listen(port, () => {
        console.log(`MsgSync Aggregator listening at http://localhost:${port}`);
    });
}

module.exports = app; // For testing
