import { internalAction } from './_generated/server';
import { internal } from './_generated/api';
import { v } from 'convex/values';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

export const attach = internalAction({
  args: { reportId: v.id('reports') },
  handler: async (ctx, { reportId }): Promise<void> => {
    const source = await ctx.runQuery(internal.demo.reportSource, { reportId });
    if (!source) return;
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica),
      bold = await pdf.embedFont(StandardFonts.HelveticaBold);
    const page = pdf.addPage([612, 792]);
    const text = (value: string, y: number, size = 11, strong = false) =>
      page.drawText(value, {
        x: 42,
        y,
        size,
        font: strong ? bold : font,
        color: rgb(0.13, 0.2, 0.16),
      });
    text('Tenday | FICTIONAL DEMO REPORT', 738, 18, true);
    text(
      'Invented values. No patient data. Not a clinical document.',
      711,
      11,
      true,
    );
    text(
      `Demo profile: ${source.name}    Report date: ${source.report.day}`,
      678,
    );
    text('Marker', 636, 11, true);
    page.drawText('Result / unit', { x: 260, y: 636, size: 11, font: bold });
    page.drawText('Printed interval', { x: 420, y: 636, size: 11, font: bold });
    let y = 607;
    for (const r of source.report.report.readings) {
      text(r.marker, y);
      page.drawText(`${r.value} ${r.unit}`, { x: 260, y, size: 11, font });
      page.drawText(r.reference || 'Not supplied', {
        x: 420,
        y,
        size: 11,
        font,
      });
      y -= 35;
    }
    text('All intervals on this page are fictional demonstration values.', 240);
    text('They must not be used as medical reference ranges.', 222);
    text(
      'Different labs/methods may use different intervals. Ask a clinician',
      190,
    );
    text(
      'about real results. A value alone does not establish a diagnosis.',
      172,
    );
    text(
      'Source page 1 of 1 | Created for the shared Tenday demo only.',
      75,
      10,
    );
    const bytes = await pdf.save();
    const storageId = await ctx.storage.store(
      new Blob([new Uint8Array(bytes).buffer], { type: 'application/pdf' }),
    );
    await ctx.runMutation(internal.demo.attachSource, {
      reportId,
      storageId,
      size: bytes.length,
      name: `demo-${source.slug}-${source.report.day}.pdf`,
    });
  },
});
