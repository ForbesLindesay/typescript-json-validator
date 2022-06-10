import {printTypeCollectionValidator} from '../src/printValidator';
import {writeFileSync, mkdirSync} from 'fs';
import prettierFile from '../src/prettierFile';
import loadTsConfig from '../src/loadTsConfig';
import {IParser, createParser} from '../src/schemaGenerator';
import * as path from 'path';
import rimrafCB from 'rimraf';
import {promisify} from 'util';
import {isBoolean} from 'lodash';

const rimraf = promisify(rimrafCB);

const complexPath = path.join(
  __dirname,
  'build-parameters/src/ComplexExample.ts',
);
const complexPathValidator = path.join(
  __dirname,
  '/output/ComplexExample.validator.ts',
);

const complexPathValidatorUsage = path.join(
  __dirname,
  '/output/ComplexExample.usage.ts',
);

mkdirSync(path.dirname(complexPathValidatorUsage), {recursive: true});

async function generateValidator() {
  const tsConfig = loadTsConfig();
  const parser: IParser = createParser(complexPath, tsConfig);
  const {symbols, schema} = parser.getAllTypes();
  if (isBoolean(schema)) {
    fail();
  }
  writeFileSync(
    complexPathValidator,
    printTypeCollectionValidator(
      parser,
      symbols,
      schema,
      '../build-parameters/src/ComplexExample',
      tsConfig.tsConfig,
    ),
  );
  prettierFile(complexPathValidator);
  writeFileSync(
    complexPathValidatorUsage,
    `
  import {Context} from 'koa';
  import { createMockContext } from '@shopify/jest-koa-mocks';
  // @ts-ignore
  import {validateKoaRequest, RequestA} from './ComplexExample.validator';

  const x: Context = createMockContext();
  export const y: RequestA = validateKoaRequest('RequestA')(x);
  `,
  );
  prettierFile(complexPathValidatorUsage);
  // @ts-ignore
  const validator = await import('./output/ComplexExample.validator');
  // @ts-ignore
  const usage = await import('./output/ComplexExample.usage');
  return [validator, usage];
}

test('print', async () => {
  const [validator, usage] = await generateValidator();
  expect(validator).toBeDefined();
  expect(usage).toBeDefined();
});
afterEach(async () => {
  await rimraf(complexPathValidator);
  await rimraf(complexPathValidatorUsage);
});
describe('Given Validator', () => {
  let validate: any;
  //let usage: any;
  beforeEach(async () => {
    const [v] = await generateValidator();
    validate = v;
    //usage = u;
  });
  afterEach(async () => {
    await rimraf(complexPathValidator);
    await rimraf(complexPathValidatorUsage);
  });
  test('validateValue', () => {
    expect(validate).toBeDefined();
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
