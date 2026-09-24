const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const routingService = require('./routingService');

/**
 * Service to handle interaction with SMS providers.
 */
class ProviderService {
    /**
   * Selects a list of optimal providers for failover.
   */
    async selectProviders(message) {
        return await routingService.getOptimalProviders(
            message.recipient,
            message.organizationId
        );
    }

    /**
   * Delivers a message with automatic failover support.
   */
    async deliverWithFailover(message) {
        const providers = await this.selectProviders(message);
        let lastError = 'No providers available';

        for (const provider of providers) {
            try {
                const result = await this.deliver(message, provider);
                if (result.success) {
                    return { ...result, providerUsed: provider.name };
                }
                lastError = result.error || 'Unknown provider error';
                console.warn(
                    `Provider ${provider.name} failed for message ${message.id}: ${lastError}. Trying next...`
                );
            } catch (e) {
                lastError = e.message;
                console.error(
                    `Critical error with provider ${provider.name}: ${lastError}`
                );
            }
        }

        return {
            success: false,
            externalId: null,
            error: `All providers failed. Last error: ${lastError}`
        };
    }

    /**
   * Delivers a message through the selected provider.
   */
    async deliver(message, provider) {
        console.log(
            `Delivering message ${message.id} via ${provider.name} (${provider.type})`
        );

        if (provider.type === 'twilio') {
            const TwilioProvider = require('./providers/twilio');
            const twilioProvider = new TwilioProvider(provider.config);
            return await twilioProvider.send(message);
        }

        if (provider.type === 'smpp') {
            const SMPPProvider = require('./providers/smpp');
            const smppProvider = new SMPPProvider(provider.config);
            try {
                await smppProvider.connect();
                const result = await smppProvider.sendMessage(
                    message.recipient,
                    message.content,
                    message.id
                );
                await smppProvider.disconnect();
                return {
                    success: result.success,
                    externalId: result.externalId,
                    error: null
                };
            } catch (error) {
                return {
                    success: false,
                    externalId: null,
                    error: error.message
                };
            }
        }

        if (provider.type === 'ss7') {
            const SS7Provider = require('./providers/ss7');
            const ss7Provider = new SS7Provider(provider.config);
            try {
                await ss7Provider.connect();
                const result = await ss7Provider.sendMessage(
                    message.recipient,
                    message.content,
                    message.id
                );
                await ss7Provider.disconnect();
                return {
                    success: result.success,
                    externalId: result.externalId,
                    error: null
                };
            } catch (error) {
                return {
                    success: false,
                    externalId: null,
                    error: error.message
                };
            }
        }

        if (provider.type === 'generic-http') {
            const GenericHttpProvider = require('./providers/generic-http');
            const httpProvider = new GenericHttpProvider(provider.config);
            return await httpProvider.send(message);
        }

        // Fallback for mock/demo
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));

        // For demonstration, we'll simulate a 90% success rate
        const isSuccess = Math.random() > 0.1;

        if (isSuccess) {
            return {
                success: true,
                externalId: `mock_${Math.random().toString(36).substring(7)}`,
                error: null
            };
        } else {
            return {
                success: false,
                externalId: null,
                error: 'Simulated mock provider failure'
            };
        }
    }
}

module.exports = new ProviderService();
