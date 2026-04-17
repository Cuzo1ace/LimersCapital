# Uptime Monitors — Limer's Capital

**Canonical source of truth** for external uptime probes. If monitors are swapped to a different provider, update this file in the same commit as the change.

**Audit reference:** `Limers-Capital-Security-Audit-Report-April-2026.md` C-02 recommendation 4.
**Provisioning runbook:** `docs/SECURITY.md §10 Step 4`.

---

## Current provider

**Better Stack** (free tier: 10 monitors, 3-minute interval, email + webhook alerts)

Dashboard: https://betteruptime.com/team/<ORG>/monitors *(link to be filled in by operator on setup)*

---

## Monitors

### 1. Frontend — `limerscapital.com`

| Field | Value |
|---|---|
| URL | `https://limerscapital.com` |
| Method | GET |
| Expected status | 200 |
| Expected body contains | `Limer's Capital` |
| Interval | 3 minutes |
| Timeout | 10 seconds |
| Regions | Ashburn (us-east) + Frankfurt (eu-central) |
| Alert recipients | Founder email, optional Slack `#incidents` webhook |
| Alert after | 2 consecutive failures (6 minutes down) |
| Note | Cloudflare Pages occasionally returns 520/521 during edge deploys — the 2-failure threshold prevents redeploy pings waking the founder. |

### 2. API Proxy — Jupiter price probe

| Field | Value |
|---|---|
| URL | `https://limer-api-proxy.solanacaribbean-team.workers.dev/jupiter/price?ids=So11111111111111111111111111111111111111112` |
| Method | GET |
| Expected status | 200 |
| Expected body contains | `So11111111111111111111111111111111111111112` |
| Interval | 3 minutes |
| Timeout | 10 seconds |
| Regions | Ashburn (us-east) |
| Alert recipients | Founder email, optional Slack `#incidents` webhook |
| Alert after | 2 consecutive failures |
| Note | This URL exercises the worker's Jupiter passthrough end-to-end — a real upstream call. If Helius/Jupiter is degraded, this probe fails before users notice. SOL's mint address is used because it is the single most price-sensitive asset we serve. |

### 3. (Optional — add when Phase 1 CSP enforces) CSP report endpoint liveness

| Field | Value |
|---|---|
| URL | `https://limer-api-proxy.solanacaribbean-team.workers.dev/csp-report` |
| Method | OPTIONS |
| Expected status | 405 *(method not allowed, proves the route exists)* |
| Interval | 15 minutes |
| Note | Low priority; added only once Phase 2 CSP enforcement makes the report endpoint user-facing-critical. |

---

## Alert routing

- **Page 1 (P1):** Founder email + SMS. Frontend or API proxy down >6 minutes.
- **Page 2 (P2):** Founder email only. Single region failing, other region healthy.
- **Silent log:** Sentry `captureMessage('uptime-recovered', 'info')` on recovery — useful for mean-time-to-recovery metrics.

## On-call behavior

When paged:

1. Confirm via Cloudflare dashboard that Pages/Worker deployments are not mid-rollout (benign cause).
2. Check upstream status pages: [Helius](https://status.helius.dev), [Cloudflare](https://www.cloudflarestatus.com), [Supabase](https://status.supabase.com).
3. Check Sentry for correlated error spikes.
4. If genuine outage, tweet from `@limerscapital` acknowledging within 15 minutes. Post-mortem within 48 hours.

## Review cadence

- **Monthly:** verify alerts still route correctly (send yourself a test page).
- **Quarterly:** revisit thresholds — if the site matures past Colosseum and monitoring is noisy, adjust.
- **After every incident:** update this doc with what the outage taught you about missing monitors.
