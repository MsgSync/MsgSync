const { aggregateAllSources } = require('../services/aggregator');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Triggers manual aggregation for all active sources.
 */
async function triggerAggregation(req, res) {
    try {
    // This could be asynchronous to return 202 Accepted
        await aggregateAllSources();
        res
            .status(200)
            .json({
                status: 'success',
                message: 'Aggregation triggered successfully'
            });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Lists all configured message sources.
 */
async function getSources(req, res) {
    try {
        const sources = await prisma.source.findMany();
        res.status(200).json({ status: 'success', data: sources });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Adds a new message source.
 */
async function addSource(req, res) {
    const { name, type, config } = req.body;

    if (!name || !type || !config) {
        return res
            .status(400)
            .json({
                status: 'error',
                message: 'Missing required fields: name, type, config'
            });
    }

    try {
        const newSource = await prisma.source.create({
            data: { name, type, config }
        });
        res.status(201).json({ status: 'success', data: newSource });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

/**
 * Provides basic analytics/summary of aggregated messages.
 */
async function getAnalytics(req, res) {
    try {
        const totalMessages = await prisma.message.count();
        const messagesBySource = await prisma.message.groupBy({
            by: ['source'],
            _count: {
                _all: true
            }
        });

        const messagesByType = await prisma.message.groupBy({
            by: ['sourceType'],
            _count: {
                _all: true
            }
        });

        res.status(200).json({
            status: 'success',
            data: {
                totalMessages,
                messagesBySource,
                messagesByType
            }
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
}

module.exports = {
    triggerAggregation,
    getSources,
    addSource,
    getAnalytics
};
