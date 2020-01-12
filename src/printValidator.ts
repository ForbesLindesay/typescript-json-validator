import Ajv from 'ajv';
import * as TJS from 'typescript-json-schema';
import * as t from './template';

function isKoaType(typeDefinition: TJS.Definition) {
  return (
    typeDefinition &&
    typeDefinition.properties &&
    KoaProperties.some(property => property in typeDefinition.properties!) &&
    Object.keys(typeDefinition.properties).every(property =>
      KoaProperties.includes(property),
    )
  );
}
const KoaProperties = ['params', 'query', 'body'];
export function printTypeCollectionValidator(
  symbols: string[],
  schema: TJS.Definition,
  relativePath: string,
  tsConfig: any,
  options: Ajv.Options = {},
) {
  const koaTypes = symbols.filter(typeName => {
    return isKoaType(schema.definitions && schema.definitions[typeName]);
  });
  return [
    t.TSLINT_DISABLE,
    t.GENERATED_COMMENT,
    t.IMPORT_AJV(tsConfig),
    t.importNamedTypes(symbols, relativePath),
    ...(koaTypes.length ? [t.IMPORT_INSPECT, t.DECLARE_KOA_CONTEXT] : []),
    t.declareAJV(options),
    t.exportNamed(symbols),
    t.declareSchema('Schema', schema),
    t.addSchema('Schema'),
    ...koaTypes.map(s => t.validateKoaRequestOverload(s, schema)),
    ...(koaTypes.length
      ? [t.VALIDATE_KOA_REQUEST_FALLBACK, t.VALIDATE_KOA_REQUEST_IMPLEMENTATION]
      : []),
    ...symbols.map(s => t.validateOverload(s)),
    t.VALIDATE_IMPLEMENTATION,
  ].join('\n');
}

export function printSingleTypeValidator(
  typeName: string,
  isNamedExport: boolean,
  schema: TJS.Definition,
  relativePath: string,
  tsConfig: any,
  options: Ajv.Options = {},
) {
  return [
    t.TSLINT_DISABLE,
    t.GENERATED_COMMENT,
    t.IMPORT_INSPECT,
    t.IMPORT_AJV(tsConfig),
    t.importType(typeName, relativePath, {isNamedExport}),
    t.declareAJV(options),
    t.exportNamed([typeName]),
    t.declareSchema(typeName + 'Schema', schema),
    // TODO: koa implementation
    t.DECLARE_VALIDATE_TYPE,
    t.validateFn(typeName, typeName + 'Schema'),
  ].join('\n');
}
