import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { beforeAll, describe, expect, it } from 'vitest';

const repositoryRoot = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const cli = path.join(repositoryRoot, 'bin/mikode-git-hooks.mjs');

/**
 * The CLI loads validation from `dist`, so these cases exercise the built package rather
 * than the sources. `pnpm test` does not build, and CI runs the Tests capability
 * independently of Build, so the suite builds for itself.
 */
beforeAll(() => {
	execFileSync('pnpm', ['run', 'build'], { cwd: repositoryRoot, stdio: 'inherit' });
});

/** Runs the CLI the way a consumer's hook or CI step does. */
function run(
	arguments_: string[],
	{
		cwd = repositoryRoot,
		env = {},
		input,
	}: { cwd?: string; env?: Record<string, string>; input?: string } = {},
) {
	return spawnSync(process.execPath, [cli, ...arguments_], {
		cwd,
		encoding: 'utf8',
		input: input ?? '',
		// A denylist: the outer test run is itself CI, and `install` deliberately skips there,
		// which would make every installation case vacuously pass.
		env: Object.fromEntries(
			Object.entries({ ...process.env, ...env }).filter(
				([name]) => !['CI', 'HUSKY', 'NODE_ENV'].includes(name) || name in env,
			),
		),
	});
}

/** A scratch repository, because `install` refuses to act outside one. */
function gitRepository(): string {
	const directory = mkdtempSync(path.join(tmpdir(), 'git-hooks-cli-'));
	execFileSync('git', ['init', '--quiet'], { cwd: directory });
	writeFileSync(path.join(directory, 'package.json'), JSON.stringify({ name: 'consumer' }));

	return directory;
}

describe('install', () => {
	it('activates hooks in a real repository', () => {
		const directory = gitRepository();
		const result = run(['install'], { cwd: directory });

		expect(result.status, result.stderr).toBe(0);
		expect(existsSync(path.join(directory, '.husky/_'))).toBe(true);
		expect(
			execFileSync('git', ['config', '--get', 'core.hooksPath'], {
				cwd: directory,
				encoding: 'utf8',
			}).trim(),
		).toBe('.husky/_');
	});

	// A consumer installing the package outside a checkout, or unpacking a tarball, must not
	// have their install fail on a hook activation that cannot apply.
	it('succeeds without acting when there is no repository', () => {
		const directory = mkdtempSync(path.join(tmpdir(), 'git-hooks-no-git-'));
		const result = run(['install'], { cwd: directory });

		expect(result.status, result.stderr).toBe(0);
		expect(existsSync(path.join(directory, '.husky'))).toBe(false);
	});

	it.each([
		['CI', 'true'],
		['HUSKY', '0'],
		['NODE_ENV', 'production'],
	])('skips when %s=%s', (name, value) => {
		const directory = gitRepository();
		const result = run(['install'], { cwd: directory, env: { [name]: value } });

		expect(result.status, result.stderr).toBe(0);
		expect(existsSync(path.join(directory, '.husky/_'))).toBe(false);
	});
});

describe('lint-title', () => {
	it('accepts a Conventional Commit header passed as an argument', () => {
		expect(run(['lint-title', 'feat(auth): add passwordless login']).status).toBe(0);
	});

	it('rejects a non-conforming header and explains why', () => {
		const result = run(['lint-title', 'Add passwordless login']);

		expect(result.status).toBe(1);
		expect(result.stderr).not.toBe('');
	});

	// The shared CI workflow passes the title through PR_TITLE rather than as an argument.
	it('reads the title from PR_TITLE when no argument is given', () => {
		expect(
			run(['lint-title'], { env: { PR_TITLE: 'fix(parser): reject an empty token' } }).status,
		).toBe(0);
	});

	it('reads the title from stdin when neither argument nor environment is given', () => {
		expect(
			run(['lint-title'], { input: 'refactor(config): remove duplicate defaults' }).status,
		).toBe(0);
	});

	it.each(['v1.2.3', "Merge branch 'main' into feature", 'Revert "some change"'])(
		'rejects a default-ignored title from stdin: %j',
		title => {
			const result = run(['lint-title'], { input: title });

			expect(result.status).toBe(1);
			expect(result.stderr).not.toBe('');
		},
	);
});

describe('lint-branch', () => {
	it('accepts an allowed type with a kebab-case description', () => {
		expect(run(['lint-branch', 'feat/add-passwordless-login']).status).toBe(0);
	});

	it('rejects a branch outside the allowed shape', () => {
		const result = run(['lint-branch', 'feature/add-login']);

		expect(result.status).toBe(1);
		expect(result.stderr).not.toBe('');
	});

	// The shared CI workflow relies on this fallback for the pull request source branch.
	it('reads the branch from GITHUB_HEAD_REF when no argument is given', () => {
		expect(
			run(['lint-branch'], { env: { GITHUB_HEAD_REF: 'fix/reject-empty-token' } }).status,
		).toBe(0);
	});
});

describe('the command surface', () => {
	it('prints usage for help', () => {
		const result = run(['help']);

		expect(result.status).toBe(0);
		expect(result.stdout).toContain('Usage: mikode-git-hooks');
	});

	it('exits 2 on an unknown command', () => {
		expect(run(['nonsense']).status).toBe(2);
	});
});
