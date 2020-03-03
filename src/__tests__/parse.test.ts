import parse from '../parse';
import Ajv from 'ajv';
import loadTsConfig from '../loadTsConfig';

test('parse', () => {
  expect(
    parse([__dirname + '/../ComplexExample.ts'], loadTsConfig()).getAllTypes(),
  ).toMatchInlineSnapshot(`
Object {
  "schema": Object {
    "$schema": "http://json-schema.org/draft-07/schema#",
    "definitions": Object {
      "MyEnum": Object {
        "enum": Array [
          0,
          1,
          2,
        ],
        "type": "number",
      },
      "RequestA": Object {
        "properties": Object {
          "body": Object {
            "$ref": "#/definitions/TypeB",
          },
          "params": Object {
            "properties": Object {
              "e": Object {
                "$ref": "#/definitions/MyEnum",
              },
            },
            "required": Array [
              "e",
            ],
            "type": "object",
          },
          "query": Object {
            "$ref": "#/definitions/TypeA",
          },
        },
        "required": Array [
          "body",
          "params",
          "query",
        ],
        "type": "object",
      },
      "RequestB": Object {
        "properties": Object {
          "query": Object {
            "$ref": "#/definitions/TypeA",
          },
        },
        "required": Array [
          "query",
        ],
        "type": "object",
      },
      "TypeA": Object {
        "properties": Object {
          "id": Object {
            "type": "number",
          },
          "value": Object {
            "type": "string",
          },
        },
        "required": Array [
          "id",
          "value",
        ],
        "type": "object",
      },
      "TypeB": Object {
        "properties": Object {
          "id": Object {
            "type": Array [
              "null",
              "number",
            ],
          },
          "value": Object {
            "format": "date-time",
            "type": Array [
              "null",
              "string",
            ],
          },
        },
        "required": Array [
          "id",
          "value",
        ],
        "type": "object",
      },
    },
  },
  "symbols": Array [
    "MyEnum",
    "TypeA",
    "TypeB",
    "RequestA",
    "RequestB",
  ],
}
`);
});

test('ajv', () => {
  const parsed = parse([__dirname + '/../ComplexExample.ts'], loadTsConfig(), {
    titles: true,
  });
  const {schema} = parsed.getAllTypes();
  const ajv = new Ajv({coerceTypes: false, allErrors: true, useDefaults: true});
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
