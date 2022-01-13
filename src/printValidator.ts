import * as Ajv from 'ajv';
import * as TJS from 'typescript-json-schema';
import * as t from './template';
import { Tsconfig } from 'tsconfig-loader';

type printOptions = {
	ajv: Ajv.Options;
	separateSchemaFile: boolean;
	filename: string;
	output: string;
};
export function printTypeCollectionValidator(
	symbols: string[],
	isNamedExport: boolean,
	schema: TJS.Definition,
	source: string,
	symbolsByFile: Record<string, string[]>,
	tsConfig: Readonly<Tsconfig>,
	formatMode: 'fast' | 'full',
	{ ajv: options, separateSchemaFile, filename, output }: printOptions = {
		ajv: {},
		separateSchemaFile: false,
		filename: '',
		output: '',
	},
	typeName?: string,
) {
	return [
		t.TSLINT_DISABLE,
		t.GENERATED_COMMENT,
		t.IMPORT_AJV(tsConfig),
		t.importNamedTypes(
			symbols,
			output,
			source,
			symbolsByFile,
			{
				isNamedExport,
			},
			typeName,
		),
		t.declareAJV(options, formatMode),
		t.exportNamed(symbols),
		t.declareSchema('Schema', schema, separateSchemaFile, `${filename}.json`),
		t.addSchema('Schema', options),
		t.DECLARE_VALIDATE_TYPE,
		`export type AllowedTypeNames = ${symbols.map((s) => `'${s}'`).join(' | ')};`,
		`export type AllowedTypes = ${symbols.map((s) => `${s}`).join(' | ')};`,
		...symbols.map((s) => t.validateOverload(s)),
		t.validateOverload('AllowedTypeNames', 'any', false),
		t.VALIDATE_IMPLEMENTATION,
		...(options.removeAdditional ? symbols.map((s) => t.cleanAndValidateOverload(s)) : []),
		options.removeAdditional ? t.cleanAndValidateOverload('AllowedTypeNames', 'any', false) : '',
		options.removeAdditional ? t.VALIDATE_IMPLEMENTATION_CLEANER : '',
	].join('\n');
}

export function printSingleTypeValidator(
	typeName: string,
	isNamedExport: boolean,
	schema: TJS.Definition,
	source: string,
	symbolsByFile: Record<string, string[]>,
	tsConfig: any,
	formatMode: 'fast' | 'full',
	{ ajv: options, separateSchemaFile, filename, output }: printOptions = {
		ajv: {},
		separateSchemaFile: false,
		filename: '',
		output: '',
	},
) {
	return [
		t.TSLINT_DISABLE,
		t.GENERATED_COMMENT,
		t.IMPORT_INSPECT,
		t.IMPORT_AJV(tsConfig),
		t.importType(typeName, output, source, symbolsByFile, { isNamedExport }),
		t.declareAJV(options, formatMode),
		t.exportNamed([typeName]),
		t.declareSchema(typeName + 'Schema', schema, separateSchemaFile, `${filename}.json`),
		t.DECLARE_VALIDATE_TYPE,
		t.validateFn(typeName, typeName + 'Schema', options),
	].join('\n');
}
