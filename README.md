# see

rank anything. Lists of anything, in your order.

A web app built from the See design canvas (*See — Brand Language*). It covers the boards the canvas's
"Start here" marks as the ones to build from: Handoff, the two prototypes, the landing, and sign up and log in.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # typecheck and production build into dist/
```

Routes: `/` landing · `/signup` · `/login` · `/app` (Charts) · `/app/c/:category` · `/app/l/:list` ·
`/app/polls` · `/app/find` · `/app/you`.

## Where things are

| Path | What it is | Built from |
| --- | --- | --- |
| `src/styles/tokens.css` | Colour roles (dark by default, light, match device), type, shape, motion, sizes, layers, spacing as `--see-*` variables | V3Handoff, V3LightMode |
| `src/styles/base.css` | The type roles (`t-hero`, `t-row`, `t-label` …) and the one focus ring | V3Handoff · 2, V3FocusStates |
| `src/brand/type.ts`, `glyphs.ts` | The vector display type: the see wordmark, category tags, the masthead lockup, the + box frames, the 12-unit icon set | DeskApp (v3.6 vector primitives) |
| `src/brand/marks.tsx`, `Icon.tsx` | `Wordmark`, `Lockup`, `CategoryTag`, `PlusBox`, `Icon` | LogoSee, V3Icons |
| `src/brand/PlusField.tsx` | The Plus field behind headers; the pointer draws the brand + | V3PlusField |
| `src/brand/Avatar.tsx`, `ProfilePicture.tsx` | People's pictures, pixelated in their colour | V3ProfilePicture |
| `src/components/` | Button (sm, md, lg; quiet), read-as chip, switch, field (3A), toast with the box's tick, the + call to action | V3Handoff · 5 |
| `src/pages/auth/` | Sign up in four steps and log in, on the orange flood | V3AuthWeb*, V3AuthPhone* |
| `src/pages/app/` | The app: side bar that folds to a rail and peeks open, Charts home, category and list views, Polls (violet), Find, You, Create | DeskApp, PixelPhone, V3SideNav, V3PollWeb, V3Behaviour |
| `src/pages/landing/` | The landing: RANK [+], the words on scroll, the five working cards, how it works, integrations, what moved, privacy, footer | V3LandingPick |
| `src/data/` | Seed lists, catalogue, polls and people from the prototypes; lists save to `localStorage` | DeskApp |

Phones (up to 760 px) get the bottom bar, the masthead above the page and sheets. Wider screens get the side
bar, drawers from the right and the corner Find pill. Reduced motion drops every duration to 1 ms.

## Not built yet

These boards are reference for later work: the player and video player, profiles and groups, Settings in
full, notifications, safety (report and block), emails, integrations (Reddit, Discord, embeds), ads, socials
and the problem states. The canvas still lists three open choices: whether see goes inside the + box in the app
(V3Masthead), whether flare is offered as an appearance (V3FlareMode), and how video plays (V3VideoPlayer).
