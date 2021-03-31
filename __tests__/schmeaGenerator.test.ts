import {createParser as parse} from '../src/schemaGenerator';
import Ajv from 'ajv';
import loadTsConfig from '../src/loadTsConfig';
import * as path from 'path';
import {isBoolean} from 'lodash';

const complexPath = path.join(
  __dirname,
  'build-parameters/src/ComplexExample.ts',
);

type ParseTestContext = {
  file: string;
  type: string;
};

type ValidateTestContext = {
  file: string;
  types: ValidateSchemaContext[];
};
type ValidateSchemaContext = {
  schemaRef: string;
  validations: {value: any; toBe: boolean}[];
};

function getPathToFile(file: string): string {
  return path.join(__dirname, 'build-parameters', 'src', file);
}

test.each<ParseTestContext>([
  {file: 'ComplexExample.ts', type: 'TypeA'},
  {file: 'Example.ts', type: 'ExampleClass'},
  {file: 'DisjointUnionExample.ts', type: 'EntityOne'},
  {file: 'OmitExample.ts', type: 'ISchema'},
])('Use schemaGenerator to parse $file', (tc: ParseTestContext) => {
  const filePath = getPathToFile(tc.file);
  const parser = parse(filePath, loadTsConfig());
  expect(parser.getAllTypes()).toMatchSnapshot();
  expect(parser.getType(tc.type)).toMatchSnapshot();
  expect(parser.getTypeExport(tc.type)).toMatchSnapshot();
});

test.each<ValidateTestContext>([
  {
    file: 'OmitExample.ts',
    types: [
      {
        schemaRef: 'root#/definitions/ISchema',
        validations: [
          {value: {id: '1', schema: 1}, toBe: false},
          {value: {id: '1', schema: {type: 'string'}}, toBe: true},
        ],
      },
    ],
  },
  {
    file: 'ComplexExample.ts',
    types: [
      {
        schemaRef: 'root#/definitions/MyEnum',
        validations: [
          {value: 1, toBe: true},
          {value: 10, toBe: false},
        ],
      },
      {
        schemaRef: 'root#/definitions/RequestA',
        validations: [
          {value: {query: {id: 'x', value: 'y'}, params: {e: 42}}, toBe: false},
        ],
      },
    ],
  },

  {
    file: 'Example.ts',
    types: [
      {
        schemaRef: 'root#/definitions/ExampleClass',
        validations: [
          {value: {value: 'test'}, toBe: true},
          {value: {value: 'test', email: 'robert@g.com'}, toBe: true},
          {
            value: {value: 'test', email: 'robert@g.com', answer: 50},
            toBe: true,
          },
          {value: {value: 'test', email: 'robert', answer: 50}, toBe: false},
          {
            value: {value: 'test', email: 'robert@g.com', answer: '50'},
            toBe: false,
          },
        ],
      },
      {
        schemaRef: 'root#/definitions/ExampleType',
        validations: [
          {value: {value: 'test'}, toBe: true},
          {value: {value: 'test', email: 'robert@g.com'}, toBe: true},
          {
            value: {value: 'test', email: 'robert@g.com', answer: 50},
            toBe: true,
          },
          {value: {value: 'test', email: 'robert', answer: 50}, toBe: false},
          {
            value: {value: 'test', email: 'robert@g.com', answer: '50'},
            toBe: false,
          },
        ],
      },
    ],
  },
])('Validating with ajv for $file', (tc: ValidateTestContext) => {
  const filePath = getPathToFile(tc.file);
  const parsed = parse(filePath, loadTsConfig());
  const {schema} = parsed.getAllTypes();
  const ajv = new Ajv({coerceTypes: false, allErrors: true, useDefaults: true});
  ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
  if (isBoolean(schema)) {
    fail();
  }
  ajv.addSchema(schema, 'root');

  tc.types.forEach((type) => {
    const validator = ajv.getSchema(type.schemaRef)!;
    if (!validator) {
      console.log(`No validator for ${type.schemaRef}`);
    }
    expect(validator).toBeDefined();
    type.validations.forEach((v) => {
      if (validator(v.value) !== v.toBe) {
        console.log(
          `Failed validation ${JSON.stringify(v.value)}, expected: ${v.toBe}`,
        );
      }
      expect(validator(v.value)).toBe(v.toBe);
      if (!v.toBe) {
        expect(
          ajv.errorsText(validator.errors, {dataVar: 'x'}),
        ).toMatchSnapshot();
      }
    });
  });
});

test('ajv', () => {
  const parsed = parse(complexPath, loadTsConfig());
  const {schema} = parsed.getAllTypes();
  const ajv = new Ajv({coerceTypes: false, allErrors: true, useDefaults: true});
  if (isBoolean(schema)) {
    fail();
  }
  ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
  ajv.addSchema(schema, 'root');

  const validateMyEnum = ajv.getSchema('root#/definitions/MyEnum')!;
  expect(validateMyEnum(1)).toBe(true);
  expect(validateMyEnum(10)).toBe(false);
  expect(
    ajv.errorsText(validateMyEnum.errors, {dataVar: 'x'}),
  ).toMatchInlineSnapshot(`"x should be equal to one of the allowed values"`);

  const validateRequestA = ajv.getSchema('root#/definitions/RequestA')!;
  expect(
    validateRequestA({query: {id: 'x', value: 'y'}, params: {e: 42}}),
  ).toBe(false);
  expect(
    ajv.errorsText(validateRequestA.errors, {dataVar: 'req'}),
  ).toMatchInlineSnapshot(
    `"req.query.id should be number, req should have required property 'body', req.params.e should be equal to one of the allowed values"`,
  );
});
