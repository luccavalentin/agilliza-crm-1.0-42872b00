import { useState, useCallback } from "react";
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

export function useEnviarProposta() {
  const router = useRouter();
  const navigate = router.navigate;
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const enviarFnDefault = useServerFn(enviarPropostaHomeFin);
  const ressincronizarFn = useServerFn(ressincronizarDadosParticipantes);

  const enviar = useCallback(async ({ 
    propostaId, 
    bancoId,
    envolvidos,
    onCadastroIncompleto,
    enviarFn: customEnviarFn
  }: { 
    propostaId: string; 
    bancoId?: string;
    envolvidos?: any[];
    onCadastroIncompleto?: (primeiroPendente: any) => void;
    enviarFn?: (args: { data: { proposta_id: string; banco_id?: string } }) => Promise<any>;
  }) => {
    const fnParaUsar = customEnviarFn || enviarFnDefault;
    setBusy(true);
    const tid = toast.loading("Processando proposta...");
    try {
      // 1. Ressincronizar (Server-side CRM -> Proposta)
      const res = await ressincronizarFn({ data: { proposta_id: propostaId } });
      if (res.alterados > 0) {
        await qc.invalidateQueries({ queryKey: ["proposta", propostaId] });
      }

      // 2. Buscar envolvidos atualizados se não foram passados ou se houve alteração
      let currentEnvolvidos = envolvidos;
      if (!currentEnvolvidos || res.alterados > 0) {
        // Se res.alterados > 0, os envolvidos passados estão defasados.
        const atualizada = await qc.fetchQuery(propostaQueryOptions(propostaId));
        currentEnvolvidos = (atualizada as any)?.envolvidos ?? [];
      }

      // 3. Validar pendências
      const pendencias = (currentEnvolvidos || []).map(env => ({
        env,
        faltantes: faltantesEnvolvido(env)
      })).filter(p => p.faltantes.length > 0);

      if (pendencias.length > 0) {
        toast.dismiss(tid);
        const primeiro = pendencias[0].env;
        
        // Se estamos em outra tela, navega para a proposta
        const path = router.state.location.pathname;
        if (!path.includes(`/propostas/${propostaId}`)) {
          navigate({
            to: "/operacional/propostas/$id",
            params: { id: propostaId },
            search: { abrir_cadastro: primeiro.id },
          });
        } else {
          onCadastroIncompleto?.(primeiro);
        }
        return;
      }

      // 4. Enviar
      const r = await fnParaUsar({ data: { proposta_id: propostaId, banco_id: bancoId } });
      toast.success("Proposta enviada com sucesso.", { id: tid });
      
      await qc.invalidateQueries({ queryKey: ["proposta", propostaId] });
      
      return r;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Falha ao enviar proposta.";
      toast.error(msg, { id: tid });
      throw e;
    } finally {
      setBusy(false);
    }
  }, [enviarFnDefault, ressincronizarFn, qc, router, navigate]);

  return { enviar, busy };
}
