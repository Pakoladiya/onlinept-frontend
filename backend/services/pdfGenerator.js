import PDFDocument from 'pdfkit';
import { getDb } from './firebase-admin.js';

const BRAND_FONT = 'Helvetica-Bold';
const BODY_FONT = 'Helvetica';
const MARGIN = 50;
const PAGE_W = 595.28;
const PAGE_H = 841.89;

// ── Helpers ─────────────────────────────────────────────────────────────────

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    return new Date(dateStr).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

async function fetchClinicData(clinicId) {
  try {
    const db = await getDb();
    if (!db) return {};
    const [clinicSnap, presetSnap] = await Promise.all([
      db.collection('clinics').doc(clinicId).get(),
      db.collection('clinic_presets').doc(clinicId).get(),
    ]);
    const clinic = clinicSnap.exists ? clinicSnap.data() : {};
    const preset = presetSnap.exists ? presetSnap.data() : {};
    return { ...clinic, ...preset }; // preset fields override clinic fields
  } catch {
    return {};
  }
}

async function fetchBookingData(bookingId, clinicId) {
  try {
    const db = await getDb();
    if (!db) return null;
    const doc = await db.collection('bookings').doc(bookingId).get();
    if (!doc.exists) return null;
    const sessionSnap = await doc.ref.collection('sessions').doc(bookingId).get();
    return sessionSnap.exists ? { ...doc.data(), ...sessionSnap.data(), id: doc.id } : doc.data();
  } catch {
    return null;
  }
}

function drawBrandedHeader(doc, clinic, title) {
  const primary = clinic.primaryColor || '#007AFF';
  const [pr, pg, pb] = hexToRgb(primary);

  // Top color bar
  doc.rect(0, 0, PAGE_W, 80).fill(primary);

  // Clinic name
  doc.fillColor(255, 255, 255)
    .fontSize(18)
    .font(BRAND_FONT)
    .text(clinic.clinicName || 'Online Physio', MARGIN, 28);

  // Subtitle / title
  if (title) {
    doc.fillColor(255, 255, 255)
      .fontSize(10)
      .font(BODY_FONT)
      .text(title, MARGIN, 50, { lineBreak: false });
  }

  // Bottom accent line
  doc.rect(0, 80, PAGE_W, 4).fill(pr, pg, pb, 0.5);

  doc.moveDown(6);
}

function drawFooter(doc, pageNum, totalPages) {
  const bottom = PAGE_H - 40;
  doc
    .fillColor('#888888')
    .fontSize(8)
    .font(BODY_FONT)
    .text(
      `Page ${pageNum} of ${totalPages}`,
      MARGIN,
      bottom,
      { align: 'center', width: PAGE_W - MARGIN * 2 }
    );
  doc
    .fillColor('#cccccc')
    .fontSize(7)
    .text(
      'Confidential – For clinical use only',
      MARGIN,
      bottom + 10,
      { align: 'center', width: PAGE_W - MARGIN * 2 }
    );
}

// ── Block renderers ──────────────────────────────────────────────────────────

function renderClinicHeader(doc, block) {
  const primary = block.primaryColor || '#007AFF';
  const [pr, pg, pb] = hexToRgb(primary);

  doc.rect(0, doc.y, PAGE_W, 90).fill(primary);
  doc.fillColor(255, 255, 255)
    .fontSize(20)
    .font(BRAND_FONT)
    .text(block.title || '', MARGIN, doc.y + 15, { width: PAGE_W - MARGIN * 2 });

  if (block.subtitle) {
    doc.fontSize(11)
      .font(BODY_FONT)
      .text(block.subtitle, MARGIN, doc.y + 2, { width: PAGE_W - MARGIN * 2 });
  }

  if (block.logo) {
    try {
      const imgBuf = Buffer.from(block.logo.replace(/^data:[^;]+;base64,/, ''), 'base64');
      doc.image(imgBuf, PAGE_W - MARGIN - 60, doc.y - 65, { fit: [60, 60] });
    } catch {
      // logo unavailable
    }
  }

  doc.moveDown(5);
}

