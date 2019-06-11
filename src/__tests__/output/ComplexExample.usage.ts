import {Context} from 'koa';
import {validateKoaRequest, RequestA} from './ComplexExample.validator';

declare const x: Context;
export const y: RequestA = validateKoaRequest('RequestA')(x);
