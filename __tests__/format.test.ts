/** @jest-environment node */
import { isFresh, monthLabel, sameDay } from '@/format';

describe('format', () => {
  it('monthLabel em português', () => {
    expect(monthLabel(new Date(2026, 2, 5))).toBe('Março de 2026');
  });
  it('sameDay compara só o dia', () => {
    expect(sameDay(new Date(2026, 0, 1, 0, 1), new Date(2026, 0, 1, 23, 59))).toBe(true);
    expect(sameDay(new Date(2026, 0, 1), new Date(2026, 0, 2))).toBe(false);
  });
  it('isFresh só para o que acabou de chegar', () => {
    expect(isFresh(new Date().toISOString())).toBe(true);
    expect(isFresh(new Date(Date.now() - 60_000).toISOString())).toBe(false);
    expect(isFresh(undefined)).toBe(false);
  });
});
