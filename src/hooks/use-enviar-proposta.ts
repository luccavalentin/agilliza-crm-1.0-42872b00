import { useState, useCallback, useMemo } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useRouter } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  enviarPropostaHomeFin, 
  ressincronizarDadosParticipantes 
} from "@/lib/propostas/propostas.functions";
import { faltantesEnvolvido } from "@/lib/propostas/campos-obrigatorios";
import { propostaQueryOptions } from "@/lib/propostas/queries";

export type EtapaEnvio = "preparando" | "participantes" | "simulacao" | "enviando" | "aguardando";

export interface StatusEnvioBanco {
  bancoId: string;
  status: "idle" | "loading" | "success" | "error";
  etapa?: EtapaEnvio;
  etapaNumero?: number;
  mensagem?: string;
  protocolo?: string;
  propostaId?: string;
  numeroProposta?: string;
  tempoDecorrido?: number;
}

export function useEnviarProposta() {
  const router = useRouter();
  const navigate = router.navigate;
  const qc = useQueryClient();
  const [statusPorBanco, setStatusPorBanco] = useState<Record<string, StatusEnvioBanco>>({});
  const [tempoInicio, setTempoInicio] = useState<number | null>(null);
  
  const enviarFnDefault = useServerFn(enviarPropostaHomeFin);
  const ressincronizarFn = useServerFn(ressincronizarDadosParticipantes);

  const busy = useMemo(() => 
    Object.values(statusPorBanco).some(s => s.status === "loading"), 
  [statusPorBanco]);

  const atualizarStatus = useCallback((bancoId: string, patch: Partial<StatusEnvioBanco>) => {
    setStatusPorBanco(prev => ({
      ...prev,
      [bancoId]: { ...(prev[bancoId] || { bancoId, status: "idle" }), ...patch }
    }));
  }, []);

  const enviar = useCallback(async ({ 
    propostaId, 
    bancoId,
    envolvidos,
    onCadastroIncompleto,
    enviarFn: customEnviarFn
  }: { 
    propostaId: string; 
    bancoId: string; // Tornando obrigatório para o novo fluxo por banco
    envolvidos?: any[];
    onCadastroIncompleto?: (primeiroPendente: any) => void;
    enviarFn?: (args: { data: { proposta_id: string; banco_id?: string } }) => Promise<any>;
  }) => {
    const fnParaUsar = customEnviarFn || enviarFnDefault;
    
    atualizarStatus(bancoId, { 
      status: "loading", 
      etapa: "preparando", 
      etapaNumero: 1, 
      mensagem: "Preparando dados...",
      tempoDecorrido: 0
    });

    const startTime = Date.now();
    const interval = setInterval(() => {
      atualizarStatus(bancoId, { tempoDecorrido: Math.round((Date.now() - startTime) / 1000) });
    }, 1000);

    try {
      // 1. Ressincronizar (etapa 1 de 5)
      atualizarStatus(bancoId, { etapa: "preparando", etapaNumero: 1, mensagem: "Sincronizando participantes..." });
      const res = await ressincronizarFn({ data: { proposta_id: propostaId } });

      // 2. Validar (etapa 2 de 5)
      atualizarStatus(bancoId, { etapa: "participantes", etapaNumero: 2, mensagem: "Validando dados obrigatórios..." });
      let currentEnvolvidos = envolvidos;
      if (!currentEnvolvidos || res.alterados > 0) {
        const atualizada = await qc.fetchQuery({
          ...propostaQueryOptions(propostaId),
          staleTime: 0,
        });
        currentEnvolvidos = (atualizada as any)?.envolvidos ?? [];
      }

      const pendencias = (currentEnvolvidos || []).map(env => ({
        env,
        faltantes: faltantesEnvolvido(env)
      })).filter(p => p.faltantes.length > 0);

      if (pendencias.length > 0) {
        clearInterval(interval);
        atualizarStatus(bancoId, { 
          status: "error", 
          mensagem: "Cadastro incompleto" 
        });
        const primeiro = pendencias[0].env;
        onCadastroIncompleto?.(primeiro);
        return;
      }

      // 3. Simulação (etapa 3 de 5)
      atualizarStatus(bancoId, { etapa: "simulacao", etapaNumero: 3, mensagem: "Sincronizando simulação bancária..." });

      // 4. Enviar (etapa 4 de 5)
      atualizarStatus(bancoId, { etapa: "enviando", etapaNumero: 4, mensagem: "Enviando ao banco..." });
      const r = await fnParaUsar({ data: { proposta_id: propostaId, banco_id: bancoId } });

      // 5. Aguardar (etapa 5 de 5)
      atualizarStatus(bancoId, { etapa: "aguardando", etapaNumero: 5, mensagem: "Aguardando retorno final..." });

      clearInterval(interval);
      
      const protocolo = r?.bancos?.find((b: any) => b.banco_id === bancoId)?.numero_proposta_banco;
      
      atualizarStatus(bancoId, { 
        status: "success", 
        protocolo,
        propostaId: r?.proposta_id,
        numeroProposta: r?.numero_proposta,
        mensagem: protocolo ? "Enviada com sucesso" : "Aguardando confirmação"
      });
      
      await qc.invalidateQueries({ queryKey: ["proposta", propostaId] });
      return r;
    } catch (e) {
      clearInterval(interval);
      const msg = e instanceof Error ? e.message : "Falha ao enviar proposta.";
      atualizarStatus(bancoId, { 
        status: "error", 
        mensagem: msg 
      });
      throw e;
    }
  }, [enviarFnDefault, ressincronizarFn, qc, atualizarStatus]);

  const limparStatus = useCallback(() => setStatusPorBanco({}), []);

  return { enviar, busy, statusPorBanco, limparStatus };
}
