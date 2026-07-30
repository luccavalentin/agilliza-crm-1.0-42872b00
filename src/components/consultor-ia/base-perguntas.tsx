import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, ChevronDown, Search, TriangleAlert } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Markdown } from "@/components/ui/markdown";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { listarPerguntasRespondidas } from "@/lib/consultor-ia/consultor-ia.functions";

/**
 * Base de conhecimento formada pelas perguntas já respondidas pelo consultor,
 * organizada e pesquisável por palavra-chave.
 */
export function BasePerguntasRespondidas({
  onReperguntar,
}: {
  onReperguntar?: (pergunta: string) => void;
}) {
  const [busca, setBusca] = useState("");
  const [chave, setChave] = useState<string | null>(null);
  const [aberto, setAberto] = useState<string | null>(null);

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
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14)
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

  return (
    <section className="rounded-xl border border-border/60 bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 p-3">
        <div className="flex items-center gap-2">
          <BookOpen className="size-4 text-primary" />
          <h2 className="text-sm font-semibold">Base de conhecimento</h2>
          <Badge variant="secondary" className="text-[11px]">
            {itens.length} perguntas respondidas
          </Badge>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            placeholder="Pesquisar por palavra-chave…"
            className="pl-8"
          />
        </div>
      </div>

      {palavrasChave.length > 0 ? (
        <div className="flex flex-wrap gap-1.5 border-b border-border/60 p-3">
          {palavrasChave.map((p) => (
            <button key={p.palavra} type="button" onClick={() => setChave(chave === p.palavra ? null : p.palavra)}>
              <Badge
                variant={chave === p.palavra ? "default" : "outline"}
                className="cursor-pointer text-[11px] capitalize"
              >
                {p.palavra} · {p.total}
              </Badge>
            </button>
          ))}
          {chave ? (
            <Button variant="ghost" size="sm" className="h-6 text-[11px]" onClick={() => setChave(null)}>
              Limpar filtro
            </Button>
          ) : null}
        </div>
      ) : null}

      <div className="max-h-[420px] space-y-1.5 overflow-y-auto p-3">
        {isLoading ? (
          <Skeleton className="h-20 w-full" />
        ) : filtrados.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">
            Nenhuma pergunta respondida encontrada para esta pesquisa.
          </p>
        ) : (
          filtrados.map((it) => (
            <Collapsible
              key={it.id}
              open={aberto === it.id}
              onOpenChange={(o) => setAberto(o ? it.id : null)}
              className="rounded-lg border border-border/60"
            >
              <CollapsibleTrigger className="flex w-full items-start gap-2 px-3 py-2 text-left text-sm hover:bg-muted/50">
                <ChevronDown
                  className={`mt-0.5 size-4 shrink-0 text-muted-foreground transition-transform ${
                    aberto === it.id ? "rotate-180" : ""
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{it.pergunta}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    {it.palavras_chave.map((p) => (
                      <Badge key={p} variant="secondary" className="text-[10px] capitalize">
                        {p}
                      </Badge>
                    ))}
                    {it.sem_resposta ? (
                      <Badge variant="outline" className="gap-1 text-[10px] text-amber-600">
                        <TriangleAlert className="size-3" />
                        fora da base
                      </Badge>
                    ) : null}
                  </span>
                </span>
                <span className="shrink-0 text-[11px] text-muted-foreground">
                  {new Date(it.created_at).toLocaleDateString("pt-BR")}
                </span>
              </CollapsibleTrigger>
              <CollapsibleContent className="border-t border-border/60 px-3 py-2.5">
                <Markdown conteudo={it.resposta} className="text-sm" />
                {it.fontes.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {it.fontes.map((f) => (
                      <Badge key={f.id} variant="secondary" className="text-[10px]">
                        Fonte: {f.categoria} — {f.titulo}
                      </Badge>
                    ))}
                  </div>
                ) : null}
                {onReperguntar ? (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-2.5 h-7 text-[11px]"
                    onClick={() => onReperguntar(it.pergunta)}
                  >
                    Perguntar novamente ao consultor
                  </Button>
                ) : null}
              </CollapsibleContent>
            </Collapsible>
          ))
        )}
      </div>
    </section>
  );
}
