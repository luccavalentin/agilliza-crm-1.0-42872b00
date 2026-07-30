import { useState } from "react";
import { FileSpreadsheet, FileText, Printer } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { formatBRL } from "@/lib/financeiro/format";
import type { ContaTipo } from "@/lib/financeiro/financeiro.functions";
import type { ContaItem } from "./contas-tabela";

const STATUS_LABEL: Record<string, string> = {
  aberta: "Aberta",
  parcial: "Parcial",
  paga: "Paga",
  atrasada: "Em atraso",
  cancelada: "Cancelada",
  estornada: "Estornada",
};

/**
 * Exportação profissional (PDF/XLSX) e impressão da relação de contas,
 * reutilizando o motor de relatórios com logo e cores da Agilliza.
 */
export function ContasExport({
  tipo,
  itens,
  resumo,
  meta,
}: {
  tipo: ContaTipo;
  itens: ContaItem[];
  resumo?: {
    totalValor: number;
    totalQtd: number;
    abertoValor: number;
    pagoValor: number;
    atrasadoValor: number;
  } | null;
  meta: string[];
}) {
  const [busy, setBusy] = useState(false);
  const recebe = tipo === "receber";
  const titulo = recebe ? "Contas a receber" : "Contas a pagar";
  const descricao = recebe
    ? "Relação de comissões, taxas e outros recebimentos."
    : "Relação de fornecedores, parceiros, impostos e despesas.";

  const columns = [
    { key: "numero", label: "Número" },
    { key: "descricao", label: "Descrição" },
    { key: "contraparte", label: recebe ? "Pagador" : "Fornecedor" },
    { key: "categoria", label: "Categoria" },
    { key: "vencimento", label: "Vencimento", format: "date" as const },
    { key: "valor", label: "Valor", align: "right" as const, format: "brl" as const, footer: "sum" as const },
    { key: "pago", label: "Baixado", align: "right" as const, format: "brl" as const, footer: "sum" as const },
    { key: "status", label: "Status" },
  ];

  const rows = itens.map((c) => ({
    numero: c.numero ?? "—",
    descricao: c.descricao,
    contraparte: c.contraparte ?? "—",
    categoria: c.categoria_nome ?? "—",
    vencimento: c.vencimento,
    valor: Number(c.valor) || 0,
    pago: Number(c.valor_pago) || 0,
    status: STATUS_LABEL[c.status_efetivo] ?? c.status_efetivo,
  }));

  const kpis = resumo
    ? [
        { label: "Total no período", valor: formatBRL(resumo.totalValor), hint: `${resumo.totalQtd} conta(s)`, tone: "brand" as const },
        { label: recebe ? "A receber" : "A pagar", valor: formatBRL(resumo.abertoValor), tone: "warning" as const },
        { label: recebe ? "Recebido" : "Pago", valor: formatBRL(resumo.pagoValor), tone: "success" as const },
        { label: "Em atraso", valor: formatBRL(resumo.atrasadoValor), tone: "danger" as const },
      ]
    : [];

  const arquivo = `agilliza-${recebe ? "contas-a-receber" : "contas-a-pagar"}-${new Date()
    .toISOString()
    .slice(0, 10)}`;

  function semDados() {
    if (rows.length === 0) {
      toast.error("Nenhuma conta na relação atual.");
      return true;
    }
    return false;
  }

  async function gerarPDF(modo: "download" | "print") {
    if (semDados()) return;
    setBusy(true);
    try {
      const { exportPDF } = await import("@/lib/relatorios/report-pdf");
      exportPDF(
        titulo,
        descricao,
        meta,
        kpis,
        columns,
        rows,
        arquivo,
        undefined,
        undefined,
        undefined,
        "landscape",
        undefined,
        modo,
      );
    } catch (e) {
      console.error("[contas:pdf]", e);
      toast.error("Falha ao gerar o PDF.");
    } finally {
      setBusy(false);
    }
  }

  async function gerarXLSX() {
    if (semDados()) return;
    setBusy(true);
    try {
      const { exportXLSX } = await import("@/lib/relatorios/report-xlsx");
      await exportXLSX(arquivo, titulo, meta, columns, rows);
    } catch (e) {
      console.error("[contas:xlsx]", e);
      toast.error("Falha ao gerar a planilha.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" disabled={busy} onClick={() => void gerarPDF("download")}>
        <FileText className="mr-1.5 h-3.5 w-3.5 opacity-70" /> PDF
      </Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => void gerarXLSX()}>
        <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5 opacity-70" /> Excel
      </Button>
      <Button variant="outline" size="sm" disabled={busy} onClick={() => void gerarPDF("print")}>
        <Printer className="mr-1.5 h-3.5 w-3.5 opacity-70" /> Imprimir
      </Button>
    </div>
  );
}
