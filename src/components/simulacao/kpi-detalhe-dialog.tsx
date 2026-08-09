import type { LucideIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type KpiItem = {
  id: string;
  label: string;
  valor: string;
  icon: LucideIcon;
  detalhe: React.ReactNode;
};

export function KpiDetalheDialog({
  kpis,
  aberto,
  onClose,
}: {
  kpis: KpiItem[];
  aberto: string | null;
  onClose: () => void;
}) {
  const k = kpis.find((x) => x.id === aberto);
  return (
    <Dialog open={!!aberto} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] sm:max-w-xl flex flex-col p-0 overflow-hidden">
        {k && (
          <>
            <DialogHeader className="p-6 pb-0">
              <DialogTitle className="flex items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/15">
                  <k.icon className="size-4" />
                </span>
                {k.label}
              </DialogTitle>
              <DialogDescription>Valor atual: {k.valor}</DialogDescription>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto min-h-0 p-6">{k.detalhe}</div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
