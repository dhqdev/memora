/**
 * Lumi — arte original do Memora (v3). Retrato em traço preto e branco, estilo
 * mangá, desenhado à mão em SVG num quadro 100×100:
 * franja em mechas que varrem pro lado, presilha ✦ (o brilho do app), olhos com
 * íris em camadas e dois brilhos, blush em retícula, suéter de gola canelada.
 *
 * Gerado em código para cada humor; `blink` fecha os olhos mantendo o resto.
 */
export type Mood = 'happy' | 'excited' | 'thinking' | 'sleepy';

const K = '#141413', W = '#FFFFFF', G = '#8E8A80';
const n = (v: number) => +v.toFixed(2);
const s = (d: string, w = 2, color = K, extra = '') => `<path d="${d}" stroke="${color}" stroke-width="${w}" fill="none" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
const f = (d: string, fill = W, w = 1.8, stroke = K) => `<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"/>`;
const fill = (d: string, color = K) => `<path d="${d}" fill="${color}"/>`;
const circ = (x: number, y: number, r: number, color = K) => `<circle cx="${n(x)}" cy="${n(y)}" r="${n(r)}" fill="${color}"/>`;

/** brilho de 4 pontas (o ✦ do app) */
function sparkle(x: number, y: number, r: number, color = K, outline?: number) {
  const k = r * 0.16;
  const d = `M${n(x)} ${n(y - r)} C${n(x + k)} ${n(y - k)} ${n(x + k)} ${n(y - k)} ${n(x + r)} ${n(y)} C${n(x + k)} ${n(y + k)} ${n(x + k)} ${n(y + k)} ${n(x)} ${n(y + r)} C${n(x - k)} ${n(y + k)} ${n(x - k)} ${n(y + k)} ${n(x - r)} ${n(y)} C${n(x - k)} ${n(y - k)} ${n(x - k)} ${n(y - k)} ${n(x)} ${n(y - r)} Z`;
  return outline ? f(d, color, outline) : fill(d, color);
}

/** retícula de pontinhos (screentone) dentro de uma elipse — o blush */
function tone(cx: number, cy: number, rx: number, ry: number, step = 1.05, r = 0.3) {
  let out = '';
  for (let y = cy - ry; y <= cy + ry; y += step * 0.866) {
    const row = Math.round((y - cy) / (step * 0.866));
    for (let x = cx - rx + (row % 2 ? step / 2 : 0); x <= cx + rx; x += step) {
      const q = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (q <= 1) out += circ(x, y, r * (1 - q * 0.45));
    }
  }
  return out;
}

