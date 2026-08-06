/**
 * Modelos de Papel Timbrado — 10 variações institucionais Agilliza.
 *
 * 5 modelos corporativos (Minimalista, Executivo, Premium, Moderno, Clássico) e 5 modelos da linha
 * "Real" — inspirados em alta nobreza: moldura ornamental refinada,
 * cantos trabalhados em ouro, brasão/selo em marca d'água e tipografia serifada de luxo.
 * Todos incluem marca d'água central e foram calibrados para máxima elegância corporativa.
 */
export type PapelTimbradoModeloId =
  | "institucional"
  | "executivo"
  | "premium"
  | "corporativo"
  | "editorial"
  | "real-pergaminho"
  | "real-bordo"
  | "real-imperial"
  | "real-esmeralda"
  | "real-onix";

/** Ornamento da linha Real (define o desenho da moldura e do selo). */
export type OrnamentoReal = "brasao" | "coroa" | "selo" | "laurel" | "monograma";

export interface PapelTimbradoModelo {
  id: PapelTimbradoModeloId;
  nome: string;
  descricao: string;
  /** Faixa/acento principal (RGB hex). */
  primaria: string;
  /** Cor mais escura da faixa (para gradiente sutil). */
  primariaEscura: string;
  /** Cor de destaque (linha fina abaixo do cabeçalho, títulos internos). */
  destaque: string;
  /** Cor de texto de destaque (títulos/rótulos no corpo). */
  destaqueTexto: string;
  /** Tom da marca d'água (aplicada em opacidade baixa). */
  marcaDagua: string;
  /** Estilo do cabeçalho. */
  estilo: "faixa" | "hairline" | "borda-lateral" | "real";
  /** Rótulo do rodapé. */
  rodape: string;
  /** Ornamento do selo/moldura (apenas estilo "real"). */
  ornamento?: OrnamentoReal;
  /** Fundo do papel (marfim/pergaminho) — apenas estilo "real". */
  fundo?: string;
  /** Cor dourada/metálica dos filetes da moldura — apenas estilo "real". */
  metalico?: string;
  /** Legenda heráldica impressa sob o brasão. */
  lema?: string;
}

