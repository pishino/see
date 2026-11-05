# See, out in the world: how everything connects

This is the how for every connection See has: signing in, the services it reads, sharing a list anywhere,
Reddit, Discord, embeds, cards, push, links and hosting. For each one it says what works today, what is a demo
until a key or a server is added, and exactly what to set up.

The short version:

| | Works now | Needs a key from you | Needs See's server | Not possible |
| --- | --- | --- | --- | --- |
| Sign in | Demo on any build | Google, Apple | Email codes, real accounts | |
| Connected services | Netflix, Letterboxd, IMDb (file import) | Spotify, YouTube, Reddit, Apple Music | X | Deezer (closed to new apps), Prime Video, Instagram, TikTok |
| Sharing | Link, card, embed, Reddit post, X, Threads, Bluesky, WhatsApp, email | | The crowd on the web and in embeds | |
| Reddit in the post | | A Reddit developer account | | |
| Discord bot | | A Discord application, a Cloudflare account | | |
| Push | | An Expo (EAS) project | Sending automatically | |

Everything below is in this repository: the shared rules and words in `packages/core` (`share.ts`,
`connections.ts`, `push.ts`, `access.ts`), the web app in `apps/web`, the phone app in `apps/mobile`, and the
integrations in `integrations/discord` and `integrations/reddit`.

---

## 1. Signing in

**Today.** Sign up and log in work end to end as a demo: any email gets a code screen, and any six digits pass.
The session lives on the device (the web keeps it in the browser; the phones in `see.session.v1`).

**With a key (web):** Continue with Google and Continue with Apple become real. See gets your name and email from
them and fills Settings › Account. Without a server, that identity lives on this device only: it is who you are
here, not an account that follows you to another device.

| Provider | What you set up | Build variable |
| --- | --- | --- |
| Google | Google Cloud console › APIs & Services › Credentials › Create OAuth client ID › **Web application**. Add your site under *Authorized JavaScript origins* (for GitHub Pages: `https://pishino.github.io`). Configure the OAuth consent screen. | `VITE_GOOGLE_CLIENT_ID` |
| Apple | Apple Developer › Certificates, IDs & Profiles › create a **Services ID**, enable Sign in with Apple, add your domain and the return URL `https://<your site>/connect/apple`, and verify the domain. | `VITE_APPLE_SERVICES_ID` |

Code: `apps/web/src/lib/connect.ts` (`signInWithGoogle`, `signInWithApple`), used by `useSignIn` on the sign-up
and log-in pages. Without a key, the buttons carry on as the demo.

**Email codes need See's server.** Something has to send the email and check the code. See section 9.

**On the phones:** sign-in is the demo. Real Google and Apple sign-in on iOS and Android use
`expo-auth-session` (Google) and `expo-apple-authentication` (Apple), with the platform's own client ids.

---

## 2. Connected services: what See reads

See only reads, to suggest what to rank; it never posts for you. What a service finds becomes things you can
rank: it shows first in Find, and lands in open places like anything else. Settings › Connected services says,
for each service, exactly which of these it is.

