import * as TJS from 'typescript-json-schema';

export default function normalizeSchema(
  schema: TJS.Definition,
): TJS.Definition {
  let result = schema;
  if (schema.anyOf && schema.definitions) {
    let {anyOf, ...extra} = schema;
    result = {...processAnyOf(anyOf, schema.definitions), ...extra};
  }
  let outputDefinitions: {
    [key: string]: TJS.Definition;
  } = {};
  if (schema.definitions) {
    const defs: {
      [key: string]: TJS.Definition;
    } = schema.definitions;
    Object.keys(defs).forEach(definition => {
      if (
        defs[definition].anyOf &&
        Object.keys(defs[definition]).length === 1
      ) {
        outputDefinitions[definition] = processAnyOf(
          defs[definition].anyOf!,
          defs,
        );
      } else {
        outputDefinitions[definition] = defs[definition];
      }
    });
  }
  return {
    ...result,
    definitions: schema.definitions ? outputDefinitions : schema.definitions,
  };
  return schema;
}

function processAnyOf(
  types: TJS.Definition[],
  definitions: {
    [key: string]: TJS.Definition;
  },
): TJS.Definition {
  function resolve(ref: TJS.Definition) {
    let match;
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
  const typeKeys = intersect(resolved.map(getCandidates)).filter(candidate => {
    const seen = new Set<number | string>();
    const firstType = getType(resolved[0], candidate);
    return resolved.every(type => {
      const v = getValue(type, candidate);
      if (seen.has(v) || getType(type, candidate) !== firstType) {
        return false;
      } else {
        seen.add(v);
        return true;
      }
    });
  });
  if (typeKeys.length !== 1) {
    return {anyOf: types};
  }
  const key = typeKeys[0];
  const type = getType(resolved[0], key);

  function recurse(remainingTypes: TJS.Definition[]): TJS.Definition {
    if (remainingTypes.length === 0) {
      return {
        properties: {
          [key]: {
            type,
            enum: resolved.map(type => getValue(type, key)),
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
  return recurse(types);
}

function getCandidates(type: TJS.Definition) {
  const required = type.required || [];
  return required.filter(
    key =>
      type.properties &&
      type.properties[key] &&
      (type.properties[key].type === 'string' ||
        type.properties[key].type === 'number') &&
      type.properties[key].enum &&
      type.properties[key].enum.length === 1,
  );
}
function getType(type: TJS.Definition, key: string): string {
  return type.properties![key].type;
}
function getValue(type: TJS.Definition, key: string): string | number {
  return type.properties![key].enum[0];
}
function intersect(values: string[][]): string[] {
  return values[0].filter(v => values.every(vs => vs.includes(v)));
}
