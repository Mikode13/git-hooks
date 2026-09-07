# Project decisions

A chronological log of decisions specific to `@mikode13/git-hooks`. Cross-project decisions
live in [`Mikode13/engineering`](https://github.com/Mikode13/engineering); this file records
only what a future maintainer of this package could not derive from those.

## The pnpm guard is gone from `prepare`

**Decision.** `prepare` installs hooks and nothing else. The package-manager check that ran
alongside it is deleted, not relocated.

**Context.** `prepare` was `node scripts/verify-pnpm.mjs && node bin/mikode-git-hooks.mjs
install`, and the guard exits non-zero unless `npm_config_user_agent` starts with `pnpm`.
npm runs `prepare` before both `npm pack` and `npm publish`. The release workflow packs the
tarball to verify it and then publishes, so automated publication could never have
completed: the guard would reject npm's own user agent at the first of those steps. The
sibling [`Mikode13/tsconfig`](https://github.com/Mikode13/tsconfig/blob/main/docs/decisions.md)
hit exactly this before its first release.

The package management standard independently forbids publishing a lifecycle script whose
only purpose is enforcing the contributor package manager.

**Consequences.** `npm install` in this repository no longer fails fast with a helpful
message. The committed lockfile, CI, and review remain the enforcement boundary. Do not
reintroduce the guard in `preinstall`, `prepare`, `prepack`, or any other lifecycle npm runs
during pack or publish.

## The build removes `dist` before compiling

**Decision.** Run `scripts/clean-dist.mjs` before `tsc`, and reimplement the single `fs.rm`
call rather than depending on `@mikode13/cross-platform`.

**Context.** `tsc` writes into `outDir` but never empties it, so output from a source file
that has since been renamed or deleted survives every later build and is published.
`cross-platform` exists precisely to make that removal portable — but it depends on this
package for its own hooks, and a build-time dependency in the other direction would couple
each release to the other's and put a cycle in the bootstrap path.

**Consequences.** `dist` is a function of the current sources alone. The duplicated line
must stay in step with `clean` if that function ever grows beyond `fs.rm`. Two independent
guards now cover this: `prepack` rebuilds during `pnpm pack`, and `scripts/pack-check.mjs`
fails on an unexpected file if the clean step is ever removed — verified by removing it and
watching the orphan appear in the tarball.

## Stable publication is enabled at 1.0.0

**Decision.** Enable automated publication through the shared release workflow, and make the
first automated release `1.0.0` rather than continuing the `0.x` line.

**Context.** `0.1.0` was published manually, before the release pipeline existed. The
automated npm publication standard requires a package with existing `0.x` versions to
reconcile its newest npm version with a Git tag on the released commit before activating.
No tag existed; `v0.1.0` now points at `ef1b54c`.

That commit is the closest thing to a released commit, not an exact match. The published
manifest is identical to `ef1b54c` on every field except that it carries neither `prepare`
nor `prepack` — scripts `ef1b54c` does define, and which npm does not strip on publish
(`@mikode13/cross-platform@1.0.0` retains its own `prepare` in the registry). The `0.1.0`
artifact was therefore produced from a hand-edited working tree that no commit reproduces.
That is the clearest possible argument for the change this decision records: an automated
release publishes what a reviewed commit contains, and nothing else.

`repository.url` also moves to the canonical `Mikode13` owner casing. npm's provenance
verification compares it against the signed attestation and rejects a lowercase owner with a
`422`, at the publish step, after the release tag has already been pushed.

**Consequences.** The source `package.json` stays at `0.0.0-development`; the real version
exists only in npm, the Git tag, and the GitHub Release. Version bumps are never committed,
and the repository has no `CHANGELOG.md`. The package now carries a stable major, so any
later change to what counts as a valid title or branch needs an explicit breaking-change
marker — it changes what merges in every MiKode repository.
