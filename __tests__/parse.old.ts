import parse from './parse';
import Ajv from 'ajv';
import loadTsConfig from '../src/loadTsConfig';

if (process.platform === 'win32') {
  describe('Old parse does not work on windows', () => {
    test('temp', () => {});
  });
} else {
  test('parse', () => {
    if (process.platform === 'win32') {
      return;
    }
    expect(
      parse(
        [__dirname + '/build-parameters/src/ComplexExample.ts'],
        loadTsConfig(),
      ).getAllTypes(),
    ).toMatchSnapshot();
  });

  test('ajv', () => {
    if (process.platform === 'win32') {
      return;
    }
    const parsed = parse(
      [__dirname + '/build-parameters/src/ComplexExample.ts'],
      loadTsConfig(),
      {
        titles: true,
      },
    );
    const {schema} = parsed.getAllTypes();
    const ajv = new Ajv({
      coerceTypes: false,
      allErrors: true,
      useDefaults: true,
    });
    ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));
    ajv.addSchema(schema, 'root');
    const validateMyEnum = ajv.getSchema('root#/definitions/MyEnum')!;
    expect(validateMyEnum).toBeDefined();
    expect(typeof validateMyEnum).toBe('function');
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
}
