const axios = require('axios');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Normalizes message data from various sources into a standard format.
 * @param {Object} rawData - The raw message data from the source.
 * @param {string} sourceName - The name of the source (e.g., 'Twilio', 'SendGrid').
 * @param {string} sourceType - The type of source (e.g., 'sms', 'email').
 * @returns {Object} The normalized message object.
 */
function normalizeMessage(rawData, sourceName, sourceType) {
    // Basic normalization logic - this would be more complex in a real app
    let normalized = {
        externalId: null,
        source: sourceName,
        sourceType: sourceType,
        sender: '',
        recipient: '',
        content: '',
        originalPayload: rawData,
        status: 'aggregated'
    };

    if (sourceType === 'sms') {
        normalized.externalId = rawData.sid || rawData.id;
        normalized.sender = rawData.from || rawData.sender;
        normalized.recipient = rawData.to || rawData.recipient;
        normalized.content = rawData.body || rawData.text;
    } else if (sourceType === 'email') {
        normalized.externalId = rawData.messageId;
        normalized.sender = rawData.from;
        normalized.recipient = rawData.to;
        normalized.content = rawData.subject + ': ' + rawData.body;
    } else if (sourceType === 'webhook') {
        normalized.externalId = rawData.id;
        normalized.sender = rawData.sender_id;
        normalized.recipient = rawData.recipient_id;
        normalized.content = rawData.message_text;
    }

    return normalized;
}

/**
 * Aggregates messages from a specific source.
 * @param {Object} source - The source configuration from the database.
 */
async function aggregateFromSource(source) {
    console.log(`Aggregating from source: ${source.name} (${source.type})`);

    try {
    // Determine how to fetch data based on source type and config
    // For now, let's pretend we're fetching from an API endpoint
        const response = await axios.get(source.config.url, {
            headers: source.config.headers || {}
        });

        const rawMessages = response.data; // Assuming it returns an array

        for (const rawMsg of rawMessages) {
            const normalizedMsg = normalizeMessage(rawMsg, source.name, source.type);

            // Save to database
            await prisma.message.upsert({
                where: { externalId: normalizedMsg.externalId },
                update: {
                    status: 'aggregated',
                    originalPayload: normalizedMsg.originalPayload
                },
                create: normalizedMsg
            });
        }

        console.log(
            `Successfully aggregated ${rawMessages.length} messages from ${source.name}`
        );
    } catch (error) {
        console.error(`Error aggregating from ${source.name}:`, error.message);
    }
}

/**
 * Main function to trigger aggregation for all active sources.
 */
async function aggregateAllSources() {
    const activeSources = await prisma.source.findMany({
        where: { active: true }
    });

    for (const source of activeSources) {
        await aggregateFromSource(source);
    }
}

module.exports = {
    normalizeMessage,
    aggregateFromSource,
    aggregateAllSources
};
