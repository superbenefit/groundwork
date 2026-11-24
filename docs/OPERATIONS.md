# Operations

Production: https://groundwork.superbenefit.dev, Worker `groundwork` on the SuperBenefit Cloudflare account.

## Deploying

Workers Builds deploys production when `main` changes, and a Preview for every other branch. There is no manual deploy step.

## Configuration

| Setting | Where | Notes |
|---|---|---|
| `TURNSTILE_SITE_KEY` | `wrangler.jsonc` `vars` | Production widget for `groundwork.superbenefit.dev`. Previews use Cloudflare's test key in `previews.vars`. |
| `TURNSTILE_SECRET` | Worker secret (dashboard) | Pairs with the site key. |
| `COOKIE_SECRET` | Worker secret (dashboard) | Signs session cookies. A random value of 32+ characters. Changing it signs everyone out once; saved groups stay. |
| `MODEL_PICK`, `MODEL_WRITE`, `MODEL_FALLBACK` | `wrangler.jsonc` | See [ARCHITECTURE.md](ARCHITECTURE.md#models). |
| `AI_GATEWAY_ID` | `wrangler.jsonc` | Gateway `groundwork`: rate limit 60 requests/min, spend alert on the account. |
| KV `OH_CACHE` | `wrangler.jsonc` | Namespace `groundwork-openhaven-cache`; shared by production and previews. |

Production refuses to start sessions if either secret is missing or the site key is a test key ("Sessions are not configured on this deployment").

## Checking production

- `GET /api/health` returns `{ "ok": true, "preview": false, "snapshot": "<date>" }`. The snapshot should be under a day old (the cron runs at 04:17 UTC). If it's `null`, the next briefing creates it.
- `POST /api/dev/run` returns 404.
- In a private window: Turnstile passes, a briefing completes in about 15 seconds, and a follow-up question gets an answer.
- Workers & Pages → groundwork → Observability: look for `briefing.failed` events and uncaught exceptions. Each finished run logs `briefing.done` with its duration, model usage and whether the briefing was written by the model or the template.

## Limits

| Control | Limit |
|---|---|
| Briefings | 20 per browser per week (ISO week, UTC; resets Monday 00:00 UTC) |
| Follow-up questions | 200 per browser per week |
| Burst | 3 briefings and 20 questions per minute per browser; 10 session starts per minute per IP |
| AI Gateway | 60 requests per minute, account-wide |
| DeepSeek V4.1 Flash | 20 requests per minute (Workers AI); structured calls fall back to Gemma 4 |
| Retention | Workspaces and their briefings are deleted 30 days after the last visit |

## Cost

At list prices (Nov 24, 2026): about $3 per 1,000 briefings and $0.50 per 1,000 follow-up questions, plus the $5/month Workers Paid base. Demo traffic should stay within $5–10/month. The spend alert on the AI Gateway is the early warning.

## Rolling back

Workers & Pages → groundwork → Deployments → choose the previous version → Rollback. Durable Object data (groups, briefings) is not affected by a code rollback. Revert the merge on `main` afterwards so the next deploy doesn't bring the change back.

## Rotating secrets

- `COOKIE_SECRET`: set a new value in the dashboard. Everyone passes Turnstile once more; nothing is lost.
- `TURNSTILE_SECRET`: rotate in Turnstile, then update the secret. Sessions that already have a cookie are unaffected.
