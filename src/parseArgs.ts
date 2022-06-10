import {posix as path} from 'path';
import {sync as globSync} from 'glob';
import * as tjs from 'ts-json-schema-generator';
import Ajv from 'ajv';
import yargs from 'yargs';

const {basename} = path;

export interface Options {
  schema: Required<Omit<tjs.Config, 'path' | 'type' | 'tsconfig'>>;
  ajv: Ajv.Options;
}
export interface File {
	fileName: string;
	typeName?: string;
}
export interface ParsedArgs {
  files: File[];
  glob: string;
  output: string | undefined;
  options: Options;
}
export function parseArgs(args?: ReadonlyArray<string>): ParsedArgs {
  var helpText =
    'Usage: typescript-json-schema <path-to-typescript-file> <type>';
  const defaultArgs: Required<
    Omit<tjs.Config, 'path' | 'type' | 'tsconfig'>
  > = {
    topRef: false,
    expose: 'export',
    jsDoc: 'extended',
    sortProps: true,
    strictTuples: false,
    skipTypeCheck: false,
    encodeRefs: true,
    minify: false,
    extraTags: [],
    additionalProperties: false,
    schemaId: '',
  };
  const yargsDefs = yargs
    .usage(helpText)
    .demand(1)

    // 'ts-json-schema-generator'

    .boolean('refs')
    .default('refs', defaultArgs.encodeRefs)
    .describe('refs', 'Create shared ref definitions.')

    .boolean('topRef')
    .default('topRef', defaultArgs.topRef)
    .describe('topRef', 'Create a top-level ref definition.')

    .boolean('noExtraProps')
    .default('noExtraProps', !defaultArgs.additionalProperties)
    .describe(
      'noExtraProps',
      'Disable additional properties in objects by default.',
    )
    .boolean('propOrder')
    .default('propOrder', defaultArgs.sortProps)
    .describe('propOrder', 'Create property order definitions.')

    .boolean('strictNullChecks')
    // default to strict null checks
    .default('strictNullChecks', !defaultArgs.skipTypeCheck)
    .describe('strictNullChecks', 'Make values non-nullable by default.')
    .string('id')
    .default('id', defaultArgs.schemaId)
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
    .string('out')
    .describe('out', 'name of output, optional')
    .alias('out', 'o');

  const parsedArgs = args ? yargsDefs.parseSync(args) : yargsDefs.parseSync();
  const _parsedArgs = parsedArgs._;
  const isCollection: boolean = parsedArgs.collection;
  const files: File[] = [];
  globSync(_parsedArgs[0] as string)
    .filter((filename) => {
      return !/\.validator\.tsx?$/.test(filename);
    })
    .forEach((fileName) => {
      if (isCollection) {
        files.push({fileName});
      } else {
        const typeName =
          (_parsedArgs[1] as string) || basename(fileName, '.ts');
        files.push({fileName, typeName});
      }
    });

  return {
    files,
    output: parsedArgs.out,
    glob: _parsedArgs[0] as string,
    options: {
      schema: {
        ...defaultArgs,
        schemaId: parsedArgs.id,
        encodeRefs: parsedArgs.refs,
        topRef: parsedArgs.topRef,
        additionalProperties: !parsedArgs.noExtraProps,
        sortProps: parsedArgs.propOrder,
        skipTypeCheck: !parsedArgs.strictNullChecks,
      },
      ajv: {
        coerceTypes: parsedArgs.coerceTypes,
        format: parsedArgs.format,
        nullable: parsedArgs.nullable,
        unicode: parsedArgs.unicode,
        uniqueItems: parsedArgs.uniqueItems,
        useDefaults: false,
      },
    },
  };
}
