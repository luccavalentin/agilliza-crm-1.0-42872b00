import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import { AGILLIZA_LOGO_LIGHT, AGILLIZA_LOGO_RATIO } from "@/lib/relatorios/brand-logo";
import { resolveBancoBrand } from "@/lib/relatorios/banco-brand";
import { CHECKLISTS_BANCOS } from "@/lib/formularios/checklists.functions";

export async function gerarChecklistBancoPDF(bancoId: string, clienteNome?: string) {
  const doc = new jsPDF("p", "mm", "a4");
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const MARGIN = 20;

  const checklist = CHECKLISTS_BANCOS[bancoId];
  if (!checklist) throw new Error("Checklist não encontrado para este banco.");

  const bancoBrand = resolveBancoBrand(bancoId);
  const corBanco = bancoBrand?.cor || "#0F172A";

  // Header Agilliza (Azul)
  doc.setFillColor("#0F172A");
  doc.rect(0, 0, pageW, 40, "F");
  
  // Linha Coral
  doc.setFillColor("#F97316");
  doc.rect(0, 40, pageW, 2, "F");

  // Logo Agilliza
  const logoH = 20;
  const logoW = logoH * AGILLIZA_LOGO_RATIO;
  try {
    doc.addImage(AGILLIZA_LOGO_LIGHT, "PNG", MARGIN, 10, logoW, logoH);
  } catch (e) {}

  doc.setTextColor("#FFFFFF");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("Checklist de Documentação", pageW - MARGIN, 22, { align: "right" });
  
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(bancoBrand?.nome || bancoId.toUpperCase(), pageW - MARGIN, 28, { align: "right" });

  let y = 55;

  // Dados do Cliente
  if (clienteNome) {
    doc.setTextColor("#0F172A");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Cliente: ${clienteNome.toUpperCase()}`, MARGIN, y);
    y += 10;
  }

  doc.setTextColor("#64748B");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Relacão de documentos necessários para análise de crédito imobiliário.", MARGIN, y);
  y += 10;

  // Tabela de Documentos
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
      fillColor: corBanco,
      textColor: "#FFFFFF",
      fontSize: 10,
      fontStyle: "bold"
    },
    bodyStyles: {
      fontSize: 9,
      cellPadding: 5
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      2: { cellWidth: 30, halign: "center" }
    }
  });

  // Rodapé
  const finalY = (doc as any).lastAutoTable.finalY || y + 50;
  
  doc.setFontSize(8);
  doc.setTextColor("#94A3B8");
  const msg = "Documento gerado automaticamente pelo sistema Agilliza. Sujeito a alterações conforme regras do banco.";
  doc.text(msg, MARGIN, pageH - 15);

  // Download
  const filename = `Checklist - ${bancoBrand?.nome || bancoId} - ${clienteNome || "Documentos"}.pdf`;
  doc.save(filename);
}
