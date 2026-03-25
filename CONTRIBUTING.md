# Contributing

Project Aerodactyl is set up so each builder can update their own ROM entry without touching the layout code.

## Fastest Way To Update A ROM

1. Open `src/content/roms/`
2. Edit the JSON file for your ROM
3. Update the fields you need:
   - `version`
   - `buildDate`
   - `status`
   - `branch`
   - `telegramUrl`
   - `maintenanceNote`
   - `highlights`
4. Commit with a simple message such as:
   - `Update crDroid to v12.7`
   - `Refresh PixelOS release metadata`

## Adding A New ROM

1. Duplicate an existing JSON file in `src/content/roms/`
2. Rename it to your ROM name, for example `rom-name.json`
3. Set a unique `order` number
4. Fill in the ROM-specific fields

The site will pick it up automatically.

## Local Checks

```bash
pnpm exec eslint .
pnpm build
```

## Release Links

Use a full Telegram post URL in `telegramUrl`, for example:

```text
https://t.me/your_channel_name/123
```

If `telegramUrl` is empty, the site shows a disabled release button instead of a broken link.
