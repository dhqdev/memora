/** @jest-environment node */
import { fallbackTitle } from '@/ai';

describe('fallbackTitle (título quando a IA não responde)', () => {
  it('usa a primeira frase', () => {
    expect(fallbackTitle('Pôr do sol na praia. Fiquei até escurecer.')).toBe('Pôr do sol na praia');
  });
  it('tira o @ das menções', () => {
    expect(fallbackTitle('Café com @Bia')).toBe('Café com Bia');
  });
  it('corta numa palavra inteira, com reticências', () => {
    const t = fallbackTitle('Café da manhã com @Bia e @Theo antes da aula de cálculo, que foi longa');
    expect(t).toBe('Café da manhã com Bia e Theo antes da aula…');
    expect(t.length).toBeLessThanOrEqual(43);
  });
  it('texto vazio vira "Um moment"', () => {
    expect(fallbackTitle('   ')).toBe('Um moment');
  });
});
