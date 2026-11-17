/** @jest-environment node */
import { canComment, extractMentions, reminderDates, storiesLeft, toHandle } from '@/rules';
import { FREE_COMMENTS, FREE_STORIES, Story } from '@/types';

const story = (id: string): Story => ({ id, title: id, category: 'Amigos', year: 2026, updatedAt: '2026-01-01T00:00:00.000Z' });

describe('canComment (limite de comentários da Lumi)', () => {
  it('libera até o limite do plano grátis', () => {
    expect(canComment({ plus: false, commentsUsed: 0 })).toBe(true);
    expect(canComment({ plus: false, commentsUsed: FREE_COMMENTS - 1 })).toBe(true);
  });
  it('bloqueia ao chegar no limite', () => {
    expect(canComment({ plus: false, commentsUsed: FREE_COMMENTS })).toBe(false);
    expect(canComment({ plus: false, commentsUsed: FREE_COMMENTS + 3 })).toBe(false);
  });
  it('Memora+ não tem limite', () => {
    expect(canComment({ plus: true, commentsUsed: 999 })).toBe(true);
  });
});

describe('storiesLeft (limite de stories)', () => {
  it('conta o que sobra no grátis', () => {
    expect(storiesLeft({ plus: false }, [])).toBe(FREE_STORIES);
    expect(storiesLeft({ plus: false }, [story('a')])).toBe(FREE_STORIES - 1);
  });
  it('nunca fica negativo', () => {
    const many = Array.from({ length: FREE_STORIES + 2 }, (_, i) => story(String(i)));
    expect(storiesLeft({ plus: false }, many)).toBe(0);
  });
  it('Memora+ é ilimitado', () => {
    expect(storiesLeft({ plus: true }, [story('a')])).toBe(Infinity);
  });
});

describe('extractMentions', () => {
  it('acha @menções com acento e sem repetir', () => {
    expect(extractMentions('Café com @Isabela e @caio. Depois @isabela de novo, e @João!')).toEqual(['Isabela', 'caio', 'João']);
  });
  it('ignora texto sem menção e e-mails pela metade', () => {
    expect(extractMentions('dia tranquilo')).toEqual([]);
    expect(extractMentions('@ sozinho')).toEqual([]);
  });
});

describe('toHandle', () => {
  it('gera um @usuário limpo', () => {
    expect(toHandle('João Pedro')).toBe('joaopedro');
    expect(toHandle('@Ana.Lú_2')).toBe('ana.lu_2');
    expect(toHandle('Çãé!! ##')).toBe('cae');
  });
  it('corta em 24 caracteres', () => {
    expect(toHandle('a'.repeat(40))).toHaveLength(24);
  });
});

describe('reminderDates (lembrete só nos dias sem moment)', () => {
  const at = (d: number, h: number, m = 0) => new Date(2026, 10, d, h, m);

  it('agenda os próximos 7 dias no horário escolhido', () => {
    const out = reminderDates(at(17, 10), 21, []);
    expect(out).toHaveLength(7);
    expect(out[0]).toEqual(at(17, 21));
    expect(out[6]).toEqual(at(23, 21));
  });

  it('pula hoje se o horário já passou', () => {
    const out = reminderDates(at(17, 21, 30), 21, []);
    expect(out[0]).toEqual(at(18, 21));
    expect(out).toHaveLength(6);
  });

  it('pula os dias que já têm moment', () => {
    const moments = [{ date: at(17, 9).toISOString() }, { date: at(19, 23).toISOString() }];
    const days = reminderDates(at(17, 10), 22, moments).map((d) => d.getDate());
    expect(days).toEqual([18, 20, 21, 22, 23]);
  });

  it('vira o mês certinho', () => {
    const days = reminderDates(new Date(2026, 10, 29, 8), 21, [], 4).map((d) => `${d.getMonth() + 1}/${d.getDate()}`);
    expect(days).toEqual(['11/29', '11/30', '12/1', '12/2']);
  });
});
