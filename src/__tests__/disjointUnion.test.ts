import {validate} from '../DisjointUnionExample.validator';

// let validate: any;

test('Enum Keys', () => {
  expect(() =>
    validate('Entity')({type: 'TypeOne'}),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invalid Entity: Entity should have required property 'foo'"`,
  );
  expect(() =>
    validate('Entity')({type: 'TypeTwo'}),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invalid Entity: Entity should have required property 'bar'"`,
  );
  expect(() =>
    validate('Entity')({type: 'TypeThree'}),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invalid Entity: Entity should have required property 'baz'"`,
  );
  expect(() =>
    validate('Entity')({type: 'TypeFour'}),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invalid Entity: Entity.type should be equal to one of the allowed values"`,
  );
});

test('Number Keys', () => {
  expect(() =>
    validate('Value')({number: 0}),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invalid Value: Value should have required property 'foo'"`,
  );
  expect(() =>
    validate('Value')({number: 1}),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invalid Value: Value should have required property 'bar'"`,
  );
  expect(() =>
    validate('Value')({number: 2}),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invalid Value: Value should have required property 'baz'"`,
  );
  expect(() =>
    validate('Value')({type: 'TypeFour'}),
  ).toThrowErrorMatchingInlineSnapshot(
    `"Invalid Value: Value should have required property 'number'"`,
  );
});
