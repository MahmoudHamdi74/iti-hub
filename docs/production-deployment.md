# Production deployment

Create separate Vercel projects for the two frontends in this monorepo:

| App | Root Directory | Configuration |
| --- | --- | --- |
| Public website | `client` | `client/vercel.json` |
| Admin dashboard | `admin` | `admin/vercel.json` |

The committed configurations build each app and rewrite frontend routes to
`index.html`, so opening or refreshing `/search`, `/settings`, or an admin route
works. Keep the existing client `VITE_API_BASE_URL` pointing at the deployed API.
Deploy the backend from this same revision as well: username validation and
persistence run on the backend, not on Vercel's static frontend.

The admin production build now replaces `environment.ts` with
`environment.prod.ts`. Its API base includes `/api` because admin endpoints are
mounted only at `/api/admin`. The standalone Vercel build overrides the base URL to `/`.
The normal `npm run build` in `admin` retains `/admin/` for deployments served by
the Express backend; that deployment must include `admin/dist/admin/browser`.

After deploying, check a direct URL and refresh in both apps, sign in to admin,
then change a test account's username and reload its profile. A Vercel response
with `DEPLOYMENT_NOT_FOUND` means the domain has no valid deployment; reconnect
that domain to the appropriate project. A frontend rewrite cannot repair that
account-level configuration.

Google sign-in also requires the deployed frontend origin in the Google OAuth
client's authorized JavaScript origins. Browser extensions blocking
`accounts.google.com/gsi/log` and browser popup policies cannot be overridden by
the application. Email sign-in remains available; CSP is not weakened.

## Email, blocking, comments and SEO verification

Gmail SMTP reads credentials from the backend environment. Gmail defaults to
STARTTLS on port 587; optional EMAIL_SMTP_PORT=465 selects implicit TLS. Set
FRONTEND_BASE_URL=https://www.itihub.tech in Azure so reset and verification buttons
point to production. There is no localhost fallback. The reset email no longer
contains a separate raw-link paragraph.

Run `node scripts/checkEmail.cjs --verify` from the server directory in Azure to
check configuration and SMTP authentication without sending mail. It reports only
configuration presence and sanitized error codes. NODE_ENV=test intentionally
suppresses delivery and must not be used in production.

Previously reset/resend could return success after SMTP failed. They now return
503; registration preserves the unverified account and tells the client delivery
failed so the user can retry OTP. SMTP acceptance is not proof of inbox delivery.
Local isolated tests sent real OTP/reset emails through Gmail; the recipient's
pasted reset email confirms reset receipt. OTP inbox receipt and delivery from
Azure remain unconfirmed. Azure SMTP logs/access are still needed to identify the
production delivery failure; changing the port is not a confirmed diagnosis.

Blocked authors and reposts of their posts are filtered before pagination across
feeds, profiles, saved posts, search and direct post access. Cache keys include
block state, and block/unblock invalidates client views. Comments and replies sort
oldest first; visible reply controls preserve the existing single-level threads.
Published photos keep their aspect ratio without a fixed minimum-height frame.

The client build generates route-specific metadata shells, robots.txt and a sitemap
for home, communities, branches and tracks. These are static metadata, not SSR of
community content. Authentication/private pages are noindex. Explicit Vercel and
Netlify rewrites and the Vite preview middleware serve the correct shell on direct
extensionless URLs. Runtime canonical URLs exclude query parameters.

Validation: 38 client feature tests, 95 production translation checks, backend
mail-failure/block/comment integration tests and existing feature/realtime tests
passed. The production build passed. Chrome production-preview checks cover
320px, 390px and 1440px layouts, real reply submission, wide/portrait photos,
metadata, sitemap and robots. No production database records were changed.

## Post counts, reposts and deletion cleanup

Profile post totals are calculated from actual posts (including reposts), so old
negative counters no longer appear. Create/repost/delete paths reconcile stored
user/community totals. Admin deletion shares the same cleanup as user deletion.

The repost menu previously cancelled the click event before Headless UI could
open it. It now uses a native MenuButton. Create/edit/repost API responses await
buildPostResponse instead of serializing a Promise as an empty object. Mutations
refresh profile/post/community caches; server feed caches are invalidated on writes.

Deleting a post removes dependent reposts, comments, reply likes, saves, post likes
and related notifications. Deleting a comment removes its replies and associated
alerts, while retaining/rebuilding grouped alerts for surviving interactions.
Notification removal and corrected unread counts are broadcast to connected
recipient devices. Reads prune historical alerts with missing post/comment targets.

Validation: the original negative-count, empty-repost-response and orphan-alert
cases were reproduced in isolated MongoDB tests before the fix. User/admin deletion,
remaining grouped comments, legacy reply targets, repost deletion, permission checks
and two-device notification removal are covered. Frontend menu actions and unread
badge refresh passed with the feature suite; production build passed. Deploy both
client and server for the complete fix. No production records were edited locally.
