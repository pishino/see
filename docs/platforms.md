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

## iOS and Android (planned: `apps/mobile`, Expo)

Not scaffolded yet: the web app comes first. When it starts:

- Expo with expo-router; screens follow PixelPhone and V3Responsive (bottom bar on phones, the rail on tablets).
- Fonts: Archivo and Instrument Sans through `@expo-google-fonts`.
- Marks and icons: `react-native-svg`, drawing the paths from `@see/brand`. The Plus field becomes a Skia
  canvas (`@shopify/react-native-skia`); pixels stay only there and in pictures.
- State: `StoreProvider` and `SettingsProvider` from `@see/core/react`, with AsyncStorage adapters (both
  providers accept an async `load`).
- Push: the titles, lines and bundling rules in `@see/core` (`compose`, `NOTIFICATIONS`); each opens its
  `see://` link through `routeOf`. Android's small icon is the + box in one colour; poll notifications are violet.
- App icon: `packages/brand/icons/png/app-store-1024.png` (iOS), `google-play-512.png`, the adaptive icon from
  `maskable.svg`, and the launch screen from `launch.svg` (the + box on ink).
- Reduced motion: the OS setting and Settings › Display both drop every duration to 1 ms, as on the web.
