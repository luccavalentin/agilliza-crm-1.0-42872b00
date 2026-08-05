/**
 * Indicador compacto de renda necessária, exibido como um "chip/card" colorido
 * logo abaixo do campo de renda familiar. A cor reflete a folga da renda
 * informada em relação à renda mínima estimada (verde/amarelo/vermelho).
 */
import { AlertTriangle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { formatBRL } from "@/lib/simulacao/format";
import {
  avaliarRendaMinima,
  rendaMinimaPelosBancos,
  type BancoRendaApi,
} from "@/lib/simulacao/renda";
import type { SistemaAmortizacao } from "@/lib/simulacao/simulacao-rapida";

import { cn } from "@/lib/utils";

interface Props {
  valorFinanciamento: number;
  valorImovel?: number | null;
  prazoMeses: number;
  taxaAno: number;
  sistema: SistemaAmortizacao | "AMBOS";
  rendaInformada?: number | null;
  bancos?: BancoRendaApi[] | null;
  compoeRendaConjuge?: boolean;
}


type Tone = "success" | "warning" | "danger" | "info";

const TONE_STYLES: Record<Tone, { accent: string; iconBox: string; icon: string; status: string }> = {
  success: {
    accent: "bg-success",
    iconBox: "bg-success/10 ring-success/20",
    icon: "text-success",
    status: "text-success",
  },
  warning: {
    accent: "bg-warning",
    iconBox: "bg-warning/15 ring-warning/25",
    icon: "text-warning-foreground",
    status: "text-warning-foreground",
  },
  danger: {
    accent: "bg-destructive",
    iconBox: "bg-destructive/10 ring-destructive/20",
    icon: "text-destructive",
    status: "text-destructive",
  },
  info: {
    accent: "bg-primary",
    iconBox: "bg-primary/10 ring-primary/20",
    icon: "text-primary",
    status: "text-primary",
  },
};

export function DicaRendaMinima(props: Props) {
  const { 
    valorFinanciamento, 
    valorImovel, 
    prazoMeses, 
    taxaAno, 
    sistema, 
    rendaInformada, 
    bancos,
    compoeRendaConjuge 
  } = props;

  if (sistema === "AMBOS") {
    const evalSac = avaliarRendaMinima({
      valor_financiamento: valorFinanciamento,
      valor_imovel: valorImovel,
      prazo_meses: prazoMeses,
      taxa_ano: taxaAno,
      renda_informada: rendaInformada,
      sistema: "S",
    });

    const evalPrice = avaliarRendaMinima({
      valor_financiamento: valorFinanciamento,
      valor_imovel: valorImovel,
      prazo_meses: prazoMeses,
      taxa_ano: taxaAno,
      renda_informada: rendaInformada,
      sistema: "P",
    });

    if (!evalSac || !evalPrice) return null;

    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-col gap-1.5 rounded-xl border border-border/70 bg-card/50 p-3 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-bold text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                SAC
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Renda {compoeRendaConjuge ? "familiar" : "titular"}
              </span>
            </div>
            <span className={cn("font-mono text-sm font-bold tabular-nums", evalSac.suficiente === false ? "text-destructive" : "text-emerald-600")}>
              {formatBRL(evalSac.rendaMinima)}
            </span>
          </div>
          
          <div className="flex items-center justify-between gap-3 border-t border-border/40 pt-1.5">
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                PRICE
              </span>
              <span className="text-[11px] font-medium text-muted-foreground">
                Renda {compoeRendaConjuge ? "familiar" : "titular"}
              </span>
            </div>
            <span className={cn("font-mono text-sm font-bold tabular-nums", evalPrice.suficiente === false ? "text-destructive" : "text-emerald-600")}>
              {formatBRL(evalPrice.rendaMinima)}
            </span>
          </div>
        </div>
        {compoeRendaConjuge && (
          <p className="px-1 text-[10px] text-muted-foreground italic">
            Sugestão: {formatBRL(Math.max(evalSac.rendaMinima, evalPrice.rendaMinima) / 2)} para cada proponente
          </p>
        )}
      </div>
    );
  }

  const apiEval = rendaMinimaPelosBancos(bancos, rendaInformada);
  const local = avaliarRendaMinima({
    valor_financiamento: valorFinanciamento,
    valor_imovel: valorImovel,
    prazo_meses: prazoMeses,
    taxa_ano: taxaAno,
    renda_informada: rendaInformada,
    sistema: sistema,
  });

  const principal = apiEval ?? local;
  if (!principal) return null;

  const rendaMin = principal.rendaMinima;
  const informada = Number(rendaInformada ?? 0);

  // Define tom pela folga da renda informada em relação à mínima
  let tone: Tone = "info";
  let Icon = Info;

  if (informada > 0 && rendaMin > 0) {
    const ratio = informada / rendaMin;
    if (ratio >= 1) {
      tone = "success";
      Icon = CheckCircle2;
    } else if (ratio >= 0.85) {
      tone = "warning";
      Icon = TriangleAlert;
    } else {
      tone = "danger";
      Icon = AlertTriangle;
    }
  }

  const s = TONE_STYLES[tone];

  return (
    <div className="flex flex-col gap-1">
      <div className="mt-2 flex items-center justify-between gap-3 overflow-hidden rounded-lg border border-border/70 bg-card px-3 py-2 shadow-sm">
        <div className="flex min-w-0 items-center gap-2">
          <Icon className={cn("h-4 w-4 shrink-0", s.icon)} aria-hidden />
          <span className="text-xs font-medium text-muted-foreground">Renda necessária {compoeRendaConjuge ? "familiar" : "titular"}</span>
        </div>
        <p className={cn("font-mono text-sm font-semibold tabular-nums", s.status)}>
          {formatBRL(rendaMin)}
        </p>
      </div>
      {compoeRendaConjuge && (
        <p className="px-1 text-[10px] text-muted-foreground italic">
          Distribuído: {formatBRL(rendaMin / 2)} para cada proponente
        </p>
      )}
    </div>
  );
}

