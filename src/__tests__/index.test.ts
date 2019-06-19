import run from '../';

// let validate: any;

test('run', () => {
  run(['src/Example.ts', 'ExampleType']);
  // validate = require('../Example.validator').default;
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
