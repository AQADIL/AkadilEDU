# Security

Do not post credentials, access tokens, student records or database exports in issues.
Report vulnerabilities through GitHub private vulnerability reporting when it is available.
Otherwise contact the repository owner privately without including live credentials.

All `VITE_*` variables are public browser configuration. Gemini keys and service-account
credentials belong only in server secret storage. Firebase web configuration is public
and is not an authorization boundary.

Authorization uses Firebase custom claims and versioned Database/Storage rules.
Frontend guards control navigation only. A database `role` field does not grant administrator authority.

Before deploying security changes, complete the migration steps in `docs/DEPLOYMENT.md`.
Previously exposed service-account private keys and browser-exposed Gemini keys must be revoked and replaced. Removing a key from
the current files does not remove it from Git history or previously deployed assets.

A real service-account private key was found in the historical `backend/README.md`.
It still requires revocation in Google Cloud. Keep the repository private until the
credential is revoked and history cleanup is coordinated. Local unpublished commits
also contain a Gemini key and must not be pushed.

Practice-test results are calculated in the browser. They are learning records, not
tamper-proof examination scores or externally accredited certificates.
