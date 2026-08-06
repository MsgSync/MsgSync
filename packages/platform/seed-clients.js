const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('Seeding Multi-Level Client Management data...');

    const root = await prisma.organization.create({
        data: {
            name: 'Central Admin',
            type: 'ADMIN',
            balance: 1000.0
        }
    });

    const reseller = await prisma.organization.create({
        data: {
            name: 'Global Reseller Ltd',
            type: 'RESELLER',
            parentId: root.id,
            balance: 500.0
        }
    });

    const client = await prisma.organization.create({
        data: {
            name: 'Local Pizza Shop',
            type: 'CLIENT',
            parentId: reseller.id,
            balance: 50.0
        }
    });

    console.log('Seeding completed:');
    console.log(`- Admin: ${root.name} (${root.id})`);
    console.log(`- Reseller: ${reseller.name} (${reseller.id})`);
    console.log(`- Client: ${client.name} (${client.id})`);

    // Add a few transactions
    await prisma.transaction.createMany({
        data: [
            {
                amount: 1000,
                type: 'CREDIT',
                status: 'COMPLETED',
                description: 'Initial Admin Credit',
                organizationId: root.id
            },
            {
                amount: 500,
                type: 'CREDIT',
                status: 'COMPLETED',
                description: 'Reseller Signup Credit',
                organizationId: reseller.id
            },
            {
                amount: 50,
                type: 'CREDIT',
                status: 'COMPLETED',
                description: 'Client Welcome Bonus',
                organizationId: client.id
            }
        ]
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
