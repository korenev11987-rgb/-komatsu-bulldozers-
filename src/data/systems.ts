import type { SystemId, SystemInfo } from '../types';

export const SYSTEMS: Record<SystemId, SystemInfo> = {
  engine: {
    id: 'engine',
    name: 'Мотор',
    subtitle: 'двигатель и охлаждение',
    color: '#e03131',
  },
  undercarriage: {
    id: 'undercarriage',
    name: 'Ходовая',
    subtitle: 'гусеницы, катки, звёздочки, натяжное колесо',
    color: '#1c7ed6',
  },
  transmission: {
    id: 'transmission',
    name: 'Трансмиссия',
    subtitle: 'гидротрансформатор, КПП, механизм поворота, бортовые редукторы',
    color: '#7048e8',
  },
  hydraulics: {
    id: 'hydraulics',
    name: 'Гидравлика',
    subtitle: 'отвал, рыхлитель, насосы, цилиндры',
    color: '#2f9e44',
  },
  electrics: {
    id: 'electrics',
    name: 'Электрика',
    subtitle: 'АКБ, генератор, стартер, жгуты, предохранители, ЭБУ, фары, монитор',
    color: '#f59f00',
  },
};

export const SYSTEM_ORDER: SystemId[] = ['engine', 'undercarriage', 'transmission', 'hydraulics', 'electrics'];
