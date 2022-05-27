import { posix } from 'path';
import { sync as globSync } from 'glob';
import { getDefaultArgs, Args as TypeScriptJsonSchemaArgs } from 'typescript-json-schema';
import * as Ajv from 'ajv';

export interface Options {
	schema: Pick<TypeScriptJsonSchemaArgs, Exclude<keyof TypeScriptJsonSchemaArgs, 'out'>>;
	ajv: Ajv.Options;
	useNamedExport: boolean;
	separateSchemaFile: boolean;
	filename: string;
	output: string;
	isCollection: boolean;
	formatMode: 'fast' | 'full';
}
export interface File {
	fileName: string;
	typeName?: string;
}
export interface ParsedArgs {
	files: File[];
	options: Options;
}
export function parseArgs(args?: string[]): ParsedArgs {
	var helpText = 'Usage: typescript-json-schema <path-to-typescript-file> <type>';
	const defaultArgs = getDefaultArgs();
	const parsedArgs = require('yargs')
		.usage(helpText)
		.demand(1)

		// typescript-json-schema options

		.boolean('refs')
		.default('refs', defaultArgs.ref)
		.describe('refs', 'Create shared ref definitions.')
		.boolean('aliasRefs')
		.default('aliasRefs', defaultArgs.aliasRef)
		.describe('aliasRefs', 'Create shared ref definitions for the type aliases.')
		.boolean('topRef')
		.default('topRef', defaultArgs.topRef)
		.describe('topRef', 'Create a top-level ref definition.')
		.boolean('titles')
		.default('titles', defaultArgs.titles)
		.describe('titles', 'Creates titles in the output schema.')
		.boolean('defaultProps')
		.default('defaultProps', true)
		.describe('defaultProps', 'Create default properties definitions.')
		.boolean('noExtraProps')
		.default('noExtraProps', defaultArgs.noExtraProps)
		.describe('noExtraProps', 'Disable additional properties in objects by default.')
		.boolean('propOrder')
		.default('propOrder', defaultArgs.propOrder)
		.describe('propOrder', 'Create property order definitions.')
		.boolean('typeOfKeyword')
		.default('typeOfKeyword', defaultArgs.typeOfKeyword)
		.describe('typeOfKeyword', 'Use typeOf keyword (https://goo.gl/DC6sni) for functions.')
		.boolean('required')
		.default('required', true)
		.describe('required', 'Create required array for non-optional properties.')
		.boolean('strictNullChecks')
		.default('strictNullChecks', true)
		.describe('strictNullChecks', 'Make values non-nullable by default.')
		.boolean('ignoreErrors')
		.default('ignoreErrors', defaultArgs.ignoreErrors)
		.describe('ignoreErrors', 'Generate even if the program has errors.')
		.array('validationKeywords')
		.default('validationKeywords', defaultArgs.validationKeywords)
		.describe('validationKeywords', 'Provide additional validation keywords to include.')
		.boolean('excludePrivate')
		.default('excludePrivate', defaultArgs.excludePrivate)
		.describe('excludePrivate', 'Exclude private members from the schema.')
		.boolean('uniqueNames')
		.default('uniqueNames', defaultArgs.uniqueNames)
		.describe('uniqueNames', 'Use unique names for type symbols.')
		.array('include')
		.default('*', defaultArgs.include)
		.describe('include', 'Further limit tsconfig to include only matching files.')
		.boolean('rejectDateType')
		.default('rejectDateType', defaultArgs.rejectDateType)
		.describe('rejectDateType', 'Rejects Date fields in type definitions.')
		.string('id')
		.default('id', defaultArgs.id)
		.describe('id', 'ID of schema.')

		// ajv options

		.choices('format', ['fast', 'full'])
		.default('format', 'fast')
		.describe(
			'format',
			"formats validation mode ('fast' by default). Pass 'full' for more correct and slow validation or false not to validate formats at all. E.g., 25:00:00 and 2015/14/33 will be invalid time and date in 'full' mode but it will be valid in 'fast' mode.",
		)
		.boolean('coerceTypes')
		.default('coerceTypes', false)
		.describe('coerceTypes', 'Change data type of data to match type keyword. e.g. parse numbers in strings')

		.choices('strictAll', ['log', true, false])
		.default('strictAll', false)
		.describe('strictAll', 'Value for all ajv strict options, unless overriden by other options (https://bit.ly/3flXX6z)')

		.choices('strict', ['log', true, false])
		.describe('strict', 'Value for all ajv strict options, unless overriden by other options (https://bit.ly/3flXX6z)')

		.choices('strictSchema', ['log', true, false])
		.describe('strictSchema', 'Prevent unknown keywords,  (https://bit.ly/3flXX6z)')

		.choices('strictNumbers', ['log', true, false])
		.describe('strictNumbers', 'Whether to accept NaN and Infinity as number types during validation,  (https://bit.ly/3flXX6z)')

		.choices('strictTypes', ['log', true, false])
		.describe('strictTypes', 'Imposes additional restrictions on how type keyword is used,  (https://bit.ly/3rfsetf)')

		.choices('strictTuples', ['log', true, false])
		.describe('strictTuples', 'https://bit.ly/3FruEKe')

		.choices('strictRequired', ['log', true, false])
		.describe(
			'strictRequired',
			'Logs warning or throws exception if the property used in "required" keyword is not defined in "properties" keyword in the same or some parent schema relating to the same object ( (https://bit.ly/3rd5Bpf)',
		)

		// specific to typescript-json-validator

		.boolean('collection')
		.default('collection', false)
		.describe('collection', 'Process the file as a collection of types, instead of one single type.')
		.boolean('useNamedExport')
		.default('useNamedExport', false)
		.describe('useNamedExport', 'Type name is a named export, rather than the default export of the file')
		.string('output')
		.describe('output', 'overrides filename')
		.boolean('separateSchemaFile')
		.default('separateSchemaFile', false)
		.describe('separateSchemaFile', 'save json schema to a separate .json file')
		.string('output')
		.describe('output', 'overrides filename')
		.parse(args);

	const isCollection: boolean = parsedArgs.collection;
	const files: File[] = [];

	globSync(parsedArgs._[0])
		.filter((filename) => !/\.validator\.tsx?$/.test(filename))
		.forEach((fileName) => {
			if (isCollection) {
				files.push({ fileName });
			} else {
				const typeName = parsedArgs._[1] || posix.basename(fileName, '.ts');
				files.push({ fileName, typeName });
			}
		});

	const [strict, strictTypes, strictSchema, strictRequired, strictTuples, strictNumbers] = [
		parsedArgs.strict ?? parsedArgs.strictAll,
		parsedArgs.strictTypes ?? parsedArgs.strictAll,
		parsedArgs.strictSchema ?? parsedArgs.strictAll,
		parsedArgs.strictRequired ?? parsedArgs.strictAll,
		parsedArgs.strictTuples ?? parsedArgs.strictAll,
		parsedArgs.strictNumbers ?? parsedArgs.strictAll,
	];

	return {
		files,
		options: {
			schema: {
				ref: parsedArgs.refs,
				aliasRef: parsedArgs.aliasRefs,
				topRef: parsedArgs.topRef,
				titles: parsedArgs.titles,
				defaultProps: parsedArgs.defaultProps,
				noExtraProps: parsedArgs.noExtraProps,
				propOrder: parsedArgs.propOrder,
				typeOfKeyword: parsedArgs.useTypeOfKeyword,
				required: parsedArgs.required,
				strictNullChecks: parsedArgs.strictNullChecks,
				ignoreErrors: parsedArgs.ignoreErrors,
				validationKeywords: parsedArgs.validationKeywords,
				include: parsedArgs.include,
				excludePrivate: parsedArgs.excludePrivate,
				uniqueNames: parsedArgs.uniqueNames,
				rejectDateType: parsedArgs.rejectDateType,
				id: parsedArgs.id,
				esModuleInterop: true,
				defaultNumberType: 'number',
				tsNodeRegister: true,
			},
			ajv: {
				coerceTypes: parsedArgs.coerceTypes,
				useDefaults: parsedArgs.defaultProps,
				removeAdditional: parsedArgs.noExtraProps && parsedArgs.generatePermissive,
				strict,
				strictTypes,
				strictSchema,
				strictRequired,
				strictTuples,
				strictNumbers,
			},
			useNamedExport: parsedArgs.useNamedExport,
			formatMode: parsedArgs.format,
			separateSchemaFile: parsedArgs.separateSchemaFile,
			isCollection,
			output: parsedArgs.output,
			filename: parsedArgs.output ? parsedArgs.output.replace(/\.tsx?$/, '') : '',
		},
	};
}
