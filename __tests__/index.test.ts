import run from '../src';
import rimrafCB from 'rimraf';
import {promisify} from 'util';
const rimraf = promisify(rimrafCB);

describe('run', () => {
  beforeAll(() => {
    run([
      '-o',
      './__tests__/validators/output/Example.validator.ts',
      '--collection',
      './__tests__/build-parameters/src/Example.ts',
      'ExampleType',
    ]);
  });
  afterAll(async () => {
    return rimraf('./__test__/validators/output', {});
  });
  test('run', async () => {
    // @ts-ignore
    const validate = await import('./validators/output/Example.validator');
    expect(validate).toBeDefined();
  });
});

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
