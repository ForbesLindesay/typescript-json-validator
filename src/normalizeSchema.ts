import * as TJS from 'typescript-json-schema';
import { isDefinition } from './utils';
import { isNumber, isString } from 'lodash';

export default function normalizeSchema(schema: TJS.Definition): TJS.Definition {
	let result = schema;
	if (schema.anyOf && schema.definitions) {
		let { anyOf, ...extra } = schema;
		result = { ...processAnyOf(anyOf, schema.definitions), ...extra };
	}
	let outputDefinitions: {
		[key: string]: TJS.DefinitionOrBoolean;
	} = {};
	if (schema.definitions) {
		const defs: {
			[key: string]: TJS.DefinitionOrBoolean;
		} = schema.definitions;
		Object.keys(defs).forEach((definition) => {
			const def = defs[definition];
			if (isDefinition(def) && def.anyOf && Object.keys(def).length === 1) {
				outputDefinitions[definition] = processAnyOf(def.anyOf, defs);
			} else {
				outputDefinitions[definition] = defs[definition];
			}
		});
	}
	return {
		...result,
		definitions: schema.definitions ? outputDefinitions : schema.definitions,
	};
}

function processAnyOf(
	types: TJS.DefinitionOrBoolean[],
	definitions: {
		[key: string]: TJS.DefinitionOrBoolean;
	},
): TJS.Definition {
	const resolve = (ref: TJS.Definition | TJS.DefinitionOrBoolean | undefined): TJS.Definition | undefined => {
		let match;
		if (isDefinition(ref)) {
			if (ref.$ref && (match = /\#\/definitions\/([a-zA-Z0-9_]+)/.exec(ref.$ref)) && definitions[match[1]]) {
				const def = definitions[match[1]];
				if (isDefinition(def)) def;
			} else {
				return ref as TJS.Definition;
			}
		}
	};
	const reduce = (acc: TJS.Definition[], ref: TJS.Definition | TJS.DefinitionOrBoolean | undefined): TJS.Definition[] => {
		const result = resolve(ref);
		if (result) {
			acc.push(result);
		}
		return acc;
	};

	const resolved = types.reduce(reduce, []);

	const typeKeys = intersect(resolved.map(getCandidates)).filter((candidate) => {
		const seen = new Set<number | string>();
		const firstType = getType(resolved[0], candidate);
		return resolved.every((type) => {
			const v = getValue(type, candidate);
			if (!v) {
				return false;
			}
			if (seen.has(v) || getType(type, candidate) !== firstType) {
				return false;
			} else {
				seen.add(v);
				return true;
			}
		});
	});
	if (typeKeys.length !== 1) {
		return { anyOf: types };
	}
	const key = typeKeys[0];
	const type = getType(resolved[0], key);

	function recurse(remainingTypes: TJS.DefinitionOrBoolean[]): TJS.Definition {
		if (remainingTypes.length === 0) {
			return {
				properties: {
					[key]: {
						type,
						enum: resolved.map((type) => getValue(type, key)).filter<string | number>((k): k is string | number => !!k),
					},
				},
				required: [key],
			};
		} else {
			return {
				if: {
					properties: {
						[key]: {
							type,
							enum: [getValue(resolve(remainingTypes[0]), key)],
						},
					},
					required: [key],
				},
				then: remainingTypes[0],
				else: recurse(remainingTypes.slice(1)),
			} as any;
		}
	}
	return recurse(types);
}

function getCandidates(type: TJS.Definition) {
	const required = type.required || [];
	return required.filter((key) => {
		const prop = type?.properties?.[key];
		return isDefinition(prop) && (prop.type === 'string' || prop.type === 'number') && prop.enum && prop.enum.length === 1;
	});
}
function getType(type: TJS.Definition | TJS.DefinitionOrBoolean, key: string) {
	if (isDefinition(type)) {
		const prop = type.properties?.[key];
		if (isDefinition(prop)) {
			return prop.type;
		}
	}
}
function getValue(type: TJS.Definition | TJS.DefinitionOrBoolean | undefined, key: string): string | number | undefined {
	if (isDefinition(type)) {
		const prop = type.properties?.[key];
		if (isDefinition(prop)) {
			const enumValue = prop.enum?.[0];
			if (isString(enumValue) || isNumber(enumValue)) {
				return enumValue;
			}
			throw new Error(`Enums must be defined with strings or numbers`);
		}
	}
	return undefined;
	// throw new Error(
	//     `getValue of a DefinitionOrBoolean failed because it was not a Definition ${JSON.stringify(type, null, 2)}`,
	// );
}
function intersect(values: string[][]): string[] {
	return values[0].filter((v) => values.every((vs) => vs.includes(v)));
}
