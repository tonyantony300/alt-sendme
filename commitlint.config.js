export default {
	extends: ['@commitlint/config-conventional'],
	helpUrl:
		'https://github.com/tonyantony300/dashbeam/blob/main/CONTRIBUTING.md#commit-messages',
	// Allow types already used by generate-release-notes.js
	rules: {
		'type-enum': [
			2,
			'always',
			[
				'build',
				'chore',
				'ci',
				'docs',
				'feat',
				'feature',
				'fix',
				'hotfix',
				'perf',
				'refactor',
				'revert',
				'style',
			'release',
			'test',
			],
		],
	},
	ignores: [
		(message) => /^Merge\b/.test(message),
		// Release PRs (see scripts/generate-release-notes.js)
		(message) => /^release[\s-]+\d+\.\d+\.\d+/i.test(message),
	],
}
