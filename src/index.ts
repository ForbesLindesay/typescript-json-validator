import {existsSync, writeFileSync, mkdirSync} from 'fs';
import * as path from 'path';
import {parseArgs} from './parseArgs';
import {
  printSingleTypeValidator,
  printTypeCollectionValidator,
} from './printValidator';
import prettierFile from './prettierFile';
import loadTsConfig from './loadTsConfig';
import normalizeSchema from './normalizeSchema';
import {createParser} from './schemaGenerator';
import {Tsconfig} from 'tsconfig-loader';
import {isBoolean, isEmpty} from 'lodash';

export {parseArgs, printSingleTypeValidator, printTypeCollectionValidator};

const {basename, dirname, resolve, relative, isAbsolute} = path;

/**
 *  Create full path for the outfile, does not write the file. If
 *  the path is not within the same directory as the script was
 *  run from , then it will throw an error.
 *
 * @param outputFilePath File path to write validators to, in os format
 */
function makeOutput(outputFilePath: string) {
  const dir = dirname(outputFilePath);
  if (!existsSync(dir)) {
    const parent = resolve(process.cwd());
    const child = resolve(dir);
    const rel = relative(parent, child);
    const isRelative = rel && !rel.startsWith('..') && !isAbsolute(rel);
    if (!isRelative) {
      throw new Error(
        `Output (${outputFilePath}) directory must be at or below the current directory (${parent})`,
      );
    }
    mkdirSync(rel);
  }
}

function toPosixPath(p: string): string {
  if (p.includes('\\')) {
    return p.replaceAll('\\', '/');
  }
  return p;
}

/**
 *
 *  Generates a relative posix from the Output Validator file to the Input Typescript file.
 * `
 * @param inputPath the path to the typescript file, in os format
 * @param outputFilePath the path to the output validator file, , in os format
 * @returns Returns the relative path from output to input, in posix format
 */
function getRelativePath(inputPath: string, outputFilePath: string): string {
  const outputDir = path.dirname(outputFilePath);
  const inputDir = path.dirname(inputPath);

  const rel = toPosixPath(path.relative(outputDir, inputDir));
  const relFinal = isEmpty(rel) || rel === '.' ? '.' : rel;
  return relFinal;
}

/**
 *
 *  Generateas the schema based on args or process.args. Saves the results to file.
 *
 * @param args Will be used instead of process.args when parsing arguments
 */
export default function run(args?: string[]) {
  const {files, glob, output, options} = parseArgs(args);
  const tsConfigResults = loadTsConfig();
  const tsConfig: Tsconfig = tsConfigResults.tsConfig;

  const newParser = createParser(glob, tsConfigResults, options.schema);

  const parsed = newParser;
  files.forEach(({fileName, typeName}) => {
    const outputFileName =
      output ?? fileName.replace(/\.tsx?$/, '.validator.ts');
    makeOutput(outputFileName);
    let validator: string;
    if (typeName) {
      const schema = parsed.getType(typeName);
      if (isBoolean(schema)) {
        throw new Error(`Schema is boolean, but should be Definition`);
      }
      validator = printSingleTypeValidator(
        parsed,
        typeName,
        normalizeSchema(schema),
        `${getRelativePath(fileName, outputFileName)}/${basename(
          fileName,
          /\.ts$/.test(fileName) ? '.ts' : '.tsx',
        )}`,
        tsConfig,
        options.ajv,
      );
    } else {
      const {symbols, schema} = parsed.getAllTypes();
      if (isBoolean(schema)) {
        throw new Error(`Schema is boolean, but should be Definition`);
      }
      validator = printTypeCollectionValidator(
        parsed,
        symbols,
        normalizeSchema(schema),
        `${getRelativePath(fileName, outputFileName)}/${basename(
          fileName,
          /\.ts$/.test(fileName) ? '.ts' : '.tsx',
        )}`,
        tsConfig,
        options.ajv,
      );
    }
    writeFileSync(outputFileName, validator);
    prettierFile(outputFileName);
  });
}
