# Push notification service

Optional Express service for administrator broadcasts through Firebase Cloud Messaging.

Install with `npm ci`. Configure the variables listed in `.env.example` in the process environment, then run `npm start`. Local development can load a private environment file with `node --env-file=.env server.js`.

Application Default Credentials must refer to an authorized service identity. Keep service account files outside the repository.

`GET /health` reports process availability. `POST /api/send-push-to-all` requires a Firebase ID token in the Authorization Bearer header with the admin custom claim. Revoked tokens are rejected.

The JSON body contains title, message and an optional HTTPS imageUrl. The service selects eligible device tokens, respects notification opt-outs and records the authenticated administrator in the audit log.

The cooldown is per process. Deploy a single instance or introduce a shared rate limiter before horizontal scaling. The frontend uses the callable Functions implementation by default; this server is an alternative integration.
