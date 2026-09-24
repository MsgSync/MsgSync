const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MsgSync Platform API',
            version: '1.0.0',
            description:
                'The core delivery engine for MsgSync. Unified SMS, OTP, Campaign Management, Security, Observability, and Telecom Infrastructure.',
            contact: {
                name: 'MsgSync Support',
                url: 'https://msgsync.com/support'
            }
        },
        servers: [
            {
                url: 'http://localhost:3001/api',
                description: 'Development server'
            }
        ],
        components: {
            securitySchemes: {
                ApiKeyAuth: {
                    type: 'apiKey',
                    in: 'header',
                    name: 'X-API-Key',
                    description: 'Access the API using your platform key.'
                }
            },
            schemas: {
                Message: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        recipient: { type: 'string', example: '+15550001122' },
                        content: { type: 'string', example: 'Hello World!' },
                        status: { type: 'string', enum: ['queued', 'sending', 'sent', 'delivered', 'failed'] },
                        provider: { type: 'string', nullable: true },
                        externalId: { type: 'string', nullable: true },
                        error: { type: 'string', nullable: true },
                        cost: { type: 'number' },
                        price: { type: 'number' },
                        createdAt: { type: 'string', format: 'date-time' },
                        sentAt: { type: 'string', format: 'date-time', nullable: true },
                        deliveredAt: { type: 'string', format: 'date-time', nullable: true }
                    }
                },
                Campaign: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        template: { type: 'string' },
                        senderId: { type: 'string', nullable: true },
                        status: { type: 'string', enum: ['draft', 'active', 'paused', 'completed'] },
                        contactListId: { type: 'string' },
                        apiKeyId: { type: 'string' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Provider: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string' },
                        active: { type: 'boolean' },
                        priority: { type: 'integer' },
                        weight: { type: 'number' },
                        costPerSms: { type: 'number' },
                        supportedPrefixes: { type: 'array', items: { type: 'string' } },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Organization: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string' },
                        balance: { type: 'number' },
                        maxDailySpend: { type: 'number' },
                        allowedCountries: { type: 'array', items: { type: 'string' } },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Invoice: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        number: { type: 'string' },
                        amount: { type: 'number' },
                        total: { type: 'number' },
                        currency: { type: 'string' },
                        status: { type: 'string' },
                        dueDate: { type: 'string', format: 'date-time' },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                Alert: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        name: { type: 'string' },
                        type: { type: 'string' },
                        threshold: { type: 'number' },
                        status: { type: 'string', enum: ['TRIGGERED', 'OK', 'ACKNOWLEDGED'] },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                AuditLog: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        action: { type: 'string' },
                        entity: { type: 'string' },
                        entityId: { type: 'string' },
                        userId: { type: 'string', nullable: true },
                        organizationId: { type: 'string' },
                        ipAddress: { type: 'string', nullable: true },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                AnalyticsStats: {
                    type: 'object',
                    properties: {
                        total: { type: 'integer' },
                        sent: { type: 'integer' },
                        failed: { type: 'integer' },
                        queued: { type: 'integer' },
                        sending: { type: 'integer' },
                        delivered: { type: 'integer' },
                        successRate: { type: 'number' }
                    }
                },
                FinancialStats: {
                    type: 'object',
                    properties: {
                        revenue: { type: 'number' },
                        cost: { type: 'number' },
                        profit: { type: 'number' },
                        margin: { type: 'number' },
                        messageCount: { type: 'integer' },
                        profileBreakdown: {
                            type: 'array',
                            items: { type: 'object', properties: { profile: { type: 'string' }, revenue: { type: 'number' } } }
                        }
                    }
                },
                CurrentUser: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        email: { type: 'string' },
                        name: { type: 'string', nullable: true },
                        organization: { type: 'object' },
                        twoFactorEnabled: { type: 'boolean' }
                    }
                }
            }
        },
        security: [{ ApiKeyAuth: [] }]
    },
    apis: ['./src/routes/*.js']
};

const specs = swaggerJsdoc(options);
module.exports = specs;
