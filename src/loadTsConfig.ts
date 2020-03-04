import loadTsconfig from 'tsconfig-loader';

export default function loadTsConfig(cwd: string = process.cwd()) {
  const result = loadTsconfig({cwd});
  const compilerOptions = result?.tsConfig.compilerOptions || {};
  if (
    compilerOptions.experimentalDecorators === false &&
    compilerOptions.emitDecoratorMetadata === undefined
  ) {
    // typescript-json-schema sets emitDecoratorMetadata by default
    // we need to disable it if experimentalDecorators support is off
    compilerOptions.emitDecoratorMetadata = false;
  }
  if (compilerOptions.composite) {
    // the composite setting adds a few constraints that cause us all manner of problems
    compilerOptions.composite = false;
  }
  compilerOptions.incremental = false;

  // since composite and incremental are false, Typescript will not accept tsBuildInfoFile
  // https://github.com/microsoft/TypeScript/blob/dcb763f62435ebb015e7fa405eb067de3254f217/src/compiler/program.ts#L2847
  delete compilerOptions.tsBuildInfoFile;

  return compilerOptions;
}