/** olho aberto; side = -1 (esquerdo de quem olha) ou 1 */
function eye(cx: number, cy: number, side: 1 | -1, o: { look?: [number, number]; big?: boolean; stars?: boolean } = {}) {
  const dx = o.look?.[0] ?? 0, dy = o.look?.[1] ?? 0;
  const X = (v: number) => n(cx - side * v); // espelha horizontalmente
  const ix = cx + dx, iy = cy + 1.3 + dy;
  const rx = o.big ? 3.9 : 3.6, ry = o.big ? 4.9 : 4.6;
  let out = '';
  // branco do olho (leve contorno inferior)
  out += f(`M${X(-5.4)} ${n(cy - 0.6)} C${X(-4)} ${n(cy - 4.6)} ${X(3.6)} ${n(cy - 4.8)} ${X(4.8)} ${n(cy - 2.4)} C${X(4.6)} ${n(cy + 2.6)} ${X(2.6)} ${n(cy + 6.4)} ${X(-0.2)} ${n(cy + 6.4)} C${X(-3)} ${n(cy + 6.3)} ${X(-5)} ${n(cy + 3.4)} ${X(-5.4)} ${n(cy - 0.6)} Z`, W, 0.01, W);
  // íris + anel interno + luz de baixo
  out += `<ellipse cx="${n(ix)}" cy="${n(iy)}" rx="${rx}" ry="${ry}" fill="${K}"/>`;
  out += `<ellipse cx="${n(ix)}" cy="${n(iy + 0.3)}" rx="${n(rx - 1.15)}" ry="${n(ry - 1.3)}" fill="none" stroke="${W}" stroke-width="0.45" opacity="0.7"/>`;
  out += fill(`M${n(ix - 2.7)} ${n(iy + 2.2)} Q${n(ix)} ${n(iy + 5.1)} ${n(ix + 2.7)} ${n(iy + 2.2)} Q${n(ix)} ${n(iy + 3.6)} ${n(ix - 2.7)} ${n(iy + 2.2)} Z`, W);
  out += `<ellipse cx="${n(ix)}" cy="${n(iy + 0.2)}" rx="1.5" ry="2" fill="${K}"/>`;
  // brilhos
  if (o.stars) {
    out += sparkle(ix - 1.25, iy - 1.5, 2.15, W);
    out += circ(ix + 1.6, iy + 2.3, 0.65, W);
  } else {
    out += circ(ix - 1.3, iy - 1.4, 1.45, W);
    out += circ(ix + 1.7, iy + 2.4, 0.6, W);
  }
  // linha dos cílios de cima (grossa, afinando) + cílios no canto
  out += fill(`M${X(-5.9)} ${n(cy + 0.2)} C${X(-4.7)} ${n(cy - 4.6)} ${X(-1.6)} ${n(cy - 6.2)} ${X(0.9)} ${n(cy - 6)} C${X(3)} ${n(cy - 5.8)} ${X(4.6)} ${n(cy - 4.8)} ${X(5.4)} ${n(cy - 3.2)} L${X(4.9)} ${n(cy - 2.3)} C${X(3.9)} ${n(cy - 3.7)} ${X(2.6)} ${n(cy - 4.3)} ${X(0.8)} ${n(cy - 4.4)} C${X(-1.6)} ${n(cy - 4.4)} ${X(-3.9)} ${n(cy - 3)} ${X(-5)} ${n(cy + 0.4)} Z`);
  out += s(`M${X(-5.2)} ${n(cy - 2)} L${X(-7.1)} ${n(cy - 3.3)}`, 1.1);
  out += s(`M${X(-5.6)} ${n(cy - 0.2)} L${X(-7.4)} ${n(cy - 0.6)}`, 0.9);
  // pálpebra de baixo, curtinha
  out += s(`M${X(-2.2)} ${n(cy + 7)} Q${X(-0.2)} ${n(cy + 7.5)} ${X(1.8)} ${n(cy + 6.9)}`, 0.6);
  return out;
}

/** olho fechado (feliz ∩ ou dormindo ∪) */
function closedEye(cx: number, cy: number, side: 1 | -1, smile: boolean) {
  const X = (v: number) => n(cx - side * v);
  if (smile) {
    return f(`M${X(-5.2)} ${n(cy + 1.6)} C${X(-3.6)} ${n(cy - 3)} ${X(3.4)} ${n(cy - 3)} ${X(5)} ${n(cy + 1.2)} C${X(3)} ${n(cy - 1.1)} ${X(-3.2)} ${n(cy - 1)} ${X(-5.2)} ${n(cy + 1.6)} Z`, K, 0.8) +
      s(`M${X(-4.9)} ${n(cy + 0.4)} L${X(-6.8)} ${n(cy - 0.6)}`, 1);
  }
  return f(`M${X(-5.4)} ${n(cy + 0.6)} C${X(-3.4)} ${n(cy + 4.4)} ${X(3.4)} ${n(cy + 4.4)} ${X(5.2)} ${n(cy + 0.4)} C${X(3)} ${n(cy + 2.6)} ${X(-3.2)} ${n(cy + 2.7)} ${X(-5.4)} ${n(cy + 0.6)} Z`, K, 0.8) +
    s(`M${X(-4.2)} ${n(cy + 2.6)} L${X(-5)} ${n(cy + 4.2)} M${X(-2)} ${n(cy + 3.5)} L${X(-2.4)} ${n(cy + 5.1)} M${X(0.6)} ${n(cy + 3.7)} L${X(0.6)} ${n(cy + 5.3)}`, 0.7) +
    s(`M${X(-5.1)} ${n(cy + 1)} L${X(-6.9)} ${n(cy + 0.3)}`, 0.9);
}

