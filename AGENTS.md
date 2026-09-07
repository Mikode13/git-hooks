# AGENTS.md

## What this repository is

`@mikode13/git-hooks` is the executable implementation of the local half of the MiKode
[git workflow standard](https://github.com/Mikode13/engineering/blob/main/standards/git-workflow.md),
accepted in
[ADR 0008](https://github.com/Mikode13/engineering/blob/main/adr/0008-use-conventional-commits-and-squash-merges.md).
It publishes one CLI, `mikode-git-hooks`, which installs the `pre-push` hook and validates
pull request titles and branch names.

## Constraint specific to this repository

This package is the enforcement boundary that every other MiKode repository installs, and
the shared CI workflow calls `lint-title` and `lint-branch` on every pull request in the
organization. A change to what counts as a valid title or branch changes what merges
everywhere, at once, the moment repositories update. The git workflow standard and this
implementation must agree exactly; changing one without the other silently forks policy
from its enforcement.

The ticket segment is deliberately rejected. The standard omits it until MiKode selects a
ticketing system, so accepting a ticket-shaped branch would quietly permit a syntax that
has not been decided.

## Bootstrapping

This repository cannot consume its own unpublished package, so `prepare` invokes the
tracked CLI entry point with Node directly rather than through a resolved bin. Consumers
use `mikode-git-hooks install`; the package never installs hooks implicitly from a
dependency directory.

For the same reason `scripts/clean-dist.mjs` reimplements one `fs.rm` call rather than
depending on `@mikode13/cross-platform`, which exists for exactly this purpose: that
package depends on this one for its own hooks, and a build-time dependency in the other
direction would couple each release to the other's.

## Local validation

```sh
pnpm install --frozen-lockfile
pnpm run check       # prettier --check, eslint --max-warnings 0, tsc --noEmit
pnpm test            # unit tests for title and branch validation
pnpm run pack:check  # builds and asserts the exact published file set
pnpm run audit:prod  # production dependency audit
```

`pre-push` runs `pnpm run check && pnpm test`. CI repeats both and adds `build` and
`pack:check`.

### Hazards

- Never add package-manager enforcement to a lifecycle script. `prepare` ran a pnpm guard
  that would have failed the release workflow's own `pnpm pack`, because npm runs `prepare`
  before packing and the guard rejects npm's user agent. See
  [`docs/decisions.md`](docs/decisions.md).
- `tsc` never empties `outDir`. The build removes `dist` first; without that, output from a
  renamed or deleted source file survives and ships.
- Loosening a validation rule loosens it for every MiKode repository. The unit suite fails
  when a rejected shape starts being accepted, and the git workflow standard must be
  updated in the same change.

## Engineering standards

This repository follows the active standards in
[`Mikode13/engineering`](https://github.com/Mikode13/engineering/blob/main/standards/README.md).
Do not duplicate their content here; read them there when a change touches package
management, TypeScript, code quality, formatting, git workflow, testing, publication, or CI.

## Releases

Publication is automated. `package.json` stays at `0.0.0-development` in source control;
semantic-release calculates the real version from Conventional Commits and publishes it
through npm Trusted Publishing after the required CI result passes on `main`. Never
hand-edit the version or publish manually.
