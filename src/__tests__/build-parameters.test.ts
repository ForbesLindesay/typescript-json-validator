jest.setTimeout(30000);
import rimrafCB from 'rimraf';
import { exec as execCB, ExecOptions } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

jest.setTimeout(30000);

const rimraf = promisify(rimrafCB);

const testDir = path.join(__dirname, 'build-parameters');

const exec = (cmd: string, options: ExecOptions): Promise<string> =>
	new Promise((resolve, reject) => {
		execCB(cmd, options, (error, stdout, stderr) => {
			if (error) {
				reject(stderr || stdout || error.message);
			} else {
				resolve(`out: ${stdout} error: ${stderr}`);
			}
		});
	});

const buildProject = async (project: string) => {
	let result = await exec(`cp tsconfig.${project}.json tsconfig.json`, { cwd: testDir });

	const results: string[] = [];
	results.push(result);
	result = await exec(`node ../../../lib/cli ./src/Example.ts ExampleType`, {
		cwd: testDir,
	});
	results.push(result);

	result = await exec(`node ../../../lib/cli ./src/DisjointUnionExample.ts --collection`, {
		cwd: testDir,
	});
	results.push(result);

	result = await exec(`npx tsc --project ./tsconfig.json`, {
		cwd: testDir,
	});
	results.push(result);

	return results;
};

describe('Build tests', () => {
	beforeAll(() => exec('yarn build', { cwd: process.cwd() }));

	afterEach(() => Promise.all([rimraf(path.join(testDir, 'lib')), exec('rm tsconfig.json', { cwd: testDir }), exec('rm src/Example.validator.ts', { cwd: testDir })]));

	test('ESNext module settings', async () => buildProject('esnext'));

	test('ESNext interop module settings', () => buildProject('esnext-interop'));

	test('ES2015 module settings', () => buildProject('es2015'));

	test('ES2015 interop module settings', () => buildProject('es2015-interop'));

	test('UMD module settings', () => buildProject('umd'));

	test('UMD interop module settings', () => buildProject('umd-interop'));

	test('System module settings', () => buildProject('system'));

	test('System interop module settings', () => buildProject('system-interop'));

	test('Common JS module settings', () => buildProject('commonjs'));

	test('Common JS interop module settings', () => buildProject('commonjs-interop'));
});
