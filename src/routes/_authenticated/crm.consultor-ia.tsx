import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Lightbulb,
  Loader2,
  MessageSquarePlus,
  Send,
  Sparkles,
  ThumbsDown,
  ThumbsUp,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Markdown } from "@/components/ui/markdown";
import { assertModuloPermitido } from "@/lib/route-guards";
import { supabase } from "@/integrations/supabase/client";
import {
  avaliarRespostaConsultor,
  excluirConversaConsultor,
  listarConversasConsultor,
  listarMensagensConsultor,
  obterItemBase,
  sugerirConteudoBase,
  type FonteCitada,
} from "@/lib/consultor-ia/consultor-ia.functions";

export const Route = createFileRoute("/_authenticated/crm/consultor-ia")({
  head: () => ({
    meta: [
      { title: "Consultor IA — Agilliza" },
      {
        name: "description",
        content:
          "Assistente de financiamento imobiliário com respostas fundamentadas na base de conhecimento da equipe.",
      },
    ],
  }),
  beforeLoad: () => assertModuloPermitido("crm.scan_ia"),
  component: ConsultorIaPage,
});

const SUGESTOES = [
  "Qual a diferença entre SAC e PRICE?",
  "Como funciona o uso de FGTS no financiamento habitacional?",
  "Quais documentos são obrigatórios para o comprador na proposta?",
  "O Santander opera Home Equity?",
];

