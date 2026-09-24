const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoices');
const authenticate = require('../middleware/auth');
const { authorize } = require('../middleware/rbac');
const { PERMISSIONS } = require('../config/rbac');
const { apiLimiter } = require('../middleware/rateLimiter');

router.use(authenticate);
router.use(apiLimiter);

router.get('/', authorize(PERMISSIONS.INVOICE_READ), invoiceController.listInvoices);
router.post('/', authorize(PERMISSIONS.INVOICE_MANAGE), invoiceController.createInvoice);
router.get('/:id', authorize(PERMISSIONS.INVOICE_READ), invoiceController.getInvoice);
router.patch('/:id/status', authorize(PERMISSIONS.INVOICE_MANAGE), invoiceController.updateStatus);
router.post('/cycle', authorize(PERMISSIONS.INVOICE_MANAGE), invoiceController.triggerBillingCycle);

module.exports = router;
