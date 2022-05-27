import parse from '../parse';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import { formatNames } from 'ajv-formats/dist/formats';
import loadTsConfig from '../loadTsConfig';
import { mapKeys } from 'lodash';
import path from 'path';

test('parse', () => {
	const actual = parse([__dirname + '/../ComplexExample.ts'], loadTsConfig()).getAllTypes();
	actual.symbolsByFile = mapKeys(actual.symbolsByFile, (_, k) => {
		return path.posix.relative(process.cwd(), k);
	});
	expect(actual).toMatchInlineSnapshot(`
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
		  "symbolsByFile": Object {
		    "src/ComplexExample": Array [
		      "MyEnum",
		      "TypeA",
		      "TypeB",
		      "RequestA",
		      "RequestB",
		    ],
		  },
		}
	`);
});

test('ajv', () => {
	const parsed = parse([__dirname + '/../ComplexExample.ts'], loadTsConfig(), {
		titles: true,
	});
	const { schema } = parsed.getAllTypes();
	const ajv = new Ajv({
		coerceTypes: false,
		allErrors: true,
		useDefaults: true,
	});
	addFormats(ajv, { formats: formatNames, mode: 'fast', keywords: true });
	ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
	ajv.addSchema(schema, 'root');
	const validateMyEnum = ajv.getSchema('root#/definitions/MyEnum')!;
	expect(validateMyEnum(1)).toBe(true);
	expect(validateMyEnum(10)).toBe(false);
	expect(ajv.errorsText(validateMyEnum.errors, { dataVar: 'x' })).toMatchInlineSnapshot(`"x must be equal to one of the allowed values"`);

	const validateRequestA = ajv.getSchema('root#/definitions/RequestA')!;
	expect(validateRequestA({ query: { id: 'x', value: 'y' }, params: { e: 42 } })).toBe(false);
	expect(ajv.errorsText(validateRequestA.errors, { dataVar: 'req' })).toMatchInlineSnapshot(
		`"req must have required property 'body', req/query/id must be number, req/params/e must be equal to one of the allowed values"`,
	);
});