function renderPatientInfo(doc, block) {
  const { fields = [] } = block;
  doc.fontSize(11).font(BRAND_FONT).fillColor('#333333').text('Patient Information', MARGIN, doc.y + 10);
  doc.moveDown(0.5);

  for (const f of fields) {
    const label = f.label || '';
    const value = f.value || 'N/A';
    const col1 = MARGIN;
    const col2 = MARGIN + 140;
    const y = doc.y;

    doc.fontSize(9).font(BRAND_FONT).fillColor('#666666').text(label + ':', col1, y);
    doc.fontSize(9).font(BODY_FONT).fillColor('#333333').text(String(value), col2, y);
    doc.moveDown(0.4);
  }

  doc.moveDown(1.5);
}

function renderTextBlock(doc, block) {
  const content = block.content || '';
  const fontSize = block.fontSize || 11;
  const bold = block.bold || false;
  const color = block.color || '#333333';
  const [r, g, b] = hexToRgb(color);

  doc.fontSize(fontSize)
    .font(bold ? BRAND_FONT : BODY_FONT)
    .fillColor(r, g, b)
    .text(content, MARGIN, doc.y, { width: PAGE_W - MARGIN * 2, lineGap: 2 });

  doc.moveDown(2);
}

function renderImageBlock(doc, block) {
  const url = block.url || block.data;
  if (!url) return;

  try {
    const imgData = url.startsWith('data:') ? Buffer.from(url.replace(/^data:[^;]+;base64,/, ''), 'base64') : null;
    if (!imgData) return;

    const fitW = Math.min(block.width || 300, PAGE_W - MARGIN * 2);
    doc.image(imgData, MARGIN, doc.y, { fit: [fitW, fitW * 0.75] });
    doc.moveDown(0.5);

    if (block.caption) {
      doc.fontSize(8).font(BODY_FONT).fillColor('#888888').text(block.caption, MARGIN, doc.y, { width: fitW, align: 'center' });
    }
    doc.moveDown(2);
  } catch {
    doc.moveDown(2);
  }
}

function renderVasScale(doc, block) {
  const score = block.score ?? 0;
  const label = block.label || 'Pain Level';
  const color = block.color || '#e63946';
  const [r, g, b] = hexToRgb(color);

  const barX = MARGIN;
  const barY = doc.y;
  const barW = PAGE_W - MARGIN * 2;
  const barH = 30;

  // Background bar
  doc.rect(barX, barY, barW, barH).fill('#eeeeee');

  // Filled portion based on score (0-10)
  const fillW = Math.max(0, Math.min(1, score / 10)) * barW;
  doc.rect(barX, barY, fillW, barH).fill(r, g, b);

  // Score text
  doc.fontSize(14).font(BRAND_FONT)
    .fillColor(255, 255, 255)
    .text(`${score}/10`, barX + 10, barY + 6);

  // Label
  doc.fontSize(10).font(BODY_FONT)
    .fillColor('#333333')
    .text(label, barX + 60, barY + 9);

  // Scale labels
  doc.fontSize(8).font(BODY_FONT)
    .fillColor('#888888')
    .text('0 = No pain', barX, barY + barH + 2)
    .text('10 = Worst possible', barX + barW - 90, barY + barH + 2);

  doc.moveDown(3);
}

function renderExerciseTable(doc, block) {
  const exercises = block.exercises || [];
  const colW = [180, 80, 70, 70, 100];
  const rowH = 22;

  const drawCell = (text, x, y, w, opts = {}) => {
    doc.fontSize(9)
      .font(opts.bold ? BRAND_FONT : BODY_FONT)
      .fillColor(opts.color || '#333333')
      .text(String(text || ''), x + 2, y + 4, { width: w - 4, lineGap: 0 });
  };

  // Header row
  const headers = ['Exercise', 'Sets', 'Reps', 'Hold', 'Frequency'];
  let x = MARGIN;
  doc.rect(MARGIN, doc.y, PAGE_W - MARGIN * 2, rowH).fill('#007AFF');
  headers.forEach((h, i) => {
    drawCell(h, x, doc.y, colW[i], { bold: true, color: '#ffffff' });
    x += colW[i];
  });
  doc.moveDown(1);

  // Data rows
  exercises.forEach((ex, idx) => {
    if (doc.y + rowH > PAGE_H - 60) { doc.addPage(); }

    const fill = idx % 2 === 0 ? '#f9f9f9' : '#ffffff';
    x = MARGIN;
    doc.rect(MARGIN, doc.y, PAGE_W - MARGIN * 2, rowH).fill(fill);
    [ex.name || ex.exerciseName || '', ex.sets || '', ex.reps || '', ex.hold || '', ex.frequency || ''].forEach((val, i) => {
      drawCell(val, x, doc.y, colW[i]);
      x += colW[i];
    });
    doc.moveDown(1);
  });

  doc.moveDown(1.5);
}

