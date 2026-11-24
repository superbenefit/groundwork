# Release checklist: groundwork.superbenefit.dev

Production deploys when `main` changes (Workers Builds). Merge the stack bottom-up: #1 → #2 → #3 → #4 → #5.

## Before the first production deploy (dashboard, one time)

These need someone with access to the SuperBenefit Cloudflare account. None can be done from the repo.

1. **Turnstile widget.** Turnstile → Add widget → hostname `groundwork.superbenefit.dev`, mode Managed.
   - Done: site key `0x4AAAAAAGQXeHxPm9HUPaLm` is in `wrangler.jsonc` → `vars.TURNSTILE_SITE_KEY` (previews keep the test key).
   - Add the **secret key** as a Worker secret: Workers & Pages → groundwork → Settings → Variables and secrets → Production → `TURNSTILE_SECRET` (type Secret).
2. **Cookie secret.** Same place: `COOKIE_SECRET`, a random value of 32+ characters (for example the output of `openssl rand -base64 48`).
   Without both secrets, production refuses to start sessions ("Sessions are not configured on this deployment").
3. **AI Gateway `groundwork`.** Already created and funded. Set:
   - Rate limiting: 60 requests per minute.
   - A spend alert on the account.
   - Caching can stay off: every call passes `skipCache`.
4. **Custom domain.** `groundwork.superbenefit.dev` is already attached to the `groundwork` Worker (it currently serves the dashboard's "Hello world"). No DNS change is needed.

## After merging to main

- [ ] Workers Builds shows the production build as successful.
- [ ] `https://groundwork.superbenefit.dev/api/health` returns `"preview": false` and a snapshot date. If the snapshot is `null`, the first briefing creates it; the daily cron (04:17 UTC) refreshes it after that.
- [ ] `https://groundwork.superbenefit.dev/api/m0/run` returns 404 (preview-only endpoints are off in production).
- [ ] Open the site in a private window: Turnstile passes (it may show a checkbox), onboarding → research → briefing completes.
- [ ] Ask one follow-up question; it answers.
- [ ] Workers Observability shows no uncaught exceptions for the run.

## Limits in production

| Control | Limit |
|---|---|
| Briefings | 20 per browser per week (ISO week, UTC; resets Monday 00:00 UTC) |
| Follow-up questions | 200 per browser per week |
| Burst | 3 briefings and 20 questions per minute per browser; 10 session starts per minute per IP |
| AI Gateway | 60 requests per minute account-wide (set in step 3) |
| DeepSeek V4.1 Flash | 20 requests per minute (Workers AI); overflow falls back to Gemma 4 for structured calls |
| Retention | Workspaces and their briefings are deleted after 30 days without a visit |

## Cost

At list prices (Nov 24, 2026), about $3 per 1,000 briefings and $0.50 per 1,000 follow-up questions, plus the $5/month Workers Paid base. Expected total for demo traffic: $5–10/month.

## Rollback

Workers & Pages → groundwork → Deployments → pick the previous version → Rollback. Durable Object data is unaffected by a code rollback.
