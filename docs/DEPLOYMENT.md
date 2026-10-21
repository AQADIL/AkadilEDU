# Deployment and migration

These changes require coordinated deployment. A frontend-only release will not configure the new authorization rules, catalog or AI endpoint.

## Prepare

1. Back up Realtime Database and record the currently deployed rules.
2. Use a staging Firebase project first. Select the intended project explicitly with the Firebase CLI.
3. Install dependencies in the root and functions directories. Run `npm run check` and emulator rule tests.
4. Fill local .env from .env.example. Firebase web configuration is public; restrict the web API key appropriately in Google Cloud. Never put an AI key in a VITE variable.
5. Set FIREBASE_DATABASE_URL and Application Default Credentials in the administrative shell. Keep credential files outside Git.

## Existing accounts and courses

Scripts default to a dry run and report counts without personal data.

```sh
node scripts/admin.mjs migrate-profiles
node scripts/admin.mjs grant-admin USER_UID
node scripts/admin.mjs sync-catalog
node scripts/admin.mjs audit-password-fields
```

Review the selected project, backups and counts before rerunning a migration with `--apply`. Grant the verified administrator's custom claim before activating new rules. Refresh the administrator's session afterward.

The catalog contains summaries only. Populate it before releasing the frontend; subsequent course changes are synchronized by syncCourseCatalog. Enrolments use users/{uid}/courses/{courseId} with a numeric millisecond expiryDate or no expiry. Review and migrate older purchasedCourses / expiresAt records before release.

If the password-field audit finds records, treat them as exposed credentials, restrict access and arrange password resets and removal under a separate remediation plan. Do not export their values into logs.

## AI import

Set the Cloud Functions secret through the interactive CLI:

```sh
firebase functions:secrets:set GEMINI_API_KEY
```

Set GEMINI_API_URL in the Functions environment to the chosen Gemini generateContent REST endpoint. It must use HTTPS and generativelanguage.googleapis.com. This endpoint selects the model. Set DATABASE_REGION to the Realtime Database region so the catalog trigger runs beside the database. Configure billing and quotas for the selected services.

Revoke any Gemini key previously included in a browser build or repository history. Removing source code does not revoke a key or erase existing bundles.

## Publish

Deploy Functions first, initialize the catalog and administrator claims, then publish the frontend and Storage rules before restricting database reads. Older clients must reload to use callable course access. The GitHub workflow follows this order.

```sh
firebase deploy --only functions
firebase deploy --only hosting,storage
firebase deploy --only database
```

Push notifications use authenticated callable Functions.

## GitHub Actions

The Firebase workflow runs security checks, lint, tests, the production build,
dependency audits and Database/Storage emulator tests. Deployment runs only after
these checks succeed on `main`; pull requests run checks without deployment access.
The workflow can also be started manually from `main` to retry a release.

Configure these repository variables:

| Variable | Purpose |
| --- | --- |
| FIREBASE_PROJECT_ID | Deployment project |
| FIREBASE_HOSTING_URL | Published site used for verification |
| FIREBASE_WORKLOAD_IDENTITY_PROVIDER | Repository-scoped Google Cloud identity provider |
| FIREBASE_DEPLOY_SERVICE_ACCOUNT | Dedicated deployment service account |
| GEMINI_API_URL | Server-side model endpoint |
| DATABASE_REGION | Region of the Realtime Database instance |

Store the browser environment as a JSON object in the repository secret
FIREBASE_WEB_CONFIG, using the VITE keys listed in .env.example. Do not include
private credentials. The workflow validates the configuration and writes ignored
environment files before deployment. GEMINI_API_KEY stays in Google Secret Manager.

The identity provider restricts authentication to the repository and owner numeric
IDs, the main branch, production environment and .github/workflows/check.yml.
The deployment account can deploy Firebase services and act as the existing
Functions runtime account. It has no private key and cannot authenticate from a PR.

Production deployments are serialized. The final step compares published asset
names with dist/index.html and checks that those assets are accessible. If this
fails, inspect the deployment before rerunning the workflow.

## Verify

Check registration, email verification, sign-in after reload, explicit sign-out, profile changes, admin permissions, assigned and expired courses, video progress, quiz submission and language switching. Verify a real AI import with a valid answer key and one invalid import. Send a push only to a designated test audience.

Firebase rules restrict course records. External video or Drive URLs remain shareable by anyone who has them; use a protected media provider if stronger distribution control is required.

CI uses an isolated demo project for rules. Live email, video, AI, push and credential configuration require deployment checks.

## Lesson playback

Deploy `getCourseContent` and `getLessonPlayback` before the frontend that calls them.
After the new frontend is available, deploy the database rules that restrict `courses`
to administrators. Course data does not need migration: the server removes video URLs
from student responses. Administrator editing continues to use the existing records.

The per-account limits are 60 course-content requests and 12 playback requests per
minute. The browser reuses concurrent identical requests without caching video IDs
persistently. Monitor callable errors after release and verify an enrolled account,
an expired enrollment, a blocked account and anonymous access.
