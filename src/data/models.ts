import type { BulldozerModel, ModelId } from '../types';
import { D155 } from './d155';
import { D275A2, D275A5 } from './d275';
import { D355 } from './d355';
import { D375A3, D375A5, D375A6, D375A8 } from './d375';
import { D475 } from './d475';
import { CAT_D10T, CAT_D6R, CAT_D9R } from './cat/models';

export const MODELS: Record<ModelId, BulldozerModel> = {
  D155,
  'D275A-2': D275A2,
  'D275A-5': D275A5,
  D355,
  'D375A-3': D375A3,
  'D375A-5': D375A5,
  'D375A-6': D375A6,
  'D375A-8': D375A8,
  D475,
  'CAT-D6R': CAT_D6R,
  'CAT-D9R': CAT_D9R,
  'CAT-D10T': CAT_D10T,
};
export const MODEL_ORDER: ModelId[] = ['D155', 'D275A-2', 'D275A-5', 'D355', 'D375A-3', 'D375A-5', 'D375A-6', 'D375A-8', 'D475', 'CAT-D6R', 'CAT-D9R', 'CAT-D10T'];
export const seriesOf = (m: BulldozerModel): string => m.series ?? m.id.replace(/A-\d+$/, '');
