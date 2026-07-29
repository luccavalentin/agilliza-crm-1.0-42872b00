import { useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Download, FileSpreadsheet, Loader2, Search, Trash2, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SITUACAO_LABEL } from "@/lib/conciliacao/bancos";
import { cruzarComSistema } from "@/lib/conciliacao/conciliacao.functions";
import {
  aplicarSistema,
  chavesParaSistema,
  cruzarPlanilhas,
  lerPlanilhaGenerica,
  RESULTADO_COMPARATIVO_LABEL,
  RESULTADO_COMPARATIVO_TONE,
  type ItemComparativo,
  type LadoPlanilha,
  type LinhaPlanilha,
  type ResultadoComparativo,
} from "@/lib/conciliacao/planilhas";
import { abaResumo, baixarXlsx } from "@/lib/conciliacao/exportar-xlsx";

const brl = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtValor = (v: number | null | undefined) => (v == null ? "—" : brl.format(Number(v)));

interface Lado {
  arquivos: { nome: string; linhas: number }[];
  linhas: LinhaPlanilha[];
}

const VAZIO: Lado = { arquivos: [], linhas: [] };

function Dropzone({
  titulo,
  descricao,
  lado,
  estado,
  onAdicionar,
  onLimpar,
}: {
  titulo: string;
  descricao: string;
  lado: LadoPlanilha;
  estado: Lado;
  onAdicionar: (files: FileList | null) => void;
  onLimpar: () => void;
}) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <Card className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="text-sm font-medium">{titulo}</div>
          <p className="text-xs text-muted-foreground">{descricao}</p>
        </div>
        {estado.arquivos.length > 0 && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onLimpar}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      <button
        type="button"
        onClick={() => ref.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onAdicionar(e.dataTransfer.files);
        }}
        className="flex flex-col items-center gap-1 rounded-lg border border-dashed px-4 py-6 text-center transition hover:bg-muted/40"
      >
        <Upload className="h-4 w-4 opacity-60" />
        <span className="text-xs text-muted-foreground">
          Arraste várias planilhas ou clique para selecionar
        </span>
      </button>
      <input
        ref={ref}
        type="file"
        multiple
        accept=".xlsx,.xls,.csv,.txt,.tsv"
        className="hidden"
        onChange={(e) => {
          onAdicionar(e.target.files);
          e.target.value = "";
        }}
        data-lado={lado}
      />

      {estado.arquivos.length > 0 && (
        <ul className="space-y-1">
          {estado.arquivos.map((a) => (
            <li
              key={a.nome}
              className="flex items-center justify-between gap-2 rounded border px-2 py-1 text-xs"
            >
              <span className="flex min-w-0 items-center gap-1.5">
                <FileSpreadsheet className="h-3.5 w-3.5 shrink-0 opacity-60" />
                <span className="truncate">{a.nome}</span>
              </span>
              <span className="font-mono tabular-nums text-muted-foreground">
                {a.linhas} linhas
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

/** Comparativo entre múltiplas planilhas próprias × relatórios de bancos. */
export function ComparadorPlanilhasDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const cruzarSistema = useServerFn(cruzarComSistema);
  const [controle, setControle] = useState<Lado>(VAZIO);
  const [banco, setBanco] = useState<Lado>(VAZIO);
  const [itens, setItens] = useState<ItemComparativo[] | null>(null);
  const [aba, setAba] = useState<"todos" | ResultadoComparativo>("todos");
  const [busca, setBusca] = useState("");
  const [ocupado, setOcupado] = useState(false);

  async function adicionar(lado: LadoPlanilha, files: FileList | null) {
    if (!files?.length) return;
    setOcupado(true);
    try {
      const novos: { nome: string; linhas: number }[] = [];
      const linhas: LinhaPlanilha[] = [];
      for (const f of Array.from(files)) {
        const lidas = await lerPlanilhaGenerica(f, lado);
        if (!lidas.length) {
          toast.warning(`Nenhuma linha reconhecida em ${f.name}.`);
          continue;
        }
        novos.push({ nome: f.name, linhas: lidas.length });
        linhas.push(...lidas);
      }
      const set = lado === "controle" ? setControle : setBanco;
      set((prev) => ({
        arquivos: [...prev.arquivos.filter((a) => !novos.some((n) => n.nome === a.nome)), ...novos],
        linhas: [
          ...prev.linhas.filter((l) => !novos.some((n) => n.nome === l.arquivo)),
          ...linhas,
        ],
      }));
      setItens(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao ler as planilhas.");
    } finally {
      setOcupado(false);
    }
  }

  async function comparar(comSistema: boolean) {
    if (!controle.linhas.length && !banco.linhas.length) {
      toast.error("Envie pelo menos uma planilha de cada lado.");
      return;
    }
    setOcupado(true);
    try {
      let resultado = cruzarPlanilhas(controle.linhas, banco.linhas);
      if (comSistema) {
        const encontrados = await cruzarSistema({
          data: { chaves: chavesParaSistema(resultado) },
        });
        resultado = aplicarSistema(resultado, encontrados as never);
      }
      setItens(resultado);
      setAba("todos");
      toast.success(
        comSistema
          ? "Planilhas cruzadas entre si e contra o sistema."
          : "Planilhas cruzadas entre si.",
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Falha ao cruzar os dados.");
    } finally {
      setOcupado(false);
    }
  }

  const filtrados = useMemo(() => {
    if (!itens) return [];
    const b = busca.trim().toLowerCase();
    return itens.filter((i) => {
      if (aba !== "todos" && i.resultado !== aba) return false;
      if (!b) return true;
      return [i.numeroProposta, i.nome, i.cpf, i.sistema?.numero_proposta]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(b));
    });
  }, [itens, aba, busca]);

  const contagens = useMemo(() => {
    const base: Record<string, number> = {
      todos: itens?.length ?? 0,
      igual: 0,
      divergente: 0,
      so_controle: 0,
      so_banco: 0,
    };
    for (const i of itens ?? []) base[i.resultado] = (base[i.resultado] ?? 0) + 1;
    return base;
  }, [itens]);

  function exportar() {
    if (!itens?.length) return;
    const linhas = itens.map((i) => ({
      resultado: RESULTADO_COMPARATIVO_LABEL[i.resultado],
      proposta: i.numeroProposta,
      cliente: i.nome,
      cpf: i.cpf,
      arquivoControle: i.controle?.arquivo,
      statusControle: i.controle?.status,
      valorControle: i.controle?.valor,
      arquivoBanco: i.banco?.arquivo,
      statusBanco: i.banco?.status,
      valorBanco: i.banco?.valor,
      sistemaProposta: i.sistema?.numero_proposta,
      sistemaStatus: i.sistema?.situacao
        ? (SITUACAO_LABEL[i.sistema.situacao] ?? i.sistema.situacao)
        : null,
      sistemaValor: i.sistema?.valor,
      divergencias: i.detalhes.join(" · "),
    }));
    const colunas = [
      { header: "Resultado", key: "resultado", width: 24 },
      { header: "Nº proposta", key: "proposta", width: 18 },
      { header: "Cliente", key: "cliente", width: 32 },
      { header: "CPF", key: "cpf", width: 16 },
      { header: "Arquivo (meu controle)", key: "arquivoControle", width: 28 },
      { header: "Status (meu controle)", key: "statusControle", width: 26 },
      { header: "Valor (meu controle)", key: "valorControle", tipo: "brl" as const, width: 18 },
      { header: "Arquivo (banco)", key: "arquivoBanco", width: 28 },
      { header: "Status (banco)", key: "statusBanco", width: 26 },
      { header: "Valor (banco)", key: "valorBanco", tipo: "brl" as const, width: 18 },
      { header: "Nº proposta (sistema)", key: "sistemaProposta", width: 20 },
      { header: "Status (sistema)", key: "sistemaStatus", width: 24 },
      { header: "Valor (sistema)", key: "sistemaValor", tipo: "brl" as const, width: 18 },
      { header: "Divergências", key: "divergencias", width: 52 },
    ];
    const porResultado = (r: ResultadoComparativo) =>
      linhas.filter((l) => l.resultado === RESULTADO_COMPARATIVO_LABEL[r]);

    baixarXlsx(`agilliza-comparativo-planilhas-${new Date().toISOString().slice(0, 10)}`, [
      abaResumo("Comparativo de planilhas", [
        { rotulo: "Gerado em", valor: new Date().toLocaleString("pt-BR") },
        { rotulo: "Planilhas do meu controle", valor: controle.arquivos.length },
        { rotulo: "Planilhas de bancos", valor: banco.arquivos.length },
        { rotulo: "Registros comparados", valor: itens.length },
        { rotulo: "Coincidentes", valor: contagens.igual ?? 0 },
        { rotulo: "Divergentes", valor: contagens.divergente ?? 0 },
        { rotulo: "Só no meu controle", valor: contagens.so_controle ?? 0 },
        { rotulo: "Só no relatório do banco", valor: contagens.so_banco ?? 0 },
      ]),
      { nome: "Todos", colunas, linhas },
      { nome: "Divergentes", colunas, linhas: porResultado("divergente") },
      { nome: "Só meu controle", colunas, linhas: porResultado("so_controle") },
      { nome: "Só banco", colunas, linhas: porResultado("so_banco") },
      { nome: "Coincidentes", colunas, linhas: porResultado("igual") },
    ]);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-6xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Comparativo de planilhas e dados</DialogTitle>
          <DialogDescription>
            Envie de um lado as suas planilhas de controle e do outro os relatórios dos
            bancos. O sistema cruza as planilhas entre si e, se quiser, também contra as
            propostas cadastradas.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 md:grid-cols-2">
          <Dropzone
            titulo="Meu controle"
            descricao="Suas planilhas internas (XLSX, XLS, CSV ou TXT tabulado)."
            lado="controle"
            estado={controle}
            onAdicionar={(f) => void adicionar("controle", f)}
            onLimpar={() => {
              setControle(VAZIO);
              setItens(null);
            }}
          />
          <Dropzone
            titulo="Relatórios dos bancos"
            descricao="Relatórios oficiais recebidos dos bancos."
            lado="banco"
            estado={banco}
            onAdicionar={(f) => void adicionar("banco", f)}
            onLimpar={() => {
              setBanco(VAZIO);
              setItens(null);
            }}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => void comparar(false)} disabled={ocupado} variant="outline">
            {ocupado && <Loader2 className="h-4 w-4 animate-spin" />}
            Cruzar planilhas
          </Button>
          <Button onClick={() => void comparar(true)} disabled={ocupado}>
            {ocupado && <Loader2 className="h-4 w-4 animate-spin" />}
            Cruzar planilhas + sistema
          </Button>
          <span className="text-xs text-muted-foreground">
            {controle.linhas.length} linhas no controle · {banco.linhas.length} linhas dos
            bancos
          </span>
        </div>

        {itens && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <Tabs value={aba} onValueChange={(v) => setAba(v as typeof aba)}>
                <TabsList>
                  <TabsTrigger value="todos">Todos ({contagens.todos})</TabsTrigger>
                  <TabsTrigger value="divergente">
                    Divergentes ({contagens.divergente})
                  </TabsTrigger>
                  <TabsTrigger value="so_controle">
                    Só meu controle ({contagens.so_controle})
                  </TabsTrigger>
                  <TabsTrigger value="so_banco">Só banco ({contagens.so_banco})</TabsTrigger>
                  <TabsTrigger value="igual">Coincidem ({contagens.igual})</TabsTrigger>
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
                <Button variant="outline" size="sm" onClick={exportar}>
                  <Download className="h-3.5 w-3.5" />
                  Planilha consolidada
                </Button>
              </div>
            </div>

            <div className="max-h-[420px] overflow-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[170px]">Resultado</TableHead>
                    <TableHead>Proposta</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Meu controle</TableHead>
                    <TableHead>Banco</TableHead>
                    <TableHead>Sistema</TableHead>
                    <TableHead>Divergências</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtrados.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="py-10 text-center text-sm text-muted-foreground"
                      >
                        Nenhum registro nesta visão.
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtrados.slice(0, 500).map((i, idx) => (
                      <TableRow key={`${i.chave}-${idx}`} className={idx % 2 ? "bg-muted/25" : undefined}>
                        <TableCell>
                          <Badge variant="outline" className={RESULTADO_COMPARATIVO_TONE[i.resultado]}>
                            {RESULTADO_COMPARATIVO_LABEL[i.resultado]}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs tabular-nums">
                          {i.numeroProposta ?? "—"}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm">
                          <div className="truncate">{i.nome ?? "—"}</div>
                          <div className="font-mono text-[11px] text-muted-foreground">
                            {i.cpf ?? ""}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>{i.controle?.status ?? "—"}</div>
                          <div className="font-mono text-muted-foreground">
                            {fmtValor(i.controle?.valor ?? null)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <div>{i.banco?.status ?? "—"}</div>
                          <div className="font-mono text-muted-foreground">
                            {fmtValor(i.banco?.valor ?? null)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          {i.sistema ? (
                            <>
                              <div>
                                {i.sistema.situacao
                                  ? (SITUACAO_LABEL[i.sistema.situacao] ?? i.sistema.situacao)
                                  : "—"}
                              </div>
                              <div className="font-mono text-muted-foreground">
                                {fmtValor(i.sistema.valor)}
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Não localizada</span>
                          )}
                        </TableCell>
                        <TableCell className="max-w-[260px] text-[11px] text-muted-foreground">
                          {i.detalhes.length ? i.detalhes.join(" · ") : "—"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
            {filtrados.length > 500 && (
              <p className="text-[11px] text-muted-foreground">
                Exibindo as 500 primeiras linhas — a planilha consolidada traz tudo.
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
