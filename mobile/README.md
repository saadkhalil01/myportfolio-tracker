# MyPortfolio mobile

Expo app for iOS, Android, and web. Includes Google account sync, offline storage, PSX quotes, holdings and portfolio editing, investment/liability/target management, wealth totals, daily valuation snapshots, and JSON backup/restore.

## Development

From `mobile/`, run `yarn start`, then open a development build or the web preview. Use `yarn ios` or `yarn android` to build locally with the corresponding native SDK installed. Dependencies are already declared in `package.json`.

Copy `.env.example` to `.env` and supply your Supabase public URL and anon key for cloud sign-in. Without them, the app runs with a separate device-only guest portfolio. Never put a service-role key in the app.

Use the same Supabase project and `user_portfolios` table as the website. Enable Google OAuth and allow `myportfoliopsx://auth/callback` in Supabase redirect URLs, plus the web preview origin when testing web sign-in. The table requires `user_id` as a unique key, `data` JSON, `updated_at`, and row-level policies restricting reads and writes to the authenticated owner.

## Data

Edits save locally before cloud sync. Failed sync retains pending changes; pull to refresh or use Account → Sync now to retry. Concurrent edits on another device surface a conflict. Export a backup before using Load cloud copy, which discards local pending edits. Guest and account portfolios remain separate; use backup/restore to transfer intentionally.

Account → Share JSON backup exports the current portfolio and also exposes selectable JSON. Paste JSON into the same field to review and confirm a restore. Restoring replaces the active portfolio and syncs it to the current account.

Growth records one valuation per day when you save changes or choose Save today's valuation. Quotes missing from PSX use average purchase price. Investment stock categories are counted once with brokerage holdings. Targets assess each goal independently using assets excluding pension.

## Checks and builds

- `yarn test` runs model and sync regression tests.
- `yarn export` generates iOS, Android, and web bundles in `dist/`.
- EAS profiles in `eas.json` cover development, preview APK, and production builds. Store distribution requires your signing credentials and EAS project configuration.

Bundle export does not validate native device behavior, OAuth provider configuration, or production database policies. Test those with your configured account on a device before release.
