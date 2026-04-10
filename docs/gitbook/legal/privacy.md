# Privacy Policy

Limer's Capital is committed to protecting user privacy. This policy describes how we handle data.

## Data We Collect

| Data Type | Storage | Purpose |
|-----------|---------|---------|
| Wallet address | In-memory only (not persisted to localStorage) | Session authentication, on-chain interactions |
| User progress | Supabase (anonymized, RLS-protected) | Education tracking, XP/LP calculations |
| Trade history | Supabase (anonymized, RLS-protected) | Paper trading state, leaderboards |
| Session data | Functional cookies only | Maintain login state |
| Analytics | PostHog (optional, anonymized) | Platform improvement |

## What We Do Not Collect

- Private keys -- never transmitted, never stored (wallet-standard only)
- Personal identity information -- no KYC on the platform itself (handled by Wam for fiat on-ramp)
- Browsing history outside the platform
- Device fingerprints

## Data Protection

- **Supabase Row-Level Security (RLS)** -- users can only access their own data
- **No cookies** except functional session data required for operation
- **Analytics are optional** -- PostHog can be opted out of
- **HTTPS everywhere** -- all data in transit is encrypted
- **No data sales** -- we do not sell or share personal data with third parties for advertising

## Your Rights

Consistent with GDPR and CCPA principles, you have the right to:

- **Access** -- request a copy of your data
- **Deletion** -- request removal of your data
- **Portability** -- export your data in a standard format
- **Opt-out** -- disable optional analytics tracking

To exercise these rights, contact us through our [social channels](../community/social.md).

[Read our Disclaimer -->](disclaimer.md)
