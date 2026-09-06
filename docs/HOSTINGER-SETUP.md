# Hostinger Node.js Deployment

This guide covers deploying the backend to Hostinger's Node.js Application Manager. Complete
[DATABASE-SETUP.md](./DATABASE-SETUP.md) first so the database exists before the app starts.

Menu labels are placeholders - they can differ slightly by hosting plan, so treat this as a guide
rather than an exact click-by-click script.

## 1. Upload the project

**Preferred: deploy from GitHub via hPanel's Git feature** - see
[GITHUB-DEPLOYMENT.md](./GITHUB-DEPLOYMENT.md) for pushing this project to GitHub and connecting
it to Hostinger. It makes future updates a `git push` + a Pull/restart instead of a manual
re-upload every time.

Otherwise, upload manually:

- **hPanel -> Files -> File Manager**: zip the project locally (excluding `node_modules/` and
  `.env`), upload the zip, then extract it into a folder such as `rewards-app/`, or
- **SSH** (if enabled on your plan): `git clone`/`scp` the project into your hosting account.

## 2. Open Node.js Application Manager

1. In hPanel, go to **Advanced -> Node.js** (label may vary, sometimes under **Website ->
   Node.js**).
2. Click **Create Application**.

## 3. Select the Node.js version

Choose the closest available LTS version to Node **18.x or newer** (20.x/22.x are fine too - this
project has no version-specific syntax). Check what Hostinger currently offers in the version
dropdown, since availability changes over time.

## 4. Set the application root

Point **Application root** to the folder you uploaded (e.g. `rewards-app`).

## 5. Set the startup file

Set **Application startup file** to:

```
backend/server.js
```

## 6. Configure environment variables

In the Node.js app's **Environment Variables** section, add every variable from
[`.env.example`](../.env.example) that's needed for the current phase:

```
NODE_ENV=production
PORT=3000
DB_HOST=...
DB_PORT=3306
DB_NAME=...
DB_USER=...
DB_PASSWORD=...
```

(`PORT` may be managed/overridden by Hostinger's proxy - check what the panel shows after
creating the app and adjust if needed.) Never commit a real `.env` file to version control.

## 7. Install dependencies

Most Hostinger Node.js panels have an **Run NPM Install** button on the application page - use
it. If SSH is available, you can instead run:

```
cd rewards-app
npm install --omit=dev
```

## 8. Build the frontend

The frontend is a React SPA (Vite) that builds to static files - it is **not** a separate
application and does not need its own Node.js app in hPanel. The existing Express app
(`backend/server.js`) serves it automatically once `frontend/dist/` exists.

Build it before (or as part of) each deploy, either locally and upload the result, or via SSH on
Hostinger itself:

```
cd frontend
npm install
npm run build
```

This produces `frontend/dist/`. Make sure that folder is included in whatever you upload/deploy -
`backend/src/app.js` checks for `frontend/dist/index.html` at startup and serves the SPA (with
client-side routing support) if it's present; if it's missing, the app still runs fine as an
API-only server. After adding or updating the build, **restart the Node.js app** (step 9) so it
picks up the new `frontend/dist/` - the check only runs once at startup.

## 9. Start / restart the application

Use the **Restart** button in the Node.js Application Manager after installing dependencies or
changing environment variables.

## 10. Verify it's running

Visit:

```
https://<your-domain-or-subdomain>/api/health
```

Expected response:

```json
{ "success": true, "message": "Application is running" }
```

## 11. Connect a domain/subdomain

In **Domains** (or the Node.js app's own domain setting), point your domain or a subdomain (e.g.
`app.yourdomain.com`) to this Node.js application.

## 12. Configure SSL

Under **Security -> SSL**, issue a free Let's Encrypt certificate for the domain/subdomain and
enable **Force HTTPS**.

## 13. Configure the daily reward cron job

The app never runs a background worker - Hostinger Cron calls a protected HTTP endpoint once a
day instead, which is what actually pays out rewards. This does **not** require your computer,
VS Code, or Claude Code to be open; it runs entirely on Hostinger's servers.

1. Make sure `CRON_SECRET` is set in the Node.js app's environment variables (see step 6) -
   generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
   if you haven't already.
2. In hPanel, go to **Advanced -> Cron Jobs**.
3. Choose **Add New Cron Job**.
4. Set the schedule to run **once a day**, at a low-traffic time - e.g. `5 0 * * *` (00:05 every
   day). hPanel's UI usually offers a "Once a day" preset plus custom minute/hour fields if you
   want a specific time.
5. Set the command to call the endpoint with your `CRON_SECRET` as a bearer token. Use whichever
   of these Hostinger's cron environment supports (curl is more common, wget is the fallback):

   ```
   curl -s -X POST -H "Authorization: Bearer YOUR_CRON_SECRET" https://yourdomain.com/api/internal/jobs/process-daily-rewards
   ```

   ```
   wget -q -O /dev/null --header="Authorization: Bearer YOUR_CRON_SECRET" --post-data="" https://yourdomain.com/api/internal/jobs/process-daily-rewards
   ```

   Replace `yourdomain.com` with the actual domain/subdomain this app is deployed on, and
   `YOUR_CRON_SECRET` with the real value (keep it out of anything public - hPanel stores the
   cron command privately, but never paste it into a shared doc or commit).
6. Save the cron job.
7. To verify it's wired up correctly without waiting a day, run the same `curl`/`wget` command by
   hand once (e.g. via SSH, or by temporarily pasting it into a terminal) and check the JSON
   response - it reports `processed`/`skipped`/`failed` counts for that day. Running it again
   immediately after should show everything as `skipped` (already credited) rather than crediting
   twice - that's the idempotency guarantee working as intended.
8. Check the Node.js app's log viewer in hPanel afterward for the `[daily-reward-job]` log lines
   confirming what ran.

## Troubleshooting

- **App won't start**: check the Node.js app's log viewer in hPanel for the actual error -
  usually a missing environment variable or a dependency that wasn't installed.
- **`/api/health` times out**: confirm the app was restarted after the last deploy, and that the
  startup file path is exactly `backend/server.js`.
- **Database connection failed (in logs)**: double check `DB_HOST`/`DB_PORT`/`DB_NAME`/`DB_USER`/
  `DB_PASSWORD` against what phpMyAdmin shows for that database.