function renderSessionNotes(doc, block) {
  const sections = block.sections || block; // SOAP: subjective, objective, assessment, plan
  const labels = { subjective: 'Subjective', objective: 'Objective', assessment: 'Assessment', plan: 'Plan' };
  const colors = { subjective: '#007AFF', objective: '#2ecc71', assessment: '#e67e22', plan: '#9b59b6' };

  for (const key of ['subjective', 'objective', 'assessment', 'plan']) {
    const value = sections[key] || sections[key === 'plan' ? 'plan' : key] || '';
    if (!value) continue;

    const col = colors[key] || '#333333';
    const [r, g, b] = hexToRgb(col);

    if (doc.y > PAGE_H - 80) doc.addPage();

    doc.rect(MARGIN, doc.y, 4, 18).fill(r, g, b);
    doc.fontSize(11).font(BRAND_FONT).fillColor(r, g, b)
      .text(labels[key], MARGIN + 10, doc.y + 2);
    doc.moveDown(0.5);

    doc.fontSize(10).font(BODY_FONT).fillColor('#333333')
      .text(value, MARGIN + 10, doc.y, { width: PAGE_W - MARGIN * 2 - 10, lineGap: 2 });
    doc.moveDown(2);
  }
}

function renderDivider(doc, block) {
  const style = block.style || 'line';
  const y = doc.y + 10;

  if (style === 'line') {
    doc.moveTo(MARGIN, y).lineTo(PAGE_W - MARGIN, y).stroke('#cccccc');
  } else if (style === 'dots') {
    const steps = Math.floor((PAGE_W - MARGIN * 2) / 10);
    for (let i = 0; i < steps; i++) {
      doc.circle(MARGIN + i * 10, y, 1.5).fill('#cccccc');
    }
  }

  doc.moveDown(2);
}

