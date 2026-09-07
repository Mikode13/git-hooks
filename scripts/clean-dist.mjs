import { rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// `tsc` never empties its own `outDir`, so output from a source file that has since been
// renamed or deleted survives every later build and is published as part of the tarball.
// Removing the directory first makes `dist` a function of the current sources alone.
//
// This is a plain `fs.rm` rather than `@mikode13/cross-platform`, which exists for exactly
// this: that package depends on this one for its own hooks, and a build-time dependency in
// the other direction would couple each release to the other's. See docs/decisions.md.
const distribution = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');

await rm(distribution, { recursive: true, force: true });
