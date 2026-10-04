# Registration and route audit — 2026-10-04

## Findings and changes

### Realtime unread counts and profile follow-up

- The active layout never mounted the unread-count queries or rendered badges.
  Navigation now displays red numbered notification/message badges on desktop,
  the mobile top bar and mobile drawer, capped visually at `99+`.
- Message events previously updated only one cached conversations page, so users
  who had not opened that page could miss list/count updates. Both global event
  handlers now refresh authoritative queries; listeners attach before connecting,
  reconnect refreshes missed events, and 30-second polling/focus refresh recovers
  when realtime transport is unavailable. Socket.IO starts with polling and can
  upgrade to WebSocket.
- Unread message counts sum messages rather than counting conversations. Reading
  messages/notifications synchronizes badges on the reader's other devices.
  Visible conversations mark newly arriving messages read, and messages sharing
  text are deduplicated only by message ID.
- Profiles include a Message action that creates or resumes a direct conversation
  with authentication and existing blocking checks. Own profiles omit this action.
  Clicking the avatar opens an accessible photo dialog; only the owner can edit.
  Photo updates preserve session role fields. Mobile actions wrap, profile text
  breaks within the viewport, and statistics use three compact columns.

Validation for this follow-up: 25 client regression tests, 95 production dictionary
tests, and the production build pass. Targeted ESLint has no errors (one existing
generic `useSocketEvent` dependency warning). `npm run test:realtime` in `server`
verifies real Socket.IO delivery over polling and WebSocket to two devices using
isolated MongoDB, duplicate-text messages, unread totals and cross-device reads.
The local production preview also verified live message/follow-notification
badges, reading new messages while a conversation is open, and profile/photo/direct
message actions at 320, 390 and 1440 pixels without overflow or runtime exceptions.
Photo upload UI is tested with a mocked upload response; production media storage
was not modified. Deploy both client and backend after merging.

### Registration and route audit

- Registration returned `EMAIL_EXISTS` / `USERNAME_EXISTS`, but the wizard only
  handled `EMAIL_TAKEN` / `USERNAME_TAKEN`. The shared error component displayed
  Axios's `ERR_BAD_REQUEST` wrapper rather than the API error. Both now handle
  the actual server response; duplicate-index races use the same error codes.
- Pending email registrations now resume at OTP verification, without changing
  the existing account's password or issuing a token before verification.
- Availability checks and registration normalize email/username consistently.
  The client now matches the server's 3–30 character username rule and excludes
  dashes. Stale availability responses are ignored and the loading state clears
  after failures.
- Google Identity enables the supported FedCM button flow. The legacy popup
  fallback has `Cross-Origin-Opener-Policy: same-origin-allow-popups` on Vercel and
  Netlify. The Google control opts out of the global image viewer. CSP was not
  weakened. A real Google-account login remains unverified; the clean browser
  showed the official button, and backend token validation passed isolated tests.
  References: [Google's FedCM migration guide](https://developers.google.com/identity/gsi/web/guides/fedcm-migration)
  and [Google's popup policy setup](https://developers.google.com/identity/gsi/web/guides/get-google-api-clientid).
- The route audit found mobile overflow in profile statistics and community
  action buttons. Both wrap within the viewport now.

## Verification

- `cd client && npm run test:features`: 19 UI regression tests.
- `cd client && npm run test:production-translations`: 94 dictionary tests.
- `cd server && npm run test:features`: registration, OTP recovery, username
  database persistence and duplicate detection against isolated MongoDB.
- `cd server && npm run test:google`: signed-token validation, expiry/audience
  rejection, verified email, account creation/linking and blocked-account denial.
- `cd server && npm run test:routes`: 319 API route/role combinations. Every
  mounted endpoint is checked for route-not-found/server errors; write requests
  use unauthenticated invalid bodies, so this is not a claim that every possible
  authenticated mutation was exercised.
- Production browser audit: 39 client routes as guest/member at desktop/mobile
  sizes (156 checks), plus 13 admin routes as guest/admin at both sizes (52
  checks). Real application code used a disposable local API and seeded database;
  no production mutations. No runtime crashes. Eight targeted rechecks confirmed
  profile/community overflow is gone after the fix.
- Production client build and targeted lint pass. These local checks do not
  certify the live deployment's configuration or external email delivery.

## Authorized production cleanup

The requested scope is user-generated database data, preserving admin accounts
(`admin`, `super_admin`, `branch_admin`), branches, rounds, tracks and role metadata.
Dynamic collections include posts, comments, communities/groups, interactions,
messages, notifications, enrollments, track uploads/records/folders/chat/progress,
jobs and events. Track membership references to removed users are removed too.
Remote media storage is not deleted by this database script.

`server/scripts/resetUserData.cjs` defaults to a read-only inventory. It refuses
unknown populated collections and requires the explicit database name for writes:

```sh
node server/scripts/resetUserData.cjs
node server/scripts/resetUserData.cjs --apply --database=<name-from-inventory>
```

Before applying, verify the configured database is the intended production
database. The script reads `DB_URL` from the server environment, writes a verified
EJSON/gzip backup to the gitignored `.private-backups` directory, then performs
the cleanup in a MongoDB transaction. The backup contains private account data;
keep it local. Transaction-capable MongoDB is required. Restart the backend after
cleanup to clear its in-memory feed caches, and check the after-counts for any
concurrent writes. `npm run test:cleanup` tests retention, memberships and backup
contents on an isolated replica set.

**Production cleanup has NOT run.** The configured Atlas credentials were
rejected with authentication error code 8000 (`AtlasError`). No production
documents were changed or backed up. Correct `server/.env` locally; never paste
the URI or password into a chat or commit it.
