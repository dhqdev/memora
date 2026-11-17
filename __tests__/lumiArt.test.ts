/** @jest-environment node */
import { lumiSvg, Mood } from '@/components/lumiArt';

const moods: Mood[] = ['happy', 'excited', 'thinking', 'sleepy'];

describe('arte da Lumi', () => {
  it.each(moods.flatMap((m) => [[m, false], [m, true]] as [Mood, boolean][]))('%s (piscando: %s) gera um SVG válido', (mood, blink) => {
    const svg = lumiSvg(mood, blink);
    expect(svg.startsWith('<svg')).toBe(true);
    expect(svg.trim().endsWith('</svg>')).toBe(true);
    expect(svg).not.toMatch(/NaN|undefined|Infinity/);
    // toda tag aberta é fechada (ou é auto-fechada)
    const opened = (svg.match(/<(svg|g|defs|clipPath)\b/g) ?? []).length;
    const closed = (svg.match(/<\/(svg|g|defs|clipPath)>/g) ?? []).length;
    expect(opened).toBe(closed);
  });

  it('piscar fecha os olhos mas mantém a boca do humor', () => {
    const open = lumiSvg('excited');
    const blink = lumiSvg('excited', true);
    expect(blink).not.toBe(open);
    const mouth = (x: string) => x.match(/<!--boca-->([\s\S]*?)<!--\/boca-->/)?.[1];
    expect(mouth(blink)).toBe(mouth(open));
  });
});
