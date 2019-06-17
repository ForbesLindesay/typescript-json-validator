import run from '../';
import {exec as execChildProcess} from 'child_process';
// let validate: any;

const exec = (cmd: string) =>
  new Promise((resolve, reject) => {
    execChildProcess(cmd, {cwd: process.cwd()}, (error, stdout, stderr) => {
      if (error) {
        reject(stderr || stdout || error.message);
      } else {
        resolve();
      }
    });
  });

beforeAll(() => exec('yarn clean'));

afterEach(() => exec('yarn clean'));

test('run', () => {
  // (jest.requireMock('../loadTsConfig')
  //   .default as jest.Mock).mockImplementationOnce(
  //   jest.requireActual('../loadTsConfig').default,
  // );
  run(['src/Example.ts', 'ExampleType']);
  // validate = require('../Example.validator').default;
});

test('ESNext module settings', () => exec('npx tsc --module esnext'));

test('UMD module settings', () => exec('npx tsc --module umd'));

test('System module settings', () => exec('npx tsc --module system'));

test('AMD module settings', () => exec('npx tsc --module amd'));

test('CommonJS module settings', () => exec('npx tsc --module commonjs'));

// test('valid', () => {
//   expect(
//     validate({
//       value: 'Hello World',
//     }),
//   ).toMatchInlineSnapshot(`
// Object {
//   "answer": 42,
//   "value": "Hello World",
// }
// `);
//   expect(
//     validate({
//       value: 'Hello World',
//       email: 'forbes@lindesay.co.uk',
//     }),
//   ).toMatchInlineSnapshot(`
// Object {
//   "answer": 42,
//   "email": "forbes@lindesay.co.uk",
//   "value": "Hello World",
// }
// `);
// });

// test('invalid', () => {
//   expect(() => validate({})).toThrowErrorMatchingInlineSnapshot(`
// "ExampleType should have required property 'value'
// ExampleType value:

// { answer: 42 }"
// `);
//   expect(() =>
//     validate({
//       value: 'Hello World',
//       email: 'forbeslindesay.co.uk',
//     }),
//   ).toThrowErrorMatchingInlineSnapshot(`
// "ExampleType.email should match format \\"email\\"
// ExampleType value:

// { value: 'Hello World',
//   email: 'forbeslindesay.co.uk',
//   answer: 42 }"
// `);
// });
