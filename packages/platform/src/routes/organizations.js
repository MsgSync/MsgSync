const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizations');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

router.post('/', authorize(PERMISSIONS.ORGANIZATION_MANAGE), organizationController.create);
router.get('/:id', authorize(PERMISSIONS.ORGANIZATION_READ), organizationController.getById);
router.patch('/:id/billing-settings', authorize(PERMISSIONS.ORGANIZATION_MANAGE), organizationController.updateBillingSettings);
router.get('/:id/sub-orgs', authorize(PERMISSIONS.ORGANIZATION_READ), organizationController.listSubOrgs);
router.post('/:id/balance', authorize(PERMISSIONS.BALANCE_MANAGE), organizationController.addBalance);
router.get('/:id/transactions', authorize(PERMISSIONS.INVOICE_READ), organizationController.getTransactions);
router.get('/:id/reporting', authorize(PERMISSIONS.ANALYTICS_READ), organizationController.getReporting);

module.exports = router;
