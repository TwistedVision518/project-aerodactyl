# Project Aerodactyl

Project Aerodactyl is a release hub for custom ROM builds targeting the Nothing Phone 2a and Nothing Phone 2a Plus. It is designed to present current ROM versions, source-side changes, builder notes, and per-ROM release tracking in a clean layout that works well on both desktop and mobile.

Live site: `https://project-aerodactyl.netlify.app`

GitHub: `https://github.com/TwistedVision518/project-aerodactyl`

## Stack

- React
- TypeScript
- Vite
- CSS with custom motion and scene effects
- Netlify for hosting

## Local Development

Install dependencies:

```bash
pnpm install
```

Start the dev server:

```bash
pnpm dev
```

Build for production:

```bash
pnpm build
```

Run lint checks:

```bash
pnpm exec eslint .
```

## Content Editing

Per-ROM content now lives in:

`src/content/roms/`

Each ROM has its own JSON file, which makes it easy for other builders to update only their own release lane without touching the layout.

Shared site sections still live in:

`src/content/site/site-content.json`

That file controls:

- GCam recommendations and config links
- Source Pulse entries
- Builder Notes entries
- Community hub copy and Telegram URL
- Device coverage cards
- Expansion / workflow cards
- GitHub comments configuration

If you want live release buttons, update the `telegramUrl` value inside the matching ROM JSON file with the correct Telegram post link.

If you want the homepage Telegram community button to go live, update `communityHub.telegramUrl` inside `src/content/site/site-content.json`.

Builder workflow guide:

`CONTRIBUTING.md`

Content editing guide:

`src/content/README.md`

Validate content before pushing:

```bash
pnpm content:check
```

## Deployment

The site is already connected to Netlify and can be redeployed from this project directory.

Manual production deploy:

```bash
pnpm --package=netlify-cli dlx netlify deploy --prod
```

Netlify project:

`https://app.netlify.com/projects/project-aerodactyl`

## Android App

The project can also be shipped as an Android app through Capacitor while keeping the website as the primary codebase.

Build the web app and sync it into the Android project:

```bash
pnpm android:sync
```

Open the Android project in Android Studio:

```bash
pnpm android:open
```

If you only need to refresh the bundled web assets without a full native sync:

```bash
pnpm android:copy
```

The native Android project lives in:

`android/`

## Notes

- The layout is organized per ROM to avoid mixing release context across different builds.
- Shared homepage content is JSON-based so other builders can update it without editing React files.
- Mobile performance is prioritized by reducing heavier pointer effects on coarse/touch devices.
- Weaker devices automatically receive a lighter rendering profile to keep the site usable for more people.
- The visual system uses a near-AMOLED black base with animated color fields layered behind the content.
