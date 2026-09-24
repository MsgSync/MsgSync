const backupService = require('../services/backupService');
const auditService = require('../services/auditService');

exports.exportBackup = async (req, res) => {
    try {
        const backup = await backupService.exportConfiguration();
        await auditService.log({
            action: 'EXPORT_CONFIGURATION_BACKUP',
            entity: 'System',
            entityId: 'configuration',
            userId: req.user?.id || null,
            organizationId: req.organization?.id || 'SYSTEM',
            metadata: { format: backup.format, version: backup.version }
        });
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="msgsync-backup-${Date.now()}.json"`);
        res.status(200).send(JSON.stringify(backup, null, 2));
    } catch (error) {
        res.status(500).json({ status: 'error', message: error.message });
    }
};

exports.validateBackup = async (req, res) => {
    try {
        backupService.validateBackup(req.body);
        res.json({ status: 'success', valid: true });
    } catch (error) {
        res.status(400).json({ status: 'error', valid: false, message: error.message });
    }
};

exports.restoreBackup = async (req, res) => {
    if (req.body?.confirm !== 'RESTORE') {
        return res.status(400).json({
            status: 'error',
            message: 'Explicit RESTORE confirmation is required'
        });
    }

    try {
        const result = await backupService.restoreConfiguration(req.body);
        try {
            await auditService.log({
                action: 'RESTORE_CONFIGURATION_BACKUP',
                entity: 'System',
                entityId: 'configuration',
                userId: req.user?.id || null,
                organizationId: req.organization?.id || 'SYSTEM',
                metadata: result.counts
            });
        } catch {}
        res.json({ status: 'success', data: result });
    } catch (error) {
        res.status(400).json({ status: 'error', message: error.message });
    }
};
