import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePropostaNotificacaoStore } from "@/hooks/use-proposta-notificacao-store";
import { signalIncomingChat } from "@/components/shared/chat-alert-store";

interface Props {
  userId?: string | null;
}

/**
 * Observador global de retornos de propostas e simulações.
 * Quando o banco atualiza uma proposta (ou simulação), dispara um popup
 * no meio da tela e uma notificação sonora.
 */
export function PropostaRetornoWatcher({ userId }: Props) {
  const seenIds = useRef<Set<string>>(new Set());
  const seenSimIds = useRef<Set<string>>(new Set());
  const adicionarPopup = usePropostaNotificacaoStore((s: any) => s.adicionar);

  useEffect(() => {
    if (!userId) return;

    // Monitora alterações em simulacao_historico para testes de CPF
    const channelSim = supabase
      .channel("rt-simulacao-historico")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "simulacao_historico",
        },
        async (payload) => {
          const row = payload.new as any;
          if (row.tipo === "info" && row.descricao.includes("testou ambos os proponentes")) {
            const { data: sim } = await supabase
              .from("simulacoes")
              .select("id, numero_simulacao, nome_cliente, usuario_responsavel_id, usuario_criador_id")
              .eq("id", row.simulacao_id)
              .maybeSingle();

            if (!sim || (sim.usuario_responsavel_id !== userId && sim.usuario_criador_id !== userId)) return;

            const uniqueKey = `sim-info-${row.id}`;
            if (seenSimIds.current.has(uniqueKey)) return;
            seenSimIds.current.add(uniqueKey);

            adicionarPopup({
              id: sim.id,
              numero: sim.numero_simulacao,
              status: "Comparativo de Taxas Concluído",
              nome_cliente: sim.nome_cliente || "—",
              banco: "Multi-proponente",
            });
          }
        }
      )
      .subscribe();


    // Monitora alterações em proposta_bancos (onde o retorno do banco chega)
    const channel = supabase
      .channel("rt-propostas-retorno")
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "proposta_bancos",
        },
        async (payload) => {
          const row = payload.new as any;
          if (!row.id || !row.proposta_id) return;
          
          // Só alerta se houver mudança de status ou mensagem significativa do banco
          const old = payload.old as any;
          if (old && old.status_banco === row.status_banco && old.mensagem_banco === row.mensagem_banco) {
            return;
          }

          // Busca dados da proposta para o popup
          const { data: prop } = await supabase
            .from("propostas")
            .select("id, numero_proposta, nome_cliente, usuario_responsavel_id, usuario_criador_id")
            .eq("id", row.proposta_id)
            .maybeSingle();

          if (!prop) return;

          // Só alerta o responsável ou criador
          if (prop.usuario_responsavel_id !== userId && prop.usuario_criador_id !== userId) {
            return;
          }

          const uniqueKey = `${row.id}-${row.status_banco}-${row.updated_at}`;
          if (seenIds.current.has(uniqueKey)) return;
          seenIds.current.add(uniqueKey);

          // Dispara Alerta Sonoro e Notificação (reutilizando sistema de chat)
          signalIncomingChat(`prop-${row.id}`, {
            titulo: `Retorno de Proposta: ${row.nome_banco || "Banco"}`,
            corpo: `Proposta ${prop.numero_proposta} - Cliente: ${prop.nome_cliente || "—"}`,
            skipSound: false,
          });
          
          // Garante som
          import("@/lib/chat-sound").then(m => m.playChatSound());

          // Adiciona ao Store para exibir o Popup Personalizado
          adicionarPopup({
            id: row.id,
            numero: prop.numero_proposta,
            status: row.status_banco || "Atualizada",
            nome_cliente: prop.nome_cliente || "—",
            banco: row.nome_banco || "Banco",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(channelSim);
    };
  }, [userId, adicionarPopup]);


  return null;
}
