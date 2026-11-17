export const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
];
export const MONTHS_SHORT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
export const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

export const monthLabel = (d: Date) => `${MONTHS[d.getMonth()]} de ${d.getFullYear()}`;
export const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
export const WEEKDAYS_SHORT = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];

/** Comentário que acabou de chegar ganha a animação palavra por palavra. */
export const isFresh = (iso?: string, ms = 10000) => !!iso && Date.now() - +new Date(iso) < ms;
