# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| latest  | ✅ Yes             |

## Reporting a Vulnerability

**Do NOT open a public issue for security vulnerabilities.**

Instead, please email us at **aetheriaarchitect@proton.me** with:

1. Description of the vulnerability
2. Steps to reproduce
3. Potential impact
4. Suggested fix (if any)

We will respond within **48 hours** and aim to patch critical issues within **7 days**.

## Security Measures

LastEnvelope uses the following security practices:

- **AES-256-GCM** encryption for vault data (client-side) and uploaded files (server-side)
- **PBKDF2** with 600,000 iterations for key derivation
- **bcrypt** (12 rounds) for password hashing
- **JWT** sessions with 7-day expiry
- **Rate limiting** on all auth endpoints
- **CSRF protection** via origin/host verification
- **CSP headers** and security headers in production
- **Timing-safe comparison** for verification codes
- **Input validation** with Zod schemas on all API endpoints
- **No secrets in source code** — all credentials via environment variables

## Disclosure Policy

We follow responsible disclosure. After a fix is released, we will credit the reporter (if desired) in our changelog.
