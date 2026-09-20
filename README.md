# MangaHarvest Queue Worker

Cloudflare Worker that triggers the MangaHarvest queue updater every 5 minutes.

## Flow

\`\`\`
Cloudflare Cron
    ↓
MangaHarvest Queue Worker
    ↓
GET /api/v1/cron/update?limit=10
    ↓
MangaHarvest updater
\`\`\`

## Required secrets

Do not commit secrets to GitHub.

Set the production values with Wrangler:

\`\`\`bash
npx wrangler secret put MANGA_HARVEST_URL
npx wrangler secret put CRON_SECRET
\`\`\`

Optional variable:

- \`UPDATE_LIMIT\`: number of queued manga to process per run. Defaults to \`10\`.

For local development, create a \`.dev.vars\` file:

\`\`\`
MANGA_HARVEST_URL=https://YOUR-MANGA-HARVEST-DOMAIN
CRON_SECRET=YOUR_CRON_SECRET
UPDATE_LIMIT=10
\`\`\`

The \`.dev.vars\` file is ignored by Git.

## Deploy

\`\`\`bash
npm install
npx wrangler login
npx wrangler secret put MANGA_HARVEST_URL
npx wrangler secret put CRON_SECRET
npx wrangler deploy
\`\`\`

## Test locally

Run the worker:

\`\`\`bash
npx wrangler dev --test-scheduled
\`\`\`

Then trigger the scheduled handler:

\`\`\`bash
curl "http://localhost:8787/cdn-cgi/local/scheduled?format=json"
\`\`\`

Check worker health:

\`\`\`bash
curl http://localhost:8787/health
\`\`\`

## Notes

The Worker only triggers the existing authenticated MangaHarvest cron endpoint. It does not store or expose the CRON secret.

After confirming the Cloudflare Worker is running, disable any duplicate scheduler that targets the same endpoint to avoid unnecessary duplicate requests.
