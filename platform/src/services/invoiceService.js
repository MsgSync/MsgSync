const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

class InvoiceService {
    /**
     * Generates a new invoice for an organization for a specific period.
     */
    async generateInvoice(organizationId, periodStart, periodEnd) {
        // 1. Fetch organization for currency and billing info
        const org = await prisma.organization.findUnique({
            where: { id: organizationId }
        });

        // 2. Calculate total amount from messages in period (only those with status 'sent' or 'delivered')
        const aggregation = await prisma.message.aggregate({
            where: {
                organizationId,
                status: { in: ['sent', 'delivered'] },
                createdAt: { // Using createdAt as the billing anchor
                    gte: new Date(periodStart),
                    lte: new Date(periodEnd)
                }
            },
            _sum: {
                price: true
            }
        });

        const amount = aggregation._sum.price || 0;
        const taxRate = 0.20; // 20% Tax example
        const tax = Number(amount) * taxRate;
        const total = Number(amount) + tax;

        // 3. Generate unique invoice number
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 6).toUpperCase();
        const invoiceNumber = `INV-${dateStr}-${randomStr}`;

        // 4. Create invoice record
        const invoice = await prisma.invoice.create({
            data: {
                number: invoiceNumber,
                organizationId,
                amount: amount,
                tax: tax,
                total: total,
                currency: 'USD',
                status: 'UNPAID',
                periodStart: new Date(periodStart),
                periodEnd: new Date(periodEnd),
                dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
                pdfUrl: `/exports/invoices/${invoiceNumber}.pdf`,
                excelUrl: `/exports/invoices/${invoiceNumber}.xlsx`
            }
        });

        return invoice;
    }

    async getInvoices(organizationId) {
        return await prisma.invoice.findMany({
            where: { organizationId },
            orderBy: { createdAt: 'desc' }
        });
    }

    async getInvoiceById(id) {
        return await prisma.invoice.findUnique({
            where: { id },
            include: { organization: true }
        });
    }

    async updateInvoiceStatus(id, status) {
        return await prisma.invoice.update({
            where: { id },
            data: { status }
        });
    }

    /**
     * Simulation of automated billing cycle run
     */
    async runBillingCycle() {
        const orgs = await prisma.organization.findMany();
        const results = [];

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        for (const org of orgs) {
            try {
                const inv = await this.generateInvoice(org.id, startOfMonth, endOfMonth);
                results.push({ org: org.name, status: 'SUCCESS', invoice: inv.number });
            } catch (err) {
                results.push({ org: org.name, status: 'FAILED', error: err.message });
            }
        }
        return results;
    }
}

module.exports = new InvoiceService();
