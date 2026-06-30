import { httpRouter } from 'convex/server';
import { httpAction } from './_generated/server';
import { internal } from './_generated/api';

const http = httpRouter();

http.route({
  path: '/on-call/current',
  method: 'GET',
  handler: httpAction(async (ctx, request) => {
    if (!isAuthorized(request)) {
      return jsonResponse({ ok: false, error: 'unauthorized' }, 401);
    }

    const now = getRequestTimestamp(request);
    const current = await ctx.runQuery(internal.rotations.current, { now });
    return jsonResponse({
      ok: true,
      ...current,
    });
  }),
});

// This endpoint returns members' Slack user IDs, so it is restricted to callers
// that hold the shared secret (the EAS workflow runner). Fails closed if the
// secret is not configured on the deployment.
function isAuthorized(request: Request) {
  const expected = process.env.CONVEX_API_TOKEN;
  if (!expected) return false;
  return request.headers.get('authorization') === `Bearer ${expected}`;
}

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
