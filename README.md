# LastEnvelope — Digital Vault for Your Legacy

**Securely store passwords, documents, and final messages. Assign beneficiaries. If you stop responding — they receive their envelopes.**

## What is LastEnvelope?

LastEnvelope is a zero-knowledge encrypted digital vault with an automated **Dead Man's Switch**. Store your sensitive data — passwords, documents, messages, instructions — and assign them to beneficiaries. If you stop checking in, the system delivers your "envelopes" to the people you've chosen.

- **Zero-Knowledge**: Your vault is encrypted client-side with AES-256-GCM. We can never read your data.
- **Dead Man's Switch**: Periodic check-ins confirm you're okay. Miss them → grace period → beneficiaries notified.
- **USDT + Card**: Pay with cryptocurrency (USDT TRC-20) or credit card via LemonSqueezy.
- **8 Languages**: EN, ES, FR, DE, RU, TR, PT, AR (with RTL support).

## Features

| Feature | Description |
|---------|-------------|
| **Encrypted Vault** | AES-256-GCM with PBKDF2 key derivation (600K iterations) |
| **Beneficiaries** | Assign vault items to specific people |
| **Dead Man's Switch** | Configurable intervals (7-90 days) + grace period |
| **File Storage** | Server-side AES-256-GCM encrypted attachments |
| **Crypto Payments** | USDT TRC-20 with TronGrid verification |
| **Card Payments** | Credit card subscriptions via LemonSqueezy |
| **Support System** | Ticket system with file attachments |
| **Admin Panel** | Dashboard, users, payments, switches, support management |
| **Activity Logging** | Full audit trail of all user actions |
| **i18n** | 8 languages with RTL support |

## Tech Stack

- **Framework**: Next.js 16 + React 19 + TypeScript
- **Database**: PostgreSQL 16 + Prisma 7
- **Auth**: NextAuth v5 (JWT, 7-day sessions)
- **Styling**: Tailwind CSS v4
- **Email**: Resend
- **SMS**: Twilio
- **Payments**: LemonSqueezy + USDT TRC-20
- **Testing**: Vitest
- **Deployment**: Docker (multi-stage, non-root)

## Quick Start

```bash
# 1. Clone the repo
git clone https://github.com/GrossBuilder/LastEnvelope.git
cd LastEnvelope/lastenvelope-app

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env
# Edit .env with your values

# 4. Set up database
npx prisma migrate dev

# 5. Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Docker Deployment

```bash
# Production deployment
docker compose up -d

# The app includes:
# - Next.js app (port 3000)
# - PostgreSQL 16
# - Cron service (payment checks + switch monitoring)
```

## Plans & Pricing

| | Free | Pro ($4.99/mo) | Pro+ ($9.99/mo) |
|--|------|----------------|-----------------|
| Vault items | 5 | Unlimited | Unlimited |
| Beneficiaries | 1 | 10 | Unlimited |
| Files | 3 (50MB) | 50 (500MB) | Unlimited (2GB) |
| Switch interval | 30 days | 7-90 days | 7-90 days |

## Contributing

We welcome contributions! Whether it's translations, bug fixes, tests, or new features — check out our [Contributing Guide](CONTRIBUTING.md).

**Good first issues:**
- 🌍 Add a new language translation
- 🧪 Write tests for API routes
- ♿ Improve accessibility
- 📖 Improve documentation

See [open issues](https://github.com/GrossBuilder/LastEnvelope/issues) for things to work on.

## Security

- **Client-side encryption**: AES-256-GCM with PBKDF2-derived keys
- **Server-side file encryption**: AES-256-GCM with auth tags
- **CSRF protection**: Origin header validation
- **Rate limiting**: IP + email based
- **Content Security Policy**: Strict CSP headers
- **HSTS**: Enforced with preload
- **Bcrypt**: 12-round password hashing
- **Input validation**: Zod schemas on all API endpoints

Found a vulnerability? See [SECURITY.md](SECURITY.md).

## License

This project is licensed under the MIT License — see [LICENSE](LICENSE) for details.

## Contact

aetheriaarchitect@proton.me
