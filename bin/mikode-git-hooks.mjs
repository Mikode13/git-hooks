#!/usr/bin/env node

import { existsSync } from 'node:fs';
import process from 'node:process';

const HELP = `Usage: mikode-git-hooks <command> [value]

Commands:
  install                 Activate Husky for the current Git repository.
  lint-title [title]      Validate a pull request title. Reads stdin when omitted.
  lint-branch [branch]    Validate a branch name. Uses GITHUB_HEAD_REF when omitted.
  help                    Show this message.`;

async function main() {
	const [command = 'help', ...arguments_] = process.argv.slice(2);

	switch (command) {
		case 'install':
			return install();
		case 'lint-title':
			return lintTitle(arguments_);
		case 'lint-branch':
			return lintBranch(arguments_);
		case 'help':
		case '--help':
		case '-h':
			console.log(HELP);
			return 0;
		default:
			console.error(`Unknown command: ${command}\n\n${HELP}`);
			return 2;
	}
}

async function install() {
	if (shouldSkipInstall() || !existsSync('.git')) {
		return 0;
	}

	const { default: husky } = await import('husky');
	const message = husky();

	if (message) {
		console.error(message);
		return 1;
	}

	return 0;
}

async function lintTitle(arguments_) {
	const title = await readValue(arguments_, 'PR_TITLE');
	const { validatePullRequestTitle } = await import('../dist/index.js');
	const result = await validatePullRequestTitle(title);

	if (!result.valid) {
		printIssues(result.errors);
		return 1;
	}

	return 0;
}

async function lintBranch(arguments_) {
	const branchName = await readValue(arguments_, 'GITHUB_HEAD_REF');
	const { validateBranchName } = await import('../dist/index.js');
	const result = validateBranchName(branchName);

	if (!result.valid) {
		for (const error of result.errors) {
			console.error(`✖ ${error}`);
		}
		return 1;
	}

	return 0;
}

async function readValue(arguments_, environmentVariable) {
	const argumentValue = arguments_.join(' ').trim();
	if (argumentValue) {
		return argumentValue;
	}

	const environmentValue = process.env[environmentVariable]?.trim();
	if (environmentValue) {
		return environmentValue;
	}

	if (!process.stdin.isTTY) {
		const chunks = [];
		for await (const chunk of process.stdin) {
			chunks.push(chunk);
		}
		const standardInput = chunks.join('').trim();
		if (standardInput) {
			return standardInput;
		}
	}

	throw new Error(`Missing value. Pass an argument, stdin, or ${environmentVariable}.`);
}

function printIssues(issues) {
	for (const issue of issues) {
		console.error(`✖ ${issue.message} [${issue.name}]`);
	}
}

function shouldSkipInstall() {
	return (
		process.env.CI === 'true' ||
		process.env.CI === '1' ||
		process.env.HUSKY === '0' ||
		process.env.NODE_ENV === 'production'
	);
}

try {
	process.exitCode = await main();
} catch (error) {
	console.error(error instanceof Error ? error.message : String(error));
	process.exitCode = 2;
}