function renderProgressChart(doc, block) {
  const { title, labels = [], datasets = [] } = block;
  const W = PAGE_W - MARGIN * 2;
  const H = 160;
  const legendH = 30;
  const padding = { top: 20, right: 20, bottom: 40, left: 50 };
  const chartX = MARGIN + padding.left;
  const chartY = doc.y + padding.top;
  const chartW = W - padding.left - padding.right;
  const chartH = H - padding.top - padding.bottom;

  // Create offscreen canvas
  const canvas = Buffer.alloc ? (() => {
    // Node.js — create a mock canvas approach using pdfkit primitives
    return null;
  })() : null;

  // Draw via pdfkit primitives (bar chart approximation)
  if (doc.y > PAGE_H - H - 40) doc.addPage();

  if (title) {
    doc.fontSize(12).font(BRAND_FONT).fillColor('#333333').text(title, MARGIN, doc.y);
    doc.moveDown(0.5);
  }

  const n = labels.length;
  const barGroupW = n > 0 ? chartW / n : chartW;
  const barW = Math.min(barGroupW * 0.6, 40);
  const maxVal = Math.max(...datasets.flatMap((d) => d.data || []), 1);

  datasets.forEach((ds, di) => {
    const color = ds.color || '#007AFF';
    const [r, g, b] = hexToRgb(color);
    const vals = ds.data || [];
    const barGap = di * (barW + 4);

    vals.forEach((val, xi) => {
      const normH = (val / maxVal) * chartH;
      const bx = chartX + xi * barGroupW + barGap + 2;
      const by = chartY + chartH - normH;

      doc.rect(bx, by, barW, normH).fill(r, g, b);

      // Value label on top
      doc.fontSize(7).font(BODY_FONT).fillColor(r, g, b)
        .text(String(val), bx, by - 10, { width: barW, align: 'center' });
    });
  });

  // Y-axis line
  doc.moveTo(chartX, chartY).lineTo(chartX, chartY + chartH).stroke('#cccccc');

  // X-axis line
  doc.moveTo(chartX, chartY + chartH).lineTo(chartX + chartW, chartY + chartH).stroke('#cccccc');

  // Y-axis labels (0, 50%, 100%)
  [0, 0.5, 1].forEach((frac) => {
    const y = chartY + chartH - frac * chartH;
    const val = Math.round(frac * maxVal);
    doc.fontSize(7).font(BODY_FONT).fillColor('#888888')
      .text(String(val), chartX - padding.left, y - 3, { width: padding.left - 2, align: 'right' });
    // Grid line
    doc.moveTo(chartX, y).lineTo(chartX + chartW, y).stroke('#eeeeee');
  });

  // X-axis labels
  labels.forEach((lbl, i) => {
    const bx = chartX + i * barGroupW + barGroupW / 2;
    doc.fontSize(7).font(BODY_FONT).fillColor('#888888')
      .text(String(lbl), bx - 20, chartY + chartH + 4, { width: 40, align: 'center' });
  });

  // Legend
  datasets.forEach((ds, i) => {
    const [r, g, b] = hexToRgb(ds.color || '#007AFF');
    const lx = MARGIN + i * 120;
    doc.rect(lx, chartY + chartH + 18, 10, 8).fill(r, g, b);
    doc.fontSize(8).font(BODY_FONT).fillColor('#333333')
      .text(ds.label || '', lx + 14, chartY + chartH + 17);
  });

  doc.moveDown(14);
}

function renderCustomTable(doc, block) {
  const headers = block.headers || [];
  const rows = block.rows || [];
  const colCount = headers.length;
  const colW = (PAGE_W - MARGIN * 2) / colCount;
  const rowH = 20;

  // Header
  let x = MARGIN;
  doc.rect(MARGIN, doc.y, PAGE_W - MARGIN * 2, rowH).fill('#34495e');
  headers.forEach((h, i) => {
    doc.fontSize(9).font(BRAND_FONT).fillColor(255, 255, 255)
      .text(String(h.label || h || ''), x + 2, doc.y + 4, { width: colW - 4 });
    x += colW;
  });
  doc.moveDown(1);

  // Data rows
  rows.forEach((row, idx) => {
    if (doc.y + rowH > PAGE_H - 60) { doc.addPage(); }
    const fill = idx % 2 === 0 ? '#f5f5f5' : '#ffffff';
    x = MARGIN;
    doc.rect(MARGIN, doc.y, PAGE_W - MARGIN * 2, rowH).fill(fill);
    headers.forEach((h, i) => {
      const val = row[h.key || h] || '';
      doc.fontSize(9).font(BODY_FONT).fillColor('#333333')
        .text(String(val), x + 2, doc.y + 4, { width: colW - 4 });
      x += colW;
    });
    doc.moveDown(1);
  });

  doc.moveDown(1.5);
}

const blockRenderers = {
  clinicHeader: renderClinicHeader,
  patientInfo: renderPatientInfo,
  textBlock: renderTextBlock,
  imageBlock: renderImageBlock,
  vasScale: renderVasScale,
  exerciseTable: renderExerciseTable,
  sessionNotes: renderSessionNotes,
  divider: renderDivider,
  customTable: renderCustomTable,
  progressChart: renderProgressChart,
};

// ── Main exported functions ──────────────────────────────────────────────────

