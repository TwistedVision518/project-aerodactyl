# Content Editing

Project Aerodactyl is set up so builders can update content without touching the React layout files.

## Per-ROM Updates

Edit the matching file in `src/content/roms/`.

Each ROM file controls:

- version
- build date
- status
- branch
- Telegram release link
- highlights
- accent colors

## Shared Homepage Updates

Edit `src/content/site/site-content.json`.

That file controls:

- community hub copy and Telegram URL
- Source Pulse entries
- Builder Notes entries
- device coverage cards
- expansion/workflow cards

## Validation

Run this before committing:

```bash
pnpm content:check
pnpm build
```
