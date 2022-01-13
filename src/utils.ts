import * as TJS from 'typescript-json-schema';
import { isBoolean, isNil } from 'lodash';

export function isDefinition(value: TJS.DefinitionOrBoolean | undefined): value is TJS.Definition {
	return !isBoolean(value) && !isNil(value);
}
