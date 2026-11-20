# Authentication diagnosis and deployment

## Verified evidence

Inspected the repository and public deployment on 21 November 2026 (India time).

- Frontend: `https://finsight-ai-exai.onrender.com`.
- Backend: `https://finsight-api-bu84.onrender.com`.
- The deployed JavaScript uses `https://finsight-api-bu84.onrender.com/api` and `credentials: 'include'`.
- A public GET to `/api/auth/me` with the frontend Origin and **no Cookie** returns 401 with `Authentication required. Please sign in.` It includes `Access-Control-Allow-Origin: https://finsight-ai-exai.onrender.com` and `Access-Control-Allow-Credentials: true`.
- This specific response originates in the missing-cookie branch of `authMiddleware`. It is correct for an anonymous visitor. CORS and the deployed frontend API URL are not the cause of that response.
- Render access was subsequently connected to Falak’s confirmed workspace. Runtime logs show Prisma P2021: `The table public.User does not exist in the current database`, on both login and registration. A read-only query of the Render `finsight-db` public schema returned no tables. This is the confirmed cause of the 500 responses and the inability to establish an authenticated session. The missing-cookie 401 is a consequence, not the registration failure. No production records were deleted.

## Request and session flow

`App` mounts `AuthProvider` on public and private routes. Its startup effect calls `refreshUser` → `authService.getCurrentUser` → `apiRequest('/auth/me')` → credentialed fetch to the API. A guest 401 is caught and resolves to `user=null`; the public landing page remains available. Only `/dashboard` is wrapped in `ProtectedRoute`.

The API runs CORS, JSON parsing, cookie-parser and the CSRF Origin guard before the auth router. `/me` requires the `token` cookie; it does not use bearer tokens or localStorage. The signed JWT expires after seven days. A valid JWT must resolve to an existing database user. Database failures remain 500 errors.

Registration hashes the password using bcryptjs, stores the user in PostgreSQL, signs a JWT, and sets the cookie. Login verifies the existing password and sets the same cookie. There is no separate server-side session table. Persistence depends on the browser sending the cookie, the same JWT_SECRET remaining configured, and the user remaining in the existing database.

Production cookie attributes are `HttpOnly; Secure; SameSite=None; Path=/`, with seven-day Max-Age and no Domain attribute (host-only on the backend). Logout clears the same cookie attributes. Do not set Domain to the frontend hostname or `.onrender.com`.

## Changes

- `backend/prisma/migrations/20261120000000_align_user_schema/migration.sql`: bridge the original integer User model to the UUID financial schema, add missing timestamps and the unique email index. Preserve the original migrations and existing user rows/password hashes. The bridge runs transactionally and stops on duplicate emails instead of deleting data.
- `backend/package.json`: `db:deploy` runs Prisma 7 `migrate deploy` with the explicit config; `prestart` applies pending migrations before the API begins listening. Add a client-generation build script.
- `backend/src/app.js`: trust the nearest production reverse-proxy hop so rate limiting handles Render forwarding headers correctly.
- `backend/test/migrations.test.js`: PostgreSQL migration regressions for a fresh database, preserved legacy users, and atomic failure on duplicate emails.

- `backend/utils/tokens.js`, `backend/src/index.js`: validate JWT_SECRET at startup; configuration faults are no longer swallowed as an invalid-session 401; explicitly sign and verify HS256.
- `backend/src/config/authCookie.js`, `backend/src/controllers/auth.controller.js`, `backend/src/middlewares/auth.middleware.js`: share cookie attributes between login, registration, logout and clearing expired/invalid cookies.
- `backend/src/routes/auth.route.js`: prevent caching session/user responses.
- `frontend/src/services/authService.js`: after login/registration, call `/me` to verify that the browser actually sends the issued cookie before reporting authenticated success. A rejected cookie produces an actionable error in the existing form. A network failure retains its separate error.
- `frontend/src/context/AuthContext.jsx`: prevent a delayed startup probe from overwriting a newer login/signup or logout; retain normal guest handling on public routes.
- `frontend/src/services/apiClient.js`, both `.env.example` files: align the local fallback port with backend port 5000 and document production configuration. Existing credentialed requests and UI styling are preserved.
- Backend and frontend package scripts, frontend lockfile, `frontend/vitest.config.js`, `backend/test/auth.test.js`, frontend `__tests__`: add regression tests. Backend uses Node's test runner/module mocks; frontend uses Vitest, jsdom and React Testing Library. Database operations in tests use an isolated in-memory substitute.

