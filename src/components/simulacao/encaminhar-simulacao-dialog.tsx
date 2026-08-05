import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Mail, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";

interface EncaminharSimulacaoDialogProps {
  aberto: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (dados: { email: string; whatsapp: string; canal: "email" | "whatsapp" }) => void;
  clienteNome: string;
  clienteEmail: string;
  clienteWhatsapp: string;
  canal: "email" | "whatsapp";
}

export function EncaminharSimulacaoDialog({
  aberto,
  onOpenChange,
  onConfirm,
  clienteNome,
  clienteEmail,
  clienteWhatsapp,
  canal,
}: EncaminharSimulacaoDialogProps) {
  const [email, setEmail] = useState(clienteEmail || "");
  const [whatsapp, setWhatsapp] = useState(clienteWhatsapp || "");

  const handleConfirm = () => {
    if (canal === "email" && !email) {
      toast.error("Por favor, preencha o e-mail.");
      return;
    }
    if (canal === "whatsapp" && !whatsapp) {
      toast.error("Por favor, preencha o número do WhatsApp.");
      return;
    }
    onConfirm({ email, whatsapp, canal });
    onOpenChange(false);
  };

  const isWhatsapp = canal === "whatsapp";

  return (
    <Dialog open={aberto} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isWhatsapp ? (
              <MessageCircle className="h-5 w-5 text-[#25D366]" />
            ) : (
              <Mail className="h-5 w-5 text-[#EA4335]" />
            )}
            Encaminhar Simulação
          </DialogTitle>
          <DialogDescription>
            Confirme os dados de contato para encaminhar a simulação de <strong>{clienteNome}</strong>.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email" className={!isWhatsapp ? "font-bold" : ""}>E-mail de destino</Label>
            <Input
              id="email"
              type="email"
              placeholder="exemplo@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={canal === "email" ? "ring-2 ring-primary/20" : ""}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="whatsapp" className={isWhatsapp ? "font-bold" : ""}>WhatsApp (com DDD)</Label>
            <Input
              id="whatsapp"
              placeholder="11999999999"
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value.replace(/\D/g, ""))}
              className={canal === "whatsapp" ? "ring-2 ring-[#25D366]/20" : ""}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleConfirm}
            className={isWhatsapp ? "bg-[#25D366] hover:bg-[#20ba5a] text-white" : "bg-[#EA4335] hover:bg-[#d93025] text-white"}
          >
            <Send className="mr-2 h-4 w-4" />
            Encaminhar via {isWhatsapp ? "WhatsApp" : "Gmail"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
