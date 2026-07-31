import { ALLOWED_TYPES, type ChangeType } from './constants.js';

const DESCRIPTION_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const ALLOWED_TYPE_SET = new Set<string>(ALLOWED_TYPES);

export interface BranchName {
	readonly type: ChangeType;
	readonly description: string;
}

export interface BranchValidationResult {
	readonly valid: boolean;
	readonly branch?: BranchName;
	readonly errors: readonly string[];
}

export function validateBranchName(branchName: string): BranchValidationResult {
	const normalizedBranchName = branchName.trim();
	const segments = normalizedBranchName.split('/');

	if (segments.length !== 2) {
		return invalid('branch name must use the format <type>/<description> with exactly one slash');
	}

	const [type, description] = segments;

	if (type === undefined || !ALLOWED_TYPE_SET.has(type)) {
		return invalid(`type must be one of [${ALLOWED_TYPES.join(', ')}]`);
	}

	if (description === undefined || !DESCRIPTION_PATTERN.test(description)) {
		return invalid('description must be lowercase English kebab-case');
	}

	return {
		valid: true,
		branch: {
			type: type as ChangeType,
			description,
		},
		errors: [],
	};
}

function invalid(message: string): BranchValidationResult {
	return { valid: false, errors: [message] };
}
