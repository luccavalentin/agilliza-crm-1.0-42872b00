import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { AGILLIZA_LOGO_LIGHT, AGILLIZA_LOGO_RATIO } from "@/lib/relatorios/brand-logo";
import { resolveBancoBrand } from "@/lib/relatorios/banco-brand";
import { CHECKLISTS_BANCOS } from "@/lib/formularios/checklists.functions";

export async function gerarChecklistBancoPDF(bancoId: string, clienteNome?: string, docsCustom?: string[]) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const MARGIN = 20;

  const checklist = docsCustom ? { docs: docsCustom } : CHECKLISTS_BANCOS[bancoId];
  if (!checklist) throw new Error("Checklist não encontrado para este banco.");

  const bancoBrand = resolveBancoBrand(bancoId);
  
  // Cores da Agilliza
  const AGILLIZA_NAVY = "#0F172A";
  const AGILLIZA_CORAL = "#F97316";

  // Header Agilliza (Azul Marinho)
  doc.setFillColor(AGILLIZA_NAVY);
  doc.rect(0, 0, pageW, 40, "F");
  
  // Linha Coral (Agilliza)
  doc.setFillColor(AGILLIZA_CORAL);
  doc.rect(0, 40, pageW, 2, "F");

  // Logo Agilliza (Superior Esquerda)
  const logoH = 18;
  const logoW = logoH * AGILLIZA_LOGO_RATIO;
  try {
    doc.addImage(AGILLIZA_LOGO_LIGHT, "PNG", MARGIN, 11, logoW, logoH);
  } catch (e) {}

  // Título e Nome do Banco (Superior Direita)
  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Checklist de Documentação", pageW - MARGIN, 22, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(bancoId.toUpperCase(), pageW - MARGIN, 28, { align: "right" });

  let y = 55;

  // Descrição
  doc.setTextColor("#64748B");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Relação de documentos necessários para análise de crédito imobiliário.", MARGIN, y);
  y += 10;

  // Logo do Banco (Opcional, se existir)
  if (bancoBrand?.logo) {
    try {
      const bLogoH = 8;
      const bLogoW = bLogoH * (bancoBrand.ratio || 1);
      doc.addImage(bancoBrand.logo, "PNG", MARGIN, y, bLogoW, bLogoH);
      y += 12;
    } catch (e) {}
  }

  // Dados do Cliente
  if (clienteNome) {
    doc.setTextColor(AGILLIZA_NAVY);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Cliente: ${clienteNome.toUpperCase()}`, MARGIN, y);
    y += 8;
  }

  // Tabela de Documentos (Cores da Agilliza)
  autoTable(doc, {
    startY: y,
    margin: { left: MARGIN, right: MARGIN },
    head: [["", "Documento Necessário", "Obrigatório"]],
    body: checklist.docs.map(doc => [
      "[  ]", 
      doc,
      "Sim"
    ]),
    theme: "striped",
    headStyles: {
      fillColor: AGILLIZA_NAVY,
      textColor: "#FFFFFF",
      fontSize: 10,
      fontStyle: "bold"
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 5,
      textColor: "#334155"
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      2: { cellWidth: 30, halign: "center" }
    },
    alternateRowStyles: {
      fillColor: "#F8FAFC"
    }
  });

  // Rodapé
  doc.setFontSize(8);
  doc.setTextColor("#94A3B8");
  const msg = "Documento gerado automaticamente pelo sistema Agilliza. Sujeito a alterações conforme regras do banco.";
  doc.text(msg, MARGIN, pageH - 15);

  // Download
  const filename = `Checklist - ${bancoId.toUpperCase()} - ${clienteNome || "Documentos"}.pdf`;
  doc.save(filename);
}

