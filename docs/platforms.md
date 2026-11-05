# Platforms

See is a web app first. The desktop app wraps the web build; the iOS and Android apps are React Native and
share the TypeScript packages with the web. This page says what each platform takes from where.

## What is shared

| Package | What it holds | Web | Desktop | iOS and Android |
| --- | --- | --- | --- | --- |
| `@see/tokens` | Every handoff value in `tokens.json`: colour roles (dark and light), type, shape, motion, sizes, breakpoints, layers, spacing | `tokens.css` (generated) | the web build | `colors(scheme)`, `size`, `motion`, `type` from `src/index.ts` |
| `@see/brand` | The display type engine (wordmark, category tags, masthead lockup), the + box frames, the icon set, profile pictures, as SVG path data; the app icon masters | `<svg>` | the web build | `react-native-svg` with the same paths |
| `@see/core` | The data model and seed, list operations (move, place, add, remove, resize), the store reducer, settings, notification kinds and copy, `see://` links | `@see/core/react` providers with localStorage | the web build | the same providers with AsyncStorage |

Change a value once in `tokens.json` and run `npm run tokens`; the build fails if `tokens.css` is out of date.

## Widths and shells

The same rules on every platform (V3Responsive), from `shellFor(width)` and `gutterFor(width)`:

| Width | Shell | Where it applies |
| --- | --- | --- |
| under 600 | bottom bar, masthead row, one column, sheets from the bottom | phones |
| 600 to 839 | bottom bar, one column centred up to 640, sheets 600 wide | large phones, small tablets |
| 840 to 1279 | rail (84), the list as a table | tablets, narrow desktop windows |
| 1280 to 1599 | side bar (288), folds with `[` | desktops |
| 1600 and up | side bar; content stops at 1200 and centres | wide desktops |

Under 500 tall (a phone on its side) the masthead folds to one line and the bottom bar drops to 56.

## Desktop (`apps/desktop`, Tauri 2)

One window around the web build. It opens on the app (`/app`), never the marketing page; its minimum width is
840, so it is always the rail or the side bar. Links that leave See open in the browser (the opener plugin).

- Dev: `npm run dev -w @see/desktop` starts the web dev server and the window.
- Build: `npm run build -w @see/desktop` builds the web app, then bundles for the platform you are on
  (`.dmg`/`.app` on macOS, `.msi`/`.exe` on Windows, `.deb`/`.rpm`/AppImage on Linux).
- Needs Rust (stable). On Linux: `libwebkit2gtk-4.1-dev`, `librsvg2-dev` and `libayatana-appindicator3-dev`.
- Icons: `npm run icons -w @see/desktop` makes every size from `apps/desktop/app-icon.png`, which
  `scripts/export-icons.mjs` exports from `packages/brand/icons/app-icon.svg`.

Next for desktop: the `see://` scheme (tauri-plugin-deep-link) routed through `routeOf`, and native
notifications (tauri-plugin-notification) using the copy in `@see/core`.

## iOS and Android (`apps/mobile`, Expo SDK 58)

One React Native app for both, on the same packages as the web. It has the phone shell (bottom bar: Charts,
Polls, Find, You), the masthead, your lists by category, and a list you rank by dragging: hold a row's grip, the
rows between make room and show the numbers they'll take, and letting go saves it (a haptic tick for each place
passed; screen readers get Move up and Move down on the grip). Tap a row for the player sheet: the picture, then
rank first, the kicker, title and maker, Play and Add, and About, Watch or Listen, More. Minimised, it is a bar
above the tabs that keeps playing; Android's back minimises it. Polls show results after you vote, Find adds
anything (or your own item), and You plays your No. 1 in the bar. Lists and settings live in AsyncStorage under
the web's keys.

- The player's state (`PlayerProvider`, `usePlayer`) is in `@see/core/react`, so the clock, autoplay and "nothing
  plays from a removed source" are the web's own. The pictures are the web's flat-tone scenes from `@see/brand`
  (`art`), recorded as SVG shapes (`artShapes`) for react-native-svg.
- Run: `npm run start -w @see/mobile` (Expo Go or a dev build), `npm run ios -w @see/mobile`,
  `npm run android -w @see/mobile`; `npm run web -w @see/mobile` previews it in a browser.
- Check: `npm run typecheck -w @see/mobile`; `npm run bundle -w @see/mobile` bundles for both platforms with Metro,
  no device needed.
- One React: the root `overrides` pin `react` and `react-dom` to the version Expo's SDK expects (19.3.0), so the
  providers in `@see/core/react` and both apps share a single copy. Move them together when the SDK moves.
- Marks and icons: `react-native-svg`, drawing the paths from `@see/brand` (`src/marks.tsx`).
- App icon: `packages/brand/icons/png/app-store-1024.png` (iOS) and `google-play-512.png` (Android adaptive
  foreground), set in `app.json`.

Next for the phones, in order: Settings; the open slot's type-to-find; scrolling while you drag near an edge;
push with the copy in `@see/core` (`compose`, `NOTIFICATIONS`), each opening its
`see://` link through `routeOf`; the Plus field as a Skia canvas. Reduced motion: the OS setting and
Settings › Display both drop every duration to 1 ms, as on the web.
