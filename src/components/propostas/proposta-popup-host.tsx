import { usePropostaNotificacaoStore } from "@/hooks/use-proposta-notificacao-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { CheckCircle2, AlertCircle, Info, ExternalLink } from "lucide-react";
import { Link } from "@tanstack/react-router";

/**
 * Host global para os popups de retorno de propostas.
 * Exibe um modal no meio da tela com design personalizado.
 */
export function PropostaPopupHost() {
  const { abertas, remover } = usePropostaNotificacaoStore();

  if (abertas.length === 0) return null;

  // Mostra um por um (pilha)
  const atual = abertas[0];

  const isPositive = ["aprovada", "aprovado", "simulada"].includes(atual.status.toLowerCase());
  const isNegative = ["recusada", "recusado", "erro"].includes(atual.status.toLowerCase());

  return (
    <Dialog open={true} onOpenChange={() => remover(atual.id)}>
      <DialogContent className="sm:max-w-[450px] border-primary/20 bg-background/95 backdrop-blur-md shadow-2xl">
        <DialogHeader className="space-y-4">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary ring-8 ring-primary/5">
            {isPositive ? (
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            ) : isNegative ? (
              <AlertCircle className="h-8 w-8 text-destructive" />
            ) : (
              <Info className="h-8 w-8 text-primary" />
            )}
          </div>
          <div className="text-center">
            <DialogTitle className="text-2xl font-bold tracking-tight">
              Retorno do Banco
            </DialogTitle>
            <DialogDescription className="mt-2 text-base">
              A proposta <span className="font-semibold text-foreground">{atual.numero}</span> do banco{" "}
              <span className="font-semibold text-foreground">{atual.banco}</span> acaba de retornar um novo status.
            </DialogDescription>
          </div>
        </DialogHeader>

        <div className="my-6 rounded-xl border border-primary/10 bg-primary/5 p-4 text-center">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Status Atual</p>
          <p className={`mt-1 text-xl font-bold ${isPositive ? 'text-emerald-600' : isNegative ? 'text-destructive' : 'text-primary'}`}>
            {atual.status.toUpperCase()}
          </p>
          <p className="mt-2 text-sm text-foreground/80 italic">
            Cliente: {atual.nome_cliente}
          </p>
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            variant="outline"
            onClick={() => remover(atual.id)}
            className="w-full sm:w-auto"
          >
            Fechar
          </Button>
          <Button
            asChild
            className="w-full sm:w-auto group"
            onClick={() => remover(atual.id)}
          >
            <Link to="/operacional/propostas/$id" params={{ id: atual.id }}>
              Ver Detalhes
              <ExternalLink className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
