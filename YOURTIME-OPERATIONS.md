# Your Time

Public page: https://jdb-builds.com/yourtime/
Private editor: https://jdb-builds.com/yourtime/private/

The clock targets the start of December 31, 2029, midnight America/Chicago, and counts upward afterward. Public visitors can read the suggestions and saved/completed list. Only the configured owner can edit. Her email is not in this repository.

## Hosting

Existing jdb-landing Cloudflare Pages project. Build command `npm run build`; output `dist`. The allowlisted build preserves the main site while excluding server source, tests, secrets, and configuration from public files. Functions are only routed to the Your Time API and private namespace. No other page uses the database.

Database: jdb-yourtime, binding YOURTIME_DB. Schema is in migrations. Do not apply any reset or seed command to production. It starts empty, and no local prototype/test data is imported.

Required production secrets: YOURTIME_ACCESS_ISSUER, YOURTIME_ACCESS_AUD, YOURTIME_OWNER_EMAIL. Cloudflare Access protects jdb-builds.com/yourtime/private and its children with a dedicated owner-only email policy. The server separately verifies token signature, issuer, audience, expiration, and owner email, and denies private requests on alternate hosts. Preview deployments have no production database binding.

## Everyday use

Open Your private space, receive the email sign-in code, then save suggestions or add your own. Did it keeps completed adventures. Delete removes a custom idea from the public page; Undo restores it. Clear deleted ideas removes the undo history from active storage (provider backups may retain older data temporarily). Saved ideas are public; do not enter private contact, travel-security, or other sensitive details.

Saving uses a revision check: if another device has changed the list, reload before saving again. Failed saves are visibly reported and never represented as successful.

## Checks and recovery

`npm ci`, `npm test`, `npm run build`. Test fixture server is loopback-only and not deployed. Cloudflare Pages deployment rollback restores site code, not list data. D1 Time Travel can recover accidental data changes within the account's retention window. Keep authentication enabled during any rollback.

Before editing auth, inspect existing apps. Your Time uses one-time PIN. Watchtower retains its Cloudflare provider; never reuse or expand its Jason-only policy for this page.
