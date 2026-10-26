/* Разбор «люди · время · инструмент» для D475A-5 по SEBM033708 (ознакомительный фрагмент Shop Manual, 33 стр.).
 * В фрагменте нет разделов разборки/сборки, таблиц специального инструмента и масс деталей; исполнители и время не указаны.
 * Единственное, что есть, — общее указание раздела 00 «HOISTING INSTRUCTIONS» (не по конкретному узлу). */
import type { BreakdownBook, BreakdownEquipment, PartBreakdownData } from '../types';

export const D475_SCOPE = 'D475A-5, SEBM033708 (ознакомительный фрагмент, 33 стр.)';

const HOISTING: BreakdownEquipment = {
  name: 'Таль и т. п. подъёмное устройство — для деталей массой 25 кг и более',
  quote:
    '«Heavy parts (25 kg or more) must be lifted with a hoist, etc. In the DISASSEMBLY AND ASSEMBLY section, every part weighing 25 kg or more is indicated clearly with the symbol» — «Тяжёлые детали (25 кг и более) следует поднимать талью и т. п. В разделе DISASSEMBLY AND ASSEMBLY каждая деталь массой 25 кг и более отмечена знаком груза». Раздела DISASSEMBLY AND ASSEMBLY в доступном фрагменте нет.',
  general: true,
  translated: true,
  ref: { doc: 'D475-SM-SAMPLE', label: '00-7', pdfPage: 7 },
};

const general = (): PartBreakdownData => ({ tools: [], equipment: [HOISTING], weights: [], crew: [], time: [], scope: D475_SCOPE });

const NODES = [
  'engine', 'cooling', 'torqueConverter', 'gearbox', 'steering', 'finalDrive', 'sprocket', 'trackFrame', 'idler',
  'trackRollers', 'carrierRollers', 'trackChain', 'pumps', 'blade', 'bladeCylinders', 'ripper', 'ripperCylinders',
  'alternator', 'starter', 'batteries', 'monitor', 'controllers', 'wiring', 'lights', 'fuseBox',
] as const;

export const D475_BREAKDOWN: BreakdownBook = Object.fromEntries(NODES.map((n) => [n, general()]));
