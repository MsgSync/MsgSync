const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedMultiTenancy() {
    console.log('Seed: Starting Multi-Tenancy Seed...');

    // 1. Create Organization
    const org = await prisma.organization.upsert({
        where: { id: 'acme-id' }, // Use fixed ID for demo predictability
        update: {},
        create: {
            id: 'acme-id',
            name: 'ACME Corp'
        }
    });
    console.log('Seed: Created Organization', org.name);

    // 2. Create API Key for Organization
    const apiKey = await prisma.apiKey.upsert({
        where: { key: 'acme-demo-key' },
        update: {
            organizationId: org.id
        },
        create: {
            key: 'acme-demo-key',
            name: 'ACME Main Key',
            organizationId: org.id
        }
    });
    console.log('Seed: Created API Key linked to Organization');

    // 3. Create a provider if not exists
    await prisma.provider.upsert({
        where: { name: 'mock' },
        update: {},
        create: {
            name: 'mock',
            type: 'mock',
            config: {},
            active: true,
            priority: 1
        }
    });

    console.log('Seed: Multi-Tenancy Seed Complete!');
    console.log('Use API Key: acme-demo-key to test tenant isolation.');
}

seedMultiTenancy()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
