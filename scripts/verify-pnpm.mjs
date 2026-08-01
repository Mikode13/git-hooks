#!/usr/bin/env node

import process from 'node:process';

const userAgent = process.env.npm_config_user_agent ?? '';

if (!userAgent.startsWith('pnpm')) {
	console.error('@mikode13/git-hooks development requires pnpm. Run "pnpm install" instead.');
	process.exit(1);
}
