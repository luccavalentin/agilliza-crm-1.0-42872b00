/**
 * Scan IA — fonte única de tipos de documento, campos esperados por tipo e
 * mapeamento campo extraído → coluna da tabela `clientes`.
 *
 * REGRA DE OURO: nada aqui aplica dados sozinho. Este módulo apenas descreve
 * o que a IA deve procurar e para onde o dado PODE ir depois que um humano
 * confirmar explicitamente, campo por campo.
 *
 * Client-safe (sem imports de servidor).
 */

export const TIPOS_DOCUMENTO = [
  "rg",
  "cnh",
  "cpf",
  "comprovante_renda",
  "comprovante_residencia",
  "certidao_casamento",
  "certidao_nascimento",
  "matricula_imovel",
  "iptu",
  "extrato_bancario",
  "outro",
] as const;

export type TipoDocumentoScan = (typeof TIPOS_DOCUMENTO)[number];

export const TIPO_DOCUMENTO_LABEL: Record<TipoDocumentoScan, string> = {
  rg: "RG / Identidade",
  cnh: "CNH",
  cpf: "CPF",
  comprovante_renda: "Comprovante de renda",
  comprovante_residencia: "Comprovante de residência",
  certidao_casamento: "Certidão de casamento",
  certidao_nascimento: "Certidão de nascimento",
  matricula_imovel: "Matrícula do imóvel",
  iptu: "IPTU / Valor venal",
  extrato_bancario: "Extrato bancário",
  outro: "Outro / não identificado",
};

export function rotuloTipo(tipo: string | null | undefined): string {
  if (!tipo) return "—";
  return TIPO_DOCUMENTO_LABEL[tipo as TipoDocumentoScan] ?? tipo;
}

export function ehTipoConhecido(tipo: string | null | undefined): tipo is TipoDocumentoScan {
  return !!tipo && (TIPOS_DOCUMENTO as readonly string[]).includes(tipo);
}

/** Lista genérica original — fallback do tipo "outro". NÃO REMOVER. */
export const CAMPOS_ESPERADOS = [
  "nome_completo",
  "cpf_cnpj",
  "rg",
  "data_nascimento",
  "estado_civil",
  "renda_mensal",
  "endereco",
  "cep",
  "telefone",
  "email",
  "valor_imovel",
  "numero_documento",
];

/** Campos esperados por tipo de documento. */
export const CAMPOS_POR_TIPO: Record<TipoDocumentoScan, string[]> = {
  rg: [
    "nome_completo",
    "numero_documento",
    "tipo_documento_identidade",
    "orgao_expedidor",
    "uf_expedicao",
    "data_expedicao",
    "data_nascimento",
    "sexo",
    "nacionalidade",
    "naturalidade",
    "nome_mae",
    "nome_pai",
    "cpf_cnpj",
  ],
  cnh: [
    "nome_completo",
    "numero_documento",
    "tipo_documento_identidade",
    "orgao_expedidor",
    "uf_expedicao",
    "data_expedicao",
    "data_nascimento",
    "sexo",
    "nacionalidade",
    "naturalidade",
    "nome_mae",
    "nome_pai",
    "cpf_cnpj",
  ],
  cpf: ["nome_completo", "cpf_cnpj", "data_nascimento", "nome_mae"],
  comprovante_renda: ["nome_completo", "profissao", "empresa", "renda_mensal"],
  comprovante_residencia: ["endereco", "cep", "bairro", "cidade", "uf"],
  certidao_casamento: [
    "nome_conjuge",
    "cpf_conjuge",
    "data_nascimento_conjuge",
    "regime_casamento",
    "estado_civil",
  ],
  certidao_nascimento: [
    "nome_completo",
    "data_nascimento",
    "nome_mae",
    "nome_pai",
    "naturalidade",
  ],
  matricula_imovel: [
    "numero_matricula",
    "cartorio",
    "comarca",
    "uf_imovel",
    "proprietario",
    "cpf_proprietario",
    "estado_civil_proprietario",
    "nome_conjuge",
    "cpf_conjuge",
    "regime_casamento",
    "tipo_imovel",
    "endereco_imovel",
    "numero_imovel",
    "complemento_imovel",
    "bairro_imovel",
    "cidade_imovel",
    "cep_imovel",
    "area_terreno",
    "area_construida",
    "area_privativa",
    "fracao_ideal",
    "inscricao_imobiliaria",
    "valor_imovel",
    "onus_gravames",
    "alienacao_fiduciaria",
    "data_registro",
    "ultimo_registro",
  ],

  iptu: ["valor_imovel", "endereco_imovel", "cep_imovel", "inscricao_imobiliaria"],
  extrato_bancario: ["nome_completo", "banco_conta", "agencia", "conta_corrente"],
  outro: CAMPOS_ESPERADOS,
};

