import {loadSync} from 'tsconfig';

export default function loadTsConfig(cwd: string = process.cwd()): any {
  const result = loadSync(cwd);
  const compilerOptions =
    (result.config && result.config.compilerOptions) || {};
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
  return compilerOptions;
}
