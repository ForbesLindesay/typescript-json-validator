import {loadSync} from 'tsconfig';

export default function loadTsConfig(cwd: string): any {
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
  return compilerOptions;
}
