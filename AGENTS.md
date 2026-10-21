# Project conventions

- Keep user-facing text and translations in `src/i18n.js` for Kazakh, Russian and English.
- Use real backend data. Do not fabricate metrics, answers, purchases or successful responses.
- Read service URLs, ports and credentials from environment variables. Never put private keys in `VITE_*` variables.
- Do not add emoji, console logging, dead code or obvious comments.
- Authorize privileged operations on the server and in Firebase rules. Client route guards are only a UI convenience.
- Preserve existing local changes. Run lint, tests, the security check and the production build before publishing.
- Keep commit subjects short and descriptive.
- Maintain the existing root README. Do not add additional README files unless explicitly requested.
- Use descriptive branch names without assistant or tool branding.
- Reuse the active task branch for related changes and follow-up fixes. Create a new branch for a separate task, not for each small edit.
- Do not commit environment files, credentials, database exports, editor state or build output.
