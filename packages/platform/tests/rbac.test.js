const { ROLES, PERMISSIONS, permissionsForRole } = require('../src/config/rbac');
const { authorize } = require('../src/middleware/rbac');

describe('RBAC policy', () => {
    it('gives administrators every permission', () => {
        expect(permissionsForRole(ROLES.ADMIN)).toEqual(expect.arrayContaining(Object.values(PERMISSIONS)));
    });

    it('allows aggregators to manage customers but not providers', () => {
        const permissions = permissionsForRole(ROLES.AGGREGATOR);
        expect(permissions).toContain(PERMISSIONS.ORGANIZATION_MANAGE);
        expect(permissions).not.toContain(PERMISSIONS.PROVIDER_MANAGE);
    });

    it('allows resellers to manage customers but not global routing', () => {
        const permissions = permissionsForRole(ROLES.RESELLER);
        expect(permissions).toContain(PERMISSIONS.ORGANIZATION_MANAGE);
        expect(permissions).not.toContain(PERMISSIONS.ROUTING_MANAGE);
    });

    it('limits customers to self-service SMS and billing permissions', () => {
        const permissions = permissionsForRole(ROLES.CUSTOMER);
        expect(permissions).toContain(PERMISSIONS.SMS_SEND);
        expect(permissions).toContain(PERMISSIONS.INVOICE_READ);
        expect(permissions).not.toContain(PERMISSIONS.ORGANIZATION_MANAGE);
        expect(permissions).not.toContain(PERMISSIONS.USER_MANAGE);
    });

    it('rejects requests without the required permission', () => {
        const req = { permissions: [PERMISSIONS.SMS_SEND] };
        const res = { status: jest.fn().mockReturnThis(), json: jest.fn().mockReturnThis() };
        const next = jest.fn();

        authorize(PERMISSIONS.PROVIDER_MANAGE)(req, res, next);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(next).not.toHaveBeenCalled();
    });
});