export function camposEsperadosDoTipo(tipo: string | null | undefined): string[] {
  return ehTipoConhecido(tipo) ? CAMPOS_POR_TIPO[tipo] : CAMPOS_ESPERADOS;
}

/** Rótulos legíveis por campo (nunca exibir o slug ao usuário). */
export const CAMPO_LABEL: Record<string, string> = {
  nome_completo: "Nome completo",
  cpf_cnpj: "CPF / CNPJ",
  rg: "RG",
  numero_documento: "Número do documento",
  tipo_documento_identidade: "Tipo do documento de identidade",
  orgao_expedidor: "Órgão expedidor",
  uf_expedicao: "UF de expedição",
  data_expedicao: "Data de expedição",
  data_nascimento: "Data de nascimento",
  sexo: "Sexo",
  nacionalidade: "Nacionalidade",
  naturalidade: "Naturalidade",
  nome_mae: "Nome da mãe",
  nome_pai: "Nome do pai",
  profissao: "Profissão",
  empresa: "Empresa",
  renda_mensal: "Renda mensal",
  estado_civil: "Estado civil",
  endereco: "Endereço",
  cep: "CEP",
  bairro: "Bairro",
  cidade: "Cidade",
  uf: "UF",
  telefone: "Telefone",
  email: "E-mail",
  nome_conjuge: "Nome do cônjuge",
  cpf_conjuge: "CPF do cônjuge",
  data_nascimento_conjuge: "Data de nascimento do cônjuge",
  regime_casamento: "Regime de casamento",
  numero_matricula: "Número da matrícula",
  cartorio: "Cartório",
  comarca: "Comarca",
  uf_imovel: "UF do imóvel",
  proprietario: "Proprietário",
  area_terreno: "Área do terreno",
  area_construida: "Área construída",
  onus_gravames: "Ônus e gravames",
  data_registro: "Data do registro",
  endereco_imovel: "Endereço do imóvel",
  cep_imovel: "CEP do imóvel",
  inscricao_imobiliaria: "Inscrição imobiliária",
  cpf_proprietario: "CPF do proprietário",
  estado_civil_proprietario: "Estado civil do proprietário",
  tipo_imovel: "Tipo do imóvel",
  numero_imovel: "Número do imóvel",
  complemento_imovel: "Complemento do imóvel",
  bairro_imovel: "Bairro do imóvel",
  cidade_imovel: "Cidade do imóvel",
  area_privativa: "Área privativa",
  fracao_ideal: "Fração ideal",
  alienacao_fiduciaria: "Alienação fiduciária",
  ultimo_registro: "Último registro / averbação",

  valor_imovel: "Valor do imóvel",
  banco_conta: "Banco",
  agencia: "Agência",
  conta_corrente: "Conta corrente",
};

export function rotuloCampo(campo: string): string {
  return CAMPO_LABEL[campo] ?? campo.replace(/_/g, " ");
}

export type DestinoCampo =
  | {
      tipo: "coluna";
      coluna: string;
      formato?: "texto" | "numero" | "data" | "estado_civil" | "regime_casamento" | "documento";
    }
  | { tipo: "matricula"; chave: string }
  | { tipo: "nenhum" };

