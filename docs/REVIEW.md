# Review: 20 October 2026

## Scope

Reviewed application source, Firebase access paths, privileged functions, dependencies, Git candidate files, local Git history and the connected GitHub repository. Changes preserve the course, quiz editor and answer-review work already present in the checkout.

## Findings and changes

| Finding | Change |
| --- | --- |
| A real service-account private key exists in the remote history of backend/README.md | Removed it from current documentation; added staged-file and CI secret checks. The exposed key still requires revocation in Google Cloud. |
| An unpushed local commit includes a Gemini key in .env.production | Excluded the sensitive local commits from the publication branch. Removed client-side AI credentials and moved imports behind authenticated Functions. Rotate the old key if used in a browser build. |
| Administrator authority depended on email or database role | Uses Auth custom claims; Functions verify account state. Database rules also reject suspended administrators. |
| Profile saving could persist password fields | Password changes use Firebase Auth; database writes use an explicit profile-field list. Rules reject password fields. Existing records require a separate audit. |
| Unprotected push service and unbounded inputs | Added verified administrator authentication, input validation, cooldowns, recipient opt-outs and batched delivery. |
| Course summaries and protected lesson contents shared the same collection read | Added a separate summary catalog and enrolment/expiry rules for course contents. |
| Import failures could produce guessed answers or successful-looking fallback data | Removed stubs and guesses. Imports require valid supplied answer keys, validated question schemas and bounded requests. |
| Hardcoded interface text, emoji, debug logs and dead pages | Centralized interface strings in i18n.js, aligned all three locales and added regression checks. Removed console output, emoji and obsolete source files. |
| Home and shop exposed unfinished or fictional content | Home now offers account access or assigned courses; the old shop route redirects to the course catalog. |
| Enrollment updates, auth subscriptions and unavailable states were inconsistent | Fixed the expiry path, profile creation race and subscription cleanup. Added explicit course/profile load failures and retry actions. |
| Unsafe trusted LaTeX output and unnecessary decorative scripts | Disabled trusted KaTeX commands, removed the unused inline jQuery script and replaced quiz smiley faces with status icons. |
| Dependency advisories and oversized entry bundle | Updated affected packages, removed unused packages and split translations, motion and PDF editing into separate bundles. |

## Verified locally

- Security candidate-file check, ESLint and production build pass.
- 13 unit/integration checks pass in the standard suite. Two emulator suites intentionally skip outside an emulator.
- Database and Storage emulator run passes all 7 checks, including nested database cases.
- npm audit reports zero known vulnerabilities for the frontend, Functions and optional backend at review time.
- Browser checks cover guest home, sign-in, 404 navigation, protected-route redirects, language switching and persistence, and mobile layout. Screenshots and local diagnostic logs are kept outside Git.

## GitHub

Updated the repository description and topics and enabled vulnerability alerts. Added CI with pinned official actions, Dependabot configuration, a pull request template and security/deployment documentation. GitHub returned 404 for private vulnerability reporting; it was not enabled. Branch protection and secret-scanning availability remain separate repository/account settings.

The publication branch starts at remote main and contains the sanitized final snapshot. The original local main and its three unpushed commits are retained locally.

## Release requirements and limits

This review does not revoke cloud credentials or deploy the application. Revoke the exposed service-account key before considering the credential incident resolved. Do not make the repository public while the sensitive history remains accessible. History cleanup requires coordination with other checkouts and is not performed here.

Follow [deployment and migration](DEPLOYMENT.md): prepare a staging project, grant administrator claims, populate the summary catalog, configure the AI secret and deploy Functions, rules and frontend together. Existing enrolments using legacy field names require migration. The old live environment does not gain the new protections until deployment.

Live registration/email, authenticated course/video flows, real AI responses and notification delivery have not been verified against production. Client-generated session metadata and practice scores are not tamper-proof security evidence. External media links remain shareable. The optional Express cooldown is process-local.
