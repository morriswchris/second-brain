// Loads @types/jest globals (describe/it/expect/jest) project-wide so `tsc`
// typechecks test files. RNTL v14 augments the global `expect` on import, so
// matchers like `toBeOnTheScreen()` are typed wherever the library is imported.
/// <reference types="jest" />
