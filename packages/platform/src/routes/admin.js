const express = require('express');
const router = express.Router();
const backupController = require('../controllers/backup');
const authenticate = require('../middleware/auth');
const { requireRole } = require('../middleware/rbac');
const { ROLES } = require('../config/rbac');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);
router.use(requireRole(ROLES.ADMIN));

router.get('/backups/export', backupController.exportBackup);
router.post('/backups/validate', backupController.validateBackup);
router.post('/backups/restore', backupController.restoreBackup);

module.exports = router;