## Variables your friend must verify in Render

Backend service `finsight-api-bu84`:

| Variable | Required value/action |
| --- | --- |
| NODE_ENV | `production` (activates Secure and SameSite=None) |
| FRONTEND_URL | `https://finsight-ai-exai.onrender.com` (origin only, no path; comma-separated additional trusted origins only if needed) |
| JWT_SECRET | Keep the existing private, strong random secret; identical across instances and redeploys. Do not paste it into chat or commit it. Changing it invalidates existing sessions. |
| DATABASE_URL | Preserve the existing working PostgreSQL connection string. |
| GROQ_API_KEY | Preserve the existing key; the current app initializes the AI client at startup. |
| PORT | Use Render's supplied port; the server already reads it. |

Frontend service `finsight-ai-exai`:

| Variable | Required value |
| --- | --- |
| VITE_API_BASE_URL | `https://finsight-api-bu84.onrender.com/api` |

No secrets belong in VITE_ variables; they are compiled into public JavaScript.

## Exact deployment steps for the friend's account

1. Commit these changes and push/merge them to the Git branch connected to **both existing services**. Your friend should verify the linked repository and branch in each service's Settings. Do not create replacement services or databases.
2. On the backend service, open Environment and verify the values above while preserving all other existing variables. Save pending edits. Use Node 24 for this project's tests (verified locally with 24.9.0).
3. Verify the backend Root Directory is `backend`. If its existing build command already installs dependencies and generates Prisma successfully, retain it. Otherwise use `npm ci && npx prisma generate --config prisma7.config.ts`. Start Command: `npm start`. Its prestart hook now runs `npm run db:deploy` before starting the API. Keep dev dependencies available at build/runtime for the Prisma CLI (the current npm install build does so). `prisma7.config.ts` is the repository's actual nonstandard config filename; pass it explicitly.
4. Deploy the backend from the updated branch using Manual Deploy → Deploy latest commit (or the automatic deploy for that commit). Wait until the new deployment is Live. Health Check Path can use `/api/health`. Check runtime logs for configuration/startup errors. Merely restarting the old service does not deploy changed code or pending environment values.
5. On the frontend service, verify Root Directory `frontend`, Build Command `npm ci && npm run build`, and `VITE_API_BASE_URL` above. For a Render Static Site, Publish Directory is `dist`; retain the SPA rewrite `/*` → `/index.html` (Rewrite) for direct login/dashboard navigation. If the existing frontend is a web service, preserve its working serving command instead of converting service type.
6. Select Save, rebuild, and deploy after frontend environment edits, or deploy the latest commit with a new build. Vite reads VITE_API_BASE_URL at build time. Wait until Live and verify the intended commit is deployed for both services.
7. The backend prestart hook applies the three checked-in migrations in order, including the new User-schema bridge. No database reset, migration reset, seed, or data deletion is used. On the inspected production database there are no public tables yet. Subsequent starts apply only pending migrations; any failure stops startup for inspection.

