import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export interface ChecklistItem {
  id: string;
  banco: "itau" | "caixa" | "inter" | "bradesco" | "santander";
  categoria: string;
  documento: string;
  obrigatorio: boolean;
  observacao?: string;
}

export const CHECKLISTS_BANCOS: Record<string, { docs: string[], logos: string[] }> = {
  itau: {
    docs: [
      "RG ou CNH (Proponente e Cônjuge)",
      "Comprovante de Estado Civil",
      "Comprovante de Residência atual (máximo 60 dias)",
      "Comprovante de Renda (Holerites ou Extratos Bancários)",
      "Declaração de Imposto de Renda Completa",
      "Ficha Cadastral Itaú preenchida",
    ],
    logos: ["itau"],
  },
  caixa: {
    docs: [
      "RG ou CNH (Proponente e Cônjuge)",
      "Comprovante de Estado Civil",
      "Comprovante de Residência",
      "Comprovante de Renda (3 últimos meses)",
      "CTPS (Física ou Digital) e extrato FGTS",
      "Declaração de Imposto de Renda e Recibo",
      "Formulários Caixa (CCA)",
    ],
    logos: ["caixa"],
  },
  inter: {
    docs: [
      "Documento de Identidade",
      "Comprovante de Estado Civil",
      "Comprovante de Residência",
      "Comprovante de Renda",
      "Declaração de IR",
    ],
    logos: ["inter"],
  },
  bradesco: {
    docs: [
      "RG ou CNH",
      "Comprovante de Estado Civil",
      "Comprovante de Residência",
      "Comprovante de Renda",
      "Declaração de IR",
      "Ficha Cadastral Bradesco",
    ],
    logos: ["bradesco"],
  },
  santander: {
    docs: [
      "RG ou CNH",
      "Comprovante de Estado Civil",
      "Comprovante de Residência",
      "Comprovante de Renda",
      "Declaração de IR",
      "Ficha Cadastral Santander",
    ],
    logos: ["santander"],
  },
};

export const obterChecklistBanco = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ({ banco: String(d) }))
  .handler(async ({ data }) => {
    return CHECKLISTS_BANCOS[data.banco] || null;
  });
