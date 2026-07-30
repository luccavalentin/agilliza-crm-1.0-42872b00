import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { FileSpreadsheet, Plus, Trash2, GitCompare, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BancoLogo } from "@/components/bancos/banco-logo";
import { NovaConciliacaoDialog } from "@/components/conciliacao/nova-conciliacao-dialog";
import { ComparadorPlanilhasDialog } from "@/components/conciliacao/comparador-planilhas-dialog";
import { LoteDetalhe, type FiltroLote } from "@/components/conciliacao/lote-detalhe";
import {
  excluirLoteConciliacao,
  listarLotesConciliacao,
  resumoConciliacao,
} from "@/lib/conciliacao/conciliacao.functions";
import { BANCOS_CONCILIACAO } from "@/lib/conciliacao/bancos";


export const Route = createFileRoute("/_authenticated/relatorios/comparativos")({
  head: () => ({
    meta: [
      { title: "Comparativo de dados — Agilliza" },
      {
        name: "description",
        content:
          "Cruze o relatório oficial do banco contra as propostas do sistema e veja divergências, ausências e conferências em segundos.",
      },
      { property: "og:title", content: "Comparativo de dados — Agilliza" },
      {
        property: "og:description",
        content:
          "Cruze o relatório oficial do banco contra as propostas do sistema e veja divergências, ausências e conferências em segundos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => s,
  component: Pagina,
});

function mesAtual(): string {
  return new Date().toISOString().slice(0, 7);
}

function fmtPeriodo(v: string): string {
  const [a, m] = v.slice(0, 7).split("-");
  return `${m}/${a}`;
}

function Pagina() {
  const qc = useQueryClient();
  const listar = useServerFn(listarLotesConciliacao);
  const resumo = useServerFn(resumoConciliacao);
  const excluir = useServerFn(excluirLoteConciliacao);

  const [periodo, setPeriodo] = useState(mesAtual());
  const [banco, setBanco] = useState<string>("todos");
  const [aberto, setAberto] = useState(false);
  const [comparador, setComparador] = useState(false);
  const [loteSelecionado, setLoteSelecionado] = useState<string | null>(null);

  const filtros = {
    periodo: periodo || null,
    banco: banco === "todos" ? null : banco,
  };

  const { data: lotes = [] } = useQuery({
    queryKey: ["conciliacao-lotes", filtros],
    queryFn: () => listar({ data: filtros }),
  });

  const { data: resumos = [] } = useQuery({
    queryKey: ["conciliacao-resumo", periodo],
    queryFn: () => resumo({ data: { periodo: periodo || null } }),
  });

  const totais = useMemo(
    () =>
      resumos.reduce(
        (acc, r) => ({
          total: acc.total + r.total,
          conferidas: acc.conferidas + r.conferidas,
          divergentes: acc.divergentes + r.divergentes,
          ausentes_sistema: acc.ausentes_sistema + r.ausentes_sistema,
          ausentes_banco: acc.ausentes_banco + r.ausentes_banco,
        }),
        { total: 0, conferidas: 0, divergentes: 0, ausentes_sistema: 0, ausentes_banco: 0 },
      ),
    [resumos],
  );

  const lote = lotes.find((l) => l.id === loteSelecionado) ?? lotes[0] ?? null;

  function invalidar() {
    qc.invalidateQueries({ queryKey: ["conciliacao-lotes"] });
    qc.invalidateQueries({ queryKey: ["conciliacao-resumo"] });
  }

  async function remover(id: string) {
    try {
      await excluir({ data: { loteId: id } });
      if (loteSelecionado === id) setLoteSelecionado(null);
      invalidar();
      toast.success("Lote removido.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao remover.");
    }
  }

  const kpis = [
    { label: "Linhas conciliadas", valor: totais.total, tone: "bg-muted-foreground/40" },
    { label: "Conferidas", valor: totais.conferidas, tone: "bg-emerald-500" },
    { label: "Divergentes", valor: totais.divergentes, tone: "bg-amber-500" },
    { label: "Ausentes no sistema", valor: totais.ausentes_sistema, tone: "bg-red-500" },
    { label: "Ausentes no banco", valor: totais.ausentes_banco, tone: "bg-sky-500" },
  ];

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            Relatórios · Comparativos
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Comparativo de dados</h1>
          <p className="text-sm text-muted-foreground">
            Faça o upload do relatório oficial do banco. O sistema cruza contra as
            propostas existentes e aponta divergências — sem criar ou alterar nada.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={() => setComparador(true)}>
            <GitCompare className="h-4 w-4" />
            Comparativo de planilhas e dados
          </Button>
          <Button onClick={() => setAberto(true)}>
            <Plus className="h-4 w-4" />
            Novo comparativo
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Mês de referência
          </label>
          <Input
            type="month"
            value={periodo}
            onChange={(e) => setPeriodo(e.target.value)}
            className="h-9 w-44"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Banco
          </label>
          <Select value={banco} onValueChange={setBanco}>
            <SelectTrigger className="h-9 w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os bancos</SelectItem>
              {BANCOS_CONCILIACAO.map((b) => (
                <SelectItem key={b.id} value={b.label}>
                  {b.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {kpis.map((k) => (
          <Card key={k.label} className="relative overflow-hidden p-4">
            <span className={`absolute inset-y-0 left-0 w-[2px] ${k.tone}`} />
            <div className="font-mono text-2xl font-semibold tabular-nums">{k.valor}</div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
              {k.label}
            </div>
          </Card>
        ))}
      </div>

      {resumos.length > 0 && (
        <div className="grid gap-3 md:grid-cols-3">
          {resumos.map((r) => (
            <Card key={r.banco_nome} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{r.banco_nome}</span>
                <span className="font-mono text-sm tabular-nums">
                  {r.percentual_conferido}%
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded bg-muted">
                <div
                  className="h-full bg-emerald-500"
                  style={{ width: `${Math.min(100, r.percentual_conferido)}%` }}
                />
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                {r.total} linhas · {r.divergentes} divergentes · {r.ausentes_sistema} ausentes no
                sistema
              </div>
            </Card>
          ))}
        </div>
      )}

      <section className="space-y-2">
        <h2 className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
          Lotes enviados
        </h2>
        {lotes.length === 0 ? (
          <Card className="flex flex-col items-center gap-2 p-10 text-center">
            <FileSpreadsheet className="h-6 w-6 opacity-50" />
            <p className="text-sm text-muted-foreground">
              Nenhum comparativo neste período. Envie o relatório do banco para começar.
            </p>
          </Card>
        ) : (
          <div className="flex flex-wrap gap-2">
            {lotes.map((l) => {
              const ativo = lote?.id === l.id;
              return (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setLoteSelecionado(l.id)}
                  className={`group flex items-center gap-3 rounded-lg border px-3 py-2 text-left transition ${
                    ativo ? "border-primary bg-primary/5" : "hover:bg-muted/50"
                  }`}
                >
                  <div>
                    <div className="text-sm font-medium">
                      {l.banco_nome} · {fmtPeriodo(l.periodo_referencia)}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {l.total_linhas} linhas · {l.total_divergentes} divergentes ·{" "}
                      {new Date(l.enviado_em).toLocaleString("pt-BR")}
                    </div>
                  </div>
                  <Trash2
                    className="h-3.5 w-3.5 opacity-0 transition group-hover:opacity-60 hover:!opacity-100"
                    onClick={(e) => {
                      e.stopPropagation();
                      void remover(l.id);
                    }}
                  />
                </button>
              );
            })}
          </div>
        )}
      </section>

      {lote && <LoteDetalhe lote={lote} />}

      <ComparadorPlanilhasDialog open={comparador} onOpenChange={setComparador} />

      <NovaConciliacaoDialog
        open={aberto}
        onOpenChange={setAberto}
        periodoPadrao={periodo || mesAtual()}
        onConcluido={(id) => {
          setLoteSelecionado(id);
          invalidar();
        }}
      />
    </div>
  );
}
