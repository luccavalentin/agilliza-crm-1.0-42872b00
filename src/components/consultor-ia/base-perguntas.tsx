import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  BookOpen,
  ChevronDown,
  FileDown,
  Printer,
  Search,
  Sparkles,
  Tags,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/components/ui/markdown";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { listarPerguntasRespondidas } from "@/lib/consultor-ia/consultor-ia.functions";
import { exportarBaseConhecimentoPdf } from "@/lib/consultor-ia/base-pdf";
import { cn } from "@/lib/utils";

/** Resumo curto da resposta para a prévia fechada do card. */
function resumo(md: string, limite = 190): string {
  const texto = md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/[#*`>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return texto.length > limite ? `${texto.slice(0, limite).trimEnd()}…` : texto;
}

/**
 * Base de conhecimento formada pelas perguntas já respondidas pelo consultor,
 * organizada, pesquisável por palavra-chave e exportável em PDF.
 */
export function BasePerguntasRespondidas({
  onReperguntar,
}: {
  onReperguntar?: (pergunta: string) => void;
}) {
  const [busca, setBusca] = useState("");
  const [chave, setChave] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);
  const [selecionados, setSelecionados] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ["consultor-ia-base-perguntas"],
    queryFn: () => listarPerguntasRespondidas({ data: {} }),
  });

  const itens = useMemo(() => data ?? [], [data]);

  const palavrasChave = useMemo(() => {
    const contagem = new Map<string, number>();
    for (const it of itens) {
      for (const p of it.palavras_chave) contagem.set(p, (contagem.get(p) ?? 0) + 1);
    }
    return Array.from(contagem.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 16)
      .map(([p, n]) => ({ palavra: p, total: n }));
  }, [itens]);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    return itens.filter((it) => {
      const texto = `${it.pergunta} ${it.resposta} ${it.palavras_chave.join(" ")}`.toLowerCase();
      if (termo && !texto.includes(termo)) return false;
      if (chave && !it.palavras_chave.includes(chave)) return false;
      return true;
    });
  }, [itens, busca, chave]);

  const comFonte = useMemo(() => filtrados.filter((i) => i.fontes.length > 0).length, [filtrados]);

  /** Registros efetivamente exportados: seleção do usuário ou todo o filtro atual. */
  const selecao = useMemo(
    () => filtrados.filter((i) => selecionados.includes(i.id)),
    [filtrados, selecionados],
  );
  const paraExportar = selecao.length > 0 ? selecao : filtrados;
  const todosMarcados = filtrados.length > 0 && selecao.length === filtrados.length;

  function alternar(id: string) {
    setSelecionados((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function alternarTodos() {
    setSelecionados(todosMarcados ? [] : filtrados.map((i) => i.id));
  }

  const contexto = [
    selecao.length > 0
      ? `Seleção: ${selecao.length} artigo(s)`
      : chave
        ? `Palavra-chave: ${chave}`
        : null,
    selecao.length === 0 && busca.trim() ? `Busca: "${busca.trim()}"` : null,
  ]
    .filter(Boolean)
    .join(" · ") || "Base completa";

  function baixar(modo: "download" | "print") {
    if (paraExportar.length === 0) {
      toast.error("Nenhum registro para exportar.");
      return;
    }
    try {
      exportarBaseConhecimentoPdf({ itens: paraExportar, contexto, modo });
      toast.success(
        modo === "print"
          ? "Abrindo impressão…"
          : paraExportar.length === 1
            ? "PDF do artigo gerado."
            : `PDF único com ${paraExportar.length} artigos gerado.`,
      );
    } catch {
      toast.error("Não foi possível gerar o PDF.");
    }
  }


  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-card shadow-card">
      {/* Cabeçalho editorial */}
      <header className="relative border-b border-border/70 bg-[linear-gradient(180deg,color-mix(in_oklab,var(--primary)_6%,var(--card)),var(--card))] p-4 sm:p-5">
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between">
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-border/70 bg-card text-primary shadow-sm sm:size-11">
              <BookOpen className="size-5" />
            </span>
            <div className="min-w-0">
              <span className="text-[10.5px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                Consultor IA
              </span>
              <h2 className="text-base font-semibold tracking-tight text-foreground sm:text-lg">
                Base de conhecimento
              </h2>
              <p className="text-[12.5px] text-muted-foreground sm:text-[13px]">
                Todo o histórico curado de perguntas e respostas, pesquisável por palavra-chave.
              </p>
            </div>
          </div>
          <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:flex-wrap sm:items-center">
            <Button
              variant="outline"
              size="sm"
              className="w-full bg-card/70 backdrop-blur sm:w-auto"
              onClick={() => baixar("print")}
              disabled={paraExportar.length === 0}
            >
              <Printer className="mr-1.5 size-4" /> Imprimir
            </Button>
            <Button
              size="sm"
              className="w-full sm:w-auto"
              onClick={() => baixar("download")}
              disabled={paraExportar.length === 0}
            >
              <FileDown className="mr-1.5 size-4" />
              {selecao.length > 0 ? `Baixar (${selecao.length})` : "Baixar PDF"}
            </Button>
          </div>
        </div>

        {/* Métricas discretas */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:max-w-xl sm:grid-cols-4">
          {[
            { label: "Registros", valor: itens.length },
            { label: "No filtro", valor: filtrados.length },
            { label: "Com fonte", valor: comFonte },
            { label: "Selecionados", valor: selecao.length },
          ].map((m) => (
            <div
              key={m.label}
              className="min-w-0 rounded-xl border border-border/70 bg-card px-3 py-2"
            >
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                {m.label}
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums leading-none text-foreground">
                {m.valor}
              </p>
            </div>
          ))}
        </div>

      </header>

      {/* Busca + palavras-chave */}
      <div className="space-y-3 border-b border-border/70 bg-muted/25 p-4">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por assunto, termo ou palavra-chave…"
            className="h-11 rounded-xl pl-9 pr-9"
          />
          {busca ? (
            <button
              type="button"
              onClick={() => setBusca("")}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-accent"
            >
              <X className="size-3.5" />
            </button>
          ) : null}
        </div>

        {palavrasChave.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="mr-1 inline-flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              <Tags className="size-3.5" /> Palavras-chave
            </span>
            {palavrasChave.map((p) => {
              const ativo = chave === p.palavra;
              return (
                <button
                  key={p.palavra}
                  type="button"
                  onClick={() => setChave(ativo ? null : p.palavra)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize transition-colors",
                    ativo
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                  )}
                >
                  {p.palavra}
                  <span className="tabular-nums opacity-70">{p.total}</span>
                </button>
              );
            })}
            {chave ? (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => setChave(null)}
              >
                Limpar filtro
              </Button>
            ) : null}
          </div>
        ) : null}

        {/* Seleção de artigos */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border/70 bg-card px-3 py-2">
          <label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-foreground">
            <Checkbox
              checked={todosMarcados}
              onCheckedChange={alternarTodos}
              aria-label="Selecionar todos os artigos"
            />
            Selecionar todos
          </label>
          <span className="min-w-0 flex-1 truncate text-[11.5px] text-muted-foreground">
            {selecao.length > 0
              ? `${selecao.length} artigo(s) — o PDF virá com as páginas unidas.`
              : "Nenhum selecionado — exporta o filtro atual."}
          </span>
          {selecao.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[11px]"
              onClick={() => setSelecionados([])}
            >
              Limpar seleção
            </Button>
          ) : null}
        </div>
      </div>


      {/* Lista */}
      <div className="brand-scroll max-h-[560px] space-y-2 overflow-y-auto p-4">
        {isLoading ? (
          <>
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </>
        ) : filtrados.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary">
              <Sparkles className="size-5" />
            </span>
            <p className="text-sm font-medium text-foreground">Nada encontrado</p>
            <p className="max-w-xs text-xs text-muted-foreground">
              Ajuste a pesquisa ou faça uma nova pergunta ao Consultor IA para alimentar a base.
            </p>
          </div>
        ) : (
          filtrados.map((it, i) => {
            const open = aberto === it.id;
            return (
              <Collapsible
                key={it.id}
                open={open}
                onOpenChange={(o) => setAberto(o ? it.id : null)}
                className={cn(
                  "group overflow-hidden rounded-xl border bg-card transition-all",
                  open
                    ? "border-primary/40 shadow-[0_10px_30px_-18px_color-mix(in_oklab,var(--primary)_60%,transparent)]"
                    : "border-border/70 hover:border-primary/30",
                )}
              >
                <CollapsibleTrigger className="flex w-full items-start gap-3 p-3 text-left">
                  <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-lg bg-primary/8 text-[11px] font-semibold tabular-nums text-primary">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold leading-snug text-foreground">
                      {it.pergunta}
                    </span>
                    {!open ? (
                      <span className="mt-1 block line-clamp-2 text-[12px] leading-relaxed text-muted-foreground">
                        {resumo(it.resposta)}
                      </span>
                    ) : null}
                    <span className="mt-1.5 flex flex-wrap items-center gap-1">
                      {it.palavras_chave.slice(0, 5).map((p) => (
                        <Badge key={p} variant="secondary" className="text-[10px] capitalize">
                          {p}
                        </Badge>
                      ))}
                      {it.sem_resposta ? (
                        <Badge variant="outline" className="gap-1 text-[10px] text-amber-600">
                          <TriangleAlert className="size-3" /> fora da base
                        </Badge>
                      ) : null}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1.5">
                    <span className="text-[11px] tabular-nums text-muted-foreground">
                      {new Date(it.created_at).toLocaleDateString("pt-BR")}
                    </span>
                    <ChevronDown
                      className={cn(
                        "size-4 text-muted-foreground transition-transform",
                        open && "rotate-180 text-primary",
                      )}
                    />
                  </span>
                </CollapsibleTrigger>

                <CollapsibleContent className="border-t border-border/60 bg-muted/20 px-4 py-3">
                  <Markdown conteudo={it.resposta} className="text-sm" />
                  {it.fontes.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {it.fontes.map((f) => (
                        <Badge key={f.id} variant="secondary" className="text-[10px]">
                          Fonte: {f.categoria} — {f.titulo}
                        </Badge>
                      ))}
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {onReperguntar ? (
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 text-[11.5px]"
                        onClick={() => onReperguntar(it.pergunta)}
                      >
                        <Sparkles className="mr-1.5 size-3.5" /> Perguntar novamente
                      </Button>
                    ) : null}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-[11.5px]"
                      onClick={() =>
                        exportarBaseConhecimentoPdf({
                          itens: [it],
                          contexto: "Registro individual",
                        })
                      }
                    >
                      <FileDown className="mr-1.5 size-3.5" /> PDF deste item
                    </Button>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            );
          })
        )}
      </div>
    </section>
  );
}
