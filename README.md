# Compassion Doula Services

Next.js public website with a custom Website Studio at `/admin`, backed by Strapi 5 and SQLite.

## Start locally

Use Node 22 or 24.

```sh
npm install
npm install --prefix backend
npm run cms:setup
npm run dev:all
```

Open http://localhost:3000 for the website and http://localhost:3000/admin for Website Studio. Setup creates a unique local password in `.local-admin.txt`; this file and all secrets are ignored by Git. Setup preserves existing credentials and data.

Alternatively run `npm run cms:dev` and `npm run dev` in separate terminals. Stop both with Ctrl+C. The backend uses port 1337. Its native admin interface is disabled; use the custom Next.js studio.

## Editing your website

1. Sign in using `.local-admin.txt`.
2. Choose a page or shared section. Edit text, links, images and descriptions.
3. Open repeated items to edit, add, remove or reorder slides, packages, FAQs, testimonials, gallery photos and service steps.
4. Choose **Change image** to select an existing photo or upload a JPG, PNG or WebP (up to 8 MB). Add a meaningful image description.
5. **Save draft** stores changes privately. **Preview** shows your current edits, including unsaved changes.
6. **Publish** saves and publishes the entire website draft. Public pages read published content without a rebuild.

Site settings controls the logo, navigation, footer and search metadata. Contact settings includes the email, Instagram and booking link. The editor covers the existing five pages and their content; creating new page layouts or changing CSS remains a development task. The media library retains uploads so replacing an image does not break other pages.

The contact form saves real inquiries in Strapi, visible under **Inquiries**. It does not send email notifications. The preview blocks form submissions. Test entries marked `CMS verification` can be ignored.

## Editor accounts

The bootstrap creates the account identified by `EDITOR_EMAIL` only if it does not exist. `EDITOR_PASSWORD` is used only for that initial creation; changing it and restarting Strapi does not change an existing password.

To reset an existing local website editor, stop Strapi first and run this from the repository root in an interactive terminal:

```sh
npm run editor:reset-password --prefix backend -- editor@example.com
```

Use the local editor's actual email for a local test. Enter the new password twice at the hidden prompts; it must be at least 14 characters. The command refuses missing users and accounts without the local provider and `site-editor` role. It changes only the password, never creates an account, and does not read the new password from the environment. Restart Strapi, sign in to `/admin` with the new password, and confirm that the old password no longer works. Avoid making content edits during verification. Previously issued sessions may remain valid until they expire; sign out existing sessions separately.

For production, after deploying the code using your normal reviewed deployment procedure, stop the Strapi PM2 process, back up the SQLite database and uploads, run the same command with the production editor email, and restart Strapi. Replace `STRAPI_PROCESS` with the actual PM2 process name and `BACKUP_DIRECTORY` with a private, access-restricted location outside the repository:

```sh
cd /path/to/Doula-Services
pm2 stop STRAPI_PROCESS
install -d -m 700 BACKUP_DIRECTORY
cp -p backend/.tmp/data.db BACKUP_DIRECTORY/data.db
for suffix in -wal -shm; do
  if [ -f "backend/.tmp/data.db$suffix" ]; then cp -p "backend/.tmp/data.db$suffix" "BACKUP_DIRECTORY/data.db$suffix"; fi
done
cp -a backend/public/uploads BACKUP_DIRECTORY/uploads
npm run editor:reset-password --prefix backend -- owner@compassion.local
pm2 start STRAPI_PROCESS
```

Use the configured database path if it differs from `backend/.tmp/data.db`, and verify the backup succeeded before resetting. Keep the backend stopped until the reset finishes, and restart it even if the command reports an error. Strapi loads its normal application lifecycle during the command, so use a deployed, configured database and take the backup first. Test locally against a disposable database, never against production data. The older `npm run cms:account` command also creates accounts and modifies account settings; do not use it for this password-only procedure.

Keep production `.env` files, SQLite databases (including journal/WAL files), backups and uploads out of Git. The repository ignores `.env*`, `backend/.tmp` and uploaded media; store backups outside the repository, and check `git status` and `git check-ignore` before committing. Never commit credentials or database copies.

## Data and architecture

- `content/defaults.json`: initial website content, seeded only into an empty database.
- `app/cms-site.tsx`: public content-driven frontend.
- `app/admin/`: custom responsive editor and authenticated preview.
- `app/api/cms/`: same-origin proxy with an HttpOnly editor session cookie.
- `backend/`: Strapi API, role policy, image uploads, inquiry storage.
- `backend/.tmp/data.db`: SQLite database (content, accounts, inquiries, media metadata).
- `backend/public/uploads/`: uploaded images.

Back up the database and uploads together while Strapi is stopped. Preserve environment secrets securely. Do not delete `.tmp/data.db` to restart the app. When Strapi is unavailable, the public website falls back to bundled initial content; editing, publishing and contact submission report an error. Drafts and live snapshots are separate. Concurrent stale saves return a conflict instead of overwriting newer work.

## Verify

```sh
npm run test:editor-reset --prefix backend
npm run typecheck
npm run build
# With both servers running:
npm run test:cms
```

The integration check verifies login, draft isolation, publication, stale saves, unsafe links, image validation/delivery, private inquiries and origin checks. It restores the initial content but leaves a small test image and a clearly identified test inquiry. Run against a local development database only. Browser checks are in `scripts/cms-browser-check.cjs`; set `PLAYWRIGHT_PATH` to an installed Playwright package if using another machine.

## Deployment notes

Deploy Next.js and Strapi as separate Node services. Build Next.js with `npm run build`, then run `npm start`; run `npm start --prefix backend` for Strapi (JavaScript backend, no compilation needed). Set `NODE_ENV=production`, `APP_ORIGIN` to the HTTPS frontend origin, `STRAPI_URL` to the backend's private address and fresh Strapi secrets. Configure persistent database/uploads storage; an ephemeral or static-only host will not preserve edits. Keep Strapi on a private interface behind the frontend proxy; if exposing it, configure the host/firewall and explicit CORS origins. Use a trusted reverse proxy with request-size/rate limits for production traffic.

The local inquiry throttle is in memory and limits each sender email; add a trusted per-visitor gateway limiter for a public deployment. No email provider or automated account recovery is configured.

Dependency review: compatible Sharp, Vite and qs patches are pinned. The current Strapi dependency tree still reports upstream advisories in Nodemailer, React Router and stream-json. Email sending, the native Strapi dashboard and data import are not used by Website Studio. Review upstream fixes before public deployment; do not force an incompatible Strapi downgrade with `npm audit fix --force`.

Replace illustrative testimonials and any sample business copy with approved content before launch. Existing photos and logos remain bundled in `public/`.

