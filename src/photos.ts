import { Directory, File, Paths } from 'expo-file-system';

/**
 * O seletor de fotos devolve um arquivo temporário (cache), que o sistema pode
 * apagar. Copiamos cada foto para a pasta de documentos do app e guardamos só
 * o caminho relativo — no iOS o caminho absoluto muda entre atualizações.
 */
const DIR = 'photos';

export async function persistPhoto(uri: string): Promise<string> {
  try {
    const dir = new Directory(Paths.document, DIR);
    dir.create({ idempotent: true, intermediates: true });
    const src = new File(uri);
    const ext = (src.extension || '.jpg').replace(/^\.?/, '.');
    const name = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}${ext}`;
    await src.copy(new File(dir, name));
    return `${DIR}/${name}`;
  } catch {
    return uri; // se falhar, mantém o original (melhor que perder a foto)
  }
}

/** Converte o que está salvo (relativo ou URI antiga) em URI para exibir. */
export function photoUri(stored: string): string {
  if (/^[a-z]+:/i.test(stored)) return stored;
  return new File(Paths.document, stored).uri;
}

/** Apaga do aparelho as fotos que o app copiou (ignora URIs externas). */
export function deletePhotos(stored: string[]) {
  for (const s of stored) {
    if (/^[a-z]+:/i.test(s)) continue;
    try {
      const f = new File(Paths.document, s);
      if (f.exists) f.delete();
    } catch {}
  }
}

/** "Apagar todos os dados": some com a pasta de fotos inteira. */
export function wipePhotos() {
  try {
    const dir = new Directory(Paths.document, DIR);
    if (dir.exists) dir.delete();
  } catch {}
}
