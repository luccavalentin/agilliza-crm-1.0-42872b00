import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, FileText, Send, Home, User, Users, Landmark, ShieldCheck, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SecaoCabecalho } from "@/components/simulacao/secao-cabecalho";
import { assertModuloPermitido } from "@/lib/route-guards";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ConsultandoOverlay } from "@/components/simulacao/consultando-overlay";
import { SecaoOperacaoImovel } from "@/components/simulacao/completa/secao-operacao-imovel";
import { SecaoTitular } from "@/components/simulacao/completa/secao-titular";
import { SecaoConjuge } from "@/components/simulacao/completa/secao-conjuge";
import { SecaoBancos } from "@/components/simulacao/completa/secao-bancos";
import { SecaoConsentimentos } from "@/components/simulacao/completa/secao-consentimentos";
import { ResultadoInlineCompleta } from "@/components/simulacao/completa/resultado-inline";
import { ResultadoInlineAmbos } from "@/components/simulacao/completa/resultado-inline-ambos";

import { formatBRL, formatPercent } from "@/lib/simulacao/format";
import { useSimulacaoCompleta } from "@/lib/simulacao/use-simulacao-completa";
import { obterSimulacao } from "@/lib/simulacao/simulacoes.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/operacional/simulacoes_/completa")({
  head: () => ({ meta: [{ title: "Simulação completa — Agilliza" }] }),
  beforeLoad: () => assertModuloPermitido("operacional.simulacoes"),
  validateSearch: (
    search: Record<string, unknown>,
  ): { duplicar?: string; origem?: "proposta" } => ({
    duplicar: typeof search.duplicar === "string" ? search.duplicar : undefined,
    origem: search.origem === "proposta" ? "proposta" : undefined,
  }),
  component: Pagina,
});

