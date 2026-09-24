const organizationService = require('../services/organizationService');
const { requireOrganizationAccess } = require('../services/authorizationService');
const { ROLES } = require('../config/rbac');

exports.create = async (req, res) => {
    try {
        const requestedType = req.body.type;
        const type = req.identityRole === ROLES.ADMIN
            ? requestedType || 'CUSTOMER'
            : req.identityRole === ROLES.AGGREGATOR
                ? (['RESELLER', 'CUSTOMER'].includes(requestedType) ? requestedType : 'CUSTOMER')
                : 'CUSTOMER';
        const parentId = req.identityRole === ROLES.ADMIN
            ? req.body.parentId || null
            : req.organization.id;
        const org = await organizationService.createOrganization({
            ...req.body,
            type,
            parentId
        });

        // Audit Log
        const auditService = require('../services/auditService');
        await auditService.log({
            action: 'CREATE_ORGANIZATION',
            entity: 'Organization',
            entityId: org.id,
            organizationId: org.id,
            metadata: { name: org.name }
        });

        res.status(201).json(org);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getById = async (req, res) => {
    try {
        await requireOrganizationAccess(req, req.params.id);
        const org = await organizationService.getOrganization(req.params.id);
        if (!org) return res.status(404).json({ error: 'Organization not found' });
        res.json(org);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

exports.listSubOrgs = async (req, res) => {
    try {
        const parentId = req.params.id === 'root' ? null : req.params.id;
        if (parentId) {
            await requireOrganizationAccess(req, parentId);
        } else if (req.identityRole !== ROLES.ADMIN) {
            return res.status(403).json({ error: 'Only administrators can list all organizations' });
        }
        const orgs = await organizationService.listSubOrganizations(parentId);
        res.json(orgs);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

exports.addBalance = async (req, res) => {
    try {
        const { amount, description } = req.body;
        await requireOrganizationAccess(req, req.params.id);
        const org = await organizationService.updateBalance(
            req.params.id,
            amount,
            'CREDIT',
            description
        );

        // Audit Log
        const auditService = require('../services/auditService');
        await auditService.log({
            action: 'UPDATE_BALANCE',
            entity: 'Organization',
            entityId: req.params.id,
            organizationId: req.params.id,
            metadata: { amount, type: 'CREDIT', description }
        });

        res.json(org);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getTransactions = async (req, res) => {
    try {
        await requireOrganizationAccess(req, req.params.id);
        const transactions = await organizationService.getTransactions(
            req.params.id
        );
        res.json(transactions);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};

exports.getReporting = async (req, res) => {
    try {
        await requireOrganizationAccess(req, req.params.id);
        const data = await organizationService.getReportingData(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(error.status || 500).json({ error: error.message });
    }
};
