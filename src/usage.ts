import {readFileSync, writeFileSync} from 'fs';
import {spawnSync} from 'child_process';

const DELIMITER = '<!-- USAGE -->';
const README = readFileSync('README.md', 'utf8').split(DELIMITER);
const result = spawnSync('node', [__dirname + '/cli', '--help']);
if (result.error) {
  throw result.error;
}
if (result.status !== 0) {
  throw new Error('cli --help exited with non zero code');
}

README[1] = '\n```\n' + result.stdout.toString() + '\n```\n';
writeFileSync('README.md', README.join(DELIMITER));
