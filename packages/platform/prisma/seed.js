const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding database...');

    // 0. Create a default Organization
    const org = await prisma.organization.upsert({
        where: { id: 'default-org-id' },
        update: {},
        create: {
            id: 'default-org-id',
            name: 'Default Organization'
        }
    });

    // 1. Create a demo API Key
    const demoKey = await prisma.apiKey.upsert({
        where: { key: 'demo-api-key' },
        update: {
            organizationId: org.id
        },
        create: {
            key: 'demo-api-key',
            name: 'Demo App',
            organizationId: org.id
        }
    });
    console.log(`Created/Ensured API Key: ${demoKey.key}`);

    // 2. Create a Mock Provider
    await prisma.provider.upsert({
        where: { name: 'mock-provider' },
        update: {},
        create: {
            name: 'mock-provider',
            type: 'generic-http',
            config: {
                url: 'https://api.mock-provider.com/v1/sms',
                method: 'POST',
                payloadTemplate: {
                    to: '{{recipient}}',
                    text: '{{content}}'
                }
            },
            priority: 1
        }
    });
    console.log('Created/Ensured Mock Provider');

    console.log('Seed completed successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
