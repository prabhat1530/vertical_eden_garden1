const PDFDocument = require('pdfkit');

// ─────────────────────────────────────────────
// Server-side PDF invoice for a paid booking.
// Returns a Buffer, so it can be attached to an email or sent as a download.
// Uses PDFKit's built-in Helvetica, which has no ₹ glyph, so amounts are
// written as "Rs." (the same as the existing in-browser invoice).
// No tax lines: the business has no GST number on record.
// ─────────────────────────────────────────────

const BUSINESS = {
    name: 'Vertical Eden Garden',
    address: 'Janakpuri District Center, New Delhi, India',
    phone: '+91 7827949218',
    email: 'verticaledengarden@gmail.com',
    website: 'verticaledengarden.in',
};

const GREEN = '#2e7d32';
const MUTED = '#64748b';

const rupees = (n) => `Rs. ${Number(n).toLocaleString('en-IN')}`;

// Same format as the in-browser invoice: INV- + first 8 characters of the id.
const invoiceNumber = (booking) => `INV-${String(booking._id).substring(0, 8).toUpperCase()}`;

const buildInvoicePdf = ({ booking, user }) => new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const left = 50;
    const right = doc.page.width - 50;

    // Header
    doc.fillColor(GREEN).font('Helvetica-Bold').fontSize(22).text(BUSINESS.name, left, 50);
    doc.fillColor(MUTED).font('Helvetica').fontSize(9)
        .text(BUSINESS.address)
        .text(`${BUSINESS.phone}  ·  ${BUSINESS.email}  ·  ${BUSINESS.website}`);

    doc.fillColor('#000').font('Helvetica-Bold').fontSize(16).text('INVOICE', left, 50, { align: 'right' });
    doc.font('Helvetica').fontSize(10).fillColor(MUTED)
        .text(invoiceNumber(booking), { align: 'right' })
        .text(`Date: ${new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`, { align: 'right' });

    doc.moveTo(left, 120).lineTo(right, 120).strokeColor('#d9e3d6').stroke();

    // Billed to
    doc.fillColor(MUTED).fontSize(9).text('BILLED TO', left, 135);
    doc.fillColor('#000').fontSize(11)
        .text(user?.name || 'Customer')
        .text(user?.email || '')
        .text(user?.phone || '')
        .text(`${booking.address}, ${booking.city}`);

    // Line items
    const tableTop = 230;
    const cols = { item: left, detail: 230, amount: right - 100 };
    doc.fillColor(GREEN).rect(left, tableTop, right - left, 22).fill();
    doc.fillColor('#fff').font('Helvetica-Bold').fontSize(10)
        .text('Item', cols.item + 8, tableTop + 7)
        .text('Details', cols.detail, tableTop + 7)
        .text('Amount', cols.amount, tableTop + 7, { width: 92, align: 'right' });

    const rows = [
        [booking.serviceName, `Visit: ${booking.preferredDate}, ${booking.preferredTime}`, null],
        ['Base price', 'Service setup', booking.basePrice],
        ['Area charges', `${booking.areaSize} sq ft`, booking.areaPrice],
    ];
    let y = tableTop + 32;
    doc.font('Helvetica').fontSize(10).fillColor('#000');
    rows.forEach(([item, detail, amount]) => {
        doc.text(item, cols.item + 8, y, { width: 170 })
            .text(detail, cols.detail, y, { width: 200 })
            .text(amount == null ? '' : rupees(amount), cols.amount, y, { width: 92, align: 'right' });
        y += 22;
    });

    doc.moveTo(left, y).lineTo(right, y).strokeColor('#d9e3d6').stroke();
    doc.font('Helvetica-Bold').fontSize(12)
        .text('Total paid', cols.detail, y + 12)
        .text(rupees(booking.totalPrice), cols.amount, y + 12, { width: 92, align: 'right' });

    // Payment
    doc.font('Helvetica').fontSize(9).fillColor(MUTED)
        .text(`Payment ID: ${booking.paymentId || '-'}   ·   Status: PAID`, left, y + 50);

    doc.fontSize(9).fillColor(MUTED)
        .text('Thank you for choosing Vertical Eden Garden!', left, 760, { align: 'center', width: right - left });

    doc.end();
});

module.exports = { buildInvoicePdf, invoiceNumber };
