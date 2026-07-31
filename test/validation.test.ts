import assert from 'node:assert/strict';
import test from 'node:test';

import { validateBranchName, validatePullRequestTitle } from '../src/index.js';

const validTitles = [
	'feat(auth): add passwordless login',
	'fix(parser): reject an empty token',
	'refactor(config): remove duplicate defaults',
	'feat(api)!: remove the legacy endpoint',
];

for (const title of validTitles) {
	void test(`accepts pull request title: ${title}`, async () => {
		const result = await validatePullRequestTitle(title);
		assert.equal(result.valid, true);
		assert.deepEqual(result.errors, []);
	});
}

const invalidTitles = [
	'Add passwordless login',
	'feature: add passwordless login',
	'feat/add-passwordless-login',
	'FEAT(auth): add passwordless login',
];

for (const title of invalidTitles) {
	void test(`rejects pull request title: ${title}`, async () => {
		const result = await validatePullRequestTitle(title);
		assert.equal(result.valid, false);
		assert.notEqual(result.errors.length, 0);
	});
}

void test('accepts a branch with an allowed type and kebab-case description', () => {
	const result = validateBranchName('feat/add-passwordless-login');
	assert.deepEqual(result, {
		valid: true,
		branch: { type: 'feat', description: 'add-passwordless-login' },
		errors: [],
	});
});

void test('rejects a branch with a ticket before ticketing is activated', () => {
	const result = validateBranchName('feat/ABC-123-add-passwordless-login');
	assert.equal(result.valid, false);
});

void test('rejects invalid branch shapes', () => {
	for (const branchName of ['feature/add-login', 'feat/add_login', 'feat/add/login', 'feat/']) {
		assert.equal(validateBranchName(branchName).valid, false);
	}
});
