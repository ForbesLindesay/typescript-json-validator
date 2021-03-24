import Ajv from 'ajv';
import * as TJS from 'typescript-json-schema';
import * as t from './template';
import {Tsconfig} from 'tsconfig-loader';

function isKoaType(typeDefinition: TJS.Definition) {
    return (
        typeDefinition &&
        typeDefinition.properties &&
        KoaProperties.some(
            (property) => property in typeDefinition.properties!,
        ) &&
        Object.keys(typeDefinition.properties).every((property) =>
            KoaProperties.includes(property),
        )
    );
}
const KoaProperties = ['params', 'query', 'body'];
type printOptions = {
    ajv: Ajv.Options;
    separateSchemaFile: boolean;
    filename: string;
    output: string;
};
export function printTypeCollectionValidator(
    symbols: string[],
    isNamedExport: boolean,
    schema: TJS.Definition,
    source: string,
    symbolsByFile: Record<string, string[]>,
    tsConfig: Readonly<Tsconfig>,
    {ajv: options, separateSchemaFile, filename, output}: printOptions = {
        ajv: {},
        separateSchemaFile: false,
        filename: '',
        output: '',
    },
) {
    const koaTypes = symbols.filter((typeName) => {
        return isKoaType(schema.definitions && schema.definitions[typeName]);
    });
    return [
        t.TSLINT_DISABLE,
        t.GENERATED_COMMENT,
        t.IMPORT_AJV(tsConfig),
        t.importNamedTypes(symbols, output, source, symbolsByFile, {
            isNamedExport,
        }),
        ...(koaTypes.length ? [t.IMPORT_INSPECT, t.DECLARE_KOA_CONTEXT] : []),
        t.declareAJV(options),
        t.exportNamed(symbols),
        t.declareSchema(
            'Schema',
            schema,
            separateSchemaFile,
            `${filename}.json`,
        ),
        t.addSchema('Schema', options),
        ...koaTypes.map((s) => t.validateKoaRequestOverload(s, schema)),
        ...(koaTypes.length
            ? [
                  t.VALIDATE_KOA_REQUEST_FALLBACK,
                  t.VALIDATE_KOA_REQUEST_IMPLEMENTATION,
              ]
            : []),
        `export type AllowedTypeNames = ${symbols
            .map((s) => `'${s}'`)
            .join(' | ')};`,
        `export type AllowedTypes = ${symbols.map((s) => `${s}`).join(' | ')};`,
        ...symbols.map((s) => t.validateOverload(s)),
        t.validateOverload('AllowedTypeNames', 'any', false),
        t.VALIDATE_IMPLEMENTATION,
        ...(options.removeAdditional
            ? symbols.map((s) => t.cleanAndValidateOverload(s))
            : []),
        options.removeAdditional
            ? t.cleanAndValidateOverload('AllowedTypeNames', 'any', false)
            : '',
        options.removeAdditional ? t.VALIDATE_IMPLEMENTATION_CLEANER : '',
    ].join('\n');
}

export function printSingleTypeValidator(
    typeName: string,
    isNamedExport: boolean,
    schema: TJS.Definition,
    source: string,
    symbolsByFile: Record<string, string[]>,
    tsConfig: any,
    {ajv: options, separateSchemaFile, filename, output}: printOptions = {
        ajv: {},
        separateSchemaFile: false,
        filename: '',
        output: '',
    },
) {
    return [
        t.TSLINT_DISABLE,
        t.GENERATED_COMMENT,
        t.IMPORT_INSPECT,
        t.IMPORT_AJV(tsConfig),
        t.importType(typeName, output, source, symbolsByFile, {isNamedExport}),
        t.declareAJV(options),
        t.exportNamed([typeName]),
        t.declareSchema(
            typeName + 'Schema',
            schema,
            separateSchemaFile,
            `${filename}.json`,
        ),
        // TODO: koa implementation
        t.DECLARE_VALIDATE_TYPE,
        t.validateFn(typeName, typeName + 'Schema', options),
    ].join('\n');
}