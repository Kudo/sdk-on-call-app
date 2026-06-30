import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { api } from './_generated/api';

const http = httpRouter();

http.route({
  path: '/on-call/current',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    const now = getRequestTimestamp(request);
    const current = await ctx.runQuery(api.rotations.current, { now });
    return jsonResponse({
      ok: true,
      ...current,
    });
  }),
});

function getRequestTimestamp(request: Request) {
  const url = new URL(request.url);
  const now = url.searchParams.get('now');
  if (!now) return Date.now();

  const numeric = Number(now);
  if (Number.isFinite(numeric)) return numeric;

  const parsed = Date.parse(now);
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

export default http;
