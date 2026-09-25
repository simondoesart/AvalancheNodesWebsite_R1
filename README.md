# Avalanche Grid — Vercel deployment

This is a ready-to-import static site. No build, dependency installation, or environment variables are required. This package has not been deployed yet.

## Put your composition in the site

Open public/index.html in your browser. Import your saved settings and add your media, or open the supplied v6.7 HTML to configure it. Choose Save & share → Export Vercel page. Replace this folder's public/index.html with the downloaded index.html. This embeds your current settings, media and uploaded font. Local settings and uploads from an older browser file are not automatically available in a new file or on the hosted site.

## GitHub Desktop

1. Choose File → New repository. Name it avalanche-grid and choose a local parent folder. Create the repository.
2. Copy the CONTENTS of this extracted folder into the new repository folder. public and vercel.json must be directly inside the repository, not inside a second nested folder.
3. In GitHub Desktop, enter “Initial Avalanche grid” as the summary and Commit to main.
4. Click Publish repository. A private repository is fine; Vercel will need access to it.

## Vercel

1. Sign in at https://vercel.com/new with GitHub, grant access to this repository, and import avalanche-grid.
2. Framework preset: Other. Root directory: repository root. Output directory: public. Build command: empty. No environment variables. vercel.json supplies these settings.
3. Click Deploy. Vercel will provide the shareable production URL when deployment succeeds.
4. Open the production URL in a private browser window to check that recipients can access it. If Vercel asks them to sign in, review your project's Deployment Protection settings for the intended audience.

## Update the shared composition

Export Vercel page again, replace public/index.html, then Commit and Push origin in GitHub Desktop. Vercel's connected repository deploys new commits automatically. Visitors' edits stay in their browser; changing controls on the site does not publish those changes for everyone. Export and push the HTML to publish a new shared starting composition.

## Included source

source/ contains the reusable component, development demo, documentation and checks. Only public/ is deployed. To test source: node source/verify.mjs.

Official guides: https://vercel.com/docs/git and https://vercel.com/docs/builds/configure-a-build
