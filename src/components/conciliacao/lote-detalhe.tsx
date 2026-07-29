import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Link } from "@tanstack/react-router";
import { Download, ExternalLink, Search } from "lucide-react";
import * as XLSX from "xlsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { listarItensConciliacao } from "@/lib/conciliacao/conciliacao.functions";
import { SITUACAO_LABEL } from "@/lib/conciliacao/bancos";
import {
  RESULTADO_LABEL,
  RESULTADO_TONE,
  type ConciliacaoLote,
  type ResultadoConciliacao,
} from "@/lib/conciliacao/tipos";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });

function fmtValor(v: number | null) {
  return v == null ? "—" : brl.format(Number(v));
}

function fmtData(v: string | null) {
  if (!v) return "—";
  const [a, m, d] = v.slice(0, 10).split("-");
  return `${d}/${m}/${a}`;
}

/** Detalhamento de um lote: abas por resultado, busca e export XLSX. */
export function LoteDetalhe({ lote }: { lote: ConciliacaoLote }) {
  const listar = useServerFn(listarItensConciliacao);
  const [aba, setAba] = useState<"todos" | ResultadoConciliacao>("divergente");
  const [busca, setBusca] = useState("");

  const { data: itens = [], isLoading } = useQuery({
    queryKey: ["conciliacao-itens", lote.id],
    queryFn: () => listar({ data: { loteId: lote.id } }),
  });

  const filtrados = useMemo(() => {
    const b = busca.trim().toLowerCase();
    return itens.filter((i) => {
      if (aba !== "todos" && i.resultado !== aba) return false;
      if (!b) return true;
      return [
        i.numero_proposta_banco,
        i.numero_proposta_sistema,
        i.nome_cliente_banco,
        i.cpf_banco,
        i.status_banco,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(b));
    });
  }, [itens, aba, busca]);

  function exportar() {
    const linhas = filtrados.map((i) => ({
      Resultado: RESULTADO_LABEL[i.resultado],
      "Nº proposta (banco)": i.numero_proposta_banco ?? "",
      "Nº proposta (sistema)": i.numero_proposta_sistema ?? "",
      Cliente: i.nome_cliente_banco ?? "",
      CPF: i.cpf_banco ?? "",
      "Status banco": i.status_banco ?? "",
      "Status sistema": i.status_sistema ? (SITUACAO_LABEL[i.status_sistema] ?? i.status_sistema) : "",
      "Valor banco": i.valor_financiamento_banco ?? "",
      "Valor sistema": i.valor_financiamento_sistema ?? "",
      "Data envio": i.data_envio_banco ?? "",
      "Data emissão": i.data_emissao_banco ?? "",
      "Data assinatura": i.data_assinatura_banco ?? "",
      Divergência: i.detalhe_divergencia ?? "",
    }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(linhas), "Conciliação");
    XLSX.writeFile(
      wb,
      `conciliacao_${lote.banco_nome.toLowerCase()}_${lote.periodo_referencia.slice(0, 7)}.xlsx`,
    );
  }

  const contagens: Record<string, number> = {
    todos: lote.total_linhas,
    conferido: lote.total_conferidas,
    divergente: lote.total_divergentes,
    ausente_no_sistema: lote.total_ausentes_sistema,
    ausente_no_banco: lote.total_ausentes_banco,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs value={aba} onValueChange={(v) => setAba(v as typeof aba)}>
          <TabsList>
            <TabsTrigger value="todos">Todos ({contagens.todos})</TabsTrigger>
            <TabsTrigger value="divergente">Divergentes ({contagens.divergente})</TabsTrigger>
            <TabsTrigger value="ausente_no_sistema">
              Ausentes no sistema ({contagens.ausente_no_sistema})
            </TabsTrigger>
            <TabsTrigger value="ausente_no_banco">
              Ausentes no banco ({contagens.ausente_no_banco})
            </TabsTrigger>
            <TabsTrigger value="conferido">Conferidas ({contagens.conferido})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 opacity-60" />
            <Input
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Buscar proposta, cliente..."
              className="h-9 w-56 pl-8"
            />
          </div>
          <Button variant="outline" size="sm" onClick={exportar} disabled={!filtrados.length}>
            <Download className="h-3.5 w-3.5" />
            XLSX
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[150px]">Resultado</TableHead>
              <TableHead>Proposta</TableHead>
              <TableHead>Cliente</TableHead>
              <TableHead>Status banco</TableHead>
              <TableHead>Status sistema</TableHead>
              <TableHead className="text-right">Valor banco</TableHead>
              <TableHead className="text-right">Valor sistema</TableHead>
              <TableHead>Datas</TableHead>
              <TableHead>Divergência</TableHead>
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                  Carregando…
                </TableCell>
              </TableRow>
            ) : filtrados.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum registro nesta visão.
                </TableCell>
              </TableRow>
            ) : (
              filtrados.map((i, idx) => (
                <TableRow key={i.id} className={idx % 2 ? "bg-muted/25" : undefined}>
                  <TableCell>
                    <Badge variant="outline" className={RESULTADO_TONE[i.resultado]}>
                      {RESULTADO_LABEL[i.resultado]}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-xs tabular-nums">
                    <div>{i.numero_proposta_banco ?? "—"}</div>
                    {i.numero_proposta_sistema && (
                      <div className="text-muted-foreground">sist. {i.numero_proposta_sistema}</div>
                    )}
                  </TableCell>
                  <TableCell className="max-w-[220px] truncate text-sm">
                    <div className="truncate">{i.nome_cliente_banco ?? "—"}</div>
                    <div className="font-mono text-[11px] text-muted-foreground">
                      {i.cpf_banco ?? ""}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{i.status_banco ?? "—"}</TableCell>
                  <TableCell className="text-sm">
                    {i.status_sistema ? (SITUACAO_LABEL[i.status_sistema] ?? i.status_sistema) : "—"}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {fmtValor(i.valor_financiamento_banco)}
                  </TableCell>
                  <TableCell className="text-right font-mono text-xs tabular-nums">
                    {fmtValor(i.valor_financiamento_sistema)}
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-[11px] text-muted-foreground">
                    <div>Envio {fmtData(i.data_envio_banco)}</div>
                    <div>Emissão {fmtData(i.data_emissao_banco)}</div>
                    {i.data_assinatura_banco && <div>Assin. {fmtData(i.data_assinatura_banco)}</div>}
                  </TableCell>
                  <TableCell className="max-w-[280px] text-xs text-muted-foreground">
                    {i.detalhe_divergencia ?? "—"}
                  </TableCell>
                  <TableCell>
                    {i.proposta_id && (
                      <Button asChild variant="ghost" size="icon" className="h-7 w-7">
                        <Link
                          to="/operacional/propostas/$id"
                          params={{ id: i.proposta_id }}
                          title="Abrir proposta"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </Link>
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
