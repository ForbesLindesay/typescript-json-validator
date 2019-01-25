import {loadSync} from 'tsconfig';

export default function loadTsConfig(cwd: string): any {
  const result = loadSync(cwd);
  return result.config;
}
