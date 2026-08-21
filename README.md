# second-brain

A cross-platform (iOS + Android) mobile app built with **Expo** and **React
Native**, scaffolded for fast local development and on-device testing with
**Expo Go**. The app is an empty-but-modern starting point — no features yet.

## Stack

| Layer      | Choice                                                                               |
| ---------- | ------------------------------------------------------------------------------------ |
| Framework  | [Expo SDK 54](https://docs.expo.dev/versions/v54.0.0/) (managed workflow)            |
| Runtime    | React Native 0.86 · React 19.2                                                       |
| Routing    | [Expo Router](https://docs.expo.dev/router/introduction/) (file-based, typed routes) |
| Language   | TypeScript 6 (strict)                                                                |
| Animation  | Reanimated 4 · React Native Worklets                                                 |
| Compiler   | React Compiler (enabled)                                                             |
| Linting    | ESLint 9 (flat config) + `eslint-config-expo`                                        |
| Formatting | Prettier 3                                                                           |
| Testing    | Jest (`jest-expo`) + React Native Testing Library                                    |

Everything here runs in **Expo Go** — no custom native modules, no development
build required.

## Prerequisites

- Node.js 22+
- The **Expo Go** app on your iOS and/or Android device
  ([App Store](https://apps.apple.com/app/expo-go/id982107779) ·
  [Play Store](https://play.google.com/store/apps/details?id=host.exp.exponent))

## Get started

```bash
npm install
npm start
```

`npm start` launches the Expo dev server and prints a QR code. Scan it with:

- **iOS** — the Camera app (opens in Expo Go)
- **Android** — the Expo Go app's built-in scanner

Your phone and computer must be on the same network. Edit files under
`src/app/` and the app reloads on save.

Platform shortcuts:

```bash
npm run android   # open on an Android device/emulator
npm run ios        # open on an iOS simulator (macOS only)
npm run web        # open in the browser
```

## Testing on a device without a local machine

Can't run npm locally? You don't need to. Both of these run in the cloud, work
over the internet via a tunnel, and use **zero EAS build credits**.

### Option A — GitHub Codespaces (recommended for active development)

A cloud VS Code environment with everything preconfigured (see
`.devcontainer/`). Live-reload as you edit.

1. On GitHub: **Code → Codespaces → Create codespace** on your branch.
2. In the Codespace terminal:
   ```bash
   npm run tunnel        # = expo start --tunnel
   ```
3. Scan the QR with Expo Go (the tunnel makes it reachable from anywhere — your
   phone does **not** need to be on the same network).

### Option B — On-demand tunnel from GitHub Actions

For a quick device check of a branch without opening a Codespace, run the
**Tunnel Preview** workflow (`.github/workflows/tunnel-preview.yml`):

1. **Actions → Tunnel Preview (on-demand) → Run workflow** (pick a branch).
2. Open the running job's **Summary** and scan the QR (or copy the `exp://` URL
   into Expo Go via **Enter URL manually**).
3. Cancel the run when finished.

This previews the code at that commit (no live editing — push to update) and is
time-boxed so it can't run forever.

## Project structure

```
src/
  app/            # Screens & routes (Expo Router, file-based)
    _layout.tsx   # Root layout + tab navigator
    index.tsx     # Home screen
    explore.tsx   # Explore screen
  components/     # Reusable UI (themed text/view, etc.)
  constants/      # Theme tokens (colors, spacing, fonts)
  hooks/          # Shared hooks (color scheme, theme)
assets/           # Icons, splash, fonts
```

The `@/*` path alias maps to `src/*` (see `tsconfig.json`).

## Scripts

| Command                 | What it does                                  |
| ----------------------- | --------------------------------------------- |
| `npm start`             | Start the Expo dev server (QR for Expo Go)    |
| `npm run tunnel`        | Start the dev server over a public tunnel     |
| `npm run android`       | Open on Android                               |
| `npm run ios`           | Open on iOS (macOS)                           |
| `npm run web`           | Open in the browser                           |
| `npm run lint`          | ESLint                                        |
| `npm run format`        | Prettier (write)                              |
| `npm run format:check`  | Prettier (check only — used in CI)            |
| `npm run typecheck`     | `tsc --noEmit`                                |
| `npm test`              | Run unit tests                                |
| `npm run test:ci`       | Tests with coverage (used in CI)              |
| `npm run doctor`        | `expo-doctor` project health check            |
| `npm run reset-project` | Move the starter code aside for a blank slate |

## Testing

Unit tests live next to the code they cover in `__tests__/` folders and use
`jest-expo` + React Native Testing Library. Note that in RNTL v14 `render` is
async — `await render(<Component />)` before querying `screen`. See
`src/components/__tests__/themed-text.test.tsx` for an example.

```bash
npm test
```

## Continuous integration & Claude automation

Workflows live in `.github/workflows/`:

- **`ci.yml`** — runs Prettier, ESLint, TypeScript, and the test suite on every
  push to `main` and every pull request.
- **`claude.yml`** — mention `@claude` in an issue or PR comment to have Claude
  implement changes, answer questions, or open a fix PR.
- **`claude-code-review.yml`** — Claude automatically reviews each pull request
  (with an Expo-Go-compatibility focus) and leaves inline comments.
- **`tunnel-preview.yml`** — manually-triggered ephemeral Expo dev server over a
  public tunnel for on-device testing (see "Testing on a device" above).

The two Claude workflows need an `ANTHROPIC_API_KEY` repository secret
(**Settings → Secrets and variables → Actions**). To use a Claude subscription
instead, generate a token with `claude setup-token` and store it as
`CLAUDE_CODE_OAUTH_TOKEN` (update the `with:` block accordingly).
