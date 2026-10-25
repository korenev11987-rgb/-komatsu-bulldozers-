import type { BulldozerModel, LayoutParams, ModelId, Part } from '../types';
import { buildNodes, type ElectricsParams } from './nodeFactory';

/**
 * Фабрика моделей, добавленных по данным спецификаций (брошюр / spec sheet).
 * Тексты «Обзора» опираются только на факты из спецификации, указанной в файле модели;
 * разделы карточек «Состав / Разборка / Сборка / Ремонт и ТО» для этих моделей — «данные из мануала не найдены».
 */
export interface SpecModelInput {
  id: ModelId;
  series: string;
  fullName: string;
  tagline: string;
  /** Короткая подпись источника, показывается в обзоре узлов */
  source: string;
  engine: { model: string; layout: string; displacement: string; power: string; note?: string; extraParts?: Part[] };
  weight: string;
  layout: LayoutParams;
  shoes: string;
  suspension: string;
  torqueConverter: string;
  gearbox: string;
  finalDrive: string;
  pumps: { description: string; parts: Part[] };
  blade: { description: string; variants: string };
  ripper: { description: string; variants: string };
  electrics: ElectricsParams;
  steeringNote: string;
}

export function specModel(p: SpecModelInput): BulldozerModel {
  const src = ` (по спецификации: ${p.source})`;
  return {
    id: p.id,
    name: p.id,
    series: p.series,
    fullName: p.fullName,
    tagline: p.tagline,
    specs: [
      { label: 'Двигатель', value: `Komatsu ${p.engine.model} (${p.engine.layout.toLowerCase()}, ${p.engine.displacement})` },
      { label: 'Мощность', value: p.engine.power },
      { label: 'Эксплуатационная масса', value: p.weight },
      { label: 'Механизм поворота', value: 'Бортовые фрикционы + тормоза' },
    ],
    layout: p.layout,
    nodes: buildNodes({
      modelName: p.id,
      engine: { ...p.engine, note: (p.engine.note ?? '') + src },
      cooling: { note: `Данные о системе охлаждения взяты только из спецификации${src}.` },
      undercarriage: {
        shoes: p.shoes,
        trackRollers: p.layout.trackRollers,
        carrierRollers: p.layout.carrierRollers,
        suspension: p.suspension,
      },
      torqueConverter: { description: p.torqueConverter },
      gearbox: { description: p.gearbox },
      steering: 'clutch',
      finalDrive: { description: p.finalDrive },
      pumps: p.pumps,
      blade: p.blade,
      ripper: p.ripper,
      electrics: p.electrics,
      overrides: { steering: { modelNote: p.steeringNote + src } },
    }),
  };
}

/** Общие тексты электрики для машин с электронным управлением (по брошюрам: монитор, контроллеры) */
const fact = (what: string, v: string) => (v && v !== '—' ? `По спецификации: ${what} ${v}.` : `Параметры (${what}) в использованной спецификации не найдены.`);

export const modernElectrics = (alt: string, bat: string, starter: string, extra: string): ElectricsParams => ({
  classic: false,
  batteries: fact('АКБ', bat),
  alternator: fact('генератор', alt),
  starter: fact('стартер', starter),
  controllers: {
    title: 'Контроллеры (ЭБУ)',
    description: `Контроллеры двигателя и силовой передачи. ${extra}`,
    parts: [
      { name: 'Контроллер двигателя', note: 'Электронный регулятор / впрыск' },
      { name: 'Контроллер силовой передачи', note: 'ГДТ, КПП, фрикционы и тормоза поворота' },
      { name: 'Датчики', note: 'Обороты, давление, температура' },
    ],
  },
  monitor: {
    title: 'Монитор',
    description: 'Монитор в кабине с указателями, предупреждениями и сервисной информацией (по брошюре).',
    parts: [
      { name: 'Монитор', note: 'Моточасы, обороты, топливо, температура ОЖ' },
      { name: 'Сигнализация неисправностей', note: 'Коды ошибок и предупреждения' },
    ],
  },
  lights: 'Рабочие фары — в зависимости от комплектации.',
});

export const classicElectrics = (alt: string, bat: string, starter: string): ElectricsParams => ({
  classic: true,
  batteries: fact('АКБ', bat),
  alternator: fact('генератор', alt),
  starter: fact('стартер', starter),
  controllers: {
    title: 'Реле, датчики и выключатели',
    description: 'Пуск, зарядка, освещение и датчики приборов. Подробная электросхема в доступных источниках не найдена.',
    parts: [
      { name: 'Выключатель стартера', note: 'Пуск и останов' },
      { name: 'Датчики давления и температуры', note: 'Двигатель, силовая передача' },
    ],
  },
  monitor: {
    title: 'Приборная панель',
    description: 'Приборы и сигнальные лампы в кабине. Подробное описание в доступных источниках не найдено.',
    parts: [
      { name: 'Указатели', note: 'Температура ОЖ, масла силовой передачи, топливо' },
      { name: 'Сигнальные лампы', note: 'Давление масла, заряд' },
    ],
  },
  lights: 'Рабочие фары — в зависимости от комплектации.',
});
