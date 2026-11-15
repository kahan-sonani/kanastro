# Kanastro

Responsive, open-source Vedic astrology application built with Next.js App Router. The application exports static pages; calculations run in a browser worker. Profiles have names and birth details, with no relationship categories. Comparison starts with two profiles and one shared division selector. The sidebar is expanded by default and collapsible; light/dark mode persists on the device.

## Run

Use Node 22.18+ (Node 25 is used in the current development environment). `npm run dev` serves Next.js on port 5173. `npm run preview` serves the production static export on port 4173.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

The app supports local profiles without an account. With Supabase configuration, Google sign-in saves profiles to an owner-restricted database. Existing local profiles are copied to an account only when the user selects that action.

```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

These are public browser settings. Never use a secret/service-role key in a `NEXT_PUBLIC_` variable. `.env.local` is ignored by Git and excluded from the downloadable source archive.

```sh
npm test
npm run build
npm run preview
```

## Implemented

- IndexedDB profile create/read/edit/delete; JSON export/import with validation and duplicate preservation.
- Supabase Google OAuth PKCE integration, cloud CRUD, account preferences, and explicit local-to-account import.
- North Indian SVG charts with sixteen named traditional divisions.
- Six ayanamsas, mean/true nodes, full-precision positions, degrees, nakshatras, padas, motion and natal houses.
- Birth-instant tithi, nakshatra, yoga and karana.
- Vimshottari mahadasha, antardasha and pratyantardasha; selectable year convention.
- Parashari sign lordships, full graha drishti, exaltation/debilitation/own sign and combustion thresholds.
- Jaimini seven/eight karakas, classical arudha padas, and rashi drishti.
- Comparison of two to four saved profiles; one division selector updates all panels.
- Light/dark themes, accessible custom selects and action menus, keyboard chart tabs, print layout.
- Client-side calculation worker, ephemeris checksum verification, no silent precision fallback.

## Scope boundaries

This is the first working milestone, not a claim to implement every Jyotish tradition. Bhava Chalit, Shadbala, Bhava Bala, Ashtakavarga, Vimsopaka, broad yoga catalogues, Jaimini dashas, additional dasha systems, transits, rectification history, saving comparisons to an account, account deletion, full offline/PWA caching and automated database backups remain later modules.

Unknown birth times are not assigned an invented ascendant. A birth time is currently required; approximate times are explicitly labelled. Birth dates are limited to 1800–2399, matching the bundled data. See [METHODS.md](METHODS.md) for all conventions and accuracy boundaries.

## Supabase setup

Project: `nckgkoaiwfibvirpcuyj` (`kanastro`). PostgreSQL 17.

The migration `supabase/migrations/20261115132337_initial.sql` was applied through the connected Supabase integration. Its filename matches the hosted migration history so a later GitHub/CLI deployment does not attempt to recreate the tables.

The tables are `public.kundli_profiles` and `public.account_preferences`. Both enable and force RLS. Anonymous/public table privileges are revoked. Authenticated users receive only select, insert, update and delete, with `auth.uid()` ownership checks on both existing and new row values.

`supabase/tests/ownership.sql` verifies owner access, cross-account denial, owner-spoofing rejection and anonymous denial. It creates transaction-scoped dummy users and rows and rolls everything back. This test passed against the hosted project. The post-migration Supabase security advisor returned no findings.

Project-level Auth settings are separate from database RLS. The canonical Site URL is `https://kanastro.kahansonani.com`, with exact redirect URLs for this domain, the former preview, and local development. Email/password sign-in and magic-link/OTP sign-in are disabled; anonymous and phone sign-in remain disabled. Email confirmation and secure email change remain enabled. Secure password change and current-password reauthentication were enabled as defensive defaults. Google sign-in is enabled. Nonce checks remain enabled, and users without an email are not allowed.

Provider setup and future deployment checklist:

1. Enable Google with an OAuth web client owned by the project owner. The Google callback is `https://nckgkoaiwfibvirpcuyj.supabase.co/auth/v1/callback`.
2. Keep Google's client secret in Supabase Auth provider configuration. Require a valid nonce and verified email; do not enable bypass switches.
3. Set the Auth Site URL to the deployed application origin. Allow only exact required redirect URLs, including the local development URL when needed. Avoid broad production wildcard redirects.
4. Leave anonymous and phone sign-in disabled. Disable email sign-up if Google is the only chosen sign-in method; keep email confirmation and secure email-change protection enabled for any retained email flow.
5. Retain refresh-token rotation and an appropriate JWT expiry. Do not enable paid session policies, branches, or add-ons for this free-tier deployment.
6. A Google Cloud OAuth consent app may need the owner to configure its audience and authorized domains before other users can sign in.

