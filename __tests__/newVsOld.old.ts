import {createParser} from '../src/schemaGenerator';
import {diff} from 'jest-diff';
import parse from './parse';
import loadTsConfig from '../src/loadTsConfig';
import path from 'path';
import {isNull} from 'lodash';

if (process.platform !== 'win32') {
  describe('Old parse does not work on windows', () => {
    test('temp', () => {});
  });
} else {
  describe('Compare perivous schema gen to new', () => {
    test.each([
      {file: 'ComplexExample.ts'},
      {file: 'Example.ts'},
      {file: 'DisjointUnionExample.ts'},
      {file: 'OmitExample.ts'},
    ])('$file', (tc) => {
      if (process.platform === 'win32') {
        return;
      }
      const oldSchema = parse(
        [
          path.normalize(
            path.posix.join(
              path.posix.normalize(__dirname),
              `/build-parameters/src/${tc.file}`,
            ),
          ),
        ],
        loadTsConfig(),
      ).getAllTypes();
      const newSchema = createParser(
        path.normalize(
          path.posix.join(
            path.posix.normalize(__dirname),
            `/build-parameters/src/${tc.file}`,
          ),
        ),
        loadTsConfig(),
        {encodeRefs: true},
      ).getAllTypes();
      expect(oldSchema).toMatchSnapshot('oldSchema');
      expect(newSchema).toMatchSnapshot('newSchema');
      const difference = diff(oldSchema, newSchema, {
        aColor: (s: string) => s,
        bColor: (s: string) => s,
        commonColor: (s: string) => s,
        patchColor: (s: string) => s,
        changeColor: (s: string) => s,
        contextLines: 3,
      });
      if (isNull(difference)) {
        fail();
      }
      //Uncomment line to have test fail, to see the differences with color
      //expect(newSchema).toStrictEqual(oldSchema);
      expect(difference.replaceAll('\r', '')).toMatchSnapshot('diff');
    }); //
  });
}
