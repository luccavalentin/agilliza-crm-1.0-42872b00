import { useState, useEffect, useRef, useMemo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ESTADO_CIVIL_COM_REGIME } from "@/lib/propostas/dominios";
import { LABEL_POR_CHAVE, faltantesEnvolvido } from "@/lib/propostas/campos-obrigatorios";
import { ressincronizarDadosParticipantes } from "@/lib/propostas/propostas.functions";
import { CamposParticipante } from "./participante-form/campos-participante";
import {
  camposFaltantes,
  formParaEnvolvido,
  VAZIO,
  type ParticipanteForm,
  envolvidoParaForm,
  participanteCompleto,
} from "./participante-form/types";

// Re-exports públicos (mantém compatibilidade com callers atuais).
export {
  envolvidoParaForm,
  formParaEnvolvido,
  participanteCompleto,
  type ParticipanteForm,
} from "./participante-form/types";

export function ParticipanteDialog({
  open,
  onOpenChange,
  titulo,
  onEnviarAgora,
  inicial,
  conjugeInicial,
  tipoQualificacaoFixo,
  salvando,
  onSalvar,
  idBanco,
  focarPendencias,
  rodapeExtra,
  avisoTopo,
  participanteIndex,
  totalParticipantes,
  propostaId,
  onSalvoPermanecer,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  titulo: string;
  inicial?: ParticipanteForm;
  conjugeInicial?: ParticipanteForm;
  tipoQualificacaoFixo?: string;
  salvando?: boolean;
  onSalvar: (
    principal: ReturnType<typeof formParaEnvolvido>,
    conjuge: ReturnType<typeof formParaEnvolvido> | null,
  ) => Promise<void> | void;
  /** Callback para disparar o envio ao banco diretamente do modal após validar/salvar. */
  onEnviarAgora?: () => void;
  idBanco?: number;
  /** Abre já destacando (e rolando até) o primeiro campo obrigatório pendente. */
  focarPendencias?: boolean;
  /** Conteúdo extra no rodapé (ex.: "Enviar ao banco agora"). */
  rodapeExtra?: React.ReactNode;
  /** Faixa informativa no topo do formulário. */
  avisoTopo?: React.ReactNode;
  /** Índice do participante atual para exibição de progresso. */
  participanteIndex?: number;
  /** Total de participantes para exibição de progresso. */
  totalParticipantes?: number;
  /** ID da proposta para ressincronização. */
  propostaId?: string;
  /** Callback opcional chamado após salvar com sucesso e permanecer no modal. */
  onSalvoPermanecer?: () => void;
}) {
  const qc = useQueryClient();
  const ressincronizarFn = useServerFn(ressincronizarDadosParticipantes);
  const [salvandoInterno, setSalvandoInterno] = useState(false);

  const [f, setF] = useState<ParticipanteForm>(inicial ?? VAZIO);
  const [conjuge, setConjuge] = useState<ParticipanteForm>(
    conjugeInicial ?? { ...VAZIO, tipo_qualificacao: "TI" },
  );
  const [buscandoCep, setBuscandoCep] = useState(false);
  const [buscandoCepC, setBuscandoCepC] = useState(false);
  const [erros, setErros] = useState<Set<string>>(new Set());
  const [errosC, setErrosC] = useState<Set<string>>(new Set());
  const [tentouEnviar, setTentouEnviar] = useState(false);
  const corpoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setF(inicial ?? { ...VAZIO, tipo_qualificacao: tipoQualificacaoFixo ?? "CO" });
      setConjuge(conjugeInicial ?? { ...VAZIO, tipo_qualificacao: "TI" });
      setErros(new Set());
      setErrosC(new Set());
      setTentouEnviar(Boolean(focarPendencias));
    }
  }, [open, inicial, conjugeInicial, tipoQualificacaoFixo, focarPendencias]);

  // Após a primeira tentativa, revalida ao vivo para o vermelho sumir conforme preenche.
  useEffect(() => {
    if (tentouEnviar) setErros(camposFaltantes(f));
  }, [f, tentouEnviar]);

  useEffect(() => {
    if (tentouEnviar) setErrosC(camposFaltantes(conjuge));
  }, [conjuge, tentouEnviar]);

  // Rola até o primeiro campo pendente quando o modal abre em modo "completar".
  useEffect(() => {
    if (!open || !focarPendencias) return;
    const t = setTimeout(() => {
      const alvo = corpoRef.current?.querySelector<HTMLElement>(".border-destructive");
      alvo?.scrollIntoView({ block: "center", behavior: "smooth" });
      alvo?.focus?.();
    }, 120);
    return () => clearTimeout(t);
  }, [open, focarPendencias, erros]);



  const pf = f.tipo_pessoa === "F";
  const permiteConjuge = true;
  const precisaConjuge = permiteConjuge && pf && ESTADO_CIVIL_COM_REGIME.has(f.estado_civil);

  const set = (patch: Partial<ParticipanteForm>) => setF((p) => ({ ...p, ...patch }));
  const setC = (patch: Partial<ParticipanteForm>) => setConjuge((p) => ({ ...p, ...patch }));

  const conjugeTemDados = [
    conjuge.nome,
    conjuge.cpf_cnpj,
    conjuge.data_nascimento,
    conjuge.nome_mae,
    conjuge.tipo_sexo,
    conjuge.tipo_documento_identidade,
    conjuge.numero_documento,
    conjuge.orgao_expedidor,
    conjuge.uf_expedicao,
    conjuge.data_expedicao,
    conjuge.profissao,
    conjuge.empresa,
    conjuge.email,
    conjuge.celular,
    conjuge.cep,
    conjuge.logradouro,
    conjuge.numero_logradouro,
    conjuge.complemento,
    conjuge.bairro,
    conjuge.municipio,
    conjuge.uf,
  ].some((valor) => String(valor ?? "").trim().length > 0) || conjuge.renda > 0;

  /** Cônjuge normalizado que será salvo junto com o titular (quando houver). */
  const conjugeParaSalvar: ParticipanteForm | null = useMemo(
    () =>
      precisaConjuge && conjugeTemDados
        ? {
            ...conjuge,
            tipo_qualificacao: "TI",
            tipo_pessoa: "F",
            estado_civil: f.estado_civil,
            regime_casamento: f.regime_casamento,
          }
        : null,
    [precisaConjuge, conjugeTemDados, conjuge, f.estado_civil, f.regime_casamento],
  );

  // Validade calculada EM TEMPO REAL a partir do formulário (nunca a partir do
  // estado de erro, que só é preenchido após a primeira tentativa).
  const pendentesAgora = useMemo(() => {
    const chaves = [
      ...camposFaltantes(f),
      ...(conjugeParaSalvar ? camposFaltantes(conjugeParaSalvar) : []),
    ];
    return Array.from(new Set(chaves)).map((k) => LABEL_POR_CHAVE[k] ?? k);
  }, [f, conjugeParaSalvar]);

  const podeEnviar = pendentesAgora.length === 0;


  async function buscarCep(
    cepRaw: string,
    aplicar: (patch: Partial<ParticipanteForm>) => void,
    atual: ParticipanteForm,
    setLoading: (v: boolean) => void,
  ) {
    const cep = cepRaw.replace(/\D/g, "");
    if (cep.length !== 8) return;
    setLoading(true);
    try {
      const resp = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const dados = await resp.json();
      if (dados?.erro) {
        toast.error("CEP não encontrado.");
        return;
      }
      aplicar({
        logradouro: dados.logradouro || atual.logradouro,
        bairro: dados.bairro || atual.bairro,
        municipio: dados.localidade || atual.municipio,
        uf: dados.uf || atual.uf,
      });
    } catch {
      toast.error("Não foi possível consultar o CEP.");
    } finally {
      setLoading(false);
    }
  }

  async function submit(enviar: boolean) {
    setTentouEnviar(true);

    // 1. Ressincroniza antes de qualquer validação (P1.g)
    if (propostaId && !salvandoInterno) {
      setSalvandoInterno(true);
      const tid = toast.loading("Sincronizando dados com o CRM...");
      try {
        await ressincronizarFn({ data: { proposta_id: propostaId } });
        await qc.invalidateQueries({ queryKey: ["proposta", propostaId] });
        toast.success("Dados sincronizados.", { id: tid });
      } catch (err) {
        console.error("Erro na ressincronização automática:", err);
        toast.dismiss(tid);
      } finally {
        setSalvandoInterno(false);
      }
    }

    const faltando = camposFaltantes(f);
    setErros(faltando);

    const c: ParticipanteForm | null = conjugeParaSalvar;
    const faltandoC = c ? camposFaltantes(c) : new Set<string>();
    setErrosC(faltandoC);

    if (faltando.size > 0 || faltandoC.size > 0) {
      toast.error(
        `Não é possível salvar: faltam dados obrigatórios destacados em vermelho.`,
      );
      return;
    }

    const conjugePayload = c ? formParaEnvolvido(c) : null;
    await onSalvar(formParaEnvolvido(f), conjugePayload, { enviar });

    // Após salvar, revalida para atualizar o estado visual se permanecer no modal
    setTentouEnviar(true);
    onSalvoPermanecer?.();
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] w-[95vw] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4">
            <DialogTitle>{titulo}</DialogTitle>
            {participanteIndex !== undefined && totalParticipantes !== undefined && (
              <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                Participante {participanteIndex} de {totalParticipantes}
              </span>
            )}
          </div>
          <DialogDescription>
            Dados complementares enviados aos bancos quando a proposta é processada.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5" ref={corpoRef}>
          {avisoTopo}
          <CamposParticipante
            f={f}
            set={set}
            erros={erros}
            buscandoCep={buscandoCep}
            onBuscarCep={(m) => buscarCep(m, set, f, setBuscandoCep)}
            mostrarQualificacao={!tipoQualificacaoFixo}
            mostrarEstadoCivil
            mostrarIdentificacaoExtra
            idBanco={idBanco}
          />


          {precisaConjuge && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 sm:p-4">
              <p className="mb-3 text-sm font-semibold text-primary">
                Dados do cônjuge / coproponente
              </p>
              <div className="space-y-5">
                <CamposParticipante
                  f={conjuge}
                  set={setC}
                  erros={errosC}
                  buscandoCep={buscandoCepC}
                  onBuscarCep={(m) => buscarCep(m, setC, conjuge, setBuscandoCepC)}
                  mostrarQualificacao={false}
                  mostrarEstadoCivil={false}
                  mostrarIdentificacaoExtra={false}
                  idBanco={idBanco}
                />

              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center">
          <div className="flex-1">
            {tentouEnviar && (erros.size === 0 && errosC.size === 0) && (
              <div className="flex items-center gap-3">
                <p className="text-[11px] font-bold text-emerald-600 flex items-center gap-1 uppercase tracking-wider">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Tudo pronto para enviar
                </p>
                {onEnviarAgora && (
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-primary font-bold animate-pulse" 
                    onClick={onEnviarAgora}
                  >
                    Enviar proposta agora →
                  </Button>
                )}
              </div>
            )}
          </div>
          <div className="flex gap-2">
            {rodapeExtra}
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={salvando}>
              Cancelar
            </Button>
            <Button onClick={submit} disabled={salvando}>
              {salvando && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              Salvar
            </Button>
          </div>
        </DialogFooter>

      </DialogContent>
    </Dialog>
  );
}
