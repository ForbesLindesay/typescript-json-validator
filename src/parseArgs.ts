import {basename} from 'path';
import {sync as globSync} from 'glob';
import {
  getDefaultArgs,
  Args as TypeScriptJsonSchemaArgs,
} from 'typescript-json-schema';
import Ajv from 'ajv';

export interface Options {
  schema: Pick<
    TypeScriptJsonSchemaArgs,
    Exclude<keyof TypeScriptJsonSchemaArgs, 'out'>
  >;
  ajv: Ajv.Options;
  useNamedExport: boolean;
}
export interface File {
  fileName: string;
  typeName?: string;
}
export interface ParsedArgs {
  files: File[];
  options: Options;
}
export function parseArgs(args?: string[]): ParsedArgs {
  var helpText =
    'Usage: typescript-json-schema <path-to-typescript-file> <type>';
  const defaultArgs = getDefaultArgs();
  const parsedArgs = require('yargs')
    .usage(helpText)
    .demand(1)

    // typescript-json-schema options

    .boolean('refs')
    .default('refs', defaultArgs.ref)
    .describe('refs', 'Create shared ref definitions.')
    .boolean('aliasRefs')
    .default('aliasRefs', defaultArgs.aliasRef)
    .describe(
      'aliasRefs',
      'Create shared ref definitions for the type aliases.',
    )
    .boolean('topRef')
    .default('topRef', defaultArgs.topRef)
    .describe('topRef', 'Create a top-level ref definition.')
    .boolean('titles')
    .default('titles', defaultArgs.titles)
    .describe('titles', 'Creates titles in the output schema.')
    .boolean('defaultProps')
    // default to enabling default props
    .default('defaultProps', true)
    .describe('defaultProps', 'Create default properties definitions.')
    .boolean('noExtraProps')
    .default('noExtraProps', defaultArgs.noExtraProps)
    .describe(
      'noExtraProps',
      'Disable additional properties in objects by default.',
    )
    .boolean('propOrder')
    .default('propOrder', defaultArgs.propOrder)
    .describe('propOrder', 'Create property order definitions.')
    .boolean('typeOfKeyword')
    .default('typeOfKeyword', defaultArgs.typeOfKeyword)
    .describe(
      'typeOfKeyword',
      'Use typeOf keyword (https://goo.gl/DC6sni) for functions.',
    )
    .boolean('required')
    // default to requiring non-optional props
    .default('required', true)
    .describe('required', 'Create required array for non-optional properties.')
    .boolean('strictNullChecks')
    // default to strict null checks
    .default('strictNullChecks', true)
    .describe('strictNullChecks', 'Make values non-nullable by default.')
    .boolean('ignoreErrors')
    .default('ignoreErrors', defaultArgs.ignoreErrors)
    .describe('ignoreErrors', 'Generate even if the program has errors.')
    .array('validationKeywords')
    .default('validationKeywords', defaultArgs.validationKeywords)
    .describe(
      'validationKeywords',
      'Provide additional validation keywords to include.',
    )
    .boolean('excludePrivate')
    .default('excludePrivate', defaultArgs.excludePrivate)
    .describe('excludePrivate', 'Exclude private members from the schema.')
    .boolean('uniqueNames')
    .default('uniqueNames', defaultArgs.uniqueNames)
    .describe('uniqueNames', 'Use unique names for type symbols.')
    .array('include')
    .default('*', defaultArgs.include)
    .describe(
      'include',
      'Further limit tsconfig to include only matching files.',
    )
    .boolean('rejectDateType')
    .default('rejectDateType', defaultArgs.rejectDateType)
    .describe('rejectDateType', 'Rejects Date fields in type definitions.')
    .string('id')
    .default('id', defaultArgs.id)
    .describe('id', 'ID of schema.')

    // ajv options

    .boolean('uniqueItems')
    .default('uniqueItems', true)
    .describe('uniqueItems', 'Validate `uniqueItems` keyword')
    .boolean('unicode')
    .default('unicode', true)
    .describe(
      'unicode',
      'calculate correct length of strings with unicode pairs (true by default). Pass false to use .length of strings that is faster, but gives "incorrect" lengths of strings with unicode pairs - each unicode pair is counted as two characters.',
    )
    .boolean('nullable')
    .default('nullable', true)
    .describe(
      'nullable',
      'support keyword "nullable" from Open API 3 specification.',
    )
    .choices('format', ['fast', 'full'])
    .default('format', 'fast')
    .describe(
      'format',
      "formats validation mode ('fast' by default). Pass 'full' for more correct and slow validation or false not to validate formats at all. E.g., 25:00:00 and 2015/14/33 will be invalid time and date in 'full' mode but it will be valid in 'fast' mode.",
    )
    .boolean('coerceTypes')
    .default('coerceTypes', false)
    .describe(
      'coerceTypes',
      'Change data type of data to match type keyword. e.g. parse numbers in strings',
    )

    // specific to typescript-json-validator

    .boolean('collection')
    .default('collection', false)
    .describe(
      'collection',
      'Process the file as a collection of types, instead of one single type.',
    )
    .boolean('useNamedExport')
    .default('useNamedExport', false)
    .describe(
      'useNamedExport',
      'Type name is a named export, rather than the default export of the file',
    )
    .parse(args);

  const isCollection: boolean = parsedArgs.collection;
  const files: File[] = [];

  globSync(parsedArgs._[0])
    .filter(filename => !/\.validator\.tsx?$/.test(filename))
    .forEach(fileName => {
      if (isCollection) {
        files.push({fileName});
      } else {
        const typeName = parsedArgs._[1] || basename(fileName, '.ts');
        files.push({fileName, typeName});
      }
    });

  return {
    files,
    options: {
      schema: {
        ref: parsedArgs.refs,
        aliasRef: parsedArgs.aliasRefs,
        topRef: parsedArgs.topRef,
        titles: parsedArgs.titles,
        defaultProps: parsedArgs.defaultProps,
        noExtraProps: parsedArgs.noExtraProps,
        propOrder: parsedArgs.propOrder,
        typeOfKeyword: parsedArgs.useTypeOfKeyword,
        required: parsedArgs.required,
        strictNullChecks: parsedArgs.strictNullChecks,
        ignoreErrors: parsedArgs.ignoreErrors,
        validationKeywords: parsedArgs.validationKeywords,
        include: parsedArgs.include,
        excludePrivate: parsedArgs.excludePrivate,
        uniqueNames: parsedArgs.uniqueNames,
        rejectDateType: parsedArgs.rejectDateType,
        id: parsedArgs.id,
      },
      ajv: {
        coerceTypes: parsedArgs.coerceTypes,
        format: parsedArgs.format,
        nullable: parsedArgs.nullable,
        unicode: parsedArgs.unicode,
        uniqueItems: parsedArgs.uniqueItems,
        useDefaults: parsedArgs.defaultProps,
      },
      useNamedExport: parsedArgs.useNamedExport,
    },
  };
}
