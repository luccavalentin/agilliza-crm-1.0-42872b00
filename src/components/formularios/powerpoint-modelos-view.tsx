import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Presentation } from "lucide-react";

const MODELOS_PPT = [
  {
    id: "apresentacao-institucional",
    titulo: "Apresentação Institucional",
    descricao: "Modelo padrão para apresentações de corretores e parceiros.",
    url: "/modelos/agilliza-institucional.pptx",
  },
  {
    id: "proposta-comercial",
    titulo: "Proposta Comercial",
    descricao: "Modelo focado em fechamento de novos negócios.",
    url: "/modelos/agilliza-proposta.pptx",
  },
  {
    id: "treinamento-parceiro",
    titulo: "Treinamento para Parceiros",
    descricao: "Conteúdo educativo sobre os processos da Agilliza.",
    url: "/modelos/agilliza-treinamento.pptx",
  },
];

export function PowerPointModelosView() {
  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold text-primary uppercase tracking-tight">
            MODELOS POWER POINT
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Baixe modelos de apresentação profissionais para utilizar com seus clientes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {MODELOS_PPT.map((modelo) => (
            <Card key={modelo.id} className="group hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold leading-tight">
                  {modelo.titulo}
                </CardTitle>
                <Presentation className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-6 line-clamp-2">
                  {modelo.descricao}
                </p>
                <Button 
                  variant="outline" 
                  className="w-full gap-2" 
                  onClick={() => window.open(modelo.url, '_blank')}
                >
                  <FileDown className="h-4 w-4" />
                  Baixar Modelo
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