function Pagina() {
  const { duplicar, origem: origemFluxo } = Route.useSearch();
  const ctx = useSimulacaoCompleta({ duplicar, modoProposta: origemFluxo === "proposta" });
  const { router, modoProposta, f, enviando, concluidos, mostraConjuge, confirmRenda, setConfirmRenda, enviar, executarEnvio, simulacaoResultadoId, simulacaoResultadoIdPrice, simulacaoResultadoIdSecundario, fecharResultadoInline, fecharResultadoInlinePrice, fecharResultadoInlineSecundario } = ctx;
  const resultadoRef = useRef<HTMLDivElement>(null);

  const [popupAberto, setPopupAberto] = useState(false);
  const jaMostrouPopup = useRef(false);

  useEffect(() => {
    if ((simulacaoResultadoId || simulacaoResultadoIdPrice || simulacaoResultadoIdSecundario) && resultadoRef.current) {
      resultadoRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [simulacaoResultadoId, simulacaoResultadoIdPrice, simulacaoResultadoIdSecundario]);

  // Monitorar retornos para mostrar o popup de comparação
  useEffect(() => {
    if (jaMostrouPopup.current || !simulacaoResultadoId || !simulacaoResultadoIdSecundario) return;

    // Usar Supabase Realtime ou Intervalo para checar se AMBOS estão prontos
    const checkStatus = async () => {
      const { data: sims } = await supabase
        .from("simulacoes")
        .select("id, status, nome_cliente, bancos:simulacao_bancos(taxa_juros_ano, status_banco)")
        .in("id", [simulacaoResultadoId, simulacaoResultadoIdSecundario]);

      if (sims && sims.length === 2) {
        const prontos = sims.every((s: any) => s.status !== "enviando" && s.status !== "rascunho");
        if (prontos) {
          jaMostrouPopup.current = true;
          setPopupAberto(true);
        }
      }
    };

    const timer = setInterval(checkStatus, 5000);
    return () => clearInterval(timer);
  }, [simulacaoResultadoId, simulacaoResultadoIdSecundario]);

  const totalBancosResumo =
    f.sistema_amortizacao === "B"
      ? (f.bancos_sac_ids?.length ?? 0) + (f.bancos_price_ids?.length ?? 0)
      : f.bancos_ids.length;

  const resumoEtapas = [
    { label: "Titular", ok: !!f.nome_cliente },
    { label: "Operação e imóvel", ok: (Number(f.valor_financiamento) || 0) > 0 },
    { label: "Bancos", ok: totalBancosResumo > 0 },
  ];

  return (
    <div className="mx-auto w-full max-w-none space-y-4 p-4 md:p-8">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2 w-fit text-muted-foreground"
        onClick={() =>
          router.history.canGoBack()
            ? router.history.back()
            : router.navigate({ to: "/operacional/simulacoes" })
        }
      >
        <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
      </Button>

      <div className="flex items-center gap-4 rounded-xl border border-border/60 bg-gradient-to-br from-primary/5 via-card to-card p-5">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
          <FileText className="h-6 w-6" />
        </span>
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight text-foreground">
            {modoProposta ? "Nova Proposta" : "Solicitar Simulação Completa"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {modoProposta
              ? "Preencha a simulação completa e envie direto ao banco — a proposta é criada automaticamente."
              : "Preencha os dados para enviar aos bancos parceiros."}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        {/* Coluna principal — formulário */}
        <div className="min-w-0 space-y-4">
          <Card className="overflow-hidden">
            <SecaoCabecalho
              icone={<User className="h-4 w-4" />}
              titulo="Titular"
              descricao="Dados do proponente principal"
            />
            <div className="p-4 sm:p-5 md:p-6">
              <SecaoTitular ctx={ctx} />
            </div>
          </Card>

          {mostraConjuge && (
            <Card className="overflow-hidden">
              <SecaoCabecalho
                icone={<Users className="h-4 w-4" />}
                titulo="Cônjuge / coobrigado"
                descricao="Composição de renda"
              />
              <div className="p-4 sm:p-5 md:p-6">
                <SecaoConjuge ctx={ctx} />
              </div>
            </Card>
          )}

          <Card className="overflow-hidden">
            <SecaoCabecalho
              icone={<Home className="h-4 w-4" />}
              titulo="Operação e imóvel"
              descricao="Produto, características e valores"
            />
            <div className="p-4 sm:p-5 md:p-6">
              <SecaoOperacaoImovel ctx={ctx} />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <SecaoCabecalho
              icone={<Landmark className="h-4 w-4" />}
              titulo="Bancos"
              descricao="Selecione as instituições para consultar"
            />
            <div className="p-4 sm:p-5 md:p-6">
              <SecaoBancos ctx={ctx} />
            </div>
          </Card>

          <Card className="overflow-hidden">
            <SecaoCabecalho
              icone={<ShieldCheck className="h-4 w-4" />}
              titulo="Consentimentos"
              descricao="Autorizações necessárias"
            />
            <div className="p-4 sm:p-5 md:p-6">
              <SecaoConsentimentos ctx={ctx} />
            </div>
          </Card>

          {/* Ação sempre disponível no final do formulário */}
          <div className="flex justify-end pt-1">
            <Button className="h-11 w-full gap-2 sm:w-auto sm:px-8" onClick={enviar} disabled={enviando}>
              <Send className="h-4 w-4" /> {modoProposta ? "Gerar Proposta e Enviar ao Banco" : "Gerar Simulação"}
            </Button>
          </div>


        </div>

        {/* Coluna lateral — resumo fixo (apenas em telas grandes) */}
        <aside className="hidden lg:block">
          <Card className="sticky top-6 overflow-hidden">
            <div className="border-b border-border/60 bg-muted/30 px-5 py-3.5">
              <h2 className="text-sm font-semibold text-foreground">Resumo</h2>
              <p className="text-xs text-muted-foreground">Acompanhe o preenchimento</p>
            </div>
            <div className="space-y-4 p-5">
              <ul className="space-y-2.5">
                {resumoEtapas.map((e) => (
                  <li key={e.label} className="flex items-center gap-2.5 text-sm">
                    <span
                      className={
                        e.ok
                          ? "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary"
                          : "flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground"
                      }
                    >
                      <ShieldCheck className="h-3 w-3" />
                    </span>
                    <span className={e.ok ? "text-foreground" : "text-muted-foreground"}>
                      {e.label}
                    </span>
                  </li>
                ))}
              </ul>

              <div className="space-y-2 rounded-lg bg-muted/40 p-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Financiamento</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatBRL(Number(f.valor_financiamento) || 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Prazo</span>
                  <span className="font-medium tabular-nums text-foreground">{f.prazo} meses</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Bancos</span>
                  <span className="font-medium tabular-nums text-foreground">
                    {totalBancosResumo}
                  </span>
                </div>
              </div>

              <Button className="h-11 w-full gap-2" onClick={enviar} disabled={enviando}>
                <Send className="h-4 w-4" /> {modoProposta ? "Gerar Proposta" : "Gerar Simulação"}
              </Button>

            </div>
          </Card>
        </aside>
      </div>

      {(simulacaoResultadoId || simulacaoResultadoIdPrice || simulacaoResultadoIdSecundario) && !modoProposta && (
        <div ref={resultadoRef} className="scroll-mt-4 space-y-4">
          <div className="flex flex-col gap-6">
            {/* Bloco do Titular Principal */}
            {simulacaoResultadoId && simulacaoResultadoIdPrice ? (
              <ResultadoInlineAmbos
                simulacaoIdSac={simulacaoResultadoId}
                simulacaoIdPrice={simulacaoResultadoIdPrice}
                onFechar={() => {
                  fecharResultadoInline();
                  fecharResultadoInlinePrice();
                }}
              />
            ) : simulacaoResultadoId ? (
              <ResultadoInlineCompleta
                simulacaoId={simulacaoResultadoId}
                onFechar={fecharResultadoInline}
              />
            ) : simulacaoResultadoIdPrice ? (
              <ResultadoInlineCompleta
                simulacaoId={simulacaoResultadoIdPrice}
                onFechar={fecharResultadoInlinePrice}
              />
            ) : null}

            {/* Bloco da Simulação Secundária (Cônjuge Invertido) */}
            {simulacaoResultadoIdSecundario && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 border-b border-border/60 pb-2">
                  <Landmark className="h-4 w-4 text-primary" />
                  <h3 className="font-semibold text-foreground">Teste de Melhor Taxa (CPF Invertido)</h3>
                </div>
                <ResultadoInlineCompleta
                  simulacaoId={simulacaoResultadoIdSecundario}
                  onFechar={fecharResultadoInlineSecundario}
                />
              </div>
            )}
          </div>
        </div>
      )}

      <ConsultandoOverlay aberto={enviando} total={totalBancosResumo} concluidos={concluidos} />




      <AlertDialog open={!!confirmRenda} onOpenChange={(o) => !o && setConfirmRenda(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renda abaixo do sugerido</AlertDialogTitle>
            <AlertDialogDescription>
              A renda informada de{" "}
              <span className="font-semibold text-foreground">
                {formatBRL(confirmRenda?.rendaInformada ?? 0)}
              </span>{" "}
              é inferior à renda familiar mínima estimada de{" "}
              <span className="font-semibold text-foreground">
                {formatBRL(confirmRenda?.rendaMinima ?? 0)}
              </span>{" "}
              para este financiamento. O banco poderá reprovar a operação. Deseja enviar mesmo
              assim?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Revisar dados</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmRenda(null);
                void executarEnvio();
              }}
            >
              Enviar mesmo assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Popup de Comparação de Taxas (Dual CPF) */}
      <ComparativoTaxasDialog 
        aberto={popupAberto} 
        onClose={() => setPopupAberto(false)} 
        idTitular={simulacaoResultadoId}
        idSecundario={simulacaoResultadoIdSecundario}
      />

      <div className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2">
        <div className="flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5 text-[10px] font-medium text-primary shadow-sm backdrop-blur-sm transition-all hover:bg-primary/20">
          <ShieldCheck className="h-3 w-3" />
          Conectado à API Bancária (Ambiente Seguro)
        </div>
      </div>
    </div>
  );
}

function ComparativoTaxasDialog({ aberto, onClose, idTitular, idSecundario }: { aberto: boolean; onClose: () => void; idTitular: string | null; idSecundario: string | null }) {
  const { data: titular } = useQuery({
    queryKey: ["simulacao", idTitular],
    queryFn: () => obterSimulacao({ data: { id: idTitular! } }),
    enabled: aberto && !!idTitular
  });

  const { data: secundario } = useQuery({
    queryKey: ["simulacao", idSecundario],
    queryFn: () => obterSimulacao({ data: { id: idSecundario! } }),
    enabled: aberto && !!idSecundario
  });

  const getMelhorTaxa = (sim: any) => {
    const bancos = (sim?.bancos as any[]) ?? [];
    const taxas = bancos
      .filter(b => b.status_banco === "simulada" && b.taxa_juros_ano)
      .map(b => b.taxa_juros_ano);
    return taxas.length > 0 ? Math.min(...taxas) : null;
  };

  const taxaTitular = getMelhorTaxa(titular);
  const taxaConjuge = getMelhorTaxa(secundario);
  
  const nomeTitular = titular?.simulacao?.nome_cliente?.split(" ")[0] ?? "Titular";
  const nomeConjuge = secundario?.simulacao?.nome_cliente?.split(" ")[0] ?? "Cônjuge";

  return (
    <AlertDialog open={aberto} onOpenChange={(o) => !o && onClose()}>
      <AlertDialogContent className="max-w-xl border-none bg-transparent p-0 shadow-2xl">
        <div className="relative overflow-hidden rounded-[2rem] border border-white/20 bg-white/80 p-8 backdrop-blur-2xl dark:bg-slate-900/80">
          {/* Decorative Background Elements */}
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-blue-400/10 blur-3xl" />
          
          <div className="relative">
            <div className="mb-8 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg shadow-primary/20">
                  <Landmark className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Análise Comparativa de Taxas
                  </h3>
                  <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    Teste Automático de CPF (Titular vs Cônjuge)
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-full hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
                onClick={onClose}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <TaxaCard 
                nome={nomeTitular} 
                taxa={taxaTitular} 
                isWinner={taxaTitular != null && taxaConjuge != null && taxaTitular <= taxaConjuge} 
              />
              <TaxaCard 
                nome={nomeConjuge} 
                taxa={taxaConjuge} 
                isWinner={taxaTitular != null && taxaConjuge != null && taxaConjuge < taxaTitular} 
              />
            </div>
            
            <div className="mt-8 flex flex-col items-center gap-4">
              <div className="rounded-2xl bg-slate-900/5 px-6 py-4 text-center backdrop-blur-sm dark:bg-white/5">
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {taxaTitular && taxaConjuge 
                    ? taxaTitular <= taxaConjuge 
                      ? `✨ O perfil de ${nomeTitular} apresentou as condições mais vantajosas para o financiamento.`
                      : `✨ O perfil de ${nomeConjuge} apresentou as condições mais vantajosas para o financiamento.`
                    : "Aguardando processamento final dos retornos bancários..."}
                </p>
              </div>

              <Button 
                onClick={onClose}
                className="group h-12 rounded-2xl bg-slate-900 px-8 font-bold text-white transition-all hover:scale-105 hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
              >
                Prosseguir com a Melhor Opção
              </Button>
            </div>
          </div>
        </div>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function TaxaCard({ nome, taxa, isWinner }: { nome: string; taxa: number | null; isWinner: boolean }) {
  return (
    <div className={cn(
      "relative overflow-hidden rounded-[1.5rem] border p-6 transition-all duration-500",
      isWinner 
        ? "border-primary/30 bg-white shadow-xl shadow-primary/5 dark:bg-slate-800" 
        : "border-slate-200 bg-slate-50/50 dark:border-slate-700 dark:bg-slate-800/50"
    )}>
      {isWinner && (
        <div className="absolute right-4 top-4">
          <div className="flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
            Melhor Taxa
          </div>
        </div>
      )}
      
      <div className="space-y-1">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400">
          PERFIL {nome}
        </span>
        <div className="flex items-baseline gap-1">
          <span className={cn(
            "text-4xl font-black tabular-nums tracking-tighter",
            isWinner ? "text-primary" : "text-slate-400"
          )}>
            {taxa ? formatPercent(taxa / 100) : "—"}
          </span>
          {taxa && <span className="text-sm font-bold text-slate-400">a.a.</span>}
        </div>
      </div>
      
      <div className="mt-4 flex items-center gap-2">
        <div className={cn(
          "h-1.5 flex-1 rounded-full",
          isWinner ? "bg-primary/20" : "bg-slate-200 dark:bg-slate-700"
        )}>
          <div 
            className={cn("h-full rounded-full transition-all duration-1000", isWinner ? "w-full bg-primary" : "w-1/2 bg-slate-300 dark:bg-slate-600")}
          />
        </div>
      </div>
    </div>
  );
}
