# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v57.0.0/ before writing any code.

## Project

`second-brain` is an Expo SDK 57 / React Native app that must remain
**Expo Go compatible** — do not add dependencies that require custom native
code or a development build. App code lives in `src/`, with file-based routes
under `src/app/`. The `@/*` alias maps to `src/*`.

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
