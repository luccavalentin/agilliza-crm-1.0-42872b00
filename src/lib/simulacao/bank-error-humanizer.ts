/**
 * Traduz códigos/mensagens de erro do provedor de integração bancária
 * para mensagens em português claras, dizendo AO USUÁRIO o que corrigir.
 * Módulo puro — pode ser importado no cliente e no servidor.
 */

const MAPA: Record<string, string> = {
  RENDA_INSUFICIENTE: "Renda declarada insuficiente para o valor solicitado.",
  DOC_INVALIDO: "Documento do cliente inválido ou não reconhecido pelo banco.",
  LIMITE_EXCEDIDO: "Valor de financiamento acima do limite do banco.",
  IDADE_MAX_EXCEDIDA: "Idade do cliente excede o limite permitido pelo banco no fim do contrato.",
  PRAZO_INVALIDO: "Prazo solicitado fora da faixa aceita pelo banco.",
  IMOVEL_NAO_ELEGIVEL: "Tipo ou situação do imóvel não é elegível para este banco.",
  UF_NAO_ATENDIDA: "O banco não atende financiamentos nesta UF.",
  TIMEOUT: "O banco não respondeu no tempo esperado. Tente reenviar.",
};

/** Códigos de recusa devolvidos pelo Bradesco dentro de INT-006. */
const BRADESCO: Record<string, string> = {
  "119": "Bradesco: renda mensal informada é menor que a renda mínima exigida para este valor de financiamento. Reduza o valor financiado, aumente o prazo ou inclua composição de renda.",
  "121-L":
    "Bradesco: a operação não passou nas regras de crédito do banco (limite/valor x renda x prazo). Ajuste valor financiado, entrada ou prazo e reenvie.",
  "014": "Bradesco: dados cadastrais do proponente incompletos ou divergentes na base do banco.",
};

const CAMPOS_PT: Record<string, string> = {
  financingAmount: "Valor do financiamento",
  propertyValue: "Valor do imóvel",
  term: "Prazo",
  income: "Renda",
  birthDate: "Data de nascimento",
  downPayment: "Entrada",
};

function moeda(v: unknown): string {
  const n = Number(v);
  if (!Number.isFinite(n)) return String(v ?? "");
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

/**
 * Recebe o corpo JSON de erro da integração e devolve uma mensagem clara.
 * Trata os formatos conhecidos:
 *  - { error: { code: "INT-SANTANDER-RANGE", context: { field, min, max, valueProvided } } }
 *  - { error: { code: "INT-006", message: 'Simulação Bradesco falhou: {"codigo":"119",...}' } }
 *  - { error: { code: "INTERNAL_ERROR", message: "Erro interno do servidor" } }
 */
export function humanizarRespostaErro(json: unknown, status: number, endpoint = ""): string {
  const err = ((json as any)?.error ?? json ?? {}) as Record<string, any>;
  const code = String(err?.code ?? err?.codigo ?? "");
  const ctx = (err?.context ?? {}) as Record<string, any>;

  // Faixa de valores fora do permitido (Santander e similares)
  if (ctx && (ctx.min != null || ctx.max != null) && ctx.field) {
    const campo = CAMPOS_PT[String(ctx.field)] ?? String(ctx.field);
    const banco = ctx.bank ? String(ctx.bank).replace(/^\w/, (c: string) => c.toUpperCase()) : "O banco";
    const ehValor = /amount|value|payment/i.test(String(ctx.field));
    const fmt = ehValor ? moeda : (v: unknown) => String(v);
    return `${banco}: ${campo} de ${fmt(ctx.valueProvided)} está fora do intervalo aceito (mínimo ${fmt(
      ctx.min,
    )} e máximo ${fmt(ctx.max)}). Ajuste o valor e reenvie.`;
  }

  const bruta = String(err?.message ?? err?.mensagem ?? err?.msg ?? err?.detail ?? "");

  // Recusa do Bradesco embutida em JSON dentro da mensagem
  const aninhado = bruta.match(/\{[\s\S]*\}/);
  if (aninhado) {
    try {
      const interno = JSON.parse(aninhado[0]) as Record<string, any>;
      const cod = String(interno.codigo ?? interno.code ?? "");
      if (BRADESCO[cod]) return BRADESCO[cod];
      const msgInterna = String(interno.mensagem ?? interno.message ?? "").trim();
      if (msgInterna) return msgInterna;
      if (cod) {
        return `O banco recusou a simulação (código ${cod}) sem detalhar o motivo. Normalmente é relação valor x renda x prazo — revise esses campos e reenvie.`;
      }
    } catch {
      /* ignora */
    }
  }

  if (/undefined\s*$/i.test(bruta) && /INT-006/i.test(code)) {
    return "O banco não devolveu o motivo da recusa. Em geral é relação valor financiado x renda x prazo. Revise esses campos e reenvie.";
  }

  if (code === "INTERNAL_ERROR" || status >= 500) {
    const ondeParticipante = /participante/i.test(endpoint);
    const ondeSimulacao = /\/simulacao/i.test(endpoint);
    if (ondeParticipante) {
      return "O banco rejeitou os dados do proponente (erro interno na integração). Verifique no cadastro do cliente: sexo, nome da mãe, RG/órgão expedidor, profissão e endereço completo (CEP, logradouro, número, bairro, cidade e UF).";
    }
    if (ondeSimulacao) {
      return "O banco rejeitou os dados da simulação (erro interno na integração). Confira prazo (o Itaú aceita no máximo 360 meses), valor do imóvel, valor financiado e sistema de amortização, e reenvie.";
    }
    return `O banco está temporariamente indisponível (erro ${status}). Tente reenviar em instantes.`;
  }

  if (MAPA[code]) return MAPA[code];
  const limpa = bruta
    .replace(/^Simula[cç][aã]o\s+\S+\s+falhou:\s*/i, "")
    .replace(/^["']|["']$/g, "")
    .trim();
  if (limpa) return limpa;
  return `A integração bancária retornou um erro (${status}). Revise os dados e tente reenviar.`;
}

export function humanizarErroBanco(codigo?: string | null, mensagem?: string | null): string {
  if (codigo && MAPA[codigo]) return MAPA[codigo];
  if (codigo && BRADESCO[codigo]) return BRADESCO[codigo];
  if (mensagem && mensagem.trim().length > 0) return mensagem.trim();
  return "Não foi possível concluir a simulação neste banco.";
}