function brow(cx: number, cy: number, side: 1 | -1, lift = 0) {
  const X = (v: number) => n(cx - side * v);
  const d = `M${X(-3.6)} ${n(cy + 0.5)} Q${X(-0.8)} ${n(cy - 1 - lift)} ${X(2.6)} ${n(cy - 0.1 - lift * 0.3)}`;
  return s(d, 2.2, W) + s(d, 1, K);
}

export function lumiSvg(mood: Mood = 'happy', blink = false): string {
  const L = 41.4, R = 58.6, EY = 51.2;
  let eyes = '', brows = '', mouth = '', extra = '';
  if (blink || mood === 'sleepy') {
    eyes = closedEye(L, EY, -1, false) + closedEye(R, EY, 1, false);
  } else if (mood === 'excited') {
    eyes = eye(L, EY, -1, { stars: true, big: true }) + eye(R, EY, 1, { stars: true, big: true });
  } else if (mood === 'thinking') {
    eyes = eye(L, EY, -1, { look: [1.1, -1] }) + eye(R, EY, 1, { look: [1.1, -1] });
  } else {
    eyes = eye(L, EY, -1) + eye(R, EY, 1);
  }

  if (mood === 'happy') {
    brows = brow(L, 43.4, -1) + brow(R, 43.4, 1);
    mouth = f('M46.3 60.1 Q50 61.3 53.7 60.1 Q52.8 64.4 50 64.5 Q47.2 64.4 46.3 60.1 Z', K, 0.9) + fill('M47.9 63 Q50 61.8 52.1 63 Q51.2 64.1 50 64.1 Q48.8 64.1 47.9 63 Z', G);
    extra = sparkle(18.5, 33, 3.2) + sparkle(83, 26, 2.2) + circ(80.5, 34, 0.8);
  } else if (mood === 'excited') {
    brows = brow(L, 42.6, -1, 1) + brow(R, 42.6, 1, 1);
    mouth = f('M45.4 59.6 Q50 60.9 54.6 59.6 Q54 66.3 50 66.4 Q46 66.3 45.4 59.6 Z', K, 0.9) + fill('M47.3 64.6 Q50 62.6 52.7 64.6 Q51.6 66 50 66 Q48.4 66 47.3 64.6 Z', G) + s('M45.8 60.3 Q50 61.5 54.2 60.3', 0.7, W);
    extra = sparkle(17.5, 31, 4.2) + sparkle(84, 23, 3) + sparkle(84.5, 44, 1.8) + sparkle(13.5, 47, 1.6) + circ(23.5, 23, 0.9) + circ(78, 33, 0.8);
  } else if (mood === 'thinking') {
    brows = brow(L, 43.8, -1, -0.4) + brow(R, 42.2, 1, 1.4);
    mouth = s('M47.8 61.4 Q49.2 60.4 50.6 61.2 Q52 62 53.4 61', 1.3);
    extra = circ(79, 34.4, 1) + circ(82.4, 28.8, 1.5) + circ(84.2, 22, 2);
  } else {
    brows = brow(L, 44.2, -1, -0.5) + brow(R, 44.2, 1, -0.5);
    mouth = blink ? '' : `<ellipse cx="50" cy="61.6" rx="1.3" ry="1.6" fill="${K}"/>`;
    extra = blink ? '' : s('M19 32.4 L22.2 32.4 L19 36 L22.2 36', 1.1) + s('M12.6 21.6 L17.8 21.6 L12.6 27.4 L17.8 27.4', 1.5);
  }
  // ----- cabelo de trás (longo, ondas nas pontas) -----
  const backHair =
    f('M50 12.6 C31 12.6 22.6 27 23.6 43.5 C24.3 54 21.6 61.6 17.6 68.6 C14.4 74.2 13.2 80.4 16.4 86.6 C18.6 85 21.6 85 24 86.8 C26.4 83.4 29 81.8 31.4 82.2 C32.6 79.6 33.4 77.4 34 75 L34 83 L66 83 L66 75 C66.6 77.4 67.4 79.6 68.6 82.2 C71 81.8 73.6 83.4 76 86.8 C78.4 85 81.4 85 83.6 86.6 C86.8 80.4 85.6 74.2 82.4 68.6 C78.4 61.6 75.7 54 76.4 43.5 C77.4 27 69 12.6 50 12.6 Z', K, 1.2) +
    // fios brancos nas ondas
    s('M21.4 66 C19 71 17.6 76 18.6 81.6', 0.55, W) + s('M25.4 70 C24 74.4 24.6 78.6 26 82', 0.55, W) +
    s('M78.6 66 C81 71 82.4 76 81.4 81.6', 0.55, W) + s('M74.6 70 C76 74.4 75.4 78.6 74 82', 0.55, W);

  // ----- suéter de gola redonda (gola canelada) -----
  const top =
    f('M4 104 C6 89.4 18.5 81.4 33.4 79.2 C38 78.4 42 77.6 44.8 76.2 L55.2 76.2 C58 77.6 62 78.4 66.6 79.2 C81.5 81.4 94 89.4 96 104 Z', W, 1.8) +
    f('M41.6 77.6 C43.6 82.6 46.6 84.2 50 84.2 C53.4 84.2 56.4 82.6 58.4 77.6 C56.6 77.2 55.6 76.8 55.2 76.2 C54 79.2 52.2 80.4 50 80.4 C47.8 80.4 46 79.2 44.8 76.2 C44.4 76.8 43.4 77.2 41.6 77.6 Z', W, 1.3) +
    s('M43.4 78.8 L44.4 78.2 M45 80.8 L45.8 79.8 M47.2 82.2 L47.6 81 M50 82.8 L50 81.4 M52.8 82.2 L52.4 81 M55 80.8 L54.2 79.8 M56.6 78.8 L55.6 78.2', 0.5) +
    // costuras dos ombros e dobras
    s('M20.2 87.6 C22.4 91.6 23.4 96 23.2 101', 0.9) + s('M79.8 87.6 C77.6 91.6 76.6 96 76.8 101', 0.9) +
    s('M30 85.6 C31.4 88 32 90.4 31.8 93', 0.55) + s('M70 85.6 C68.6 88 68 90.4 68.2 93', 0.55) +
    // estampa ✦ no peito
    sparkle(59.4, 90.6, 3.3, K) + sparkle(63.8, 87.4, 1.4, K);

  // ----- pescoço e rosto -----
  const neck =
    f('M44.8 61 L44.8 77 Q50 81.4 55.2 77 L55.2 61 Z', W, 1.6) +
    fill('M44.8 64.6 Q50 69.8 55.2 64.6 L55.2 66.2 Q50 71.4 44.8 66.2 Z');
  const face =
    f('M33.4 43.6 C33.4 54.6 37.8 62.6 43.8 66.6 C46.4 68.3 48.4 69 50 69 C51.6 69 53.6 68.3 56.2 66.6 C62.2 62.6 66.6 54.6 66.6 43.6 C66.6 30.8 59.8 23.6 50 23.6 C40.2 23.6 33.4 30.8 33.4 43.6 Z', W, 1.8);
  const blush = tone(37.4, 57.6, 3.6, 1.7) + tone(62.6, 57.6, 3.6, 1.7);
  const nose = s('M50.6 56.2 L49.7 57.6 L50.7 57.8', 0.9);

  // ----- franja: uma "touca" preta + mechas em forma de folha, varrendo pra esquerda -----
  const capY = (x: number) => 34.6 + ((x - 50) / 17.5) ** 2 * 9.5;
  let bangs = f('M31.6 47.6 C28.4 30.6 35.8 13.4 50 13.4 C64.2 13.4 72 30 68.6 47.4 C66.4 41.4 60 35.6 50 35.6 C40 35.6 33.8 41.4 31.6 47.6 Z', K, 1.2);
  const locks: [number, number, number, number][] = [
    [64.6, 3.3, 47.4, -0.4],
    [36.4, 3.4, 47.6, -1.2],
    [59.4, 4.0, 44.6, -1.4],
    [41.6, 3.9, 45.4, -1.8],
    [53.6, 4.3, 45.8, -2.2],
    [47.4, 4.3, 44.4, -2.4],
  ];
  for (const [cx, hw, tipY, sw] of locks) {
    const a = cx - hw, b = cx + hw, ya = capY(a) - 3, yb = capY(b) - 3, tx = cx + sw * 1.6;
    const d = `M${n(a)} ${n(ya)} C${n(a + 0.2)} ${n(ya + (tipY - ya) * 0.55)} ${n(tx - 0.6)} ${n(tipY - 3)} ${n(tx)} ${n(tipY)} C${n(tx + 1.6)} ${n(tipY - 3.6)} ${n(b + 0.4)} ${n(yb + (tipY - yb) * 0.45)} ${n(b)} ${n(yb)} Z`;
    bangs += fill(d);
    // fio branco separando a mecha da vizinha
    bangs += s(`M${n(tx + 0.5)} ${n(tipY - 1.6)} C${n(tx + 1.8)} ${n(tipY - 4.4)} ${n(b)} ${n(yb + (tipY - yb) * 0.35)} ${n(b - 0.2)} ${n(yb - 1.5)}`, 0.55, W);
  }
  bangs +=
    // brilho no topo
    s('M37.4 25.6 Q43.2 20.4 49.4 19.8', 1.3, W) + s('M53 19.9 Q58.2 20.6 62 24', 1.3, W) +
    s('M41 24.4 L40.4 26.6 M44.6 22.2 L44.2 24.2 M58 22.2 L58.6 24', 0.7, W) +
    // presilha ✦ no lado direito
    sparkle(64.8, 31, 4.6, W, 1) + sparkle(60, 27, 1.9, W, 0.8);

  // ----- mechas laterais na frente das orelhas -----
  const sideLocks =
    f('M34.6 37.6 C31 45.6 31.6 54.6 30 61.6 C29.4 64.6 28.2 67 26.4 69.2 C30.8 68.4 33.4 65 34.4 60.4 C35.4 55 35.4 47.6 36.6 41.2 Z', K, 1) +
    f('M65.4 37.6 C69 45.6 68.4 54.6 70 61.6 C70.6 64.6 71.8 67 73.6 69.2 C69.2 68.4 66.6 65 65.6 60.4 C64.6 55 64.6 47.6 63.4 41.2 Z', K, 1) +
    s('M33.4 46 C32.6 52 32.6 57 31.4 62', 0.45, W) + s('M66.6 46 C67.4 52 67.4 57 68.6 62', 0.45, W);

  const ahoge = s('M51.2 13.8 C48.4 7.4 54.4 3.6 58.4 6.2 C55 6.4 52.8 9.4 53.6 13.6', 1.9);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
<defs><clipPath id="lumiClip"><circle cx="50" cy="50" r="47"/></clipPath></defs>
<circle cx="50" cy="50" r="48" fill="${W}"/>
<g clip-path="url(#lumiClip)">
${extra}
${backHair}${top}${neck}${face}${blush}${nose}${eyes}
<g transform="translate(0 0.9)"><!--boca-->${mouth}<!--/boca--></g>
${sideLocks}${bangs}${brows}${ahoge}
</g>
<circle cx="50" cy="50" r="47" fill="none" stroke="${K}" stroke-width="3"/>
<circle cx="50" cy="50" r="49.2" fill="none" stroke="${W}" stroke-width="1.6"/>
</svg>`;
}
