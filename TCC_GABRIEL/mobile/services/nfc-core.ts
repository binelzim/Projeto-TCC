export class ErroNfc extends Error {}
export class LeituraCancelada extends ErroNfc {}

type Registro = { tnf: number; type: number[] | string; payload: number[] };
export function identificarTag(registros: Registro[] | undefined, decodificar: (bytes: Uint8Array) => string): string {
  const textos = registros?.filter(r => r.tnf === 1 && (r.type === 'T' || (r.type.length === 1 && r.type[0] === 0x54))) || [];
  if (textos.length !== 1) throw new ErroNfc('Grave na tag um único registro NDEF de texto com sua matrícula ou a placa do veículo.');
  const bytes = textos[0].payload;
  if (bytes[0] & 0x80) throw new ErroNfc('Grave a identificação como texto NDEF em UTF-8.');
  if (!bytes.length || (bytes[0] & 0x40) || bytes.length <= 1 + (bytes[0] & 0x3f))
    throw new ErroNfc('O texto da tag está vazio ou incompleto. Grave a identificação novamente.');
  let token: string;
  try { token = decodificar(new Uint8Array(bytes)).trim(); }
  catch { throw new ErroNfc('Não foi possível interpretar o texto da tag. Grave a identificação novamente.'); }
  if (!/^[A-Za-z0-9-]{1,64}$/.test(token)) throw new ErroNfc('A tag deve conter somente sua matrícula ou a placa do veículo, sem links ou outros textos.');
  return token;
}

export type LeitorNativo = {
  preparar: () => Promise<void>;
  solicitar: () => Promise<unknown>;
  obter: () => Promise<string>;
  cancelar: () => Promise<void>;
};

// One session owns the radio until native cleanup finishes, even after cancellation.
export function criarLeitor(carregar: () => Promise<LeitorNativo>, limiteMs = 45000) {
  let cancelarAtual: ((erro: Error) => void) | undefined;
  return {
    cancelar() { cancelarAtual?.(new LeituraCancelada('Leitura NFC cancelada.')); },
    async ler(): Promise<string> {
      if (cancelarAtual) throw new ErroNfc('Já existe uma leitura NFC em andamento.');
      let motivo: Error | undefined;
      let leitor: LeitorNativo | undefined;
      let solicitou = false;
      let rejeitar!: (erro: Error) => void;
      const cancelamento = new Promise<never>((_, reject) => { rejeitar = reject; });
      cancelarAtual = erro => { motivo = erro; rejeitar(erro); };
      const timer = setTimeout(() => cancelarAtual?.(new ErroNfc('Tempo de leitura esgotado. Aproxime a tag e tente novamente.')), limiteMs);
      const conferir = () => { if (motivo) throw motivo; };
      const leitura = async () => {
        leitor = await carregar(); conferir();
        await leitor.preparar(); conferir();
        solicitou = true;
        await leitor.solicitar(); conferir();
        const token = await leitor.obter(); conferir();
        return token;
      };
      try { return await Promise.race([leitura(), cancelamento]); }
      finally {
        clearTimeout(timer);
        if (solicitou && leitor) await leitor.cancelar().catch(() => {});
        cancelarAtual = undefined;
      }
    },
  };
}
