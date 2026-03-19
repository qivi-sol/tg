# TON Vault

TON Vault is a Telegram Mini App MVP where players spend Keys to raid 3x3 vaults, dodge one bomb, and cash out coins and shards before the run collapses.

The project is intentionally launch-oriented:

- React + TypeScript + Vite frontend
- Tailwind mobile-first UI with a dark crypto-game style
- Telegram WebApp bootstrap with explicit dev fallback
- Supabase Edge Functions for auth and game actions
- Atomic SQL RPC functions for raid, referral, daily reward, and ad-reward mutations

## Current MVP Scope

- Telegram auth bootstrap with browser dev mode isolation
- Server-authoritative raid loop
- Daily rewards with cooldown locking
- Referral bonuses with duplicate and self-referral protection
- Leaderboard
- Shop and Telegram Stars scaffolding
- Rewarded ads scaffolding with server-side key grant and cooldown
- Airdrop Score preview card

## Stack

- Frontend: React 18, TypeScript, Vite
- Styling: Tailwind CSS
- Routing: React Router
- Backend: Supabase Postgres + Edge Functions
- Telegram integration: Telegram WebApp API

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Copy env values:

```bash
cp .env.example .env
```

3. Fill in your Supabase project values and Telegram bot settings.

4. Push the database schema:

```bash
supabase db push
```

5. Serve Edge Functions locally:

```bash
npm run supabase:functions:serve
```

6. Start the frontend:

```bash
npm run dev
```

The app now uses `BrowserRouter` so Telegram Mini App launches work cleanly. Static hosts such as Netlify need an SPA redirect to `index.html`, which is already included in `public/_redirects`.

## Environment Variables

Copy `.env.example` to `.env` and set the following values.

### Frontend

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-public-anon-key
VITE_TELEGRAM_BOT_USERNAME=YOUR_BOT_USERNAME
VITE_ENABLE_DEV_AUTH=false
VITE_ENABLE_DEV_ADS_MOCK=false
VITE_AD_REWARD_COOLDOWN_MINUTES=30
VITE_AD_REWARD_KEY_REWARD=1
VITE_DAILY_REWARD_COOLDOWN_HOURS=24
VITE_DEV_TELEGRAM_ID=900000001
VITE_DEV_TELEGRAM_USERNAME=vault_tester
VITE_DEV_FIRST_NAME=Vault
```

### Edge Functions / server secrets

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
APP_JWT_SECRET=replace-with-a-long-random-secret
APP_ENV=development
TELEGRAM_BOT_TOKEN=123456:replace-me
TELEGRAM_BOT_USERNAME=YOUR_BOT_USERNAME
ALLOW_DEV_LOGIN=false
AD_REWARD_COOLDOWN_MINUTES=30
AD_REWARD_KEYS=1
DAILY_REWARD_COOLDOWN_HOURS=24
RAPID_TAP_COOLDOWN_MS=650
```

### Important env notes

- `VITE_TELEGRAM_BOT_USERNAME` and `TELEGRAM_BOT_USERNAME` should match.
- `APP_ENV=production` disables dev login even if `ALLOW_DEV_LOGIN=true` is left behind.
- `VITE_ENABLE_DEV_AUTH` is for browser testing only. Turn it on locally only when you want to bypass Telegram.
- `ALLOW_DEV_LOGIN` must also be enabled locally if you want browser dev auth to work end to end.
- `VITE_ENABLE_DEV_ADS_MOCK` is for local rewarded-ad testing only.
- Never expose `SUPABASE_SERVICE_ROLE_KEY`, `APP_JWT_SECRET`, or `TELEGRAM_BOT_TOKEN` to the client.

## Database Migrations

Current migrations:

- `20260319103000_initial_schema.sql`
- `20260319111500_game_action_functions.sql`
- `20260319123000_referral_signup_function.sql`
- `20260319143000_rewarded_ads_and_cooldowns.sql`

These create and maintain:

- `users`
- `raids`
- `raid_cells`
- `referrals`
- `daily_claims`
- `economy_logs`

They also provide atomic server actions:

- `start_raid_session`
- `reveal_raid_cell_action`
- `cash_out_raid_action`
- `claim_daily_reward_action`
- `apply_referral_bonus_on_signup`
- `claim_ad_reward_action`

## Edge Functions

Functions included in this repo:

- `telegram-auth`
- `app-bootstrap`
- `raid-start`
- `raid-reveal`
- `raid-cashout`
- `daily-claim`
- `leaderboard`
- `rewarded-ad-claim`
- `payment-create-invoice`
- `payment-verify`

Set local secrets before serving if needed:

```bash
supabase secrets set \
  SUPABASE_URL=https://wtthacztjhhudgehosws.supabase.co \
  SUPABASE_SERVICE_ROLE_KEY=... \
  APP_JWT_SECRET=... \
  APP_ENV=development \
  TELEGRAM_BOT_TOKEN=... \
  TELEGRAM_BOT_USERNAME=... \
  ALLOW_DEV_LOGIN=true \
  AD_REWARD_COOLDOWN_MINUTES=30 \
  AD_REWARD_KEYS=1 \
  DAILY_REWARD_COOLDOWN_HOURS=24 \
  RAPID_TAP_COOLDOWN_MS=650
```

