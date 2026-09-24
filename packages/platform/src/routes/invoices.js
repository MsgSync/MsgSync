const express = require('express');
const router = express.Router();
const invoiceController = require('../controllers/invoices');

router.get('/', invoiceController.listInvoices);
router.post('/', invoiceController.createInvoice);
router.get('/:id', invoiceController.getInvoice);
router.patch('/:id/status', invoiceController.updateStatus);
router.post('/cycle', invoiceController.triggerBillingCycle);

module.exports = router;
