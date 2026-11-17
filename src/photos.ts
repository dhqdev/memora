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
