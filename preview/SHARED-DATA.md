# Shared data preview

The default preview now reads shared snapshots from the Sydney `vibecheck-dev` project (`koirkuoxosuhpvfukdkl`). `?demo=1` keeps simulated reports in browser storage only. Resetting samples never touches the database. Four seed venue listings remain unverified; no simulated scores were added to the shared database.

## Behavior

- Labels: The crowd, Social buzz, Party energy. Party energy bands: below 4 Chilled; below 7 Buzzing; 7 or higher Going off. Insufficient data is grey Awaiting vibes.
- Reports less than 60 minutes old count. At least 3 reports are required for scores; snapshots refresh every minute and on manual refresh.
- Shared submission requires a confirmed Supabase email account. Email/password authentication uses supabase-js 2.95.0, loaded from a pinned jsDelivr ESM URL. Session handling/refresh belongs to the SDK. No passwords are stored by app code. The frontend contains only the publishable project key.
- POST is verified with auth.getUser inside the Edge Function. Anonymous users, project API keys and forged JWTs cannot submit. The database RPC is SECURITY INVOKER and executable only by service_role. It validates inputs and uses a transaction advisory lock to enforce 15 minutes between reports per user/venue, plus 8 per hour per user.
- Raw reports and internal user IDs remain inaccessible to browser roles. Public GET returns explicitly selected summary fields, without raw reports, identifiers, or score totals.

## Running

`git pull --ff-only`

`node preview/check-calculations.cjs`

`python -m http.server 8000 --directory preview`

Keep the Codespace port private. The service-role key is supplied only by the Supabase Edge runtime. The migration `database/submission.sql` has already been applied remotely; it is a snapshot, not a CLI-generated migration filename. Edge source: `supabase/functions/venue-vibes/index.ts`. Config documents why platform JWT checking is off: public GET and authenticated POST share this endpoint.

## Verification

Calculation tests pass. Deployed API checks: public GET 200 with four empty venue summaries; missing and forged identity POST 401; OPTIONS 204; invalid method 405. Database transaction test under service_role: valid save, duplicate cooldown, invalid score and unknown venue checks pass; test user/reports rolled back. Security advisor has no warnings; the raw reports table intentionally has no browser-access policy.

## Remaining before broader testing / release

Account signup and email confirmation still require a human test. Default Supabase email delivery is limited to project-team addresses; configure SMTP before inviting other testers. Set the permanent Site URL/redirect URLs once hosting is chosen; default confirmation redirects may lead to localhost (return to the preview to sign in). No emails were sent as part of automated testing. Authenticated POST has been tested at the database layer; a real account submission through the complete browser flow remains to be verified.

This is a browser development preview. Maps, verified venue addresses, account deletion, retention policy, moderation/reporting, production abuse controls, privacy policy and native packaging/store submission still remain. Per-account cooldowns do not prevent coordinated abuse or multiple accounts. Dependency bundling/lockfiles and reproducible native builds belong in the production app; the preview uses an exact SDK CDN version and the Edge Function uses an exact npm version.
