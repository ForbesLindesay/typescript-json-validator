import { writeFileSync } from 'fs';
import stringify from 'json-stable-stringify';
import { forEach, isEmpty, has, uniqBy } from 'lodash';
import { posix } from 'path';
import { exit } from 'process';
import { Tsconfig } from 'tsconfig-loader';
import loadTsConfig from './loadTsConfig';
import normalizeSchema from './normalizeSchema';
import parse, { ParsedResults } from './parse';
import { Options, parseArgs } from './parseArgs';
import prettierFile from './prettierFile';
import { printSingleTypeValidator, printTypeCollectionValidator } from './printValidator';

export { parse, parseArgs, printSingleTypeValidator, printTypeCollectionValidator };

function process(
	sourceFile: string,
	parsed: ParsedResults,

	tsConfig: Tsconfig,
	useNamedExport: boolean,
	options: Options,
	typeName: string | undefined,
) {
	if (typeName) {
		const { schema, symbolsByFile } = parsed.getType(typeName);
		const normalSchema = normalizeSchema(schema);
		const validator = printSingleTypeValidator(typeName, useNamedExport, normalSchema, sourceFile, symbolsByFile, tsConfig, options.formatMode, options);
		return { normalSchema, validator };
	} else {
		const { symbols, schema, symbolsByFile } = parsed.getAllTypes();
		const normalSchema = normalizeSchema(schema);
		const validator = printTypeCollectionValidator(symbols, useNamedExport, normalSchema, posix.resolve(sourceFile), symbolsByFile, tsConfig, options.formatMode, options);
		return { normalSchema, validator };
	}
}

type FileNameType = {
	outputFileName: string;
	baseFileName: string;
	outFileNotSpecified: boolean;
	fileName: string;
};
type FileNameTypeWithTypename = {
	outputFileName: string;
	baseFileName: string;
	outFileNotSpecified: boolean;
	fileName: string;
	typeName: string | undefined;
};
function getOutputFilename(filename: string, specifiedOutput: string | undefined): FileNameType {
	const baseFileName = filename.replace(/\.tsx?$/, '');
	const outFileNotSpecified = !specifiedOutput;
	const outputFileName: string = specifiedOutput ? specifiedOutput : `${baseFileName}.validator.ts`;

	return {
		outputFileName,
		baseFileName,
		outFileNotSpecified,
		fileName: filename,
	};
}
export default function run(args?: string[]) {
	const { files, options } = parseArgs(args);
	const tsConfig: Tsconfig = loadTsConfig();
	const parsed = parse(
		files.map((f) => f.fileName),
		tsConfig,
		options.schema,
	);
	if (options.separateSchemaFile && !tsConfig.resolveJsonModule) {
		console.error(`You requested to store schema in json file, but tsconfg does not resovle json modules. `);
		console.error(`Please set resolveJsonModule to true in your tsconfig`);
		exit(1);
	}

	const fileMapedToOut = files.reduce((acc, { fileName, typeName }) => {
		const data: FileNameTypeWithTypename = {
			...getOutputFilename(fileName, options.output),
			typeName,
		};

		if (!has(acc, data.outputFileName)) {
			acc[data.outputFileName] = [];
			acc[data.outputFileName].push(data);
			return acc;
		}

		acc[data.outputFileName] = uniqBy([...acc[data.outputFileName], data], 'typeName');

		return acc;
	}, {} as Record<string, FileNameTypeWithTypename[]>);
	forEach(fileMapedToOut, (data: FileNameTypeWithTypename[]) => {
		forEach(data, ({ fileName, typeName, outputFileName, outFileNotSpecified, baseFileName }) => {
			//const {outputFileName, outFileNotSpecified, baseFileName} = getOutputFilename(fileName, options.output);
			options.output = outputFileName;
			options.filename = isEmpty(options.filename) ? baseFileName : options.filename;
			const { normalSchema, validator } = process(
				fileName,
				parsed,

				tsConfig,

				options.useNamedExport,

				options,
				typeName,
			);

			writeFileSync(outputFileName, validator);
			prettierFile(outputFileName);
			if (options.separateSchemaFile) {
				const fn = `${options.filename}.json`;
				writeFileSync(fn, stringify(normalSchema));
				prettierFile(fn);
			}
			//if output filename is set, executing the loop again will only overwrite the files.
			return !outFileNotSpecified;
		});
	});
}
