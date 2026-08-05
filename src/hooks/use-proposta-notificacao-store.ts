import { create } from "zustand";

interface PropostaNotificacao {
  id: string;
  numero: string;
  status: string;
  nome_cliente: string;
  banco: string;
}

interface PropostaNotificacaoStore {
  abertas: PropostaNotificacao[];
  adicionar: (notif: PropostaNotificacao) => void;
  remover: (id: string) => void;
}

/**
 * Store global para gerenciar popups de retorno de propostas.
 * Usado para exibir o aviso personalizado no meio da tela quando uma
 * proposta ou simulação recebe atualização do banco.
 */
export const usePropostaNotificacaoStore = create<PropostaNotificacaoStore>((set) => ({
  abertas: [],
  adicionar: (notif) =>
    set((state) => ({
      // Evita duplicados para a mesma proposta no mesmo ciclo
      abertas: state.abertas.find((n) => n.id === notif.id)
        ? state.abertas
        : [...state.abertas, notif],
    })),
  remover: (id) =>
    set((state) => ({
      abertas: state.abertas.filter((n) => n.id !== id),
    })),
}));