export async function generateBrandedPDF(clinicId, blocks) {
  const clinic = await fetchClinicData(clinicId);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGIN, size: 'A4', info: { Title: 'Clinic Document' } });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    let pageNum = 0;

    doc.on('pageAdded', () => { pageNum++; });

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const renderer = blockRenderers[block.type];

      if (!renderer) {
        renderTextBlock(doc, { content: `[Unsupported block: ${block.type}]`, fontSize: 9, color: '#cccccc' });
        continue;
      }

      // Auto page-break if near bottom
      if (doc.y > PAGE_H - 80) doc.addPage();

      try {
        renderer(doc, block);
      } catch (err) {
        console.error(`[pdfGenerator] Block render error (${block.type}):`, err.message);
        renderTextBlock(doc, { content: `[Render error: ${err.message}]`, fontSize: 8, color: '#cc0000' });
      }
    }

    // Add page numbers on all pages (post-process via info)
    const totalPages = doc.bufferedPageRange().count || 1;
    if (totalPages > 0) {
      for (let p = 0; p < totalPages; p++) {
        doc.switchToPage(p);
        drawFooter(doc, p + 1, totalPages);
      }
    }

    doc.end();
  });
}

export async function generateSessionSummaryPDF(bookingId, clinicId) {
  const [clinic, session] = await Promise.all([
    fetchClinicData(clinicId),
    fetchBookingData(bookingId, clinicId),
  ]);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGIN, size: 'A4', info: { Title: `Session Summary – ${bookingId}` } });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const totalPages = { count: 0 };
    doc.on('pageAdded', () => { totalPages.count++; });

    // ── Page 1: Header + Patient Info ───────────────────────────────────────
    drawBrandedHeader(doc, clinic, `Session Summary`);
    doc.moveDown(1);

    const patientName = session?.patientName || session?.patient?.name || 'N/A';
    const sessionDate = formatDate(session?.date || session?.sessionDate);
    const therapistName = session?.therapistName || session?.therapist?.name || 'N/A';
    const condition = session?.condition || session?.diagnosis || 'N/A';
    const status = session?.status || 'Completed';

    const infoFields = [
      { label: 'Patient Name', value: patientName },
      { label: 'Session Date', value: sessionDate },
      { label: 'Therapist', value: therapistName },
      { label: 'Diagnosis / Condition', value: condition },
      { label: 'Status', value: status },
    ];

    renderPatientInfo(doc, { fields: infoFields });

    // ── VAS Score ───────────────────────────────────────────────────────────
    if (session?.vasScore !== undefined || session?.painScore !== undefined) {
      const score = session?.vasScore ?? session?.painScore;
      renderVasScale(doc, { score, label: 'VAS Pain Score (0–10)', color: '#e63946' });
    }

    // ── HEP Exercises ───────────────────────────────────────────────────────
    const exercises = session?.hep || session?.exercises || [];
    if (exercises.length > 0) {
      if (doc.y > PAGE_H - 150) doc.addPage();
      doc.fontSize(13).font(BRAND_FONT).fillColor('#333333').text('Home Exercise Program (HEP)', MARGIN, doc.y + 5);
      doc.moveDown(1);
      renderExerciseTable(doc, { exercises });
    }

    // ── SOAP Notes ───────────────────────────────────────────────────────────
    const soap = session?.soapNotes || session?.notes || {};
    const hasSoap = soap.subjective || soap.objective || soap.assessment || soap.plan;
    if (hasSoap) {
      if (doc.y > PAGE_H - 120) doc.addPage();
      doc.fontSize(13).font(BRAND_FONT).fillColor('#333333').text('Clinical Notes (SOAP)', MARGIN, doc.y + 5);
      doc.moveDown(1);
      renderSessionNotes(doc, { sections: soap });
    }

    // ── Next Appointment ────────────────────────────────────────────────────
    const nextAppt = session?.nextAppointment || session?.followUp;
    if (nextAppt) {
      if (doc.y > PAGE_H - 80) doc.addPage();
      renderDivider(doc, { style: 'line' });
      doc.fontSize(11).font(BRAND_FONT).fillColor('#007AFF')
        .text('Next Appointment', MARGIN, doc.y);
      doc.moveDown(0.5);
      doc.fontSize(10).font(BODY_FONT).fillColor('#333333')
        .text(formatDate(nextAppt), MARGIN, doc.y, { width: PAGE_W - MARGIN * 2 });
    }

    // ── Page numbers ─────────────────────────────────────────────────────────
    const pages = totalPages.count || 1;
    for (let p = 0; p < pages; p++) {
      doc.switchToPage(p);
      drawFooter(doc, p + 1, pages);
    }

    doc.end();
  });
}