import { fileURLToPath } from 'node:url';

import lint from '@commitlint/lint';
import load from '@commitlint/load';

import { ALLOWED_TYPES } from './constants.js';

const PACKAGE_ROOT = fileURLToPath(new URL('../', import.meta.url));
const COMMITLINT_SEED = {
	extends: ['@commitlint/config-conventional'],
	rules: {
		'type-enum': [2, 'always', [...ALLOWED_TYPES]] as [2, 'always', string[]],
	},
};

type LintOptions = NonNullable<Parameters<typeof lint>[2]>;

export interface ValidationIssue {
	readonly name: string;
	readonly message: string;
}

export interface TitleValidationResult {
	readonly valid: boolean;
	readonly errors: readonly ValidationIssue[];
	readonly warnings: readonly ValidationIssue[];
}

export async function validatePullRequestTitle(title: string): Promise<TitleValidationResult> {
	const config = await load(COMMITLINT_SEED, { cwd: PACKAGE_ROOT });
	const parserOptions = config.parserPreset?.parserOpts as LintOptions['parserOpts'];
	const lintOptions: LintOptions = parserOptions === undefined ? {} : { parserOpts: parserOptions };
	const report = await lint(title.trim(), config.rules, lintOptions);

	return {
		valid: report.valid,
		errors: report.errors.map(({ message, name }) => ({ message, name })),
		warnings: report.warnings.map(({ message, name }) => ({ message, name })),
	};
}
