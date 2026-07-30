/**
 * Modelos de Papel Timbrado — 10 variações institucionais Agilliza.
 *
 * 5 modelos corporativos (faixa/hairline/borda-lateral) e 5 modelos da linha
 * "Real" — inspirados em cartas régias antigas: moldura ornamental dupla,
 * cantos trabalhados, brasão/selo em marca d'água e tipografia serifada.
 * Todos incluem marca d'água central e foram calibrados para impressão em
 * papel cartão (fundo levemente marfim nos modelos Real).
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
    nome: "Institucional Azul",
    descricao: "Faixa azul profundo com detalhe coral. Padrão Agilliza.",
    primaria: "#000F9F",
    primariaEscura: "#000A70",
    destaque: "#F5333F",
    destaqueTexto: "#000F9F",
    marcaDagua: "#000F9F",
    estilo: "faixa",
    rodape: "Agilliza · Crédito Imobiliário — Documento oficial",
  },
  {
    id: "executivo",
    nome: "Executivo Grafite",
    descricao: "Minimalismo em grafite com acento azul discreto.",
    primaria: "#1F2937",
    primariaEscura: "#111827",
    destaque: "#3B82F6",
    destaqueTexto: "#111827",
    marcaDagua: "#1F2937",
    estilo: "hairline",
    rodape: "Agilliza · Correspondente de Crédito Imobiliário",
  },
  {
    id: "premium",
    nome: "Premium Coral",
    descricao: "Azul institucional profundo com acento coral — comunicados premium.",
    primaria: "#000A70",
    primariaEscura: "#00074A",
    destaque: "#F5333F",
    destaqueTexto: "#000A70",
    marcaDagua: "#000A70",
    estilo: "faixa",
    rodape: "Agilliza · Assessoria Premium em Crédito",
  },
  {
    id: "corporativo",
    nome: "Corporativo Grafite",
    descricao: "Grafite sóbrio com borda azul institucional — sofisticação corporativa.",
    primaria: "#1F2937",
    primariaEscura: "#0B0B0F",
    destaque: "#000F9F",
    destaqueTexto: "#0B0B0F",
    marcaDagua: "#1F2937",
    estilo: "borda-lateral",
    rodape: "Agilliza · Soluções Corporativas de Crédito",
  },
  {
    id: "editorial",
    nome: "Editorial Tinta",
    descricao: "Preto e branco tipográfico, hairlines finas e marca d'água ampla.",
    primaria: "#0B0B0F",
    primariaEscura: "#000000",
    destaque: "#0B0B0F",
    destaqueTexto: "#0B0B0F",
    marcaDagua: "#0B0B0F",
    estilo: "hairline",
    rodape: "Agilliza · Correspondência Institucional",
  },

  /* ——— Linha Real — carta régia moderna, para papel cartão ——— */
  {
    id: "real-pergaminho",
    nome: "Real Pergaminho",
    descricao: "Marfim envelhecido, moldura dupla dourada e brasão em marca d'água.",
    primaria: "#6B4E1E",
    primariaEscura: "#4A3512",
    destaque: "#B08D3F",
    destaqueTexto: "#4A3512",
    marcaDagua: "#8A6A2A",
    estilo: "real",
    ornamento: "brasao",
    fundo: "#FBF7EE",
    metalico: "#C6A253",
    lema: "Fides · Diligentia · Domus",
    rodape: "Agilliza · Correspondência Régia — Documento oficial",
  },
  {
    id: "real-bordo",
    nome: "Real Bordô & Ouro",
    descricao: "Bordô profundo com filetes em ouro e coroa heráldica central.",
    primaria: "#6B1220",
    primariaEscura: "#480B16",
    destaque: "#C6A253",
    destaqueTexto: "#6B1220",
    marcaDagua: "#6B1220",
    estilo: "real",
    ornamento: "coroa",
    fundo: "#FCF8F4",
    metalico: "#C6A253",
    lema: "Honor · Fortitudo · Fides",
    rodape: "Agilliza · Chancelaria de Crédito Imobiliário",
  },
  {
    id: "real-imperial",
    nome: "Real Azul Imperial",
    descricao: "Azul institucional em veste régia, selo lacrado e serifas clássicas.",
    primaria: "#000A70",
    primariaEscura: "#00062F",
    destaque: "#C6A253",
    destaqueTexto: "#000A70",
    marcaDagua: "#000A70",
    estilo: "real",
    ornamento: "selo",
    fundo: "#F9FAFD",
    metalico: "#B99A4E",
    lema: "Ordo · Ratio · Confidentia",
    rodape: "Agilliza · Gabinete Institucional",
  },
  {
    id: "real-esmeralda",
    nome: "Real Esmeralda",
    descricao: "Verde esmeralda com louros dourados — sobriedade patrimonial.",
    primaria: "#0B4F3A",
    primariaEscura: "#06301F",
    destaque: "#C6A253",
    destaqueTexto: "#0B4F3A",
    marcaDagua: "#0B4F3A",
    estilo: "real",
    ornamento: "laurel",
    fundo: "#F7FBF8",
    metalico: "#BE9C4C",
    lema: "Patrimonium · Cura · Futurum",
    rodape: "Agilliza · Patrimônio e Crédito Imobiliário",
  },
  {
    id: "real-onix",
    nome: "Real Ônix & Ouro",
    descricao: "Ônix absoluto, monograma gravado e ouro velho — máxima etiqueta.",
    primaria: "#111114",
    primariaEscura: "#000000",
    destaque: "#C6A253",
    destaqueTexto: "#111114",
    marcaDagua: "#111114",
    estilo: "real",
    ornamento: "monograma",
    fundo: "#FAF9F7",
    metalico: "#A98B45",
    lema: "Silentium · Rigor · Excellentia",
    rodape: "Agilliza · Correspondência Reservada",
  },
];

export function getPapelTimbradoModelo(id: PapelTimbradoModeloId | undefined | null): PapelTimbradoModelo {
  return PAPEL_TIMBRADO_MODELOS.find((m) => m.id === id) ?? PAPEL_TIMBRADO_MODELOS[0];
}
