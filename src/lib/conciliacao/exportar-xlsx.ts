/**
 * Geração de planilhas consolidadas e formatadas (XLSX) do módulo de
 * Comparativo de dados. Executa no navegador.
 */
import * as XLSX from "xlsx";

export type TipoColuna = "texto" | "brl" | "data" | "int";

export interface ColunaXlsx {
  header: string;
  key: string;
  tipo?: TipoColuna;
  width?: number;
}

export interface AbaXlsx {
  nome: string;
  colunas: ColunaXlsx[];
  linhas: Record<string, unknown>[];
}

const FORMATO: Record<TipoColuna, string | undefined> = {
  texto: undefined,
  brl: 'R$ #,##0.00;[Red]-R$ #,##0.00;"—"',
  data: "dd/mm/yyyy",
  int: "#,##0",
};

function larguraAuto(col: ColunaXlsx, linhas: Record<string, unknown>[]): number {
  if (col.width) return col.width;
  const maior = linhas.reduce((max, l) => {
    const v = l[col.key];
    const s = v == null ? "" : String(v);
    return Math.max(max, s.length);
  }, col.header.length);
  return Math.min(52, Math.max(10, maior + 2));
}

function celula(valor: unknown, tipo: TipoColuna): XLSX.CellObject {
  if (valor == null || valor === "") return { t: "s", v: "—" };
  if (tipo === "brl" || tipo === "int") {
    const n = Number(valor);
    if (!Number.isFinite(n)) return { t: "s", v: String(valor) };
    return { t: "n", v: n, z: FORMATO[tipo] };
  }
  if (tipo === "data") {
    const s = String(valor).slice(0, 10);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (m) return { t: "d", v: new Date(`${s}T12:00:00Z`), z: FORMATO.data };
    return { t: "s", v: String(valor) };
  }
  return { t: "s", v: String(valor) };
}

function montarAba(aba: AbaXlsx): XLSX.WorkSheet {
  const ws: XLSX.WorkSheet = {};
  const nLin = aba.linhas.length + 1;
  const nCol = aba.colunas.length;

  aba.colunas.forEach((col, c) => {
    ws[XLSX.utils.encode_cell({ r: 0, c })] = { t: "s", v: col.header };
  });
  aba.linhas.forEach((linha, r) => {
    aba.colunas.forEach((col, c) => {
      ws[XLSX.utils.encode_cell({ r: r + 1, c })] = celula(linha[col.key], col.tipo ?? "texto");
    });
  });

  ws["!ref"] = XLSX.utils.encode_range({
    s: { r: 0, c: 0 },
    e: { r: Math.max(0, nLin - 1), c: Math.max(0, nCol - 1) },
  });
  ws["!cols"] = aba.colunas.map((col) => ({ wch: larguraAuto(col, aba.linhas) }));
  ws["!rows"] = [{ hpt: 22 }];
  if (aba.linhas.length) {
    ws["!autofilter"] = { ref: ws["!ref"] as string };
  }
  // Congela a linha de cabeçalho ao abrir.
  (ws as Record<string, unknown>)["!freeze"] = "A2";
  return ws;
}

/** Aba de capa/resumo com pares rótulo → valor. */
export function abaResumo(
  titulo: string,
  itens: { rotulo: string; valor: string | number }[],
): AbaXlsx {
  return {
    nome: "Resumo",
    colunas: [
      { header: titulo, key: "rotulo", width: 38 },
      { header: "Valor", key: "valor", width: 26 },
    ],
    linhas: itens.map((i) => ({ rotulo: i.rotulo, valor: i.valor })),
  };
}

/** Escreve o arquivo consolidado, ignorando abas sem linhas. */
export function baixarXlsx(nomeArquivo: string, abas: AbaXlsx[]) {
  const wb = XLSX.utils.book_new();
  for (const aba of abas) {
    XLSX.utils.book_append_sheet(wb, montarAba(aba), aba.nome.slice(0, 31));
  }
  XLSX.writeFile(wb, nomeArquivo.endsWith(".xlsx") ? nomeArquivo : `${nomeArquivo}.xlsx`);
}
