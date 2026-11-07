import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';
import { auth } from './auth';
import { owner } from './lib/access';
import type { Id } from './_generated/dataModel';

const http = httpRouter();
auth.addHttpRoutes(http);
const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Authorization, Content-Type, X-File-Name, X-File-Kind', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Cache-Control': 'no-store' };
const response = (text: string, status = 400) => new Response(status === 204 ? null : text, { status, headers: cors });
http.route({ path: '/files', method: 'OPTIONS', handler: httpAction(async () => response('', 204)) });
http.route({ pathPrefix: '/files/', method: 'OPTIONS', handler: httpAction(async () => response('', 204)) });
http.route({ path: '/files', method: 'POST', handler: httpAction(async (ctx, request) => {
  let id; try { id = await owner(ctx); } catch { return response('Reconnect your private session.', 401); }
  const mime = request.headers.get('Content-Type')?.split(';')[0];
  const kind = request.headers.get('X-File-Kind');
  if ((kind !== 'meal' && kind !== 'report') || !mime || !['image/jpeg', 'image/png', 'application/pdf'].includes(mime) || (kind === 'meal' && mime === 'application/pdf')) return response('Choose a JPEG, PNG, or PDF report.');
  if (Number(request.headers.get('Content-Length')) > 6 * 1024 * 1024) return response('Choose a file smaller than 6 MB.', 413);
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (bytes.length < 8 || bytes.length > 6 * 1024 * 1024) return response('Choose a nonempty file smaller than 6 MB.', 413);
  const valid = mime === 'image/jpeg' ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255 : mime === 'image/png' ? [137,80,78,71,13,10,26,10].every((b,i) => bytes[i] === b) : new TextDecoder().decode(bytes.slice(0, 5)) === '%PDF-';
  if (!valid) return response('The file contents do not match its format.');
  const storageId = await ctx.storage.store(new Blob([bytes], { type: mime }));
  try {
    const fileId = await ctx.runMutation(internal.files.register, { owner: id, storageId, mime, kind, size: bytes.length, name: (request.headers.get('X-File-Name') ?? 'Source').replace(/[^\w. -]/g, '').slice(0, 120) || 'Source' });
    return new Response(JSON.stringify({ fileId }), { headers: { ...cors, 'Content-Type': 'application/json' } });
  } catch { await ctx.storage.delete(storageId); return response('Upload could not be saved. Try again.', 503); }
}) });
http.route({ pathPrefix: '/files/', method: 'GET', handler: httpAction(async (ctx, request) => {
  try {
    const id = await owner(ctx);
    const fileId = new URL(request.url).pathname.slice('/files/'.length) as Id<'files'>;
    const file = await ctx.runQuery(internal.files.owned, { owner: id, id: fileId });
    const blob = await ctx.storage.get(file.storageId);
    if (!blob) return response('Source is unavailable.', 404);
    return new Response(blob, { headers: { ...cors, 'Content-Type': file.mime, 'Content-Disposition': `inline; filename="${file.name.replace(/["\\\r\n]/g, '')}"`, 'X-Content-Type-Options': 'nosniff' } });
  } catch { return response('Source is unavailable.', 404); }
}) });
export default http;
