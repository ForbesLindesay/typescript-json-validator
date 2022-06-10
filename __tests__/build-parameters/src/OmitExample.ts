import type {JSONSchema7} from 'json-schema';

export type IUiSchemaNoReact = {
  'ui:field'?: string;
  'ui:widget'?: string;
  'ui:options'?: {
    [key: string]:
      | boolean
      | number
      | string
      | Record<string, unknown>
      | unknown[]
      | null;
  };
  'ui:order'?: string[];
  [name: string]: unknown;
};

interface Schemas {
  schema: any;
  uischema?: any;
  id: string;
}

export interface ISchema extends Omit<Schemas, 'schema' | 'uischema'> {
  schema: JSONSchema7;
  uischema?: IUiSchemaNoReact;
}
