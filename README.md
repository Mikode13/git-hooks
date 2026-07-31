# @mikode13/git-hooks

Shared Git hooks, Conventional Commit validation, and workflow tooling for MiKode
repositories.

> **Status:** Experimental. This package implements proposed ADR 0008 and its draft Git
> workflow standard. The API may change before the decision is accepted and before
> version `1.0.0`.

## What it provides

- Explicit Husky installation without mutating consumers from a dependency lifecycle.
- Pull request title validation through Conventional Commits and commitlint.
- Branch validation using `<type>/<description>`.
- One pinned dependency graph for Husky and commitlint across MiKode repositories.

Intermediate commit messages remain free-form. The protected default branch receives one
Conventional Commit through a required squash merge whose title comes from the pull
request.

## Installation

Install the package as a direct development dependency:

```sh
pnpm add --save-dev @mikode13/git-hooks
```

Add explicit hook installation and the shared check contract to `package.json`:

```json
{
	"scripts": {
		"prepare": "mikode-git-hooks install",
		"check": "pnpm run format:check && pnpm run lint && pnpm run typecheck",
		"test": "<PROJECT_TEST_COMMAND>"
	}
}
```

The published package's own lifecycle scripts are not needed by consumers. Keep them
blocked in `pnpm-workspace.yaml`:

```yaml
allowBuilds:
  '@mikode13/git-hooks': false
```

Copy the MiKode engineering `pre-push` template to `.husky/pre-push`:

```sh
pnpm run check && pnpm test
```

Commit the hook with the repository. There is deliberately no `commit-msg` hook because
intermediate commits are not part of the release history.

## CLI

Activate Husky in the current Git repository:

```sh
pnpm exec mikode-git-hooks install
```

Validate a pull request title from an argument, `PR_TITLE`, or standard input:

```sh
pnpm exec mikode-git-hooks lint-title "feat(auth): add passwordless login"
printf '%s\n' "$PR_TITLE" | pnpm exec mikode-git-hooks lint-title
```

Validate a branch from an argument or `GITHUB_HEAD_REF`:

```sh
pnpm exec mikode-git-hooks lint-branch feat/add-passwordless-login
```

Allowed types are `build`, `chore`, `ci`, `docs`, `feat`, `fix`, `perf`, `refactor`,
`revert`, `style`, and `test`. Descriptions and optional scopes must be in English;
automated validation enforces structure and casing, while review enforces language.

Ticket identifiers are not accepted yet. When MiKode selects a ticketing system, the
shared standard and this package will add `<type>/<ticket>-<description>` together.

## Repository enforcement

Local hooks can be bypassed, so repositories must also:

1. Require pull requests for the default branch.
2. Permit only squash merges.
3. Use the pull request title and body as the squash commit title and message.
4. Require CI checks for the title, branch, project checks, tests, and build.
5. Block force pushes to the default branch.

## Development

```sh
pnpm install --frozen-lockfile
pnpm run check
pnpm test
pnpm run build
pnpm run audit:prod
pnpm run pack:check
```

This implementation repository cannot consume its own unpublished package during
bootstrap. Its project-owned `prepare` script therefore invokes the tracked CLI entry
point with Node. Published consumers use `mikode-git-hooks install` as documented above;
the package never installs hooks implicitly from a dependency directory.

The source of truth for the proposed workflow is
[ADR 0008](https://github.com/mikode13/engineering/blob/45cd253/adr/0008-use-conventional-commits-and-squash-merges.md).

## License

This package is source-available under the MIT License with the Commons Clause License
Condition v1.0. It is not released under an MIT-only or open-source license. See
[`LICENSE`](LICENSE) for the complete terms.
