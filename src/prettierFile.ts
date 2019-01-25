import {sync as spawnSync} from 'cross-spawn';
let prettierPath: string | undefined = undefined;
try {
  prettierPath = require.resolve('.bin/prettier');
} catch (ex) {}

export default function prettierFile(fileName: string) {
  if (prettierPath) {
    spawnSync(prettierPath, [fileName, '--write']);
  }
}
