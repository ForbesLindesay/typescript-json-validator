// generated by typescript-json-validator

import Ajv = require('ajv');
import ExampleType from './Example';
import {inspect} from 'util';

const ajv = new Ajv({coerceTypes: false, allErrors: true, useDefaults: true});

export {ExampleType};
export const ExampleTypeSchema = {
  $schema: 'http://json-schema.org/draft-07/schema#',
  defaultProperties: [],
  properties: {
    answer: {
      default: 42,
      type: 'number',
    },
    email: {
      format: 'email',
      type: 'string',
    },
    value: {
      type: 'string',
    },
  },
  required: ['answer', 'value'],
  type: 'object',
};

ajv.addMetaSchema(require('ajv/lib/refs/json-schema-draft-06.json'));

type ValidateFunction = ((data: any) => data is ExampleType) &
  Pick<Ajv.ValidateFunction, 'errors'>;
const validateSchema = ajv.compile(ExampleTypeSchema) as ValidateFunction;

export default function validate(value: unknown): ExampleType {
  if (validateSchema(value)) {
    return value;
  } else {
    throw new Error(
      (validateSchema.errors
        ? validateSchema.errors
            .map(error => `ExampleType${error.dataPath} ${error.message}`)
            .join('\n') + '\nExampleType value:\n\n'
        : null || 'Error validating ExampleType:\n\n') + inspect(value),
    );
  }
}