/** Para onde cada campo extraído pode ir na tabela `clientes`. */
export const DESTINO_CAMPO: Record<string, DestinoCampo> = {
  nome_completo: { tipo: "coluna", coluna: "nome" },
  cpf_cnpj: { tipo: "coluna", coluna: "documento", formato: "documento" },
  rg: { tipo: "coluna", coluna: "numero_documento" },
  numero_documento: { tipo: "coluna", coluna: "numero_documento" },
  tipo_documento_identidade: { tipo: "coluna", coluna: "tipo_documento_identidade" },
  orgao_expedidor: { tipo: "coluna", coluna: "orgao_expedidor" },
  uf_expedicao: { tipo: "coluna", coluna: "uf_expedicao" },
  data_expedicao: { tipo: "coluna", coluna: "data_expedicao", formato: "data" },
  data_nascimento: { tipo: "coluna", coluna: "data_nascimento", formato: "data" },
  sexo: { tipo: "coluna", coluna: "sexo" },
  nacionalidade: { tipo: "coluna", coluna: "nacionalidade" },
  naturalidade: { tipo: "coluna", coluna: "naturalidade" },
  nome_mae: { tipo: "coluna", coluna: "mae" },
  nome_pai: { tipo: "coluna", coluna: "pai" },
  profissao: { tipo: "coluna", coluna: "profissao" },
  empresa: { tipo: "coluna", coluna: "empresa" },
  renda_mensal: { tipo: "coluna", coluna: "renda_total_declarada", formato: "numero" },
  estado_civil: { tipo: "coluna", coluna: "estado_civil", formato: "estado_civil" },
  email: { tipo: "coluna", coluna: "email" },
  telefone: { tipo: "coluna", coluna: "telefone_celular", formato: "documento" },
  banco_conta: { tipo: "coluna", coluna: "banco_conta" },
  agencia: { tipo: "coluna", coluna: "agencia" },
  conta_corrente: { tipo: "coluna", coluna: "conta_corrente" },

  // Cônjuge
  nome_conjuge: { tipo: "coluna", coluna: "conjuge_nome" },
  cpf_conjuge: { tipo: "coluna", coluna: "conjuge_cpf", formato: "documento" },
  data_nascimento_conjuge: { tipo: "coluna", coluna: "conjuge_data_nascimento", formato: "data" },
  regime_casamento: { tipo: "coluna", coluna: "regime_casamento", formato: "regime_casamento" },

  // Imóvel
  valor_imovel: { tipo: "coluna", coluna: "imovel_valor", formato: "numero" },
  endereco_imovel: { tipo: "coluna", coluna: "imovel_logradouro" },
  cep_imovel: { tipo: "coluna", coluna: "imovel_cep", formato: "documento" },
  uf_imovel: { tipo: "coluna", coluna: "imovel_uf" },

  // Matrícula (jsonb clientes.imovel_matricula — mesclado, nunca sobrescrito por inteiro)
  numero_matricula: { tipo: "matricula", chave: "numero_matricula" },
  cartorio: { tipo: "matricula", chave: "cartorio" },
  comarca: { tipo: "matricula", chave: "comarca" },
  proprietario: { tipo: "matricula", chave: "proprietario" },
  area_terreno: { tipo: "matricula", chave: "area_terreno" },
  area_construida: { tipo: "matricula", chave: "area_construida" },
  onus_gravames: { tipo: "matricula", chave: "onus_gravames" },
  data_registro: { tipo: "matricula", chave: "data_registro" },
  inscricao_imobiliaria: { tipo: "matricula", chave: "inscricao_imobiliaria" },

  // Sem coluna correspondente no cadastro do cliente (endereço pessoal fica em outra tabela)
  endereco: { tipo: "nenhum" },
  cep: { tipo: "nenhum" },
  bairro: { tipo: "nenhum" },
  cidade: { tipo: "nenhum" },
  uf: { tipo: "nenhum" },
};

export function destinoDoCampo(campo: string): DestinoCampo {
  return DESTINO_CAMPO[campo] ?? { tipo: "nenhum" };
}

export const ESTADOS_CIVIS = [
  "solteiro",
  "casado",
  "uniao_estavel",
  "divorciado",
  "viuvo",
] as const;

export const REGIMES_CASAMENTO = [
  "comunhao_parcial",
  "comunhao_universal",
  "separacao_total",
  "participacao_final",
  "nao_aplicavel",
] as const;

