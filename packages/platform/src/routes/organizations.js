const express = require('express');
const router = express.Router();
const organizationController = require('../controllers/organizations');

router.post('/', organizationController.create);
router.get('/:id', organizationController.getById);
router.get('/:id/sub-orgs', organizationController.listSubOrgs);
router.post('/:id/balance', organizationController.addBalance);
router.get('/:id/transactions', organizationController.getTransactions);
router.get('/:id/reporting', organizationController.getReporting);

module.exports = router;
