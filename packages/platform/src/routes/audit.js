const express = require('express');
const router = express.Router();
const auditController = require('../controllers/audit');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');

router.use(authenticate);
router.get('/', authorize(PERMISSIONS.AUDIT_READ), auditController.getLogs);

module.exports = router;
