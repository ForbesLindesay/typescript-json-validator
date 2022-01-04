module.exports = {
	preset: 'ts-jest',
	testEnvironment: 'node',
	transform: {
		'^.+\\.ts$': 'ts-jest',
	},
	testRegex: '.*/__tests__/.*\\.(test|spec)\\.ts$',
	watchPathIgnorePatterns: ['.*/lib/.*', '.*/src/Example.validator\\.ts', '.*/src/__tests__/output/.*'],
	//moduleFileExtensions: ['ts', 'js'],
	globals: {
		'ts-jest': {
			diagnostics: false,
			inlineSourceMap: true,
		},
	},
	reporters: ['default', ['jest-summary-reporter', { failuresOnly: true }]],
};
