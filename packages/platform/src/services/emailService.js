async function sendInvoiceEmail(invoice, organization) {
    const webhookUrl = process.env.INVOICE_EMAIL_WEBHOOK_URL;
    if (!webhookUrl || !organization.billingEmail) return { delivered: false, reason: 'Email delivery is not configured' };

    const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            to: organization.billingEmail,
            invoiceNumber: invoice.number,
            total: Number(invoice.total),
            currency: invoice.currency,
            pdfUrl: invoice.pdfUrl,
            excelUrl: invoice.excelUrl
        })
    });

    if (!response.ok) throw new Error(`Invoice email delivery failed with status ${response.status}`);
    return { delivered: true };
}

module.exports = { sendInvoiceEmail };