| Service | How | Reads | Status |
| --- | --- | --- | --- |
| Spotify | Sign in (OAuth with PKCE, no secret) | Your top tracks | Real with `VITE_SPOTIFY_CLIENT_ID` |
| YouTube | Sign in (Google's token client) | Your liked videos | Real with `VITE_GOOGLE_CLIENT_ID` |
| Reddit | Sign in (installed app) | Your upvotes: the music and video links in them | Real with `VITE_REDDIT_CLIENT_ID` |
| Apple Music | MusicKit JS | Your recently played | Real with `VITE_APPLE_MUSIC_TOKEN` |
| Netflix | The file Netflix lets you download | Your viewing history (episodes fold into their show) | Works now, web and phone |
| Letterboxd | The export Letterboxd lets you download | Your diary and ratings | Works now, web and phone |
| IMDb | The ratings export | Your ratings | Works now, web and phone |
| X | Needs See's server and X's paid API | Who you follow | Not yet |
| Deezer | Deezer isn't taking new apps on its developer site | — | Not possible today |
| Prime Video | No API, no file to download | — | Not possible |
| Instagram | Saved posts aren't open to apps for personal accounts | — | Not possible |
| TikTok | Liked videos aren't open to apps | — | Not possible |

Without a key, the sign-in services still connect as a clearly labelled demo ("this build isn't linked to
Spotify yet, so connecting here is a demo"), and nothing is read.

### Setting up each sign-in

The return address is your site plus `connect/<service>`; for GitHub Pages that's
`https://pishino.github.io/see/connect/spotify` and `…/connect/reddit`.

- **Spotify.** developer.spotify.com › Dashboard › Create app. Add the return address under *Redirect URIs*; tick
  *Web API*. Copy the Client ID into `VITE_SPOTIFY_CLIENT_ID`. A new app is in development mode: only people you
  add under *User Management* can connect, until Spotify grants extended quota.
- **YouTube.** In the same Google Cloud project as sign-in: enable **YouTube Data API v3**; the web client id is
  the same `VITE_GOOGLE_CLIENT_ID`. The `youtube.readonly` scope is sensitive: until Google verifies the app, it
  shows an "unverified app" warning and is limited to 100 test users.
- **Reddit.** reddit.com/prefs/apps › create another app › type **installed app**. Set the redirect uri to the
  return address. Copy the id under the app's name into `VITE_REDDIT_CLIENT_ID`. Scopes used: `identity history`.
- **Apple Music.** Apple Developer Program › Keys › create a key with **MusicKit**. Sign a developer token with it
  (an ES256 JWT, issuer = your Team ID, key id = the key's id, valid for up to six months) and put it in
  `VITE_APPLE_MUSIC_TOKEN`. Renew it before it expires.

Code: the flows are in `apps/web/src/lib/connect.ts`; the page a sign-in returns to is
`apps/web/src/pages/ConnectReturn.tsx`; turning each service's answer into things to rank is in
`packages/core/src/connections.ts` (`fromSpotify`, `fromYouTube`, `fromReddit`, `fromAppleMusic`,
`fromNetflixCsv`, `fromLetterboxdCsv`, `fromImdbCsv`), with tests.

Tokens stay in the tab's session storage and are used once, to read; reading again means connecting again.

**On the phones:** file imports work now (the phone's file picker). The sign-ins come next with
`expo-auth-session`, returning to `see://connect/<service>`; they use the same `from…` functions.

### Getting the files

- **Netflix:** Account › your profile › Viewing activity › Download all → `NetflixViewingHistory.csv`.
- **Letterboxd:** Settings › Import & export › Export your data → a zip; choose `watched.csv`, `ratings.csv` or
  `diary.csv` from it.
- **IMDb:** Your ratings › ⋯ › Export → a CSV.

The file is read on the device; nothing is uploaded.

---

## 3. Sharing a list anywhere

A list goes out as a **template**: its name, its size and what's in it. Never your order, never your handle. The
template lives in the link itself (`/t/<code>`), so there is no account or server behind it. Whoever opens it
ranks their own.

The rules, the same in every place (V3IntMap):

1. **Rank yours** by tapping, top first. No dragging inside a post: the feed scrolls.
2. **Lock in** saves it to your See and posts nothing. You need at least three placed.
3. **The crowd opens after you lock in**, in violet, and never moves your ranks. Agreeing is a number on the
   card ("agree on 3 of 10"), never a nudge on your list.
4. **Reply with yours** is the only thing that puts your order in a thread: your top five, how far you agree,
   and a link to your full order.

Where each place gets See (a list's ⋯ › Share…):

| Place | What arrives | Ranking happens |
| --- | --- | --- |
| Link (messages, anywhere) | The template page | In See |
| Reddit | A post with the list, and *Rank yours in See* | In See; in the post with the Reddit app (section 4) |
| Discord | `/see rank link:<link>` | In the channel, with the bot (section 5) |
| X, Threads, Bluesky, WhatsApp, Email | The text and the link, opened in that app's composer | In See |
| The card | A 1200 × 630 picture: No. 1's own artwork, your top three | In See (the card is the link's picture) |
| A page (blog, docs) | An embed: full (readers rank in place) or compact (your locked top 5) | In the page |

Code: `packages/core/src/share.ts` (templates, ranking, the crowd's order, agreement, every place's words and
links), the template page and embed in `apps/web/src/pages/share/RankYours.tsx`, the share sheet in
`ShareSheet.tsx`, and the card in `apps/web/src/brand/card.ts`.

The embed code looks like:

```html
<iframe src="https://pishino.github.io/see/embed/<code>" title="Videos of the year · See"
  width="100%" height="680" style="border:0;max-width:720px" loading="lazy"></iframe>
```

**The crowd on the web and in embeds needs See's server** (somewhere to keep everyone's locked orders). Today,
Lock in there saves yours and offers Reply with yours; Reddit and Discord already keep their own crowd.

---

## 4. Reddit: rank it in the post

Two levels.

**Works now, no setup.** Share › Reddit opens Reddit's post composer with the list written out and a *Rank
yours in See* link. After locking in on the template page, *Reply with yours* copies your fill to paste as a
comment.

**In the post (`integrations/reddit`, a Devvit Web app).** A community adds See once; then:

- A moderator's menu item, **Post a See list**, asks for a list's link and posts it as a See post.
- In the post: *In it*, **Rank yours**, one tap per place, **Lock in**, then yours beside the community's (with
  SAME marks) and how far you agree. Lock in posts nothing.
- **Reply with yours** comments your fill as you (Reddit shows who; the card doesn't).
- Locked orders are kept per post in the app's Redis (`f:<postId>`, one field per person). The community's order
  only opens to people who have locked in.

Setting it up:

1. Have a Reddit account and agree to the Developer Platform terms at developers.reddit.com.
2. From `integrations/reddit`: `npx devvit login`.
3. `npm run build` (builds the post page and the server to `dist/`).
4. `npx devvit upload` to create the app; `npx devvit playtest r/<your test community>` to try it live.
5. Install it in a community from its page on developers.reddit.com; moderators then see **Post a See list**
   in the community's menu.

The links in posts open `https://pishino.github.io/see/` (`SEE_URL` in `src/server/index.ts` and
`src/client/main.ts`); change both if See lives elsewhere.

To work on the post page without Reddit: `npm run local -w @see/reddit -- <template code>`, then open
`http://localhost:4300`. It serves the built page and answers `/api` with the real routes and a pretend crowd.

Code: `src/server/routes.ts` (the routes, tested), `src/server/index.ts` (wires them to Devvit's redis, reddit
and context), `src/client/` (the post page), `devvit.json` (menu, form, permissions).

---

## 5. Discord: rank it with the server

`integrations/discord` is a Discord bot that runs as a Cloudflare Worker. It doesn't need a server of your own.

What it does:

- **`/see rank link:<link>`** posts a list: the template, *In it*, and three buttons: **Rank yours**, **Server
  order**, **Open in See**. The post carries the list, never anybody's order.
- **Rank yours** opens a panel only you can see. Tap your order, Undo, Lock in. Locking in unlocks the server's
  order for you alone, beside yours, with how far you agree.
- **Reply with yours** posts your fill card in the channel: top five, agreement, full order.
- **`/see poll question:… options:a, b, c`** posts a violet poll. One tap; the count updates on the poll, your
  results come to you alone, and it never moves anyone's chart.

Setting it up:

1. discord.com/developers › New Application. From *General Information*, copy the **Application ID** and the
   **Public Key**. Under *Bot*, reset and copy the **token** (used once, to register the commands).
2. A Cloudflare account. From `integrations/discord`:
   - `npx wrangler kv namespace create FILLS`, and paste the id into `wrangler.toml`.
   - `npx wrangler secret put DISCORD_PUBLIC_KEY` and `npx wrangler secret put DISCORD_APPLICATION_ID`.
   - Set `SEE_URL` in `wrangler.toml` to where See's web app lives.
   - `npx wrangler deploy`, and note the worker's URL.
3. Back in the Discord application: *General Information › Interactions Endpoint URL* = the worker's URL. Discord
   checks it with a signed ping before saving.
4. Register the commands: `DISCORD_APPLICATION_ID=… DISCORD_BOT_TOKEN=… npm run register -w @see/discord`. Add
   `GUILD_ID=<a server id>` to see them in one server at once while testing; global commands take up to an hour.
5. Invite it: `https://discord.com/oauth2/authorize?client_id=<Application ID>&scope=applications.commands%20bot`.
   Put the Application ID in the web app's `VITE_DISCORD_APP_ID`, and Share › Discord shows this link.

Kept in KV: the list behind each post (`t:`), each person's unfinished ranking for a day (`s:`), locked orders
and votes for 90 days (`f:`, `w:`). KV listing can lag a few seconds behind a fresh lock-in, so a crowd count can
read one short for a moment.

Next for Discord: the **ranking room** on calls (V3IntDiscord's voice panel) is a Discord Activity, which is an
embedded web app plus the Embedded App SDK.

Code: `src/handler.ts` (everything the bot says and does, tested), `src/verify.ts` (Discord's Ed25519
signature check), `src/worker.ts` (the Cloudflare Worker), `scripts/register.mjs` (the slash commands).

---

## 6. Push notifications

Covered in `docs/platforms.md` › Push delivery. In short: `deliver()` in `@see/core` decides who gets what and
when (push switches, quiet hours, never anything about someone blocked); the phone registers with Expo's push
service (set `expo.extra.eas.projectId` from `npx eas init`); `node scripts/send-push.mjs '<token>' <kind>` sends
one by hand. Sending automatically needs See's server.

---

## 7. Links

Every link opens the right place: `routeOf` in `@see/core` on the web and desktop, and the phone's link handler.
On the phones, a shared list to rank (`see://t/…`) opens See on the web for now; the phone's own Rank yours
screen is next.

| Link | Opens |
| --- | --- |
| `see://list/<id>` | A list (or why it can't be opened: deleted, private) |
| `see://join/<code>` | An invite: Join this list, or ask again once 7 days have passed |
| `see://t/<code>` | A shared list to rank (also `https://…/t/<code>`) |
| `see://u/<handle>` | Someone's page |
| `see://poll/<id>` | Polls |
| `see://you/activity` | Activity |
| `https://…/embed/<code>` | The list inside a page |
| `https://…/connect/<service>` | Where a service's sign-in returns |

---

## 8. Hosting and trying it

Every push to `main` publishes the web app and a browser preview of the phone app to GitHub Pages
(`.github/workflows/pages.yml`; one-time setup in the README). The build reads the app keys above from the
repository's **variables** (Settings › Secrets and variables › Actions › Variables), so adding one there and
pushing turns that connection on for the published site. They are public client ids, not secrets.

| Variable | For |
| --- | --- |
| `VITE_GOOGLE_CLIENT_ID` | Sign in with Google; YouTube |
| `VITE_APPLE_SERVICES_ID` | Sign in with Apple |
| `VITE_SPOTIFY_CLIENT_ID` | Spotify |
| `VITE_REDDIT_CLIENT_ID` | Reddit (reading upvotes) |
| `VITE_APPLE_MUSIC_TOKEN` | Apple Music |
| `VITE_DISCORD_APP_ID` | The "add See to a server" link in Share |

Locally, put the same lines in `apps/web/.env.local`.

---

## 9. What See's server adds

Everything above runs without one. A server is what turns See from "yours, on this device" into accounts shared
between people and devices:

- **Accounts:** email codes, checking Google and Apple sign-ins, one account across web, desktop and phones.
- **Lists between people:** invites, private lists and the people on a list for real (today they're seeded), and
  the clash between two people instead of two windows.
- **The crowd on the web and in embeds:** everyone's locked orders for a template.
- **Push sent automatically:** keeping phone tokens and settings, and sending with `deliver()` and `sendExpo()`.
- **X:** reading who you follow needs a server and X's paid API.
- **Keeping connections fresh:** refresh tokens, so Spotify and the others can be read again without signing in.

The shared rules for all of it are already in `packages/core`, so a server reuses them rather than restating them.
