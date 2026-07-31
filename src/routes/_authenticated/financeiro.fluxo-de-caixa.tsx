import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
  Area,
  ComposedChart,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  Wallet,
  Scale,
  Gauge,
  CalendarClock,
  ArrowDownRight,
  ArrowUpRight,
  CalendarRange,
  X,
} from "lucide-react";
import { assertModuloPermitido } from "@/lib/route-guards";
import {
  obterFluxoCaixaAnalitico,
  type FluxoAnalitico,
} from "@/lib/financeiro/financeiro.functions";
import { PanelHeader, SectionTitle, HeroMetric, MiniMetric, PanelCard } from "@/components/common/dashboard";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatBRL } from "@/lib/financeiro/format";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/financeiro/fluxo-de-caixa")({
  head: () => ({ meta: [{ title: "Fluxo de caixa — Agilliza" }] }),
  beforeLoad: () => assertModuloPermitido("financeiro.fluxo_caixa"),
  component: Pagina,
  errorComponent: () => (
    <div className="p-6 text-sm text-muted-foreground">
      Não foi possível carregar o fluxo de caixa.
    </div>
  ),
});

function formatCurto(v: number) {
  const abs = Math.abs(v);
  if (abs >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (abs >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

const SERIES: Record<string, { rotulo: string; cor: string }> = {
  entrada: { rotulo: "Entradas", cor: "var(--chart-3)" },
  saida: { rotulo: "Saídas", cor: "var(--chart-5)" },
  saldoAcum: { rotulo: "Saldo acumulado", cor: "var(--chart-1)" },
  resultado: { rotulo: "Resultado líquido", cor: "var(--chart-2)" },
};

/** Tooltip do gráfico com tipografia tabular e cores por série. */
function FluxoTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[210px] rounded-xl border border-border/70 bg-card/95 p-3 shadow-xl backdrop-blur">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <ul className="space-y-1.5">
        {payload.map((p: any) => (
          <li key={p.dataKey} className="flex items-center justify-between gap-4 text-xs">
            <span className="flex items-center gap-2 text-muted-foreground">
              <span
                className="size-2.5 rounded-full"
                style={{ background: SERIES[p.dataKey]?.cor ?? p.color }}
              />
              {SERIES[p.dataKey]?.rotulo ?? p.name}
            </span>
            <span className="font-mono font-semibold tabular-nums text-foreground">
              {formatBRL(Number(p.value))}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Legenda customizada em chips, no lugar da legenda padrão do Recharts. */
function FluxoLegenda() {
  return (
    <div className="mb-3 flex flex-wrap items-center gap-2">
      {Object.entries(SERIES).map(([k, s]) => (
        <span
          key={k}
          className="inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-muted/40 px-2.5 py-1 text-[11px] font-medium text-muted-foreground"
        >
          <span className="size-2 rounded-full" style={{ background: s.cor }} />
          {s.rotulo}
        </span>
      ))}
    </div>
  );
}

/** Filtro por calendário: de X a X, com aplicar e limpar. */
function FiltroPeriodo({
  de,
  ate,
  onAplicar,
  onLimpar,
}: {
  de: string;
  ate: string;
  onAplicar: (de: string, ate: string) => void;
  onLimpar: () => void;
}) {
  const [rascDe, setRascDe] = useState(de);
  const [rascAte, setRascAte] = useState(ate);
  const ativo = !!(de || ate);

  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-border/70 bg-card/70 p-2 shadow-sm">
      <div className="flex items-center gap-2">
        <CalendarRange className="size-4 shrink-0 text-muted-foreground" />
        <div className="space-y-1">
          <Label htmlFor="fluxo-de" className="text-[10px] uppercase tracking-wide text-muted-foreground">
            De
          </Label>
          <Input
            id="fluxo-de"
            type="date"
            className="h-9 w-[9.5rem]"
            value={rascDe}
            onChange={(e) => setRascDe(e.target.value)}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="fluxo-ate" className="text-[10px] uppercase tracking-wide text-muted-foreground">
            Até
          </Label>
          <Input
            id="fluxo-ate"
            type="date"
            className="h-9 w-[9.5rem]"
            value={rascAte}
            onChange={(e) => setRascAte(e.target.value)}
          />
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <Button size="sm" className="h-9" onClick={() => onAplicar(rascDe, rascAte)}>
          Aplicar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="h-9"
          disabled={!ativo && !rascDe && !rascAte}
          onClick={() => {
            setRascDe("");
            setRascAte("");
            onLimpar();
          }}
        >
          <X className="mr-1 size-3.5" /> Limpar
        </Button>
      </div>
    </div>
  );
}


function Pagina() {
  const [gran, setGran] = useState<"dia" | "semana" | "mes">("mes");
  const { data, isLoading, dataUpdatedAt } = useQuery({
    queryKey: ["fin-fluxo-analitico", gran],
    queryFn: () => obterFluxoCaixaAnalitico({ data: { granularidade: gran } }),
  });

  const atualizado = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString("pt-BR", { timeZone: "America/Sao_Paulo",   hour: "2-digit", minute: "2-digit" })
    : undefined;

  const r = data?.resumo;
  const pontos = data?.pontos ?? [];
  const vazio = !isLoading && pontos.length === 0;

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-6 p-3 sm:p-4 md:space-y-8 md:p-6">
      <PanelHeader
        eyebrow="Financeiro · Fluxo de caixa"
        titulo="Fluxo de caixa"
        descricao="Caixa realizado e projeção de entradas e saídas em aberto."
        atualizadoEm={atualizado}
        actions={
          <Tabs value={gran} onValueChange={(v) => setGran(v as typeof gran)}>
            <TabsList>
              <TabsTrigger value="dia">Diário</TabsTrigger>
              <TabsTrigger value="semana">Semanal</TabsTrigger>
              <TabsTrigger value="mes">Mensal</TabsTrigger>
            </TabsList>
          </Tabs>
        }
      />

      {vazio ? (
        <PanelCard titulo="Sem movimentações">
          <p className="py-10 text-center text-sm text-muted-foreground">
            Não há lançamentos realizados nem contas em aberto para projetar.
          </p>
        </PanelCard>
      ) : (
        <>
          <SectionTitle>Posição de caixa</SectionTitle>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <HeroMetric
              label="Saldo realizado"
              valor={formatBRL(r?.saldoRealizado ?? 0)}
              hint="Caixa efetivo acumulado"
              tone={(r?.saldoRealizado ?? 0) >= 0 ? "success" : "danger"}
              icon={Wallet}
            />
            <HeroMetric
              label="Resultado projetado"
              valor={formatBRL(r?.resultadoProj ?? 0)}
              hint="Entradas − saídas em aberto"
              tone={(r?.resultadoProj ?? 0) >= 0 ? "brand" : "warning"}
              icon={Scale}
            />
            <HeroMetric
              label="Saldo final projetado"
              valor={formatBRL(r?.saldoFinalProj ?? 0)}
              hint="Realizado + projeção"
              tone={(r?.saldoFinalProj ?? 0) >= 0 ? "success" : "danger"}
              icon={TrendingUp}
            />
            <HeroMetric
              label="Cobertura de saídas"
              valor={`${(r?.coberturaPct ?? 0).toFixed(0)}%`}
              hint="A receber ÷ a pagar (aberto)"
              tone={(r?.coberturaPct ?? 0) >= 100 ? "success" : "warning"}
              icon={Gauge}
            />
          </div>

          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <MiniMetric
              label="Entradas em aberto"
              valor={formatBRL(r?.totalEntradaProj ?? 0)}
              tone="success"
            />
            <MiniMetric
              label="Saídas em aberto"
              valor={formatBRL(r?.totalSaidaProj ?? 0)}
              tone="danger"
            />
            <MiniMetric
              label="Melhor período"
              valor={r?.melhorPeriodo ? formatBRL(r.melhorPeriodo.valor) : "—"}
              tone="success"
            />
            <MiniMetric
              label="Pior período"
              valor={r?.piorPeriodo ? formatBRL(r.piorPeriodo.valor) : "—"}
              tone="danger"
            />
          </div>

          <SectionTitle>Evolução do caixa</SectionTitle>
          <PanelCard
            titulo="Entradas, saídas e saldo acumulado"
            subtitulo="Barras = entradas/saídas por período · linha = saldo projetado acumulado"
          >
            <div className="h-[360px] w-full">
              {isLoading ? (
                <p className="text-sm text-muted-foreground">Carregando…</p>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={pontos} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gSaldo" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--chart-1)" stopOpacity={0.28} />
                        <stop offset="100%" stopColor="var(--chart-1)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      stroke="hsl(var(--muted-foreground))"
                      width={54}
                      tickFormatter={(v) => formatCurto(Number(v))}
                    />
                    <Tooltip formatter={(v) => formatBRL(Number(v))} contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <ReferenceLine y={0} stroke="hsl(var(--border))" />
                    <Area
                      type="monotone"
                      dataKey="saldoAcum"
                      name="Saldo acumulado"
                      stroke="var(--chart-1)"
                      strokeWidth={2.5}
                      fill="url(#gSaldo)"
                    />
                    <Bar dataKey="entrada" name="Entradas" fill="var(--chart-3)" radius={[4, 4, 0, 0]} maxBarSize={34} />
                    <Bar dataKey="saida" name="Saídas" fill="var(--chart-5)" radius={[4, 4, 0, 0]} maxBarSize={34} />
                    <Line
                      type="monotone"
                      dataKey="resultado"
                      name="Resultado líquido"
                      stroke="var(--chart-2)"
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              )}
            </div>
          </PanelCard>

          <SectionTitle>Composição em aberto</SectionTitle>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <PanelCard titulo="Entradas por origem" subtitulo="A receber em aberto" abrirTo="/financeiro/contas-a-receber">
              <DistribList itens={data?.entradasPorCategoria ?? []} tone="success" />
            </PanelCard>
            <PanelCard titulo="Saídas por categoria" subtitulo="A pagar em aberto" abrirTo="/financeiro/contas-a-pagar">
              <DistribList itens={data?.saidasPorCategoria ?? []} tone="danger" />
            </PanelCard>
          </div>

          <SectionTitle>Próximos vencimentos</SectionTitle>
          <PanelCard titulo="Agenda de caixa" subtitulo="Contas a vencer, ordenadas por data">
            <ProximosVencimentos itens={data?.proximosVencimentos ?? []} />
          </PanelCard>
        </>
      )}
    </div>
  );
}

function DistribList({
  itens,
  tone,
}: {
  itens: { nome: string; valor: number }[];
  tone: "success" | "danger";
}) {
  if (itens.length === 0)
    return <p className="py-6 text-center text-sm text-muted-foreground">Nada em aberto.</p>;
  const max = Math.max(...itens.map((i) => i.valor), 1);
  const total = itens.reduce((s, i) => s + i.valor, 0);
  const barColor = tone === "success" ? "bg-success" : "bg-destructive";
  return (
    <ul className="space-y-3">
      {itens.map((i) => (
        <li key={i.nome} className="min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <span className="truncate text-sm text-foreground">{i.nome}</span>
            <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground">
              {formatBRL(i.valor)}
            </span>
          </div>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn("h-full rounded-full transition-all", barColor)}
                style={{ width: `${(i.valor / max) * 100}%` }}
              />
            </div>
            <span className="w-9 shrink-0 text-right text-[11px] tabular-nums text-muted-foreground">
              {total > 0 ? ((i.valor / total) * 100).toFixed(0) : 0}%
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

function ProximosVencimentos({ itens }: { itens: FluxoAnalitico["proximosVencimentos"] }) {
  if (itens.length === 0)
    return <p className="py-6 text-center text-sm text-muted-foreground">Sem vencimentos futuros.</p>;
  return (
    <ul className="divide-y divide-border">
      {itens.map((i, idx) => {
        const receber = i.tipo === "receber";
        return (
          <li key={idx} className="flex items-center gap-3 py-2.5">
            <span
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset",
                receber
                  ? "bg-success/10 text-success ring-success/20"
                  : "bg-destructive/10 text-destructive ring-destructive/20",
              )}
            >
              {receber ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownRight className="h-4 w-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground">{i.descricao}</p>
              <p className="flex items-center gap-1.5 truncate text-xs text-muted-foreground">
                <CalendarClock className="h-3 w-3 shrink-0" />
                {formatarData(i.vencimento)}
                {i.contraparte ? ` · ${i.contraparte}` : ""}
              </p>
            </div>
            <span
              className={cn(
                "shrink-0 font-mono text-sm font-semibold tabular-nums",
                receber ? "text-success" : "text-destructive",
              )}
            >
              {receber ? "+" : "−"}
              {formatBRL(i.valor)}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

function formatarData(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}/${m}/${y}`;
}
