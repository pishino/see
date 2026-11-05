# see

rank anything. Lists of anything, in your order.

See is a **web app first**. The same product will ship as a desktop app (Tauri, around the web build) and as
iOS and Android apps (React Native). Everything those apps share lives in `packages/`, so they behave and look
the same. Built from the See design canvas (*See — Brand Language*): the boards its "Start here" marks as the
source of truth.

## Try it without cloning

Never done this before? Follow [docs/how-to-test.md](docs/how-to-test.md): it covers the live site, a no-install way
to run it in your browser, and running it on your own computer.

Every push to `main` publishes the web app and a browser preview of the phone app to GitHub Pages:

- Web app: https://pishino.github.io/see/ (straight in: https://pishino.github.io/see/app)
- Phone app preview: https://pishino.github.io/see/phone/ (open it on your phone, or narrow your browser)

One-time setup: Settings › Pages › Build and deployment › Source: **GitHub Actions**. To publish a branch before
it is merged, run the **Pages** workflow from the Actions tab on that branch, after allowing the branch under
Settings › Environments › github-pages › Deployment branches.

The phone preview runs the real phone app in a browser. Haptics, push and the phone's own share sheet need a
phone: open the project in Expo Go (`npm run start -w @see/mobile`, then scan the QR code).

## Run it

```bash
npm install
npm run dev          # the web app at http://localhost:5173
npm test             # the shared logic's tests
npm run build        # checks the tokens are current, typechecks, builds the web app
```

Desktop (needs Rust, and on Linux WebKitGTK; see `docs/platforms.md`):

```bash
npm run dev -w @see/desktop
```

iOS and Android (Expo; open it in Expo Go or a simulator):

```bash
npm run start -w @see/mobile
```

## What is where

```
apps/web         the web app: landing, sign up and log in, the app        React, Vite
apps/desktop     the desktop shell: a native window around apps/web     Tauri 2
apps/mobile      iOS and Android: the phone shell on the shared packages Expo, React Native
integrations/    discord (a Cloudflare Worker bot) and reddit (a Devvit Web app)
packages/tokens  design tokens: tokens.json → tokens.css and TS          every platform
packages/brand   type engine, wordmark, + box, icons, pictures, app icons every platform
packages/core    data model, list operations, store, settings, notification copy   every platform
scripts/         exporting the app icons from their SVG masters
docs/            platforms.md: how each platform uses the packages; integrations.md: sign-in, services, sharing, Reddit, Discord
```

| In `apps/web/src` | What it is | Built from |
| --- | --- | --- |
| `pages/landing/` | The landing: RANK [+], the words on scroll, the five working cards, how it works, integrations, what moved, privacy | V3LandingPick |
| `pages/auth/` | Sign up in four steps and log in, on the orange flood | V3AuthWeb*, V3AuthPhone* |
| `pages/app/` | The app: side bar and rail, Charts, categories, lists, Polls, Find, Create, your page, Settings, Activity | DeskApp, PixelPhone, V3Responsive, V3Settings, V3Notifications |
| `brand/`, `components/` | The marks and controls drawn for the web (buttons, chips, switch, field, toast, the + call to action, the Plus field) | V3Handoff, V3PlusField |

Routes: `/` · `/signup` · `/login` · `/app` (Charts) · `/app/c/:category` · `/app/l/:list` · `/app/polls` ·
`/app/find` · `/app/you` · `/app/settings/:section` · `/app/activity` · `/open?link=see://…`

## Widths

From V3Responsive: the bottom bar under 840, the rail from 840 to 1279, the side bar from 1280 (its tab or `[`
folds it). Gutters 20 / 40 / 56; wide phones keep one column centred up to 640; from 1600 the page stops at
1200. The list table drops columns from the right as it narrows. The same rules carry over to tablets and
phones in the native apps (`shellFor` and `gutterFor` in `@see/tokens`).

## Not built yet

Everything on the boards is built on the web, and the phone apps carry the same screens. What's left needs a
server, which this repo doesn't have yet:

- Accounts. Sign-up, log-in and the email code work in the browser, and each device keeps its own lists.
  Nothing syncs between devices or people.
- The crowd on the web. Shared links, embeds and the published chart count picks from the link itself; the
  Reddit app and the Discord bot keep a real crowd in their own storage.
- Sending push and email. The phone apps ask for push and register a token, and `@see/core` builds the
  messages (`deliver`, `sendExpo`); `@see/emails` renders all six emails. Something has to send them.
- Selling ads. The ad spaces, tags and the sponsored poll are in place with sample sponsors.
- Posting to X for you. X's API is paid, so sharing to X opens its composer with the text and link.

The boards marked Earlier on the canvas are kept for reference and weren't built.