`supabase/config.toml` contains local development defaults; it is not proof of hosted Auth changes. The Google web client `Kanastro Web` is configured in Google Cloud project `sylvan-agility-514814-d4`. The OAuth audience is External / Testing, with the project owner added as a test user. End-to-end Google login and authenticated profile creation, reload, and deletion were verified on 2026-11-15; the temporary verification profile was removed. Before opening Google login to the public, complete Google branding requirements and change the Google app from Testing to Production. The frontend is configured for direct Vercel deployment from `kahan-sonani/kanastro`, with `kanastro.kahansonani.com` as the production domain. OAuth credentials are configured in Supabase and are not included in the frontend environment or repository.

The optional GitHub production integration can deploy migrations from this repository. Keep paid preview branching disabled. Frontend hosting is independent: Vercel runs `npm run build` and serves the Next.js static export from `out/`. Rebuild when public environment configuration changes. The Supabase data model is unchanged by the hosting migration.

## Validation

`npm test` runs twelve suites, including 96 reference charts covering all six ayanamsas, both node modes, historical time zones, high latitude, leap day and the supported date-range edges. Reference values are independently produced by the native C engine through pyswisseph, rather than by the browser implementation under test. Angular parity tolerance is `1e-7` degrees; speed tolerance is `1e-6` degrees/day. This validates the WASM integration, not an independent astronomical theory or every interpretive tradition.

Regenerate the committed fixtures deliberately when changing the ephemeris version:

```sh
uv run --with pyswisseph==2.10.3.2 --python 3.12 python scripts/reference-fixtures.py
```

Additional tests cover invalid dates, DST folds/gaps, missing ephemeris data, nakshatra boundaries, varga boundaries, karaka ranking, arudha exceptions and dasha continuity.

## Data and license

AGPL-3.0-or-later. The deployed footer provides a corresponding-source archive generated from an explicit allowlist; it contains no user records or local environment files. See [NOTICE](NOTICE) for dependency and data credits.

Birthplace search uses a bundled GeoNames cities15000 snapshot with 34,216 places, downloaded on 2026-11-15. Coordinates describe a city centre and can be refined in the profile form. City data does not establish the accuracy of a user's recorded birth location or time.

Cloud profiles are not cached for offline writes in this version. Local profiles belong to the current browser origin; use export/import to move between localhost, preview and production. Browser storage can be cleared, so exports remain important.

## Frontend deployment

- Production: [kanastro.kahansonani.com](https://kanastro.kahansonani.com), hosted directly on the personal Vercel Hobby project `kanastro`. Pushes to `main` automatically deploy from GitHub.
- Framework: Next.js 16.4.6, App Router, static export.
- Repository: `kahan-sonani/kanastro`, production branch `main`.
- Build command: `npm run build`; install command: `npm ci`. Leave the Vercel Output Directory override unset so its Next.js adapter can read `.next` build metadata and publish the static export.
- Set the two `NEXT_PUBLIC_SUPABASE_*` values in Vercel for Production and Preview. Google OAuth secrets stay in Supabase Auth.
- Connect GitHub through the personal account. Git pushes should use the configured `github-personal` SSH remote; do not use `geekaf-kahan`.
- `vercel.json` configures security headers and caching. The CSP permits Next's inline bootstrap scripts and WASM while restricting external scripts.
- The browser calculation worker is bundled separately with esbuild; its WASM and ephemeris files are served as static assets.
- Hostinger DNS points the `kanastro` CNAME to `b59cdf2f24f81828.vercel-dns-017.com` with a 300-second TTL. Root-domain records are independent.
- The migration was completed on 2026-11-15. HTTPS, Next.js assets, the calculation worker, Google sign-in returning to the canonical domain, and phone/tablet layouts were verified. Production has no hosting login gateway or editing toolbar.
- The custom domain was detached from ChatGPT Sites, and its obsolete Sites verification TXT records were removed. The old platform deployment remains available separately. This source no longer declares a Sites hosting binding; deploy through Vercel.
