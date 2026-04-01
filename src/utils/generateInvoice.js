/**
 * generateInvoice — opens a print-ready invoice in a new tab using the browser print API.
 * Call with booking data, triggers window.print() with the formatted HTML.
 */
export function openInvoice({ clinicName, clinicAddress, phone, email, gstNumber, physioName, qualifications, patientName, serviceName, servicePrice, bookingId, date, paymentId }) {
  const fmt = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' });
  const amount = typeof servicePrice === 'number' ? servicePrice : parseFloat(servicePrice) || 0;
  const taxRate = 0.18;
  const taxable = +(amount / (1 + taxRate)).toFixed(2);
  const tax = +(amount - taxable).toFixed(2);
  const invoiceDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
  const invoiceNum = `INV-${Date.now().toString().slice(-6)}`;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Invoice ${invoiceNum}</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Inter, system-ui, sans-serif; padding: 40px; max-width: 800px; margin: auto; color: #111827; font-size: 14px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; }
  .clinic-name { font-size: 22px; font-weight: 700; color: #0066FF; }
  .clinic-sub { color: #6b7280; margin-top: 4px; }
  .invoice-meta { text-align: right; }
  .invoice-title { font-size: 20px; font-weight: 700; }
  .invoice-num { color: #6b7280; margin-top: 4px; }
  .divider { border: 0; border-top: 2px solid #e5e7eb; margin: 24px 0; }
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; margin-bottom: 32px; }
  .info-block h3 { font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #9ca3af; margin-bottom: 8px; }
  .info-block p { line-height: 1.7; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
  th { background: #f3f4f6; padding: 10px 14px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #6b7280; }
  td { padding: 10px 14px; border-bottom: 1px solid #e5e7eb; }
  .text-right { text-align: right; }
  .totals { margin-left: auto; width: 280px; }
  .totals td { padding: 6px 0; border: none; }
  .totals .grand-total { font-size: 16px; font-weight: 700; border-top: 2px solid #0066FF; padding-top: 10px; }
  .footer { margin-top: 48px; color: #9ca3af; font-size: 12px; line-height: 1.8; }
  .footer strong { color: #374151; }
  @media print { body { padding: 20px; } }
</style>
</head>
<body>
  <div class="header">
    <div>
      <div class="clinic-name">${clinicName}</div>
      <div class="clinic-sub">${clinicAddress || 'Surat, Gujarat'}</div>
      <div class="clinic-sub">${phone ? `Phone: ${phone}` : ''} ${email ? `· ${email}` : ''}</div>
      ${gstNumber ? `<div class="clinic-sub">GSTIN: ${gstNumber}</div>` : ''}
    </div>
    <div class="invoice-meta">
      <div class="invoice-title">INVOICE</div>
      <div class="invoice-num">#${invoiceNum}</div>
      <div class="invoice-num">Date: ${invoiceDate}</div>
      ${paymentId ? `<div class="invoice-num">Receipt No: ${paymentId}</div>` : ''}
      <div class="invoice-num">Booking ID: ${bookingId}</div>
    </div>
  </div>

  <hr class="divider">

  <div class="info-grid">
    <div class="info-block">
      <h3>Patient</h3>
      <p><strong>${patientName || 'Patient'}</strong></p>
    </div>
    <div class="info-block">
      <h3>Physiotherapist</h3>
      <p><strong>${physioName}</strong><br>${qualifications}</p>
    </div>
  </div>

  <table>
    <thead><tr><th>Service</th><th class="text-right">Amount</th></tr></thead>
    <tbody>
      <tr><td>${serviceName} (Physiotherapy Consultation)</td><td class="text-right">${fmt.format(taxable)}</td></tr>
    </tbody>
  </table>

  <table class="totals">
    <tbody>
      <tr><td>Subtotal</td><td class="text-right">${fmt.format(taxable)}</td></tr>
      <tr><td>GST (18%)</td><td class="text-right">${fmt.format(tax)}</td></tr>
      <tr class="grand-total"><td>Total Amount</td><td class="text-right">${fmt.format(amount)}</td></tr>
    </tbody>
  </table>

  <div class="footer">
    <p>Payment received via Online Consultation Portal. Thank you for choosing ${clinicName}.</p>
    <p>For queries, contact us at ${email || clinicName}.</p>
  </div>
</body>
</html>`;

  const win = window.open('', '_blank');
  win.document.write(html);
  win.document.close();
  win.onload = () => {
    win.focus();
    win.print();
  };
}
