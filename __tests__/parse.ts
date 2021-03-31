import * as path from 'path';
import {TsConfigLoaderResult} from 'tsconfig-loader';
import * as TJS from 'typescript-json-schema';

const {resolve} = path;
export default function parse(
  filenames: string[],
  tsConfig: TsConfigLoaderResult,
  settings: TJS.PartialArgs = {},
) {
  filenames = filenames.map((f) => resolve(f));
  const program = TJS.getProgramFromFiles(
    filenames,
    tsConfig.tsConfig.compilerOptions,
  );

  const generator = TJS.buildGenerator(program, {
    rejectDateType: true,
    aliasRef: true,
    required: true,
    topRef: true,
    strictNullChecks: true,
    ...settings,
  });

  if (!generator) {
    throw new Error('Did not expect generator to be null');
  }

  return {
    getAllTypes(includeReffedDefinitions = true, ...fns: string[]) {
      const symbols = generator.getMainFileSymbols(
        program,
        fns.length ? fns : filenames,
      );
      const schema = generator.getSchemaForSymbols(
        symbols,
        includeReffedDefinitions,
      );

      return {symbols, schema};
    },
    getType(name: string) {
      return generator.getSchemaForSymbol(name);
    },
  };
}
