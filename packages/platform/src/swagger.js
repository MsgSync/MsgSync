const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'MsgSync Platform API',
            version: '1.0.0',
            description:
        'The core delivery engine for MsgSync. Unified SMS, OTP, and Campaign Management.',
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
                        status: { type: 'string', enum: ['queued', 'sent', 'failed'] },
                        createdAt: { type: 'string', format: 'date-time' }
                    }
                },
                OTPRequest: {
                    type: 'object',
                    required: ['recipient'],
                    properties: {
                        recipient: { type: 'string' },
                        length: { type: 'integer', default: 6 },
                        ttl: { type: 'integer', default: 300 }
                    }
                }
            }
        },
        security: [{ ApiKeyAuth: [] }]
    },
    apis: ['./src/routes/*.js'] // Path to the API docs
};

const specs = swaggerJsdoc(options);
module.exports = specs;
