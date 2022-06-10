import Ajv from 'ajv';
import {Tsconfig} from 'tsconfig-loader';
import * as TJS from 'typescript-json-schema';
import {isDefinition} from './normalizeSchema';
import {IParser} from './schemaGenerator';
import * as t from './template';

function isKoaType(typeDefinition: TJS.DefinitionOrBoolean) {
  if (!isDefinition(typeDefinition)) return false;
  return (
    typeDefinition.properties &&
    KoaProperties.some((property) => property in typeDefinition.properties!) &&
    Object.keys(typeDefinition.properties).every((property) =>
      KoaProperties.includes(property),
    )
  );
}
const KoaProperties = ['params', 'query', 'body'];
export function printTypeCollectionValidator(
  parser: IParser,
  symbols: string[],
  schema: TJS.Definition,
  relativePath: string,
  tsConfig: Tsconfig,
  options: Ajv.Options = {},
) {
  const koaTypes = symbols.filter((typeName) => {
    if (!schema.definitions) return false;
    if (!isDefinition(schema.definitions[typeName])) return false;
    return isKoaType(schema.definitions[typeName]);
  });
  return [
    t.TSLINT_DISABLE,
    t.GENERATED_COMMENT,
    t.IMPORT_AJV(tsConfig),
    t.importNamedTypes(symbols, relativePath, parser),
    ...(koaTypes.length ? [t.IMPORT_INSPECT, t.DECLARE_KOA_CONTEXT] : []),
    t.declareAJV(options),
    t.exportNamed(symbols),
    t.declareSchema('Schema', schema),
    t.addSchema('Schema'),
    ...koaTypes.map((s) => t.validateKoaRequestOverload(s, schema)),
    ...(koaTypes.length
      ? [t.VALIDATE_KOA_REQUEST_FALLBACK, t.VALIDATE_KOA_REQUEST_IMPLEMENTATION]
      : []),
    ...symbols.map((s) => t.validateOverload(s)),
    t.VALIDATE_IMPLEMENTATION,
  ].join('\n');
}

/**
 *
 * @param parser The parser that generates tbe ATS from the typescript files
 * @param typeName  the name of the type that should have its validators generated
 * @param schema  the JSON schema for the types
 * @param relativePath relative path from the output file to the source file, in posix format
 * @param tsConfig TSC config object
 * @param options  Ajv config options
 * @returns Resturns a string that is the typescipt for the validation.
 */
export function printSingleTypeValidator(
  parser: IParser,
  typeName: string,
  schema: TJS.Definition,
  relativePath: string,
  tsConfig: Tsconfig,
  options: Ajv.Options = {},
) {
  return [
    t.TSLINT_DISABLE,
    t.GENERATED_COMMENT,
    t.IMPORT_INSPECT,
    t.IMPORT_AJV(tsConfig),
    t.importType(typeName, relativePath, parser),
    t.declareAJV(options),
    t.exportNamed([typeName]),
    t.declareSchema(typeName + 'Schema', schema),
    // TODO: koa implementation
    t.DECLARE_VALIDATE_TYPE,
    t.validateFn(typeName, typeName + 'Schema'),
  ].join('\n');
}
