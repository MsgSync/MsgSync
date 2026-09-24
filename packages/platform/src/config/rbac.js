const ROLES = Object.freeze({
    ADMIN: 'ADMIN',
    AGGREGATOR: 'AGGREGATOR',
    RESELLER: 'RESELLER',
    CUSTOMER: 'CUSTOMER'
});

const PERMISSIONS = Object.freeze({
    SMS_SEND: 'sms:send',
    SMS_READ: 'sms:read',
    SMS_WRITE: 'sms:write',
    BULK_READ: 'bulk:read',
    BULK_WRITE: 'bulk:write',
    CONTACT_MANAGE: 'contacts:manage',
    RATE_READ: 'rates:read',
    RATE_MANAGE: 'rates:manage',
    ROUTING_READ: 'routing:read',
    ROUTING_MANAGE: 'routing:manage',
    PROVIDER_READ: 'providers:read',
    PROVIDER_MANAGE: 'providers:manage',
    ORGANIZATION_READ: 'organizations:read',
    ORGANIZATION_MANAGE: 'organizations:manage',
    BALANCE_MANAGE: 'organizations:balance',
    INVOICE_READ: 'invoices:read',
    INVOICE_MANAGE: 'invoices:manage',
    USER_MANAGE: 'users:manage',
    AUDIT_READ: 'audit:read',
    ANALYTICS_READ: 'analytics:read'
});

const ROLE_PERMISSIONS = Object.freeze({
    [ROLES.ADMIN]: Object.freeze(Object.values(PERMISSIONS)),
    [ROLES.AGGREGATOR]: Object.freeze([
        PERMISSIONS.SMS_SEND,
        PERMISSIONS.SMS_READ,
        PERMISSIONS.SMS_WRITE,
        PERMISSIONS.BULK_READ,
        PERMISSIONS.BULK_WRITE,
        PERMISSIONS.CONTACT_MANAGE,
        PERMISSIONS.RATE_READ,
        PERMISSIONS.RATE_MANAGE,
        PERMISSIONS.ROUTING_READ,
        PERMISSIONS.ROUTING_MANAGE,
        PERMISSIONS.PROVIDER_READ,
        PERMISSIONS.ORGANIZATION_READ,
        PERMISSIONS.ORGANIZATION_MANAGE,
        PERMISSIONS.BALANCE_MANAGE,
        PERMISSIONS.INVOICE_READ,
        PERMISSIONS.INVOICE_MANAGE,
        PERMISSIONS.USER_MANAGE,
        PERMISSIONS.AUDIT_READ,
        PERMISSIONS.ANALYTICS_READ
    ]),
    [ROLES.RESELLER]: Object.freeze([
        PERMISSIONS.SMS_SEND,
        PERMISSIONS.SMS_READ,
        PERMISSIONS.SMS_WRITE,
        PERMISSIONS.BULK_READ,
        PERMISSIONS.BULK_WRITE,
        PERMISSIONS.CONTACT_MANAGE,
        PERMISSIONS.RATE_READ,
        PERMISSIONS.RATE_MANAGE,
        PERMISSIONS.ROUTING_READ,
        PERMISSIONS.ORGANIZATION_READ,
        PERMISSIONS.ORGANIZATION_MANAGE,
        PERMISSIONS.BALANCE_MANAGE,
        PERMISSIONS.INVOICE_READ,
        PERMISSIONS.USER_MANAGE,
        PERMISSIONS.AUDIT_READ,
        PERMISSIONS.ANALYTICS_READ
    ]),
    [ROLES.CUSTOMER]: Object.freeze([
        PERMISSIONS.SMS_SEND,
        PERMISSIONS.SMS_READ,
        PERMISSIONS.SMS_WRITE,
        PERMISSIONS.BULK_READ,
        PERMISSIONS.BULK_WRITE,
        PERMISSIONS.CONTACT_MANAGE,
        PERMISSIONS.RATE_READ,
        PERMISSIONS.ORGANIZATION_READ,
        PERMISSIONS.INVOICE_READ,
        PERMISSIONS.ANALYTICS_READ
    ])
});

function normalizeRole(role, organizationType) {
    if (Object.values(ROLES).includes(role)) return role;
    if (organizationType === 'ADMIN') return ROLES.ADMIN;
    if (organizationType === 'AGGREGATOR') return ROLES.AGGREGATOR;
    if (organizationType === 'RESELLER') return ROLES.RESELLER;
    return ROLES.CUSTOMER;
}

function permissionsForRole(role) {
    return ROLE_PERMISSIONS[normalizeRole(role)] || [];
}

module.exports = {
    ROLES,
    PERMISSIONS,
    ROLE_PERMISSIONS,
    normalizeRole,
    permissionsForRole
};
