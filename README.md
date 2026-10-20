# AkadilEDU

Course delivery and exam practice in Kazakh, Russian and English.

Students access assigned courses, watch lessons, complete quizzes and review results. Administrators manage courses, enrolments, tests and accounts. Firebase Authentication identifies users; Realtime Database stores application data. Cloud Functions handle privileged operations and AI-assisted imports.

## Run locally

Requires Node.js 22.12 or later and a configured Firebase project.

```sh
npm ci
npm ci --prefix functions
npm ci --prefix backend
```

Copy `.env.example` to `.env` and fill in the Firebase web configuration, local host and port. Enable the authentication providers you use and authorize the application domain in Firebase Authentication.

```sh
npm run dev
```

Vite prints the local address. Missing configuration produces an explicit unavailable screen. There is no demo account or seeded production data.

## Configuration

`VITE_*` values are public browser configuration. Never put service credentials or AI keys in them. AI imports use the `GEMINI_API_KEY` Cloud Functions secret and the server-only endpoint in `functions/.env.example`.

Administrators require the Firebase Auth custom claim `admin: true`. A database role or an email address alone does not grant administrator access. See [deployment and migration](docs/DEPLOYMENT.md) before applying the new database rules to an existing installation.

## Checks

```sh
npm run check
npm audit
npm audit --prefix functions
npm audit --prefix backend
```

The check command runs candidate-file security checks, lint, unit tests and the production build. Database rule tests run when `FIREBASE_DATABASE_EMULATOR_HOST` is set; CI runs them against an isolated Firebase demo project.

## Project structure

| Directory | Purpose |
| --- | --- |
| src | React application and shared translations in i18n.js |
| functions | Privileged Firebase operations, course catalog and AI import |
| backend | Optional authenticated push notification service |
| scripts | Security checks and administrative migration tools |
| tests | Validation, HTTP authorization and database rule tests |

## Contributing

Enable the local commit guard with `git config core.hooksPath .githooks`. It checks the staged snapshot for credentials and prohibited client patterns. CI repeats the checks.


Keep interface text in `src/i18n.js` for all three languages. Use configuration for deployment-specific values. Do not add emojis, debug output, fabricated results or unfinished screens. Add comments only for non-obvious logic. Keep commit subjects short and specific.

Read [security guidance](SECURITY.md), [deployment requirements](docs/DEPLOYMENT.md) and the [review report](docs/REVIEW.md). Exam practice runs in the browser and is not a tamper-proof assessment system.
