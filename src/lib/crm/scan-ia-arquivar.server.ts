/**
 * Scan IA → Documentação do cliente.
 *
 * Depois que o operador confirma a leitura e aplica ao cadastro, o arquivo
 * original é copiado do bucket `scan-ia` para `cliente-documentos` e passa a
 * constar na aba Documentos do cliente (com tipo, versão e trilha).
 */
import { rotuloTipo } from "./scan-ia-tipos";

type Categoria =
  | "comprador"
  | "conjuge"
  | "vendedor"
  | "vendedor_conjuge"
  | "imovel"
  | "outros";

const CATEGORIA_POR_TIPO: Record<string, Categoria> = {
  matricula_imovel: "imovel",
  iptu: "imovel",
};

export interface ResultadoArquivamento {
  arquivado: boolean;
  ja_existia: boolean;
  documento_id: string | null;
  erro: string | null;
}

/**
 * Copia o arquivo da leitura para a documentação do cliente. Idempotente:
 * se a mesma leitura já foi arquivada, apenas devolve o registro existente.
 */
export async function arquivarLeituraNaDocumentacao(params: {
  supabase: any;
  userId: string;
  leituraId: string;
  clienteId: string;
  tipoDocumento: string | null;
  arquivoUrl: string;
}): Promise<ResultadoArquivamento> {
  const { supabase, userId, leituraId, clienteId, tipoDocumento, arquivoUrl } = params;

  try {
    const { data: existente } = await supabase
      .from("cliente_documentos")
      .select("id")
      .eq("cliente_id", clienteId)
      .like("storage_path", `%scan-ia-${leituraId}-%`)
      .maybeSingle();
    if (existente?.id) {
      return { arquivado: true, ja_existia: true, documento_id: existente.id, erro: null };
    }

    const { data: blob, error: dlErr } = await supabase.storage
      .from("scan-ia")
      .download(arquivoUrl);
    if (dlErr || !blob) throw dlErr ?? new Error("Arquivo original não encontrado.");

    const nomeOriginal = (arquivoUrl.split("/").pop() ?? "documento")
      .replace(/^[0-9a-f-]{36}-/i, "")
      .replace(/[^\w.\-]/g, "_");
    const nomeArquivo = `${rotuloTipo(tipoDocumento)} — ${nomeOriginal}`;
    const path = `${clienteId}/scan-ia-${leituraId}-${nomeOriginal}`;

    const buffer = await blob.arrayBuffer();
    const contentType = blob.type || "application/octet-stream";
    const { error: upErr } = await supabase.storage
      .from("cliente-documentos")
      .upload(path, buffer, { contentType, upsert: true });
    if (upErr) throw upErr;

    const categoria: Categoria = CATEGORIA_POR_TIPO[tipoDocumento ?? ""] ?? "comprador";
    const tipo = tipoDocumento ?? "outro";

    const { count } = await supabase
      .from("cliente_documentos")
      .select("id", { count: "exact", head: true })
      .eq("cliente_id", clienteId)
      .eq("categoria", categoria)
      .eq("tipo_documento", tipo);

    const { data: inserido, error: insErr } = await supabase
      .from("cliente_documentos")
      .insert({
        cliente_id: clienteId,
        categoria,
        pasta_id: null,
        tipo_documento: tipo,
        nome_arquivo: nomeArquivo,
        storage_path: path,
        mime_type: contentType,
        tamanho_bytes: buffer.byteLength,
        versao: (count ?? 0) + 1,
        status: "recebido",
        enviado_por: userId,
      })
      .select("id")
      .single();
    if (insErr) throw insErr;

    await supabase.from("cliente_historico").insert({
      cliente_id: clienteId,
      tipo: "documento",
      descricao: `Documento do Scan IA arquivado na documentação: ${nomeArquivo}`,
      ator_id: userId,
    });

    return { arquivado: true, ja_existia: false, documento_id: inserido.id, erro: null };
  } catch (e: any) {
    return {
      arquivado: false,
      ja_existia: false,
      documento_id: null,
      erro: e?.message ?? "Falha ao arquivar o documento na documentação do cliente.",
    };
  }
}
