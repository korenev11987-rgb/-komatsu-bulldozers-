import type { BulldozerModel, ModelId } from '../types';
import { D155 } from './d155';
import { D355 } from './d355';
import { D475 } from './d475';

export const MODELS: Record<ModelId, BulldozerModel> = { D155, D355, D475 };
export const MODEL_ORDER: ModelId[] = ['D155', 'D355', 'D475'];
