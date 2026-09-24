const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const BACKUP_VERSION = 1;
const CONFIG_MODELS = [
    'organizations',
    'users',
    'apiKeys',
    'providers',
    'ratePlans',
    'rates',
    'hlrConfigs',
    'contactLists',
    'contacts',
    'campaigns',
    'routingRules',
    'senderIds',
    'bundles',
    'bundleSubscriptions',
    'invoices',
    'transactions',
    'alerts'
];

async function exportConfiguration() {
    const [
        organizations,
        users,
        apiKeys,
        providers,
        ratePlans,
        rates,
        hlrConfigs,
        contactLists,
        contacts,
        campaigns,
        routingRules,
        senderIds,
        bundles,
        bundleSubscriptions,
        invoices,
        transactions,
        alerts
    ] = await Promise.all([
        prisma.organization.findMany(),
        prisma.user.findMany(),
        prisma.apiKey.findMany(),
        prisma.provider.findMany(),
        prisma.ratePlan.findMany(),
        prisma.rate.findMany(),
        prisma.hlrConfig.findMany(),
        prisma.contactList.findMany(),
        prisma.contact.findMany(),
        prisma.campaign.findMany(),
        prisma.routingRule.findMany(),
        prisma.senderId.findMany(),
        prisma.bundle.findMany(),
        prisma.bundleSubscription.findMany(),
        prisma.invoice.findMany(),
        prisma.transaction.findMany(),
        prisma.alert.findMany()
    ]);

    return {
        format: 'msgsync-logical-backup',
        version: BACKUP_VERSION,
        exportedAt: new Date().toISOString(),
        excluded: ['messages', 'auditLogs'],
        data: {
            organizations,
            users,
            apiKeys,
            providers,
            ratePlans,
            rates,
            hlrConfigs,
            contactLists,
            contacts,
            campaigns,
            routingRules,
            senderIds,
            bundles,
            bundleSubscriptions,
            invoices,
            transactions,
            alerts
        }
    };
}

function validateBackup(payload) {
    if (!payload || payload.format !== 'msgsync-logical-backup') {
        throw new Error('Unsupported backup format');
    }
    if (payload.version !== BACKUP_VERSION) {
        throw new Error(`Unsupported backup version: ${payload.version}`);
    }
    if (!payload.data || !Array.isArray(payload.data.organizations) || !Array.isArray(payload.data.users)) {
        throw new Error('Backup is missing organization or user data');
    }
    for (const model of CONFIG_MODELS) {
        if (payload.data[model] !== undefined && !Array.isArray(payload.data[model])) {
            throw new Error(`Backup field ${model} must be an array`);
        }
    }
    return true;
}

async function restoreConfiguration(payload) {
    validateBackup(payload);
    const data = payload.data;
    const orderedDeletes = [
        'alert', 'invoice', 'transaction', 'bundleSubscription', 'campaign',
        'contactList', 'contact', 'senderId', 'rate', 'routingRule', 'provider',
        'hlrConfig', 'apiKey', 'user', 'organization'
    ];
    const orderedCreates = [
        ['organization', data.organizations || []],
        ['user', data.users || []],
        ['apiKey', data.apiKeys || []],
        ['provider', data.providers || []],
        ['ratePlan', data.ratePlans || []],
        ['rate', data.rates || []],
        ['hlrConfig', data.hlrConfigs || []],
        ['contactList', data.contactLists || []],
        ['contact', data.contacts || []],
        ['campaign', data.campaigns || []],
        ['routingRule', data.routingRules || []],
        ['senderId', data.senderIds || []],
        ['bundle', data.bundles || []],
        ['bundleSubscription', data.bundleSubscriptions || []],
        ['invoice', data.invoices || []],
        ['transaction', data.transactions || []],
        ['alert', data.alerts || []]
    ];

    await prisma.$transaction(async (tx) => {
        for (const model of orderedDeletes) {
            await tx[model].deleteMany();
        }
        for (const [model, rows] of orderedCreates) {
            if (rows.length > 0) await tx[model].createMany({ data: rows });
        }
    });

    return {
        restoredAt: new Date().toISOString(),
        counts: Object.fromEntries(orderedCreates.map(([model, rows]) => [model, rows.length]))
    };
}

module.exports = {
    BACKUP_VERSION,
    exportConfiguration,
    validateBackup,
    restoreConfiguration
};
