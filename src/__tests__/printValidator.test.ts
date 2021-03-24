import parse from '../parse';
import {printTypeCollectionValidator} from '../printValidator';
import {writeFileSync} from 'fs';
import prettierFile from '../prettierFile';
import loadTsConfig from '../loadTsConfig';
import {Tsconfig} from 'tsconfig-loader';
import {isNil} from 'lodash';

let validate: typeof import('./output/ComplexExample.validator') =
    undefined as any;

describe('Print Validator tests', () => {
    beforeAll(async () => {
        const tsConfig: Tsconfig = loadTsConfig();
        const {symbols, schema, symbolsByFile} = parse(
            [__dirname + '/../ComplexExample.ts'],
            tsConfig,
        ).getAllTypes();

        const output = __dirname + '/output/ComplexExample.validator.ts';
        writeFileSync(
            output,
            printTypeCollectionValidator(
                symbols,
                false,
                schema,
                '../../ComplexExample',
                symbolsByFile,
                tsConfig,
                {
                    ajv: {},
                    separateSchemaFile: false,
                    filename: '',
                    output,
                },
            ),
        );
        prettierFile(output);
        writeFileSync(
            __dirname + '/output/ComplexExample.usage.ts',
            `
  import {Context} from 'koa';
  import {validateKoaRequest, RequestA} from './ComplexExample.validator';

  declare const x: Context;
  export const y: RequestA = validateKoaRequest('RequestA')(x);
  `,
        );
        prettierFile(__dirname + '/output/ComplexExample.usage.ts');
        validate = await import('./output/ComplexExample.validator');
    });
    test('validateValue', () => {
        expect(validate.validate('MyEnum')(0)).toBe(0);
        expect(() =>
            validate.validate('MyEnum')(42),
        ).toThrowErrorMatchingInlineSnapshot(
            `"Invalid MyEnum: MyEnum should be equal to one of the allowed values"`,
        );
    });

    test('validateRequest', () => {
        expect(() =>
            validate.validateKoaRequest('RequestA')({
                params: {},
                throw: (number: number, message: string) => {
                    throw new Error(`${number} <KOA ERROR> ${message}`);
                },
            } as any),
        ).toThrowErrorMatchingInlineSnapshot(`
"400 <KOA ERROR> Invalid request: params should have required property 'e'

{ params: {}, query: undefined, body: undefined }"
`);
        const {params, query, body} = validate.validateKoaRequest('RequestA')({
            params: {
                e: validate.MyEnum.ValueB,
            },
            query: {
                id: 0,
                value: 'hello',
            },
            request: {
                body: {
                    id: 1,
                    value: '2019-01-25T19:09:28.179Z',
                },
            },
            throw: (number: number, message: string) => {
                throw new Error(`${number} <KOA ERROR> ${message}`);
            },
        } as any);
        expect({params, query, body}).toMatchInlineSnapshot(`
Object {
  "body": Object {
    "id": 1,
    "value": "2019-01-25T19:09:28.179Z",
  },
  "params": Object {
    "e": 1,
  },
  "query": Object {
    "id": 0,
    "value": "hello",
  },
}
`);
    });
});
