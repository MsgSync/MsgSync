const organizationService = require('../services/organizationService');

exports.create = async (req, res) => {
    try {
        const org = await organizationService.createOrganization(req.body);

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
        const org = await organizationService.getOrganization(req.params.id);
        if (!org) return res.status(404).json({ error: 'Organization not found' });
        res.json(org);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.listSubOrgs = async (req, res) => {
    try {
        const parentId = req.params.id === 'root' ? null : req.params.id;
        const orgs = await organizationService.listSubOrganizations(parentId);
        res.json(orgs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.addBalance = async (req, res) => {
    try {
        const { amount, description } = req.body;
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
        const transactions = await organizationService.getTransactions(
            req.params.id
        );
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getReporting = async (req, res) => {
    try {
        const data = await organizationService.getReportingData(req.params.id);
        res.json(data);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
