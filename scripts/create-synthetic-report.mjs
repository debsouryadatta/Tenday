import { createRequire } from 'node:module';
import { mkdir, writeFile } from 'node:fs/promises';
const require = createRequire(
  new URL('../packages/convex/package.json', import.meta.url),
);
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const pdf = await PDFDocument.create();
pdf.setTitle('Tenday synthetic test report');
pdf.setAuthor('Tenday test fixtures');
const page = pdf.addPage([595, 600]);
const regular = await pdf.embedFont(StandardFonts.Helvetica);
const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
const ink = rgb(0.13, 0.18, 0.15);
const forest = rgb(0.2, 0.36, 0.27);
function text(value, x, y, size = 12, font = regular) {
  page.drawText(value, { x, y, size, font, color: ink });
}
page.drawRectangle({
  x: 36,
  y: 498,
  width: 523,
  height: 64,
  color: rgb(0.92, 0.95, 0.91),
});
text('SYNTHETIC - FOR APP TESTING ONLY', 52, 536, 14, bold);
text(
  'No patient. No clinical interpretation. Values are invented.',
  52,
  515,
  11,
);
text('Tenday sample lab report', 36, 457, 23, bold);
text('Report date: 2026-11-07', 36, 427);
text('Source page: 1 of 1', 36, 407);
page.drawRectangle({ x: 36, y: 350, width: 523, height: 30, color: forest });
for (const [label, x] of [
  ['Marker', 48],
  ['Result', 240],
  ['Unit', 322],
  ['Lab interval', 424],
])
  page.drawText(label, {
    x,
    y: 360,
    size: 11,
    font: bold,
    color: rgb(1, 1, 1),
  });
const rows = [
  ['Glucose', '92', 'mg/dL', '70 - 100'],
  ['Hemoglobin', '13.8', 'g/dL', '12.0 - 16.0'],
  ['C-reactive protein', '<5', 'mg/L', 'Not supplied'],
  ['Urine protein', 'Negative', '', 'Negative'],
];
rows.forEach((row, i) => {
  const y = 326 - i * 42;
  row.forEach((value, j) => text(value, [48, 240, 322, 424][j], y, 11));
  page.drawLine({
    start: { x: 36, y: y - 14 },
    end: { x: 559, y: y - 14 },
    color: rgb(0.88, 0.91, 0.87),
    thickness: 0.5,
  });
});
text(
  'The intervals above are invented source text for extraction testing.',
  36,
  105,
  11,
);
text(
  'They must never be used as general medical reference intervals.',
  36,
  87,
  11,
);
text(
  'Fixture covers numeric, bounded, qualitative, and missing-unit results.',
  36,
  69,
  11,
);
await mkdir('output/pdf', { recursive: true });
await writeFile('output/pdf/tenday-synthetic-report.pdf', await pdf.save());
console.log('Created one synthetic report fixture.');
