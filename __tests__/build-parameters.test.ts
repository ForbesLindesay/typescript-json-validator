jest.setTimeout(30000);
import rimrafCB from 'rimraf';
import { exec as execCB, ExecOptions } from 'child_process';
import * as path from 'path';
import { promisify } from 'util';

jest.setTimeout(30000);

const rimraf = promisify(rimrafCB);

const testDir = path.join(__dirname, 'build-parameters');

const cli = path.join(__dirname, '..', 'lib', 'cli');
const exec = (cmd: string, options: ExecOptions): Promise<string> =>
  new Promise((resolve, reject) => {
    const subProcess = execCB(cmd, options, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || stdout || error.message);
      } else {
        resolve(stdout);
      }
    });
    subProcess.stdout?.on('data', (data) => {
      if (process.env['DEBUG']?.includes('TSJ'))
        console.log(`${cmd}(${subProcess.pid}) : ${data}`);
    });
  });

const buildProject = async (project: string) => {
  await exec(`cp tsconfig.${project}.json tsconfig.json`, {cwd: testDir});

  await exec(`node ${cli} ./src/Example.ts ExampleType`, {
    cwd: testDir,
  });
  await exec(
    `node ${cli} --collection ./src/Example.ts -o ./src/ExampleColl.validator.ts`,
    {
      cwd: testDir,
    },
  );
  await exec(`node ${cli} ./src/DisjointUnionExample.ts --collection`, {
    cwd: testDir,
  });
  await exec(`node ${cli} ./src/ComplexExample.ts --collection`, {
    cwd: testDir,
  });

  await exec(`npx tsc --project ./tsconfig.json`, {
    cwd: testDir,
  });
};
beforeAll(() => exec('pnpm testBuild', {cwd: path.join(testDir, '../../')}));

afterEach(() =>
  Promise.all([
    rimraf(path.join(testDir, 'lib')),
    exec('rm tsconfig.json', {cwd: testDir}),
    exec('rm src/*.validator.ts', {cwd: testDir}),
  ]),
);

test('ESNext module settings', () => buildProject('esnext'));

test('ESNext interop module settings', () => buildProject('esnext-interop'));

test('ES2015 module settings', () => buildProject('es2015'));

test('ES2015 interop module settings', () => buildProject('es2015-interop'));

test('UMD module settings', () => buildProject('umd'));

test('UMD interop module settings', () => buildProject('umd-interop'));

test('System module settings', () => buildProject('system'));

test('System interop module settings', () => buildProject('system-interop'));

test('Common JS module settings', () => buildProject('commonjs'));

test('Common JS interop module settings', () =>
  buildProject('commonjs-interop'));