export const PAPEL_TIMBRADO_MODELOS: PapelTimbradoModelo[] = [
  {
    id: "institucional",
    nome: "Minimalista Agilliza",
    descricao: "Design limpo com foco na marca. Faixa azul e detalhes em coral vibrante.",
    primaria: "#000F9F",
    primariaEscura: "#000A70",
    destaque: "#F5333F",
    destaqueTexto: "#000F9F",
    marcaDagua: "#000F9F",
    estilo: "hairline",
    rodape: "Agilliza · Soluções em Crédito Imobiliário",
  },
  {
    id: "executivo",
    nome: "Executivo Moderno",
    descricao: "Sofisticação em tons de cinza com acentos azulados. Profissional e direto.",
    primaria: "#1F2937",
    primariaEscura: "#111827",
    destaque: "#3B82F6",
    destaqueTexto: "#111827",
    marcaDagua: "#1F2937",
    estilo: "faixa",
    rodape: "Agilliza · Correspondente Bancário Autorizado",
  },
  {
    id: "premium",
    nome: "Agilliza Premium",
    descricao: "Visual exclusivo para comunicados de alto impacto. Azul marinho e Coral.",
    primaria: "#000A70",
    primariaEscura: "#00074A",
    destaque: "#F5333F",
    destaqueTexto: "#000A70",
    marcaDagua: "#000A70",
    estilo: "borda-lateral",
    rodape: "Agilliza · Assessoria Especializada em Crédito",
  },
  {
    id: "corporativo",
    nome: "Corporativo Elite",
    descricao: "Forte identidade visual com bordas estruturadas e tipografia clara.",
    primaria: "#000F9F",
    primariaEscura: "#00074A",
    destaque: "#1F2937",
    destaqueTexto: "#000F9F",
    marcaDagua: "#1F2937",
    estilo: "faixa",
    rodape: "Agilliza · Gestão de Ativos e Crédito",
  },
  {
    id: "editorial",
    nome: "Clássico Agilliza",
    descricao: "Equilíbrio perfeito entre tradição e modernidade. Elegância atemporal.",
    primaria: "#0B0B0F",
    primariaEscura: "#000000",
    destaque: "#000F9F",
    destaqueTexto: "#0B0B0F",
    marcaDagua: "#000F9F",
    estilo: "hairline",
    rodape: "Agilliza · Excelência em Atendimento",
  },

  /* ——— Linha Real — carta régia moderna, para papel cartão ——— */
  {
    id: "real-pergaminho",
    nome: "Real Nobreza",
    descricao: "Luxo em tons marfim e dourado, com moldura artesanal e brasão real.",
    primaria: "#4A3512",
    primariaEscura: "#2A1F0B",
    destaque: "#C6A253",
    destaqueTexto: "#4A3512",
    marcaDagua: "#C6A253",
    estilo: "real",
    ornamento: "brasao",
    fundo: "#FFFDF5",
    metalico: "#D4AF37",
    lema: "EXCELÊNCIA · INTEGRIDADE · LAR",
    rodape: "Agilliza · Gabinete de Crédito Premium",
  },
  {
    id: "real-bordo",
    nome: "Real Majestoso",
    descricao: "Bordô Imperial combinado com detalhes em ouro velho para máxima distinção.",
    primaria: "#6B1220",
    primariaEscura: "#480B16",
    destaque: "#D4AF37",
    destaqueTexto: "#6B1220",
    marcaDagua: "#6B1220",
    estilo: "real",
    ornamento: "coroa",
    fundo: "#FEF9F5",
    metalico: "#D4AF37",
    lema: "HONRA · FORTALEZA · FÉ",
    rodape: "Agilliza · Chancelaria de Financiamento Imobiliário",
  },
  {
    id: "real-imperial",
    nome: "Real Gran Elite",
    descricao: "O azul profundo da Agilliza em uma moldura de gala com selo de cera dourado.",
    primaria: "#000A70",
    primariaEscura: "#00062F",
    destaque: "#D4AF37",
    destaqueTexto: "#000A70",
    marcaDagua: "#000A70",
    estilo: "real",
    ornamento: "selo",
    fundo: "#F7F9FF",
    metalico: "#D4AF37",
    lema: "ORDEM · RAZÃO · CONFIANÇA",
    rodape: "Agilliza · Documentação de Alta Relevância",
  },
  {
    id: "real-esmeralda",
    nome: "Real Prestígio",
    descricao: "Verde esmeralda profundo e ouro, evocando estabilidade e crescimento patrimonial.",
    primaria: "#0B4F3A",
    primariaEscura: "#06301F",
    destaque: "#D4AF37",
    destaqueTexto: "#0B4F3A",
    marcaDagua: "#0B4F3A",
    estilo: "real",
    ornamento: "laurel",
    fundo: "#F5FBF7",
    metalico: "#D4AF37",
    lema: "PATRIMÔNIO · CUIDADO · FUTURO",
    rodape: "Agilliza · Consultoria Patrimonial e Crédito",
  },
  {
    id: "real-onix",
    nome: "Real Soberano",
    descricao: "O poder do preto e dourado em uma peça de altíssima sofisticação corporativa.",
    primaria: "#111114",
    primariaEscura: "#000000",
    destaque: "#D4AF37",
    destaqueTexto: "#111114",
    marcaDagua: "#D4AF37",
    estilo: "real",
    ornamento: "monograma",
    fundo: "#FAF9F7",
    metalico: "#C5A048",
    lema: "DISCRIÇÃO · RIGOR · EXCELÊNCIA",
    rodape: "Agilliza · Correspondência de Alta Cúpula",
  },
];

export function getPapelTimbradoModelo(id: PapelTimbradoModeloId | undefined | null): PapelTimbradoModelo {
  return PAPEL_TIMBRADO_MODELOS.find((m) => m.id === id) ?? PAPEL_TIMBRADO_MODELOS[0];
}
