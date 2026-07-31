export const ALLOWED_TYPES = [
	'build',
	'chore',
	'ci',
	'docs',
	'feat',
	'fix',
	'perf',
	'refactor',
	'revert',
	'style',
	'test',
] as const;

export type ChangeType = (typeof ALLOWED_TYPES)[number];
