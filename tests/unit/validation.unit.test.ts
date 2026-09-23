import { describe, expect, it } from 'vitest';

import { validateBranchName, validatePullRequestTitle } from '../../src/index.js';

const validTitles = [
	'feat(auth): add passwordless login',
	'fix(parser): reject an empty token',
	'refactor(config): remove duplicate defaults',
	'feat(api)!: remove the legacy endpoint',
];

const ignoredTitles = [
	'v1.2.3',
	"Merge branch 'main' into feature",
	'Revert "some change"',
];

const invalidTitles = [
	'Add passwordless login',
	'feature: add passwordless login',
	'feat/add-passwordless-login',
	'FEAT(auth): add passwordless login',
];

describe('pull request titles', () => {
	it.each(validTitles)('accepts %j', async title => {
		const result = await validatePullRequestTitle(title);

		expect(result.valid).toBe(true);
		expect(result.errors).toStrictEqual([]);
	});

	it.each(invalidTitles)('rejects %j', async title => {
		const result = await validatePullRequestTitle(title);

		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});

	it.each(ignoredTitles)('rejects a default-ignored title %j', async title => {
		const result = await validatePullRequestTitle(title);

		expect(result.valid).toBe(false);
		expect(result.errors.length).toBeGreaterThan(0);
	});
});

describe('branch names', () => {
	it('accepts an allowed type with a kebab-case description', () => {
		expect(validateBranchName('feat/add-passwordless-login')).toStrictEqual({
			valid: true,
			branch: { type: 'feat', description: 'add-passwordless-login' },
			errors: [],
		});
	});

	// The git workflow standard omits the ticket segment until MiKode selects a ticketing
	// system, so a ticket-shaped branch has to be rejected rather than quietly tolerated.
	it('rejects a ticket segment before ticketing is activated', () => {
		expect(validateBranchName('feat/ABC-123-add-passwordless-login').valid).toBe(false);
	});

	it.each([
		['feature/add-login', 'a type outside the allowed set'],
		['feat/add_login', 'snake_case rather than kebab-case'],
		['feat/add/login', 'more than one path segment'],
		['feat/', 'an empty description'],
	])('rejects %j: %s', branchName => {
		expect(validateBranchName(branchName).valid).toBe(false);
	});
});
