const MsgSyncClient = require('@msgsync/sdk');
const dotenv = require('dotenv');

dotenv.config();

/**
 * Service to sync aggregated messages to the main MsgSync Platform.
 */
class SyncService {
    constructor() {
        this.client = new MsgSyncClient({
            apiKey: process.env.MSGSYNC_PLATFORM_API_KEY || 'demo-api-key',
            baseUrl: process.env.MSGSYNC_PLATFORM_URL || 'http://localhost:3001/api'
        });
    }

    /**
     * Syncs a normalized message to the Platform.
     * @param {Object} message - The normalized record from Aggregator DB.
     */
    async syncToPlatform(message) {
        console.log(`Syncing aggregated message ${message.id} to platform...`);

        try {
            const result = await this.client.sendMessage({
                recipient: message.recipient,
                content: `(Aggregated from ${message.source}) ${message.content}`,
                metadata: {
                    source_aggregator_id: message.id,
                    original_sender: message.sender,
                    source_type: message.sourceType
                }
            });

            console.log(`Successfully synced to platform. MsgID: ${result.data.id}`);
            return result;
        } catch (error) {
            console.error('Sync failed:', error.message);
            throw error;
        }
    }
}

module.exports = new SyncService();
