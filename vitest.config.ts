import { defineConfig } from 'vitest/config';

export default defineConfig({
	test: {
		projects: [
			{
				test: {
					name: 'unit',
					include: ['tests/unit/**/*.unit.test.ts'],
				},
			},
			{
				test: {
					name: 'integration',
					include: ['tests/integration/**/*.integration.test.ts'],
					// Each case builds the package and spawns the real CLI against a scratch Git
					// repository, which comfortably exceeds the 5s default.
					testTimeout: 120_000,
					hookTimeout: 120_000,
				},
			},
		],
		coverage: {
			provider: 'v8',
			include: ['src/**/*.ts'],
		},
	},
});
