/**
 * PDF profissional da Base de Conhecimento do Consultor IA.
 * Cabeçalho institucional Agilliza, painel de contexto, sumário e blocos
 * de pergunta/resposta com palavras-chave e fontes citadas.
 */
import { jsPDF } from "jspdf";
import { drawBrandHeader } from "@/lib/relatorios/report-pdf";
import { getPdfPalette } from "@/lib/relatorios/pdf-theme";

export interface ItemBasePdf {
  pergunta: string;
  resposta: string;
  palavras_chave: string[];
  fontes: { id: string; titulo: string; categoria: string }[];
  sem_resposta?: boolean;
  created_at: string;
}

const HEADER_H = 78;
const MARGIN = 40;

/** Converte markdown simples em texto limpo para o PDF. */
function limparMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, (b) => b.replace(/```/g, "").trim())
    .replace(/^\s{0,3}#{1,6}\s*/gm, "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .replace(/\[(.+?)\]\((.+?)\)/g, "$1")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function fmtData(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
  } catch {
    return "—";
  }
}

/** Gera o PDF da base de conhecimento (download direto). */
export function exportarBaseConhecimentoPdf(opcoes: {
  itens: ItemBasePdf[];
  contexto?: string;
  modo?: "download" | "print";
}) {
  const { itens, contexto = "Base completa", modo = "download" } = opcoes;
  const P = getPdfPalette();
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const contentW = pageW - MARGIN * 2;

  const pintarFundo = () => {
    if (!P.pageBg) return;
    doc.setFillColor(P.pageBg);
    doc.rect(0, 0, pageW, pageH, "F");
  };

  const novaPagina = () => {
    doc.addPage();
    pintarFundo();
    drawBrandHeader(doc, pageW, HEADER_H, "Base de Conhecimento", "Consultor IA · Agilliza");
    return HEADER_H + 30;
  };

  pintarFundo();
  drawBrandHeader(doc, pageW, HEADER_H, "Base de Conhecimento", "Consultor IA · Agilliza");

  let y = HEADER_H + 26;

  // Painel de contexto
  const emitido = new Date().toLocaleString("pt-BR", { timeZone: "America/Sao_Paulo" });
  const info: { label: string; value: string }[] = [
    { label: "Escopo", value: contexto },
    { label: "Registros", value: String(itens.length) },
    { label: "Emitido em", value: emitido },
  ];
  const boxH = 46;
  doc.setFillColor(P.card);
  doc.setDrawColor(P.borda);
  doc.setLineWidth(0.75);
  doc.roundedRect(MARGIN, y, contentW, boxH, 5, 5, "FD");
  doc.setFillColor(P.coral);
  doc.rect(MARGIN, y + 9, 3, boxH - 18, "F");
  const colW = (contentW - 28) / info.length;
  info.forEach((it, i) => {
    const cx = MARGIN + 16 + i * colW;
    if (i > 0) {
      doc.setDrawColor(P.borda);
      doc.setLineWidth(0.5);
      doc.line(cx - 8, y + 12, cx - 8, y + boxH - 12);
    }
    doc.setTextColor(P.cinza);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text(it.label.toUpperCase(), cx, y + 18);
    doc.setTextColor(P.destaque);
    doc.setFontSize(10.5);
    doc.text(String(it.value), cx, y + 33, { maxWidth: colW - 14 });
  });
  y += boxH + 22;

  // Blocos de pergunta/resposta
  itens.forEach((it, idx) => {
    const numero = String(idx + 1).padStart(2, "0");
    const perguntaLinhas = doc.splitTextToSize(it.pergunta, contentW - 46) as string[];
    const respostaLinhas = doc.splitTextToSize(limparMarkdown(it.resposta), contentW - 46) as string[];
    const chavesTxt = it.palavras_chave.length ? it.palavras_chave.join("  ·  ") : "";
    const fontesTxt = it.fontes.length
      ? it.fontes.map((f) => `${f.categoria} — ${f.titulo}`).join("  |  ")
      : "";
    const chavesLinhas = chavesTxt ? (doc.splitTextToSize(chavesTxt, contentW - 46) as string[]) : [];
    const fontesLinhas = fontesTxt ? (doc.splitTextToSize(fontesTxt, contentW - 46) as string[]) : [];

    const altura =
      20 +
      perguntaLinhas.length * 13 +
      10 +
      respostaLinhas.length * 11.5 +
      (chavesLinhas.length ? chavesLinhas.length * 10 + 8 : 0) +
      (fontesLinhas.length ? fontesLinhas.length * 10 + 6 : 0) +
      18;

    if (y + Math.min(altura, pageH - HEADER_H - 90) > pageH - 60) y = novaPagina();

    const topo = y;

    // Numeração em coluna lateral
    doc.setTextColor(P.coral);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(15);
    doc.text(numero, MARGIN, topo + 13);

    const x = MARGIN + 34;
    let cy = topo;

    // Pergunta
    doc.setTextColor(P.destaque);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10.5);
    perguntaLinhas.forEach((l) => {
      if (cy > pageH - 70) {
        cy = novaPagina();
      }
      doc.text(l, x, cy + 11);
      cy += 13;
    });

    // Metadados da pergunta
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(P.cinza);
    doc.text(
      `${fmtData(it.created_at)}${it.sem_resposta ? "  ·  fora da base curada" : ""}`,
      x,
      cy + 9,
    );
    cy += 16;

    // Resposta
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.6);
    doc.setTextColor(P.texto);
    respostaLinhas.forEach((l) => {
      if (cy > pageH - 62) cy = novaPagina();
      doc.text(l, x, cy + 9);
      cy += 11.5;
    });

    if (chavesLinhas.length) {
      cy += 6;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.setTextColor(P.azul);
      chavesLinhas.forEach((l) => {
        if (cy > pageH - 62) cy = novaPagina();
        doc.text(l, x, cy + 8);
        cy += 10;
      });
    }

    if (fontesLinhas.length) {
      cy += 4;
      doc.setFont("helvetica", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(P.cinza);
      fontesLinhas.forEach((l) => {
        if (cy > pageH - 62) cy = novaPagina();
        doc.text(`Fonte: ${l}`, x, cy + 8);
        cy += 10;
      });
    }

    // Filete lateral do bloco (apenas quando não quebrou de página)
    if (cy > topo) {
      doc.setDrawColor(P.borda);
      doc.setLineWidth(0.5);
      doc.line(MARGIN + 22, topo + 2, MARGIN + 22, cy + 4);
    }

    y = cy + 18;

    // Separador entre blocos
    if (idx < itens.length - 1 && y < pageH - 70) {
      doc.setDrawColor(P.borda);
      doc.setLineWidth(0.5);
      doc.line(MARGIN, y - 9, pageW - MARGIN, y - 9);
    }
  });

  // Rodapé com paginação
  const total = doc.getNumberOfPages();
  for (let p = 1; p <= total; p++) {
    doc.setPage(p);
    const fy = pageH - 22;
    doc.setDrawColor(P.borda);
    doc.setLineWidth(0.5);
    doc.line(MARGIN, fy, pageW - MARGIN, fy);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(P.cinza);
    doc.text(`Agilliza · Crédito Imobiliário  —  Emitido em ${emitido}`, MARGIN, fy + 12);
    doc.text(`Página ${p} de ${total}`, pageW - MARGIN, fy + 12, { align: "right" });
  }

  if (modo === "print") {
    doc.autoPrint();
    const url = doc.output("bloburl") as unknown as string;
    const win = window.open(url, "_blank");
    if (win) return;
  }

  doc.save(`agilliza-base-conhecimento-${new Date().toISOString().slice(0, 10)}.pdf`);
}
