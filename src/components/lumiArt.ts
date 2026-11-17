/**
 * Arte da Lumi: traço preto e branco estilo mangá, dentro de um círculo.
 * Desenho original do Memora. Cada humor troca olhos, sobrancelhas e boca.
 */
export type Mood = 'happy' | 'excited' | 'thinking' | 'sleepy';

export function lumiSvg(mood: Mood): string {
  const K = '#141413', W = '#FFFFFF';
  const s = (d: string, w = 2, extra = '') => `<path d="${d}" stroke="${K}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
  const f = (d: string, fill = W, w = 2) => `<path d="${d}" fill="${fill}" stroke="${K}" stroke-width="${w}" stroke-linejoin="round"/>`;
  let eyes = '', brows = '', mouth = '';
  if (mood === 'happy') {
    eyes = s('M37.5 50 Q41.5 45.5 45.5 50', 2.3) + s('M54.5 50 Q58.5 45.5 62.5 50', 2.3) + s('M36.6 49 L35.3 48', 1.4) + s('M63.4 49 L64.7 48', 1.4);
    brows = s('M37.5 42.5 Q41.5 41 45 42', 1.4) + s('M55 42 Q58.5 41 62.5 42.5', 1.4);
    mouth = f('M46 58.5 Q50 63.5 54 58.5 Z', K, 1.2);
  } else if (mood === 'excited') {
    eyes = `<ellipse cx="41.5" cy="50" rx="3.4" ry="4.2" fill="${K}"/><ellipse cx="58.5" cy="50" rx="3.4" ry="4.2" fill="${K}"/>` +
      `<circle cx="42.6" cy="48.4" r="1.25" fill="${W}"/><circle cx="59.6" cy="48.4" r="1.25" fill="${W}"/><circle cx="40.4" cy="51.6" r="0.6" fill="${W}"/><circle cx="57.4" cy="51.6" r="0.6" fill="${W}"/>` +
      s('M36.8 46.6 Q41.5 43.6 46.3 46.4', 2) + s('M53.7 46.4 Q58.5 43.6 63.2 46.6', 2);
    brows = s('M37.5 41 Q41.5 39 45 40.5', 1.4) + s('M55 40.5 Q58.5 39 62.5 41', 1.4);
    mouth = f('M45.5 58 Q50 64.5 54.5 58 Z', K, 1.2);
  } else if (mood === 'thinking') {
    eyes = `<ellipse cx="43" cy="50.2" rx="2.4" ry="3.3" fill="${K}"/><ellipse cx="60" cy="50.2" rx="2.4" ry="3.3" fill="${K}"/><circle cx="43.8" cy="49" r="0.9" fill="${W}"/><circle cx="60.8" cy="49" r="0.9" fill="${W}"/>` +
      s('M37.5 47 Q41.5 44.8 45.8 46.6', 1.8) + s('M54.5 46.6 Q58.5 44.8 62.5 47', 1.8);
    brows = s('M37.5 42 Q41.5 41.4 45 42.4', 1.4) + s('M55 40.6 Q58.8 38.6 62.5 40', 1.4);
    mouth = s('M47.5 60 Q50 59.2 52.5 60.4', 1.6);
  } else {
    eyes = s('M37.8 50.5 Q41.5 52 45.3 50.5', 2) + s('M54.7 50.5 Q58.5 52 62.2 50.5', 2);
    brows = s('M37.5 43.5 Q41.5 42.8 45 43.4', 1.4) + s('M55 43.4 Q58.5 42.8 62.5 43.5', 1.4);
    mouth = s('M48 60 Q50 61 52 60', 1.6);
  }
  const blush = s('M36.5 56 L38 54.2 M38.8 56 L40.3 54.2 M41.1 56 L42.6 54.2', 0.9) + s('M57.4 56 L58.9 54.2 M59.7 56 L61.2 54.2 M62 56 L63.5 54.2', 0.9);
  const freckles = [[39, 53], [41.3, 53.6], [58.6, 53.6], [61, 53]].map(([x, y]: number[]) => `<circle cx="${x}" cy="${y}" r="0.45" fill="${K}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><clipPath id="c"><circle cx="50" cy="50" r="47"/></clipPath></defs>
  <circle cx="50" cy="50" r="48" fill="${W}"/>
  <g clip-path="url(#c)"><g transform="translate(50 55) scale(1.06) translate(-50 -50)">
    
    ${f('M27 40 C21 52 25 60 22 68 C20 75 15 79 13 86 C20 89 27 86 31 80 C33 84 37 85 40 83 L60 83 C63 85 67 84 69 80 C73 86 80 89 87 86 C85 79 80 75 78 68 C75 60 79 52 73 40 Z', K, 1.5)}
    ${s('M22 70 C21 74 19 77 17 80', 0.9, 'stroke="#FFFFFF"')}${s('M78 70 C79 74 81 77 83 80', 0.9, 'stroke="#FFFFFF"')}
    
    ${f('M8 106 C10 88 25 81 41 78 L59 78 C75 81 90 88 92 106 Z')}
    ${s('M41.5 78.5 Q50 87 58.5 78.5', 1.8)}
    <path d="M65 93 L66 95.4 L68.6 95.6 L66.6 97.2 L67.3 99.8 L65 98.4 L62.7 99.8 L63.4 97.2 L61.4 95.6 L64 95.4 Z" fill="${K}"/>
    
    ${f('M44.5 64 L44.5 79 Q50 82 55.5 79 L55.5 64 Z', W, 1.8)}
    
    ${f('M32.5 42 C32.5 57 40 68.5 50 69 C60 68.5 67.5 57 67.5 42 C67.5 30 60 24 50 24 C40 24 32.5 30 32.5 42 Z')}
    ${f('M33 47 C29.5 46 29 51.5 33.5 53.5', W, 1.6)}${f('M67 47 C70.5 46 71 51.5 66.5 53.5', W, 1.6)}
    <path d="M31.6 55.6 L32.3 57.3 L34 57.5 L32.7 58.6 L33.1 60.3 L31.6 59.4 L30.1 60.3 L30.5 58.6 L29.2 57.5 L30.9 57.3 Z" fill="${K}"/>
    ${eyes}${brows}${blush}${freckles}
    ${s('M50.2 53.2 L49.4 55.6 L50.6 55.8', 1.1)}
    ${mouth}
    
    ${f('M30.5 47 C27.5 30 37 16.5 51 16.5 C65 16.5 73.5 27 70.5 46 C69 38 66.5 33.5 62.5 30 C57.5 35.5 48 38.5 38.5 39 C35.5 41 32.5 43.5 30.5 47 Z', K, 1.5)}
    ${s('M38.5 24.5 Q45 19.8 52 20.3', 1.3, 'stroke="#FFFFFF"')}${s('M55.5 21 Q58.5 21.6 61 23.2', 1.3, 'stroke="#FFFFFF"')}
    ${s('M50 20.5 C47 26 44 31 41.5 37', 0.8, 'stroke="#FFFFFF"')}${s('M58 22.5 C57 27.5 54 32 50 35.5', 0.8, 'stroke="#FFFFFF"')}
    ${s('M51 17 C48.5 11 54 7.5 57.5 9.6 C54.5 10 52.6 12.6 53.2 16.8', 1.9)}
  </g></g>
  <circle cx="50" cy="50" r="47" fill="none" stroke="${K}" stroke-width="3"/>
  <circle cx="50" cy="50" r="49.2" fill="none" stroke="${W}" stroke-width="1.6"/>
</svg>`;
}