Render references: [environment save/deploy options](https://render.com/docs/configure-environment-variables), [manual deploys](https://render.com/docs/deploys#manual-deploys), [health checks](https://render.com/docs/health-checks).

## Browser verification after deployment

1. In a private window, open the landing page. `/api/auth/me` should be 401 with no cookie; the page should remain usable. Browsers may still show this expected HTTP response in the console/Network panel.
2. Sign in with an existing account. In DevTools Network, inspect the POST `/api/auth/login` response locally: it should be 200 and set `token` with the production attributes above. Do not share its value.
3. The subsequent GET `/api/auth/me` must send the Cookie and return 200. Refresh `/dashboard`; it should remain authenticated. Optionally test registration using an account you intend to keep; the local test suite already covers registration without touching production.
4. Logout, then request `/me`: expect 401 and a public page that remains usable. An expired or tampered token must also be rejected.
5. If login succeeds but the cookie is absent on `/me`, inspect DevTools Issues and cookie blocked reasons. Separate onrender.com apps can encounter third-party cookie restrictions; `SameSite=None; Secure` does not override browser privacy policy. Confirm by allowing cookies for this site in a controlled test. For broad browser compatibility, serve frontend and API under a shared custom-domain site (e.g. app.example.com/api.example.com), or use a proper same-origin API proxy. Do not weaken cookies, move JWTs into localStorage, or disable CSRF/CORS. [Cookie reference](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie).
6. If a cookie is sent but rejected, your friend should check JWT_SECRET consistency and expiration. If `/me` returns 500, inspect backend logs/database connectivity rather than treating it as a guest.

## Local validation

From `backend`: `npm ci`, then `npm test` (Node 24; HTTP tests bind only to localhost).

From `frontend`: `npm ci`, `npm test`, `npm run build`.

Full frontend lint also reports an existing `react-hooks/set-state-in-effect` finding in `src/context/DashboardContext.jsx`, outside this authentication change. Run `npx eslint src/context/AuthContext.jsx src/context/__tests__/AuthContext.test.jsx src/services/authService.js src/services/apiClient.js src/services/__tests__/authService.test.js vitest.config.js` to check the changed frontend files.

Validation result: 14 backend tests (including PostgreSQL migration tests) and 13 frontend tests passed; changed frontend files passed lint; production build passed with the existing large-bundle warning. The backend suite needs permission to bind its localhost HTTP server in restricted execution environments. Both existing Render services were subsequently deployed successfully; see the deployment record below.

Additional validation: applied all three migrations to a temporary native PostgreSQL database with the installed Prisma 7 CLI, then applied them again (no pending migrations). Prisma migrate diff reported no difference from prisma/schema.prisma. Real Prisma registration, password verification/login, and current-user queries passed against that isolated database. It was shut down after testing.

## Completed production deployment — 21 November 2026

Confirmed workspace: Falak’s `My Workspace` (`tea-d7heutpo3t8c73admeag`). Code commit: `e3c9d0782e4597fd66e3e992be7a6404e3c7d118`, pushed to the existing repository’s `main` branch.

- Backend deployment `dep-dc0drnqjnfac73ba4fcg`: Live at 05:26 IST. [Backend dashboard](https://dashboard.render.com/web/srv-dc0d3hu7bikc73f5sfqg).
- Frontend deployment `dep-dc0drpbl550s73cqjn9g`: Live at 05:25 IST. [Frontend dashboard](https://dashboard.render.com/static/srv-dc0d67k9v7es739rtjv0).
- Merged backend NODE_ENV=production and FRONTEND_URL=https://finsight-ai-exai.onrender.com without replacing other variables. Existing JWT_SECRET, database connection and other secrets were preserved. The frontend API URL was inspected and already correct.
- Saved and verified the frontend `/*` → `/index.html` rule with action **Rewrite**. Direct `/login` now returns HTTP 200.
- Retained the working Render build commands (`npm install && npx prisma generate` for the backend, `npm install && npm run build` for the frontend), root directories and publish directory. Logs confirm the backend build discovers prisma7.config.ts. The new npm prestart hook applies migrations before `node src/index.js` starts.
- Automatic deployments did not arrive after the Git push; deployment lists and event histories showed no queued/building deployment for the new commit. Explicit latest-commit deploys were triggered after that check, and both reported the correct code SHA and reached Live.
- Production `_prisma_migrations` confirms all three migrations finished successfully with none rolled back. The database was initialized through migrations, without any reset or data deletion.

Live HTTP verification passed: health 200; registration 201; registration cookie /me 200; login 200; login cookie /me 200; incorrect password 401; invalid token 401 with cookie clearing; logout 200 with cookie clearing; logged-out /me 401 with no-store; exact credentialed CORS. HttpOnly, Secure, SameSite=None, Path=/, seven-day Max-Age and no Domain attribute were verified from live Set-Cookie headers. Frontend /, /login, /signup and /dashboard return the SPA document with HTTP 200 (the dashboard is still guarded by React authentication).

Two clearly marked `FinSight Deployment Check` accounts with generated `deployment-check-...@example.invalid` addresses were retained. A transient closed HTTP connection interrupted the first verification after registration, so a second account was used for the completed checks. Their random credentials were neither printed nor saved. No pre-existing records were deleted or altered. Expired-session handling was verified locally; no production signing secret was retrieved. HTTP cookie round-trips were verified; browser privacy settings can still block cross-site cookies as described above.

For future code deployments, push the intended commit to main, inspect Render’s deploy list, and verify the intended SHA. If no automatic deployment is queued or active, use Manual Deploy → Deploy latest commit for each service. Wait for Live and repeat the browser checks above. Never run migrate reset or delete the database.
