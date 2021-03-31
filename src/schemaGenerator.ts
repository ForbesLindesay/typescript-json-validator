import * as tjs from 'ts-json-schema-generator';
import {TsConfigLoaderResult} from 'tsconfig-loader';
import * as path from 'path';
import {JSONSchema7Definition as Definition} from 'json-schema';
import {SymbolFlags, SyntaxKind} from 'typescript';
export interface IParser {
  /**
   *  returns the schema and symbols for all processed types
   */
  getAllTypes(): {symbols: string[]; schema: Definition};
  /**
   *
   * @param name Name of thr type
   *
   * @returns the JSONSCHEMA7 or boolran for the requested type
   */
  getType(name: string): Definition;
  /**
   *
   * @param name the name of the local scope type
   *
   * @returns the symbol name that the type is exported as
   */
  getTypeExport(name: string): string;
}

function createBaseConfig(
  filename: string,
  tsconfig: TsConfigLoaderResult,
  settings: tjs.Config = {},
): tjs.Config {
  return {
    ...settings,
    path: filename,
    tsconfig: tsconfig.tsConfigPath,
    type: '*', // Or <type-name> if you want to generate schema for that one type only
    additionalProperties: settings.additionalProperties,
    schemaId: settings.schemaId,
  };
}

const syntaxToSymbolKind: Record<number, SymbolFlags> = {
  [SyntaxKind.InterfaceDeclaration]: SymbolFlags.Interface,
  [SyntaxKind.ClassDeclaration]: SymbolFlags.Class,
  [SyntaxKind.TypeAliasDeclaration]: SymbolFlags.TypeAlias,
};

export function createParser(
  filename: string,
  tsconfig: TsConfigLoaderResult,
  settings: tjs.Config = {},
): IParser {
  const config: tjs.Config = createBaseConfig(filename, tsconfig, settings);
  const program = tjs.createProgram(config);
  const parser = tjs.createParser(program, config);
  const formatter = tjs.createFormatter(config);
  const generator = new tjs.SchemaGenerator(program, parser, formatter, config);

  return {
    getTypeExport(name: string): string {
      const fullPath = path.normalize(filename);
      const src = program.getSourceFiles().find((f) => {
        return path.normalize(f.fileName).endsWith(fullPath);
      });
      let exportName: null | string = null;
      src?.forEachChild((c) => {
        if (exportName) return;
        const symbolsForNode = program
          .getTypeChecker()
          .getSymbolsInScope(c, syntaxToSymbolKind[c.kind] ?? 0);
        const symbolType = symbolsForNode.find((s) => {
          return s.getName() === name;
        });
        if (!symbolType) return;

        if (symbolType.getEscapedName().toString() === name) {
          exportName = program
            .getTypeChecker()
            .getExportSymbolOfSymbol(symbolType)
            .getEscapedName()
            .toString();
        }
      });
      if (!exportName) return '';
      return exportName;
    },
    getAllTypes: (_includeReffedDefinitions?: boolean, ..._fns: string[]) => {
      const schema = generator.createSchema('*');
      const symbols = Object.keys(schema?.definitions ?? {});
      return {schema, symbols};
    },
    getType: (name: string) => {
      return generator.createSchema(name);
    },
  };
}
