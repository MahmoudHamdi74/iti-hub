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
