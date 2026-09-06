# Deploying via GitHub

This covers getting the project onto GitHub, then deploying to Hostinger straight from that
GitHub repository (instead of manually zipping and uploading files, as described as the fallback
in [HOSTINGER-SETUP.md](./HOSTINGER-SETUP.md)).

## 0. Install Git

Neither `git` nor the GitHub CLI (`gh`) are installed on this machine. Install Git for Windows
first: <https://git-scm.com/download/win> (accept the defaults during install). Restart your
terminal/VS Code afterward so it picks up the new `PATH`.

A GitHub account is also required - free at <https://github.com/join> if you don't have one.

## 1. Initialize the repository locally

From the project root (`C:\Users\wc\OneDrive\Desktop\Vibe App`):

```powershell
git init
git add .
git status
```

**Before committing**, check the `git status` output carefully - confirm you don't see `.env`,
`.env.test`, `node_modules/`, `frontend/dist/`, or anything else that shouldn't be tracked. The
`.gitignore` already excludes these, but it's worth a second look before the first commit,
especially since this project handles real financial data once deployed.

```powershell
git commit -m "Initial commit: Hostinger rewards app (Phases 1-15)"
```

## 2. Create the repository on GitHub

1. Go to <https://github.com/new>.
2. Pick a repository name (e.g. `hostinger-rewards-app`).
3. **Recommended: choose Private.** This codebase encodes real business rules (commission rates,
   reward logic, admin capabilities) - there's no secret credential in it (`.env` is gitignored),
   but there's no reason to make the business logic itself public either, unless you specifically
   want to.
4. Do **not** check "Add a README" / "Add .gitignore" / "Add a license" - the repo already has
   these locally, and GitHub will refuse to let you push if the remote has commits the local repo
   doesn't (or you'll need to merge unrelated histories).
5. Click **Create repository**. GitHub shows you a remote URL like
   `https://github.com/<your-username>/hostinger-rewards-app.git` - copy it.

## 3. Connect and push

```powershell
git branch -M main
git remote add origin https://github.com/<your-username>/hostinger-rewards-app.git
git push -u origin main
```

The first push will prompt you to sign in to GitHub (a browser window opens, or you'll be asked
for a Personal Access Token if using HTTPS without the credential manager). Follow the prompt.

From then on, `git add .`, `git commit -m "..."`, `git push` is the normal workflow for updates.

## 4. Deploy to Hostinger from the GitHub repo

Hostinger's hPanel has a **Git** deployment feature (usually under **Advanced -> Git**, label may
vary by plan) that clones a repository directly into your hosting account - no manual zip/upload
needed.

1. In hPanel, go to **Advanced -> Git**.
2. Click **Create Repository** (or **Add repository**).
3. **Repository URL**: paste the same `https://github.com/<your-username>/hostinger-rewards-app.git`
   URL from step 2.
   - If the repo is **private**, Hostinger needs read access. It typically shows you a **deploy
     key** (a public key) to add under the GitHub repo's **Settings -> Deploy keys** (grant
     read-only access) - follow whatever Hostinger's Git panel instructs. Alternatively, some
     Hostinger plans accept a URL with an embedded GitHub Personal Access Token
     (`https://<token>@github.com/<user>/<repo>.git`) - check what your panel offers.
4. **Branch**: `main`.
5. **Directory to deploy to**: choose a folder under your hosting account (e.g. `rewards-app`) -
   this becomes the **Application root** you'll point the Node.js app at next.
6. Click **Create** / **Deploy**. Hostinger clones the repository into that folder.
7. Continue from **step 2 onward in [HOSTINGER-SETUP.md](./HOSTINGER-SETUP.md)** (Node.js
   Application Manager: select Node version, set application root to the folder from step 5, set
   startup file to `backend/server.js`, add environment variables - `.env` was never committed, so
   it must be created here or added through the panel's Environment Variables UI - run npm
   install, build the frontend, restart, connect domain, SSL, cron).

## 5. Updating after the first deploy

Whenever you push new commits to GitHub:

1. In hPanel's Git section, click **Pull** (or **Sync** / **Deploy latest**, depending on the
   panel) to pull the latest commit into the cloned folder. Some Hostinger plans support an
   automatic webhook-triggered deploy on push - check if that's available on yours and enable it
   if you'd rather not click Pull manually every time.
2. If `package.json` changed, re-run `npm install` (via the Node.js app panel or SSH).
3. If frontend code changed, re-run `npm run build` inside `frontend/` (see HOSTINGER-SETUP.md
   step 8).
4. **Restart the Node.js application** - required after any of the above, since Node caches
   modules at startup and won't pick up new files otherwise.

## What never goes to GitHub

`.gitignore` excludes `.env`, `.env.test`, `node_modules/`, and `frontend/dist/`. This means:

- Real credentials (DB password, JWT secret, CRON secret, SMTP credentials) live **only** in
  Hostinger's environment variables panel (or a `.env` file created directly on the server) -
  never in the repository, never in GitHub, never in a commit.
- `npm install` must be run on the server after every deploy (dependencies aren't committed).
- The frontend must be built on the server (or built locally and the `dist/` folder uploaded
  separately, if you'd rather not run the build on Hostinger) after every deploy that touches
  frontend code.