function ConsultorIaPage() {
  const qc = useQueryClient();
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [pergunta, setPergunta] = useState("");
  const [fonteAberta, setFonteAberta] = useState<string | null>(null);
  const [sugerindo, setSugerindo] = useState<string | null>(null);
  const [observacao, setObservacao] = useState("");
  const fimRef = useRef<HTMLDivElement>(null);

  const { data: conversas } = useQuery({
    queryKey: ["consultor-ia-conversas"],
    queryFn: () => listarConversasConsultor(),
  });

  const { data: mensagens, isLoading: carregandoMsgs } = useQuery({
    queryKey: ["consultor-ia-mensagens", conversaId],
    queryFn: () => listarMensagensConsultor({ data: { conversa_id: conversaId! } }),
    enabled: !!conversaId,
  });

  const { data: fonteDetalhe } = useQuery({
    queryKey: ["consultor-ia-fonte", fonteAberta],
    queryFn: () => obterItemBase({ data: { id: fonteAberta! } }),
    enabled: !!fonteAberta,
  });

  const [streaming, setStreaming] = useState(false);
  const [parcial, setParcial] = useState("");
  const [perguntaPendente, setPerguntaPendente] = useState<string | null>(null);

  async function perguntarStream(texto: string) {
    setStreaming(true);
    setParcial("");
    setPerguntaPendente(texto);
    try {
      const { data: sessao } = await supabase.auth.getSession();
      const token = sessao.session?.access_token;
      if (!token) throw new Error("Sessão expirada. Entre novamente.");

      const resp = await fetch("/api/consultor-ia/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ conversa_id: conversaId, pergunta: texto }),
      });
      if (!resp.ok || !resp.body) throw new Error("Falha ao consultar a IA.");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let idConversa = conversaId;
      let erro: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const linhas = buffer.split("\n");
        buffer = linhas.pop() ?? "";
        for (const linha of linhas) {
          if (!linha.trim()) continue;
          let ev: any;
          try {
            ev = JSON.parse(linha);
          } catch {
            continue;
          }
          if (ev.tipo === "conversa") {
            idConversa = ev.conversa_id;
            if (!conversaId) setConversaId(ev.conversa_id);
          } else if (ev.tipo === "texto") {
            setParcial(ev.texto);
          } else if (ev.tipo === "erro") {
            erro = ev.mensagem;
          }
        }
      }

      if (erro) throw new Error(erro);
      await qc.invalidateQueries({ queryKey: ["consultor-ia-mensagens", idConversa] });
      await qc.invalidateQueries({ queryKey: ["consultor-ia-conversas"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao consultar a IA.");
    } finally {
      setStreaming(false);
      setParcial("");
      setPerguntaPendente(null);
    }
  }

  const avaliar = useMutation({
    mutationFn: (v: { mensagem_id: string; avaliacao: "util" | "nao_util" }) =>
      avaliarRespostaConsultor({ data: v }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["consultor-ia-mensagens", conversaId] });
      toast.success("Obrigado pelo retorno.");
    },
  });

  const excluir = useMutation({
    mutationFn: (id: string) => excluirConversaConsultor({ data: { id } }),
    onSuccess: async () => {
      setConversaId(null);
      await qc.invalidateQueries({ queryKey: ["consultor-ia-conversas"] });
      toast.success("Conversa excluída.");
    },
  });

  const enviarSugestao = useMutation({
    mutationFn: (v: { pergunta: string; observacao?: string }) =>
      sugerirConteudoBase({ data: v }),
    onSuccess: () => {
      setSugerindo(null);
      setObservacao("");
      toast.success("Sugestão enviada para quem administra a base.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao enviar sugestão."),
  });

  useEffect(() => {
    fimRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens?.length, parcial, streaming]);

  const lista = useMemo(() => mensagens ?? [], [mensagens]);

  function enviar(texto?: string) {
    const t = (texto ?? pergunta).trim();
    if (!t || streaming) return;
    setPergunta("");
    void perguntarStream(t);
  }

  return (
    <div className="flex h-full flex-col gap-4">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <Sparkles className="size-5 text-primary" />
            Consultor IA
          </h1>
          <p className="text-sm text-muted-foreground">
            Especialista em financiamento imobiliário — responde com base na base de conhecimento
            mantida pela equipe.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setConversaId(null)}
          className="gap-2"
        >
          <MessageSquarePlus className="size-4" />
          Nova conversa
        </Button>
      </header>

      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="hidden min-h-0 flex-col rounded-xl border border-border/60 bg-card lg:flex">
          <p className="border-b border-border/60 px-3 py-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
            Conversas
          </p>
          <div className="min-h-0 flex-1 overflow-y-auto p-2">
            {(conversas ?? []).length === 0 ? (
              <p className="px-2 py-4 text-xs text-muted-foreground">Nenhuma conversa ainda.</p>
            ) : (
              (conversas ?? []).map((c) => (
                <div
                  key={c.id}
                  className={`group flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm transition-colors ${
                    conversaId === c.id ? "bg-primary/10 text-primary" : "hover:bg-muted/60"
                  }`}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 truncate text-left"
                    onClick={() => setConversaId(c.id)}
                  >
                    {c.titulo}
                  </button>
                  <button
                    type="button"
                    aria-label="Excluir conversa"
                    className="opacity-0 transition-opacity group-hover:opacity-100"
                    onClick={() => excluir.mutate(c.id)}
                  >
                    <Trash2 className="size-3.5 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))
            )}
          </div>
        </aside>

        <section className="flex min-h-0 flex-col overflow-hidden rounded-xl border border-border/60 bg-card">
          <div className="min-h-0 flex-1 space-y-3 overflow-y-auto p-4">
            {!conversaId && !streaming ? (
              <div className="mx-auto max-w-xl py-8 text-center">
                <Lightbulb className="mx-auto mb-3 size-8 text-primary" />
                <p className="text-sm font-medium">Como posso ajudar?</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Pergunte sobre regras de bancos, FGTS, SFH/SFI, documentação e etapas da esteira.
                </p>
                <div className="mt-4 grid gap-2 sm:grid-cols-2">
                  {SUGESTOES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => enviar(s)}
                      className="rounded-lg border border-border/60 px-3 py-2 text-left text-xs transition-colors hover:border-primary/40 hover:bg-primary/[0.04]"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}

            {carregandoMsgs && conversaId ? <Skeleton className="h-20 w-full" /> : null}

            {lista.map((m) =>
              m.papel === "usuario" ? (
                <div key={m.id} className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                    {m.conteudo}
                  </div>
                </div>
              ) : (
                <div key={m.id} className="flex justify-start">
                  <div
                    className={`max-w-[90%] rounded-2xl rounded-bl-sm border px-3.5 py-2.5 text-sm ${
                      m.sem_resposta
                        ? "border-amber-500/40 bg-amber-500/10"
                        : "border-border/60 bg-muted/40"
                    }`}
                  >
                    {m.sem_resposta ? (
                      <p className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-amber-700 dark:text-amber-400">
                        <TriangleAlert className="size-3.5" />
                        Lacuna de conhecimento na base
                      </p>
                    ) : null}
                    <Markdown conteudo={m.conteudo} />

                    {m.fontes_usadas.length > 0 ? (
                      <div className="mt-2.5 flex flex-wrap gap-1.5">
                        {m.fontes_usadas.map((f: FonteCitada) => (
                          <button key={f.id} type="button" onClick={() => setFonteAberta(f.id)}>
                            <Badge variant="secondary" className="cursor-pointer text-[11px]">
                              Fonte: {f.categoria} — {f.titulo}
                            </Badge>
                          </button>
                        ))}
                      </div>
                    ) : null}

                    <div className="mt-2 flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6"
                        aria-label="Resposta útil"
                        onClick={() => avaliar.mutate({ mensagem_id: m.id, avaliacao: "util" })}
                      >
                        <ThumbsUp
                          className={`size-3.5 ${m.avaliacao === "util" ? "text-primary" : "text-muted-foreground"}`}
                        />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="size-6"
                        aria-label="Resposta não útil"
                        onClick={() => avaliar.mutate({ mensagem_id: m.id, avaliacao: "nao_util" })}
                      >
                        <ThumbsDown
                          className={`size-3.5 ${m.avaliacao === "nao_util" ? "text-destructive" : "text-muted-foreground"}`}
                        />
                      </Button>
                      {m.sem_resposta ? (
                        <Button
                          size="sm"
                          variant="outline"
                          className="ml-1 h-6 text-[11px]"
                          onClick={() => {
                            const idx = lista.findIndex((x) => x.id === m.id);
                            const anterior = [...lista.slice(0, idx)]
                              .reverse()
                              .find((x) => x.papel === "usuario");
                            setSugerindo(anterior?.conteudo ?? "");
                          }}
                        >
                          Sugerir conteúdo para a base
                        </Button>
                      ) : null}
                    </div>
                  </div>
                </div>
              ),
            )}

            {perguntaPendente ? (
              <div className="flex justify-end">
                <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-primary px-3.5 py-2 text-sm text-primary-foreground">
                  {perguntaPendente}
                </div>
              </div>
            ) : null}

            {streaming ? (
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-2xl rounded-bl-sm border border-border/60 bg-muted/40 px-3.5 py-2.5 text-sm">
                  {parcial ? (
                    <>
                      <Markdown conteudo={parcial} />
                      <span className="ml-0.5 inline-block h-4 w-[2px] animate-pulse bg-primary align-text-bottom" />
                    </>
                  ) : (
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Consultando a base…
                    </span>
                  )}
                </div>
              </div>
            ) : null}
            <div ref={fimRef} />
          </div>

          <div className="flex items-center gap-2 border-t border-border/60 p-3">
            <Input
              value={pergunta}
              onChange={(e) => setPergunta(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  enviar();
                }
              }}
              placeholder="Pergunte ao consultor…"
              disabled={streaming}
            />
            <Button onClick={() => enviar()} disabled={streaming || !pergunta.trim()}>
              <Send className="size-4" />
            </Button>
          </div>
        </section>
      </div>

      <Dialog open={!!fonteAberta} onOpenChange={(o) => !o && setFonteAberta(null)}>
        <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{fonteDetalhe?.titulo ?? "Fonte"}</DialogTitle>
            <DialogDescription>{fonteDetalhe?.categoria}</DialogDescription>
          </DialogHeader>
          {fonteDetalhe ? (
            <Markdown conteudo={fonteDetalhe.conteudo} className="text-sm" />
          ) : (
            <Skeleton className="h-24 w-full" />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={sugerindo !== null} onOpenChange={(o) => !o && setSugerindo(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sugerir conteúdo para a base</DialogTitle>
            <DialogDescription>
              A pergunta será enviada para quem administra a base de conhecimento revisar.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input value={sugerindo ?? ""} onChange={(e) => setSugerindo(e.target.value)} />
            <Textarea
              value={observacao}
              onChange={(e) => setObservacao(e.target.value)}
              placeholder="Observação (opcional)"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSugerindo(null)}>
              Cancelar
            </Button>
            <Button
              disabled={enviarSugestao.isPending || !(sugerindo ?? "").trim()}
              onClick={() =>
                enviarSugestao.mutate({
                  pergunta: (sugerindo ?? "").trim(),
                  observacao: observacao.trim() || undefined,
                })
              }
            >
              Enviar sugestão
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
