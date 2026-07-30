import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { BookOpen, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import {
  CATEGORIAS_BASE,
  excluirItemBase,
  listarBaseConhecimento,
  listarSugestoesBase,
  resolverSugestaoBase,
  salvarItemBase,
  type ItemBase,
} from "@/lib/consultor-ia/consultor-ia.functions";

export const Route = createFileRoute("/_authenticated/admin/consultor-ia-base")({
  head: () => ({
    meta: [
      { title: "Base de conhecimento do Consultor IA — Agilliza" },
      {
        name: "description",
        content:
          "Curadoria dos conteúdos que fundamentam as respostas do Consultor IA da Agilliza.",
      },
    ],
  }),
  beforeLoad: () => assertModuloPermitido("admin.parametros"),
  component: BaseConhecimentoPage,
});

type Rascunho = {
  id?: string;
  categoria: string;
  titulo: string;
  conteudo: string;
  tags: string;
  ativo: boolean;
  global: boolean;
};

const VAZIO: Rascunho = {
  categoria: "Duvidas_Frequentes",
  titulo: "",
  conteudo: "",
  tags: "",
  ativo: true,
  global: true,
};

function BaseConhecimentoPage() {
  const qc = useQueryClient();
  const [q, setQ] = useState("");
  const [categoria, setCategoria] = useState("todas");
  const [editando, setEditando] = useState<Rascunho | null>(null);
  const [preview, setPreview] = useState(false);

  const { data: itens, isLoading } = useQuery({
    queryKey: ["consultor-ia-base", q, categoria],
    queryFn: () =>
      listarBaseConhecimento({ data: { q, categoria, incluirInativos: true } }),
  });

  const { data: sugestoes } = useQuery({
    queryKey: ["consultor-ia-sugestoes"],
    queryFn: () => listarSugestoesBase(),
  });

  const salvar = useMutation({
    mutationFn: (r: Rascunho) =>
      salvarItemBase({
        data: {
          id: r.id,
          categoria: r.categoria,
          titulo: r.titulo.trim(),
          conteudo: r.conteudo.trim(),
          tags: r.tags
            .split(",")
            .map((t) => t.trim())
            .filter(Boolean),
          ativo: r.ativo,
          global: r.global,
        },
      }),
    onSuccess: async () => {
      setEditando(null);
      await qc.invalidateQueries({ queryKey: ["consultor-ia-base"] });
      toast.success("Conteúdo salvo. O Consultor IA já passa a usá-lo.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao salvar."),
  });

  const excluir = useMutation({
    mutationFn: (id: string) => excluirItemBase({ data: { id } }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["consultor-ia-base"] });
      toast.success("Conteúdo removido.");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Falha ao remover."),
  });

  const resolver = useMutation({
    mutationFn: (v: { id: string; status: "resolvida" | "descartada" }) =>
      resolverSugestaoBase({ data: v }),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ["consultor-ia-sugestoes"] });
    },
  });

  function abrirEdicao(it: ItemBase) {
    setEditando({
      id: it.id,
      categoria: it.categoria,
      titulo: it.titulo,
      conteudo: it.conteudo,
      tags: it.tags.join(", "),
      ativo: it.ativo,
      global: it.correspondente_id === null,
    });
    setPreview(false);
  }

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-semibold">
            <BookOpen className="size-5 text-primary" />
            Base de conhecimento — Consultor IA
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Atualize aqui sempre que uma regra de banco ou regulação mudar — o Consultor IA
            responde com base nesse conteúdo.
          </p>
        </div>
        <Button
          onClick={() => {
            setEditando({ ...VAZIO });
            setPreview(false);
          }}
          className="gap-2"
        >
          <Plus className="size-4" />
          Novo conteúdo
        </Button>
      </header>

      {(sugestoes ?? []).length > 0 ? (
        <div className="rounded-xl border border-amber-500/40 bg-amber-500/5 p-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-amber-700 dark:text-amber-400">
            Sugestões da equipe ({sugestoes!.length})
          </p>
          <ul className="space-y-1.5">
            {sugestoes!.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center gap-2 text-sm">
                <span className="min-w-0 flex-1">{s.pergunta}</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs"
                  onClick={() => {
                    setEditando({ ...VAZIO, titulo: s.pergunta.slice(0, 120) });
                    setPreview(false);
                  }}
                >
                  Criar conteúdo
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 text-xs"
                  onClick={() => resolver.mutate({ id: s.id, status: "descartada" })}
                >
                  Descartar
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por título ou conteúdo"
            className="pl-8"
          />
        </div>
        <Select value={categoria} onValueChange={setCategoria}>
          <SelectTrigger className="w-[200px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas as categorias</SelectItem>
            {CATEGORIAS_BASE.map((c) => (
              <SelectItem key={c} value={c}>
                {c.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <Skeleton className="h-40 w-full" />
      ) : (itens ?? []).length === 0 ? (
        <p className="rounded-xl border border-border/60 bg-card p-6 text-center text-sm text-muted-foreground">
          Nenhum conteúdo cadastrado.
        </p>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(itens ?? []).map((it) => (
            <article
              key={it.id}
              className="rounded-xl border border-border/60 bg-card p-3.5 transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="secondary" className="text-[11px]">
                      {it.categoria.replace(/_/g, " ")}
                    </Badge>
                    {!it.ativo ? (
                      <Badge variant="outline" className="text-[11px]">
                        Inativo
                      </Badge>
                    ) : null}
                    {it.correspondente_id === null ? (
                      <Badge variant="outline" className="text-[11px]">
                        Global
                      </Badge>
                    ) : null}
                  </div>
                  <h2 className="mt-1.5 truncate text-sm font-medium">{it.titulo}</h2>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    aria-label="Editar"
                    onClick={() => abrirEdicao(it)}
                  >
                    <Pencil className="size-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="size-7"
                    aria-label="Excluir"
                    onClick={() => excluir.mutate(it.id)}
                  >
                    <Trash2 className="size-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
              <p className="mt-1.5 line-clamp-3 text-xs text-muted-foreground">
                {it.conteudo.replace(/[#*_`]/g, "").slice(0, 220)}
              </p>
            </article>
          ))}
        </div>
      )}

      <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
        <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle>{editando?.id ? "Editar conteúdo" : "Novo conteúdo"}</DialogTitle>
            <DialogDescription>
              O texto abaixo é enviado como referência para a IA responder.
            </DialogDescription>
          </DialogHeader>

          {editando ? (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Categoria</Label>
                  <Select
                    value={editando.categoria}
                    onValueChange={(v) => setEditando({ ...editando, categoria: v })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIAS_BASE.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c.replace(/_/g, " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label>Tags (separadas por vírgula)</Label>
                  <Input
                    value={editando.tags}
                    onChange={(e) => setEditando({ ...editando, tags: e.target.value })}
                    placeholder="fgts, sfh, carencia"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label>Título</Label>
                <Input
                  value={editando.titulo}
                  onChange={(e) => setEditando({ ...editando, titulo: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label>Conteúdo (markdown)</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="h-7 text-xs"
                    onClick={() => setPreview((p) => !p)}
                  >
                    {preview ? "Editar" : "Preview"}
                  </Button>
                </div>
                {preview ? (
                  <div className="min-h-[200px] rounded-md border border-border/60 bg-muted/30 p-3 text-sm">
                    <Markdown conteudo={editando.conteudo} />
                  </div>
                ) : (
                  <Textarea
                    value={editando.conteudo}
                    onChange={(e) => setEditando({ ...editando, conteudo: e.target.value })}
                    rows={12}
                    className="font-mono text-xs"
                  />
                )}
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={editando.ativo}
                    onCheckedChange={(v) => setEditando({ ...editando, ativo: v })}
                  />
                  Ativo
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch
                    checked={editando.global}
                    onCheckedChange={(v) => setEditando({ ...editando, global: v })}
                  />
                  Conteúdo global (vale para todos)
                </label>
              </div>
            </div>
          ) : null}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditando(null)}>
              Cancelar
            </Button>
            <Button
              disabled={
                salvar.isPending ||
                !editando ||
                editando.titulo.trim().length < 3 ||
                editando.conteudo.trim().length < 10
              }
              onClick={() => editando && salvar.mutate(editando)}
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
