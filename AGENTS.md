# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v54.0.0/ before writing any code.

## Project

`second-brain` is an Expo SDK 54 / React Native app that must remain
**Expo Go compatible** — do not add dependencies that require custom native
code or a development build. App code lives in `src/`, with file-based routes
under `src/app/`. The `@/*` alias maps to `src/*`.

> **SDK note:** pinned to SDK 54 — the newest SDK the current store release
> of Expo Go can load. The Expo Go binary lags new SDKs, so SDK 55+ projects
> fail on-device with "requires a newer version of Expo Go". Bump forward one
> SDK at a time only after confirming the store Expo Go supports it, and keep
> every `expo-*` / `react-native*` package on its target-SDK version
> (`npx expo install --fix`). Note the older per-package versioning at this
> SDK (e.g. `expo-router@6.x`, not `56.x`) and that navigation theme helpers
> come from `@react-navigation/native`, while native tabs use standalone
> `Label`/`Icon` from `expo-router/unstable-native-tabs`.

## Commands (run before committing)

```bash
npm run lint        # ESLint (flat config, eslint-config-expo)
npm run typecheck   # tsc --noEmit
npm test            # Jest (jest-expo) + React Native Testing Library
npm run format      # Prettier (write)
```

## Testing notes

- Tests live in `__tests__/` folders beside the code they cover.
- React Native Testing Library v14 `render` is **async** — always
  `await render(<Component />)` before querying `screen`.
- CSS imports are stubbed in Jest via `jest/style-mock.js`.