## Telegram Mini App Auth Notes

### Development mode

- Browser dev mode is explicitly isolated.
- Frontend dev auth only activates when `VITE_ENABLE_DEV_AUTH=true`.
- Edge Function dev login only activates when `ALLOW_DEV_LOGIN=true` and `APP_ENV` is not `production`.

### Production hardening

- Real Telegram `initData` validation should happen server-side only.
- This repo already keeps that verification boundary in the Edge Function layer.
- Before launch, confirm `TELEGRAM_BOT_TOKEN` is correct and `VITE_ENABLE_DEV_AUTH` is disabled.
- Do not allow arbitrary client-supplied `telegram_id` values outside the verified Telegram payload.
- `index.html` includes Telegram's official `telegram-web-app.js` bridge, which is required for `window.Telegram.WebApp.initData` to be available inside the Mini App.

## Raid Security Model

The raid loop is server-authoritative for MVP:

- Raid cells are generated once on raid start.
- Cells are stored in `raid_cells`.
- Only one active raid is allowed per user.
- Reveals validate raid ownership, status, cell range, unrevealed state, and rapid-tap cooldown.
- Cashout and reward credit happen server-side.
- Bomb hits lock the run as lost and prevent later cashout.
- Economy changes are written through SQL functions and logged in `economy_logs`.

This keeps the client as a renderer, not the source of truth.

## Referrals

Referral deep links follow this format:

```text
https://t.me/YOUR_BOT_USERNAME/app?startapp=ref_CODE
```

Rules in the MVP:

- Only the first valid referral counts.
- Self-referrals are blocked.
- Duplicate referral bonuses are blocked.
- Inviter gets `+2 Keys`.
- Invitee gets `+1 Key`.
- Rewards are logged in `economy_logs`.

If `TELEGRAM_BOT_USERNAME` is still the placeholder, the UI stays in fallback mode and will not pretend referral sharing is ready.

## Daily Rewards

- One claim every `DAILY_REWARD_COOLDOWN_HOURS`
- Default rotation:
  - Day 1: `+2 Keys`
  - Day 2: `+500 Coins`
  - Day 3: `+1 Shard`
- Claims are locked server-side and persisted in `daily_claims`
- The frontend shows the next available claim time

## Rewarded Ads Preparation

This repo includes an MVP-safe scaffold:

- Home screen button for rewarded ad claim
- Server-side `claim_ad_reward_action`
- Cooldown-backed key grant logging
- Frontend mock watch flow via `VITE_ENABLE_DEV_ADS_MOCK`

TODO for live Monetag integration:

- Replace the mock ad lifecycle in `src/services/ads-service.ts`
- Verify ad completion before hitting the grant endpoint
- Add provider-specific anti-fraud telemetry

## Telegram Stars Preparation

The Shop is structurally ready for Telegram Stars without shipping live billing yet.

Planned flow:

1. Frontend requests invoice payload from `payment-create-invoice`
2. Telegram opens the invoice
3. Backend verifies successful payment
4. Reward is granted idempotently and logged

Current state:

- Typed shop item config exists
- Purchase preparation service exists
- Edge Function placeholders exist for invoice creation and verification

## Verification

Type-check:

```bash
npm run check
```

Production build:

```bash
npm run build
```

If you intentionally need LAN exposure during local development, use:

```bash
npm run dev:host
```

The default `npm run dev` binds to `127.0.0.1` to reduce exposure from the current Vite dev-server advisory path.

## Deployment

### Frontend

```bash
npm run build
```

Deploy `dist/` to a static host such as Vercel, Netlify, or Cloudflare Pages.

For Netlify:

- Build command: `npm run build`
- Publish directory: `dist`
- SPA fallback: already handled by `public/_redirects`
- BotFather Mini App URL: use the root site URL only, for example `https://your-site.netlify.app`
- Do not append `#`, `#/home`, or other hash routes to the BotFather URL

### Supabase

```bash
supabase db push
supabase functions deploy telegram-auth
supabase functions deploy app-bootstrap
supabase functions deploy raid-start
supabase functions deploy raid-reveal
supabase functions deploy raid-cashout
supabase functions deploy daily-claim
supabase functions deploy leaderboard
supabase functions deploy rewarded-ad-claim
supabase functions deploy payment-create-invoice
supabase functions deploy payment-verify
```

## Known Limitations

- Telegram Stars payments are scaffolded but not live.
- Rewarded ads use a local mock unless you wire a real provider.
- Telegram auth still depends on correct production bot token configuration.
- Supabase CLI and Deno are required to fully exercise Edge Functions locally.
- The current npm audit issues are tied to the Vite dev-server dependency path; upgrading to the next safe major should be done with a compatibility test pass.

## Launch Checklist

- Replace placeholder bot usernames
- Disable `VITE_ENABLE_DEV_AUTH`
- Set `APP_ENV=production`
- Keep `ALLOW_DEV_LOGIN=false` in production secrets
- Verify Telegram `initData` validation with your real bot token
- Run `npm run check`
- Run `npm run build`
- Push migrations and deploy functions
- Test referral join, daily claim, raid cashout, raid loss, and rewarded-ad cooldown on a real Supabase project
