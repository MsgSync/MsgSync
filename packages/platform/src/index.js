const express = require('express');
const dotenv = require('dotenv');
const messageRoutes = require('./routes/messages');
const analyticsRoutes = require('./routes/analytics');
const otpRoutes = require('./routes/otp');
const bulkRoutes = require('./routes/bulk');
const organizationRoutes = require('./routes/organizations');
const bundleRoutes = require('./routes/bundles');
const rateRoutes = require('./routes/rates');
const dynamicRoutingRoutes = require('./routes/routing');
const lookupRoutes = require('./routes/lookups');
const brandingRoutes = require('./routes/branding');
const authRoutes = require('./routes/auth');
const auditRoutes = require('./routes/audit');
const invoiceRoutes = require('./routes/invoices');
const securityRoutes = require('./routes/security');
const requestLogger = require('./middleware/logger');

// Load environment variables
dotenv.config();

const app = express();
const port = process.env.PORT || 3001; // Default to 3001 to avoid conflict with aggregator

const path = require('path');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./swagger');

app.use(requestLogger);
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// API Documentation
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Auth & Login Route
app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/login-2fa', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login-2fa.html'));
});

// Dashboard Route
app.get('/dashboard', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
});

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', component: 'platform' });
});

// Real-time Analytics Route
app.get('/analytics', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'analytics.html'));
});

// Campaigns Route
app.get('/campaigns', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'campaigns.html'));
});

// Clients & Resellers Route
app.get('/clients', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'clients.html'));
});

// Billing & Payments Route
app.get('/billing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'billing.html'));
});

// Bundles & Packages Route
app.get('/bundles', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'bundles.html'));
});

// Coverage & Rates Route
app.get('/coverage', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'coverage.html'));
});

// Intelligent Routing Route
app.get('/routing', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'routing.html'));
});

// Security & Anti-Fraud Route
app.get('/security', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'security.html'));
});

// HLR & Number Lookup Route
app.get('/lookups', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'lookups.html'));
});

// Branding & Settings Route
app.get('/settings', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'settings.html'));
});

// Audit Logs Route
app.get('/audits', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'audits.html'));
});

// API Routes
app.use('/api/messages', messageRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/otp', otpRoutes);
app.use('/api/bulk', bulkRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/bundles', bundleRoutes);
app.use('/api/network', rateRoutes);
app.use('/api/routing', dynamicRoutingRoutes);
app.use('/api/lookups', lookupRoutes);
app.use('/api/branding', brandingRoutes);
app.use('/api/audit', auditRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/security', securityRoutes);

// Health check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', component: 'platform' });
});

// Start server
if (require.main === module) {
    app.listen(port, () => {
        console.log(`MsgSync Platform listening at http://localhost:${port}`);
    });
}

module.exports = app;
