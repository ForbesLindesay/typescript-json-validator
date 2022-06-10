import * as TJS from 'typescript-json-schema';
import {
  JSONSchema7Definition as Definition,
  JSONSchema7,
  JSONSchema7TypeName,
} from 'json-schema';
import {isBoolean, isNil} from 'lodash';
import {JSONSchema7Type} from 'json-schema';

type DefinitionMap = {
  [key: string]: Definition;
};
export default function normalizeSchema(schema: JSONSchema7): JSONSchema7 {
  let result = schema;
  const definitions: DefinitionMap | undefined = schema.definitions;
  if (schema.anyOf && definitions) {
    let {anyOf, ...extra} = schema;
    result = {
      ...processAnyOf(anyOf, definitions),
      ...extra,
    };
  }
  let outputDefinitions: DefinitionMap = {};
  if (schema.definitions) {
    const defs: DefinitionMap = schema.definitions;
    Object.keys(defs).forEach((definition: keyof typeof defs) => {
      const def = defs[definition];
      if (!isDefinition(def)) return;
      if (def.anyOf && Object.keys(def).length === 1) {
        outputDefinitions[definition] = processAnyOf(def.anyOf, defs);
      } else {
        outputDefinitions[definition] = defs[definition];
      }
    });
  }
  return {
    ...result,
    definitions: schema.definitions ?? outputDefinitions,
  };
  return schema;
}

function processAnyOf(
  types: Definition[],
  definitions: DefinitionMap,
): JSONSchema7 {
  function resolve(ref: undefined | Definition): Definition | undefined {
    let match;
    if (!isDefinition(ref)) return;
    if (
      ref.$ref &&
      (match = /\#\/definitions\/([a-zA-Z0-9_]+)/.exec(ref.$ref)) &&
      definitions[match[1]]
    ) {
      return definitions[match[1]];
    } else {
      return ref;
    }
  }
  const resolved = types.map(resolve);
  const typeKeys = intersect(resolved.map(getCandidates)).filter(
    (candidate) => {
      const seen = new Set<JSONSchema7Type>();
      const firstType = getType(resolved[0], candidate);
      return resolved.every((type) => {
        const v = getValue(type, candidate);
        if (seen.has(v) || getType(type, candidate) !== firstType) {
          return false;
        } else {
          seen.add(v);
          return true;
        }
      });
    },
  );
  if (typeKeys.length !== 1) {
    return {anyOf: types};
  }
  const key = typeKeys[0];
  const type = getType(resolved[0], key);

  function recurse(remainingTypes: Definition[]): Definition {
    if (remainingTypes.length === 0) {
      return {
        properties: {
          [key]: {
            type: type,
            enum: resolved.map((type) => getValue(type, key)),
          },
        },
        required: [key],
      };
    } else {
      return {
        if: {
          properties: {
            [key]: {type, enum: [getValue(resolve(remainingTypes[0]), key)]},
          },
          required: [key],
        },
        then: remainingTypes[0],
        else: recurse(remainingTypes.slice(1)),
      } as any;
    }
  }
  const out = recurse(types);
  if (isBoolean(out)) {
    return {};
  }
  return out;
}

export function isDefinition(
  value: TJS.DefinitionOrBoolean | undefined | null,
): value is JSONSchema7 {
  if (isNil(value)) return false;
  if (typeof value === 'boolean') return false;

  return true;
}

function getCandidates(type: TJS.DefinitionOrBoolean | undefined) {
  if (!isDefinition(type)) return [];
  const required = type.required ?? [];
  return required.filter((key) => {
    if (isNil(type.properties)) return false;
    const property = type.properties[key];
    if (!isDefinition(property)) return false;

    return (
      (property.type === 'string' || property.type === 'number') &&
      property.enum &&
      property.enum.length === 1
    );
  });
}
function getType(
  type: Definition | undefined,
  key: string,
): JSONSchema7TypeName | JSONSchema7TypeName[] | undefined {
  if (!isDefinition(type)) {
    throw new Error(`getType type was a boolean, should be a Definition`);
  }
  const property = type.properties?.[key];
  if (property && isDefinition(property)) {
    return property?.type;
  }
  throw new Error(`getType type was a boolean, should be a Definition`);
}
function getValue(
  type: TJS.DefinitionOrBoolean | undefined,
  key: string,
): JSONSchema7Type {
  if (!type) return '';
  if (!isDefinition(type)) return '';
  const property: TJS.Definition = (type.properties![
    key
  ] as unknown) as TJS.Definition;
  const e: JSONSchema7Type[] = (property.enum as unknown) as JSONSchema7Type[];
  return e[0];
}
function intersect(values: string[][]): string[] {
  return values[0].filter((v) => values.every((vs) => vs.includes(v)));
}
