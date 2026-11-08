/// <reference types="vite/client" />
import { convexTest } from 'convex-test';
import { describe, expect, it } from 'vitest';
import schema from './schema';
import { api, internal } from './_generated/api';
import agent from '@convex-dev/agent/test';
import rateLimiter from '@convex-dev/rate-limiter/test';
import { PDFDocument } from 'pdf-lib';

const modules = import.meta.glob('./**/*.ts');
const meal = {
  title: 'Synthetic lunch',
  day: '2026-11-08',
  time: '12:30',
  items: [
    {
      name: 'Toast',
      portion: 'slice',
      quantity: 2,
      calories: 100,
      protein: 4,
      carbs: 18,
      fat: 2,
    },
  ],
  note: 'Synthetic test input',
  source: 'manual' as const,
};
const report = {
  title: 'Synthetic lab report',
  day: '2026-11-08',
  readings: [
    {
      marker: 'Glucose',
      value: '<5',
      unit: 'mmol/L',
      reference: '',
      low: null,
      high: null,
      page: 1,
    },
  ],
  note: 'Synthetic test input',
};
async function setup() {
  const t = convexTest(schema, modules);
  agent.register(t);
  rateLimiter.register(t);
  const [one, two] = await t.run(async (ctx) =>
    Promise.all([
      ctx.db.insert('users', { isAnonymous: true }),
      ctx.db.insert('users', { isAnonymous: true }),
    ]),
  );
  const a = t.withIdentity({ subject: `${one}|sessionA` });
  const b = t.withIdentity({ subject: `${two}|sessionB` });
  await a.mutation(api.records.setGoal, {
    goal: {
      kind: 'consistency',
      target: 3,
      preferences: 'vegetarian',
      rationale: 'A regular meal rhythm.',
    },
    timezone: 'Asia/Kolkata',
  });
  return { t, a, b, one, two };
}
describe('confirmed records and private sessions', () => {
  it('rejects unauthenticated health access', async () => {
    const { t } = await setup();
    await expect(
      t.query(api.records.today, { day: meal.day }),
    ).rejects.toThrow();
  });
  it('keeps sessions isolated for queries, edits, and deletes', async () => {
    const { a, b } = await setup();
    const id = await a.mutation(api.records.saveMeal, {
      operationId: 'one',
      meal,
    });
    expect((await b.query(api.records.today, { day: meal.day })).meals).toEqual(
      [],
    );
    await expect(b.query(api.records.meal, { id })).rejects.toThrow(
      'unavailable',
    );
    await expect(
      b.mutation(api.records.saveMeal, {
        id,
        operationId: 'stolen',
        revision: 1,
        meal,
      }),
    ).rejects.toThrow('unavailable');
    await expect(b.mutation(api.records.deleteMeal, { id })).rejects.toThrow(
      'unavailable',
    );
  });
  it('saves once on retries and replaces an edited meal without adding a second record', async () => {
    const { a } = await setup();
    const id = await a.mutation(api.records.saveMeal, {
      operationId: 'double',
      meal,
    });
    expect(
      await a.mutation(api.records.saveMeal, { operationId: 'double', meal }),
    ).toBe(id);
    await a.mutation(api.records.saveMeal, {
      id,
      revision: 1,
      operationId: 'edit',
      meal: { ...meal, items: [{ ...meal.items[0], quantity: 3 }] },
    });
    expect(
      (await a.query(api.records.today, { day: meal.day })).meals,
    ).toHaveLength(1);
    await expect(
      a.mutation(api.records.saveMeal, {
        id,
        revision: 1,
        operationId: 'stale',
        meal,
      }),
    ).rejects.toThrow('changed elsewhere');
    await a.mutation(api.records.deleteMeal, { id });
    expect(
      (await a.query(api.records.today, { day: meal.day })).meals,
    ).toHaveLength(0);
  });
  it('keeps intended local-day changes and rejects invalid input atomically', async () => {
    const { a } = await setup();
    const id = await a.mutation(api.records.saveMeal, {
      operationId: 'local',
      meal,
    });
    await a.mutation(api.records.saveMeal, {
      id,
      revision: 1,
      operationId: 'move',
      meal: { ...meal, day: '2026-11-07', time: '23:55' },
    });
    expect(
      (await a.query(api.records.today, { day: meal.day })).meals,
    ).toHaveLength(0);
    expect(
      (await a.query(api.records.today, { day: '2026-11-07' })).meals,
    ).toHaveLength(1);
    await expect(
      a.mutation(api.records.saveMeal, {
        operationId: 'invalid',
        meal: { ...meal, items: [{ ...meal.items[0], quantity: -1 }] },
      }),
    ).rejects.toThrow();
    expect(
      (await a.query(api.records.today, { day: meal.day })).meals,
    ).toHaveLength(0);
  });
  it('preserves qualitative and bounded report values and removes sources with records', async () => {
    const { t, a, b, one } = await setup();
    const storageId = await t.run((ctx) =>
      ctx.storage.store(new Blob(['synthetic PDF'])),
    );
    const fileId = await t.mutation(internal.files.register, {
      owner: one,
      storageId,
      name: 'synthetic.pdf',
      mime: 'application/pdf',
      size: 13,
      kind: 'report',
    });
    await expect(
      b.mutation(api.records.saveReport, {
        operationId: 'steal',
        fileId,
        report,
      }),
    ).rejects.toThrow('unavailable');
    const id = await a.mutation(api.records.saveReport, {
      operationId: 'report',
      fileId,
      report,
    });
    expect(
      await a.mutation(api.records.saveReport, {
        operationId: 'report',
        fileId,
        report,
      }),
    ).toBe(id);
    expect(
      (await a.query(api.records.report, { id })).report.readings[0].value,
    ).toBe('<5');
    await expect(b.query(api.records.report, { id })).rejects.toThrow(
      'unavailable',
    );
    await expect(b.mutation(api.records.deleteReport, { id })).rejects.toThrow(
      'unavailable',
    );
    await a.mutation(api.records.deleteReport, { id });
    expect(await t.run((ctx) => ctx.storage.get(storageId))).toBeNull();
    await expect(a.query(api.records.report, { id })).rejects.toThrow(
      'unavailable',
    );
  });
  it('invalidates guidance when confirmed inputs change', async () => {
    const { a, t, one } = await setup();
    await t.mutation(internal.jobs.setInsight, {
      owner: one,
      day: meal.day,
      revision: 1,
      text: 'Start with a meal.',
      basis: 'Your logging goal.',
    });
    expect(
      (await a.query(api.records.today, { day: meal.day })).insight,
    ).not.toBeNull();
    await a.mutation(api.records.saveMeal, {
      operationId: 'new-context',
      meal,
    });
    expect(
      (await a.query(api.records.today, { day: meal.day })).insight,
    ).toBeNull();
    await t.mutation(internal.jobs.setInsight, {
      owner: one,
      day: meal.day,
      revision: 1,
      text: 'Stale suggestion',
      basis: 'Old inputs',
    });
    expect(
      (await a.query(api.records.today, { day: meal.day })).insight,
    ).toBeNull();
  });
  it('retains unconfirmed AI jobs separately and ignores stale job completions', async () => {
    const { a, b, t, one } = await setup();
    const first = await t.mutation(internal.jobs.begin, {
      owner: one,
      operationId: 'draft',
      kind: 'meal',
    });
    await t.mutation(internal.jobs.finish, {
      id: first.job._id,
      lease: first.job.updatedAt - 1,
      output: 'wrong',
    });
    expect(
      (await a.query(api.jobs.get, { operationId: 'draft' }))?.status,
    ).toBe('processing');
    await t.mutation(internal.jobs.finish, {
      id: first.job._id,
      lease: first.job.updatedAt,
      output: JSON.stringify(meal),
    });
    expect(
      (await a.query(api.jobs.get, { operationId: 'draft' }))?.status,
    ).toBe('ready');
    expect(await b.query(api.jobs.get, { operationId: 'draft' })).toBeNull();
    expect(
      (await a.query(api.records.today, { day: meal.day })).meals,
    ).toHaveLength(0);
  });
  it('blocks unauthenticated uploads and invalid file contents before storage', async () => {
    const { t, a } = await setup();
    const options = {
      method: 'POST',
      headers: { 'Content-Type': 'application/pdf', 'X-File-Kind': 'report' },
      body: 'not a PDF',
    };
    expect((await t.fetch('/files', options)).status).toBe(401);
    expect((await a.fetch('/files', options)).status).toBe(400);
    expect(await t.run((ctx) => ctx.db.query('files').take(1))).toHaveLength(0);
  });
  it('rejects long PDFs before upload and scopes private source retrieval', async () => {
    const { t, a, b } = await setup();
    const pdf = await PDFDocument.create();
    for (let i = 0; i < 4; i++) pdf.addPage();
    const headers = {
      'Content-Type': 'application/pdf',
      'X-File-Kind': 'report',
      'X-File-Name': 'synthetic.pdf',
    };
    expect(
      (
        await a.fetch('/files', {
          method: 'POST',
          headers,
          body: new Blob([new Uint8Array(await pdf.save())]),
        })
      ).status,
    ).toBe(400);
    pdf.removePage(3);
    const uploaded = await a.fetch('/files', {
      method: 'POST',
      headers,
      body: new Blob([new Uint8Array(await pdf.save())]),
    });
    expect(uploaded.status).toBe(200);
    const { fileId } = await uploaded.json();
    expect((await a.fetch(`/files/${fileId}`)).status).toBe(200);
    expect((await b.fetch(`/files/${fileId}`)).status).toBe(404);
    expect((await t.fetch(`/files/${fileId}`)).status).toBe(404);
  });
});
