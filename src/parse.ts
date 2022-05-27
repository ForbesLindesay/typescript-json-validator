import { posix } from 'path';
import * as TJS from 'typescript-json-schema';
import { isEmpty, has } from 'lodash';
import { Tsconfig } from 'tsconfig-loader';

export interface ParsedResults {
	getAllTypes(
		includeReffedDefinitions?: boolean,
		...fns: string[]
	): {
		symbols: string[];
		schema: TJS.Definition;
		symbolsByFile: Record<string, string[]>;
	};
	getType(name: string): {
		schema: TJS.Definition;
		symbolsByFile: Record<string, string[]>;
	};
}
const fqnRx = /"(.*)"\..*/;
function generateFileToSymbolMap(symbols: string[], generator: TJS.JsonSchemaGenerator) {
	return symbols.reduce((acc, s) => {
		const ref = generator.getSymbols(s);
		if (isEmpty(ref)) return acc;
		const fqn = ref[0].fullyQualifiedName;
		const matches = fqn.match(fqnRx);
		if (isEmpty(matches) || !matches) {
			return acc;
		}
		const file = matches[1];
		const name = ref[0].symbol.name;

		if (!has(acc, file)) {
			acc[file] = [];
		}

		acc[file].push(name);

		return acc;
	}, {} as Record<string, string[]>);
}

export default function parse(filenames: string[], tsConfig: Readonly<Tsconfig>, settings: TJS.PartialArgs = {}): ParsedResults {
	filenames = filenames.map((f) => posix.resolve(f).replace(/\\/g, '/'));
	const program = TJS.getProgramFromFiles(filenames, tsConfig);

	const generator = TJS.buildGenerator(program, {
		rejectDateType: true,
		aliasRef: true,
		required: true,
		topRef: true,
		strictNullChecks: true,
		...settings,
	});

	if (!generator) {
		throw new Error('Did not expect generator to be null');
	}

	return {
		getAllTypes(includeReffedDefinitions = true, ...fns: string[]) {
			const symbols = generator.getMainFileSymbols(program, fns.length ? fns : filenames);
			const schema = generator.getSchemaForSymbols(symbols, includeReffedDefinitions);
			const symbolsByFile = generateFileToSymbolMap(symbols, generator);

			return { symbols, schema, symbolsByFile };
		},
		getType(name: string) {
			const schema = generator.getSchemaForSymbol(name);
			const symbolsByFile = generateFileToSymbolMap([name], generator);

			return { schema, symbolsByFile };
		},
	};
}
