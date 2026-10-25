import type { ModelId, NodeId } from '../../types';
import { MANUALS } from './manuals';
import { REPAIR } from './library';
import { NOT_FOUND, type RepairCard } from './types';

export { MANUALS };

/** Карточка узла: отсутствующие разделы явно помечаются как «данные из мануала не найдены» */
export function getRepairCard(model: ModelId, node: NodeId): RepairCard {
  const c = REPAIR[model]?.[node] ?? {};
  return {
    components: c.components ?? NOT_FOUND,
    disassembly: c.disassembly ?? NOT_FOUND,
    assembly: c.assembly ?? NOT_FOUND,
    repair: c.repair ?? NOT_FOUND,
  };
}
