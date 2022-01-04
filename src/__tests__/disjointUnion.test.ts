import { validate } from '../DisjointUnionExample.validator';

// let validate: any;

test('Enum Keys', () => {
	expect(() => validate('Entity')({ type: 'TypeThree', baz: 1 })).toBeTruthy();
	expect(() => validate('Entity')({ type: 'TypeOne' })).toThrowErrorMatchingInlineSnapshot(`"Invalid Entity: Entity/type must be equal to one of the allowed values"`);
	expect(() => validate('Entity')({ type: 'TypeTwo' })).toThrowErrorMatchingInlineSnapshot(`"Invalid Entity: Entity/type must be equal to one of the allowed values"`);
	expect(() => validate('Entity')({ type: 'TypeThree' })).toThrowErrorMatchingInlineSnapshot(`"Invalid Entity: Entity must have required property 'baz'"`);
	expect(() => validate('Entity')({ type: 'TypeFour' })).toThrowErrorMatchingInlineSnapshot(`"Invalid Entity: Entity/type must be equal to one of the allowed values"`);
});

test('Number Keys', () => {
	expect(() => validate('Value')({ number: 0 })).toThrowErrorMatchingInlineSnapshot(
		`"Invalid Value: Value must have required property 'foo', Value must have required property 'bar', Value/number must be equal to one of the allowed values, Value must have required property 'baz', Value/number must be equal to one of the allowed values, Value must match a schema in anyOf"`,
	);
	expect(() => validate('Value')({ number: 1 })).toThrowErrorMatchingInlineSnapshot(
		`"Invalid Value: Value must have required property 'foo', Value/number must be equal to one of the allowed values, Value must have required property 'bar', Value must have required property 'baz', Value/number must be equal to one of the allowed values, Value must match a schema in anyOf"`,
	);
	expect(() => validate('Value')({ number: 2 })).toThrowErrorMatchingInlineSnapshot(
		`"Invalid Value: Value must have required property 'foo', Value/number must be equal to one of the allowed values, Value must have required property 'bar', Value/number must be equal to one of the allowed values, Value must have required property 'baz', Value must match a schema in anyOf"`,
	);
	expect(() => validate('Value')({ type: 'TypeFour' })).toThrowErrorMatchingInlineSnapshot(
		`"Invalid Value: Value must have required property 'foo', Value must have required property 'number', Value must have required property 'bar', Value must have required property 'number', Value must have required property 'baz', Value must have required property 'number', Value must match a schema in anyOf"`,
	);
});
