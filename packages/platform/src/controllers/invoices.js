const invoiceService = require('../services/invoiceService');

exports.listInvoices = async (req, res) => {
    try {
        const { organizationId } = req.query;
        if (!organizationId)
            return res.status(400).json({ error: 'organizationId is required' });

        const invoices = await invoiceService.getInvoices(organizationId);
        res.json(invoices);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createInvoice = async (req, res) => {
    try {
        const { organizationId, periodStart, periodEnd } = req.body;
        const invoice = await invoiceService.generateInvoice(
            organizationId,
            periodStart,
            periodEnd
        );
        res.status(201).json(invoice);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.getInvoice = async (req, res) => {
    try {
        const invoice = await invoiceService.getInvoiceById(req.params.id);
        if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
        res.json(invoice);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const invoice = await invoiceService.updateInvoiceStatus(
            req.params.id,
            status
        );
        res.json(invoice);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

exports.triggerBillingCycle = async (req, res) => {
    try {
        const results = await invoiceService.runBillingCycle();
        res.json({ message: 'Billing cycle completed', results });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
