import {writeFileSync} from 'fs';
import {basename} from 'path';
import {parseArgs} from './parseArgs';
import parse from './parse';
import {
  printSingleTypeValidator,
  printTypeCollectionValidator,
} from './printValidator';
import prettierFile from './prettierFile';

export {
  parse,
  parseArgs,
  printSingleTypeValidator,
  printTypeCollectionValidator,
};

export default function run(args?: string[]) {
  const {files, options} = parseArgs(args);

  const parsed = parse(files.map(f => f.fileName), options.schema);

  files.forEach(({fileName, typeName}) => {
    const outputFileName = fileName.replace(/\.tsx?$/, '.validator.ts');
    let validator: string;
    if (typeName) {
      const schema = parsed.getType(typeName);
      validator = printSingleTypeValidator(
        typeName,
        options.useNamedExport,
        schema,
        `./${basename(fileName, /\.ts$/.test(fileName) ? '.ts' : '.tsx')}`,
        options.ajv,
      );
    } else {
      const {symbols, schema} = parsed.getAllTypes();
      validator = printTypeCollectionValidator(
        symbols,
        schema,
        `./${basename(fileName, /\.ts$/.test(fileName) ? '.ts' : '.tsx')}`,
        options.ajv,
      );
    }
    writeFileSync(outputFileName, validator);
    prettierFile(outputFileName);
  });
}
