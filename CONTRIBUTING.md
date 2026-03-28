# Contributing to LastEnvelope

Thank you for your interest in contributing! LastEnvelope is an open-source encrypted digital legacy platform, and we welcome contributions from the community.

## How to Contribute

### Reporting Bugs

1. Check [existing issues](https://github.com/GrossBuilder/LastEnvelope/issues) to avoid duplicates
2. Open a new issue using the **Bug Report** template
3. Include steps to reproduce, expected vs actual behavior, and your environment

### Suggesting Features

1. Open an issue using the **Feature Request** template
2. Describe the use case and why it would benefit users
3. Be open to discussion — we may suggest alternative approaches

### Submitting Code (Pull Requests)

1. **Fork** the repository
2. Create a feature branch from `master`: `git checkout -b feature/your-feature`
3. Make your changes following our code style
4. Run checks before submitting:
   ```bash
   npx tsc --noEmit        # No TypeScript errors
   npm run lint             # No lint errors
   npm test                 # All tests pass
   ```
5. Write a clear PR description explaining **what** and **why**
6. Submit a Pull Request to `master`

### What We're Looking For

- 🌍 **Translations** — Add or improve i18n dictionaries (see `src/lib/i18n/dictionaries/`)
- 🧪 **Tests** — Increase test coverage for API routes and components
- ♿ **Accessibility** — Improve a11y, screen reader support, keyboard navigation
- 📱 **Mobile UX** — Better responsive layouts and touch interactions
- 📖 **Documentation** — Improve README, add guides, API docs
- 🐛 **Bug fixes** — Always welcome

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/LastEnvelope.git
cd lastenvelope-app

# Install dependencies
npm install

# Copy environment template
cp .env.example .env
# Fill in your local values (see .env.example for descriptions)

# Set up database
npx prisma migrate dev

# Run development server
npm run dev
```

## Code Style

- **TypeScript** — strict mode, no `any` unless absolutely necessary
- **React** — functional components, hooks only
- **Naming** — camelCase for variables/functions, PascalCase for components
- **i18n** — all user-facing strings must go through the i18n system
- **Security first** — validate all inputs, use parameterized queries, never trust client data

## Architecture Overview

```
src/
├── app/           # Next.js App Router pages & API routes
├── components/    # Reusable React components
├── lib/           # Shared utilities (auth, crypto, email, etc.)
└── generated/     # Auto-generated Prisma client (do not edit)
```

- **Auth**: NextAuth v5 with JWT strategy
- **Database**: Prisma ORM + PostgreSQL
- **Encryption**: AES-256-GCM (client-side for vault, server-side for files)
- **Payments**: LemonSqueezy (card) + USDT TRC-20 (crypto)
- **i18n**: 8 languages, dictionary-based

## Commit Messages

Use clear, descriptive commit messages:

```
feat: add Japanese translation
fix: prevent path traversal in file upload
docs: update API documentation
test: add tests for vault encryption
```

## Code of Conduct

Be respectful, inclusive, and constructive. We follow the [Contributor Covenant](https://www.contributor-covenant.org/version/2/1/code_of_conduct/).

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