function semAcento(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function normalizarEstadoCivil(valor: string): string | null {
  const v = semAcento(valor);
  if (v.includes("solteir")) return "solteiro";
  if (v.includes("uniao")) return "uniao_estavel";
  if (v.includes("casad")) return "casado";
  if (v.includes("divorc") || v.includes("separad")) return "divorciado";
  if (v.includes("viuv")) return "viuvo";
  return null;
}

export function normalizarRegimeCasamento(valor: string): string | null {
  const v = semAcento(valor);
  if (v.includes("universal")) return "comunhao_universal";
  if (v.includes("parcial")) return "comunhao_parcial";
  if (v.includes("separacao") || v.includes("separaç")) return "separacao_total";
  if (v.includes("participacao")) return "participacao_final";
  if (v.includes("nao aplic")) return "nao_aplicavel";
  return null;
}

/** Converte "R$ 1.234,56" / "1234.56" para número; retorna null se não der. */
export function normalizarNumero(valor: string): number | null {
  const limpo = valor.replace(/[^\d,.-]/g, "").trim();
  if (!limpo) return null;
  const temVirgula = limpo.includes(",");
  const norm = temVirgula ? limpo.replace(/\./g, "").replace(",", ".") : limpo;
  const n = Number(norm);
  return Number.isFinite(n) ? n : null;
}

/** Converte "12/03/1985" ou "1985-03-12" para ISO yyyy-mm-dd; null se inválido. */
export function normalizarData(valor: string): string | null {
  const v = valor.trim();
  let m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return `${m[1]}-${m[2]}-${m[3]}`;
  m = v.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})/);
  if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  return null;
}

/** Converte o valor de texto extraído para o formato aceito pela coluna destino. */
export function converterValor(
  campo: string,
  valor: string,
): { ok: true; valor: string | number | null } | { ok: false; motivo: string } {
  const destino = destinoDoCampo(campo);
  const bruto = valor.trim();
  if (!bruto) return { ok: false, motivo: "Valor vazio." };
  if (destino.tipo === "matricula") return { ok: true, valor: bruto };
  if (destino.tipo === "nenhum") return { ok: false, motivo: "Campo sem destino no cadastro." };

  switch (destino.formato) {
    case "numero": {
      const n = normalizarNumero(bruto);
      return n === null ? { ok: false, motivo: "Número inválido." } : { ok: true, valor: n };
    }
    case "data": {
      const d = normalizarData(bruto);
      return d === null ? { ok: false, motivo: "Data inválida." } : { ok: true, valor: d };
    }
    case "documento": {
      const d = bruto.replace(/\D+/g, "");
      return d ? { ok: true, valor: d } : { ok: false, motivo: "Documento inválido." };
    }
    case "estado_civil": {
      const e = normalizarEstadoCivil(bruto);
      return e === null ? { ok: false, motivo: "Estado civil não reconhecido." } : { ok: true, valor: e };
    }
    case "regime_casamento": {
      const r = normalizarRegimeCasamento(bruto);
      return r === null ? { ok: false, motivo: "Regime não reconhecido." } : { ok: true, valor: r };
    }
    default:
      return { ok: true, valor: bruto };
  }
}

/** Faixa de confiança usada na UI e nas regras de marcação padrão. */
export function faixaConfianca(c: number | null | undefined): "alta" | "media" | "revisar" {
  const v = c ?? 0;
  if (v >= 0.9) return "alta";
  if (v >= 0.6) return "media";
  return "revisar";
}

export const CONFIANCA_LABEL: Record<"alta" | "media" | "revisar", string> = {
  alta: "Alta",
  media: "Média",
  revisar: "Revisar",
};

/**
 * Comparação tolerante para detectar conflito real entre o valor já cadastrado
 * e o valor extraído: ignora pontuação, acentos, espaços e caixa. Ex.: o CPF
 * "429.914.268-37" é o MESMO valor de "42991426837" — não é conflito.
 */
export function valoresEquivalentes(a: string | null | undefined, b: string | null | undefined): boolean {
  const norm = (v: string | null | undefined) => {
    const t = String(v ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .trim();
    if (!t) return "";
    const digitos = t.replace(/\D+/g, "");
    // Valores essencialmente numéricos (documentos, telefones, CEP, datas):
    // compara apenas os dígitos.
    if (digitos.length >= 6 && t.replace(/[^a-z]/g, "").length === 0) return digitos;
    return t.replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  };
  return norm(a) === norm(b);
}
