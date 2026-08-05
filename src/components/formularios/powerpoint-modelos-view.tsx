import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileDown, Presentation, Check, Play, Eye, Layers } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { OpHero } from "@/components/operacional/ui";

import slide1Asset from "@/assets/modelos/slide-1.png.asset.json";
import slide2Asset from "@/assets/modelos/slide-2.png.asset.json";
import slide3Asset from "@/assets/modelos/slide-3.png.asset.json";
import slide4Asset from "@/assets/modelos/slide-4.png.asset.json";

const MODELOS_PPT = [
  {
    id: "apresentacao-institucional",
    titulo: "Apresentação Institucional",
    descricao: "Design moderno e profissional alinhado à marca Agilliza. Ideal para parcerias e reuniões de alto impacto.",
    url: "/modelos/APRESENTAÇÃO_AGILLIZA.pptx",
    cor: "#0F172A",
    slides: [slide1Asset.url, slide2Asset.url, slide3Asset.url, slide4Asset.url],
    tamanho: "3.2 MB",
  },
  {
    id: "proposta-comercial",
    titulo: "Proposta Comercial",
    descricao: "Modelo focado em fechamento de novos negócios, com gatilhos mentais e estrutura de conversão.",
    url: "/modelos/APRESENTAÇÃO_AGILLIZA.pptx",
    cor: "#2563EB",
    slides: [slide1Asset.url, slide2Asset.url, slide3Asset.url, slide4Asset.url],
    tamanho: "3.2 MB",
  },
  {
    id: "treinamento-parceiro",
    titulo: "Treinamento para Parceiros",
    descricao: "Conteúdo educativo detalhado sobre os processos e diferenciais da Agilliza.",
    url: "/modelos/APRESENTAÇÃO_AGILLIZA.pptx",
    cor: "#059669",
    slides: [slide1Asset.url, slide2Asset.url, slide3Asset.url, slide4Asset.url],
    tamanho: "3.2 MB",
  },
];

export function PowerPointModelosView() {
  const [selecionado, setSelecionado] = useState(MODELOS_PPT[0].id);
  const modeloAtual = MODELOS_PPT.find((m) => m.id === selecionado)!;

  const baixar = (url: string, titulo: string) => {
    // Forçar download automático
    const link = document.createElement("a");
    link.href = url;
    link.download = url.split("/").pop() || "apresentacao.pptx";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Download de "${titulo}" iniciado.`);
  };

  return (
    <div className="mx-auto w-full max-w-none space-y-6 p-4 md:p-6">
      <OpHero
        icon={<Presentation className="h-5 w-5" />}
        eyebrow="Documentos · Apresentações"
        titulo="Modelos de PowerPoint"
        descricao="Visualize e baixe modelos profissionais para suas reuniões e treinamentos."
        accent={modeloAtual.cor}
        acoes={
          <Button onClick={() => baixar(modeloAtual.url, modeloAtual.titulo)} className="gap-2">
            <FileDown className="h-4 w-4" />
            Baixar Modelo
          </Button>
        }
      />

      {/* Seletor de modelos (estilo Papel Timbrado) */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3 px-1">
          <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Modelos Disponíveis
          </h2>
          <span className="text-[11px] text-muted-foreground">
            {MODELOS_PPT.length} variações profissionais
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {MODELOS_PPT.map((modelo) => (
            <button
              key={modelo.id}
              onClick={() => setSelecionado(modelo.id)}
              className={cn(
                "group relative overflow-hidden rounded-xl border bg-card text-left transition-all p-4",
                "shadow-[0_1px_3px_rgba(0,0,0,0.1)] hover:-translate-y-0.5 hover:shadow-md",
                selecionado === modelo.id
                  ? "border-primary ring-2 ring-primary/20 bg-primary/5"
                  : "border-border/60 hover:border-primary/40"
              )}
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <h3 className="font-semibold text-foreground">{modelo.titulo}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                    {modelo.descricao}
                  </p>
                </div>
                <div 
                  className={cn(
                    "p-2 rounded-lg transition-colors",
                    selecionado === modelo.id ? "bg-primary text-white" : "bg-secondary text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                  )}
                >
                  <Presentation className="h-4 w-4" />
                </div>
              </div>

              {selecionado === modelo.id && (
                <div className="absolute top-0 right-0 p-1">
                  <Check className="h-3 w-3 text-primary" />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Preview Section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl bg-slate-900 aspect-video relative group">
          <div className="absolute inset-0 flex flex-col items-center justify-center text-white p-12 text-center space-y-4">
             <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-sm mb-4">
                <Presentation className="h-10 w-10" />
             </div>
             <h2 className="text-3xl font-bold tracking-tight">{modeloAtual.titulo}</h2>
             <p className="text-slate-400 max-w-md mx-auto">{modeloAtual.descricao}</p>
             <div className="pt-8">
                <Button 
                  size="lg" 
                  className="bg-white text-slate-900 hover:bg-slate-200 gap-2"
                  onClick={() => baixar(modeloAtual.url, modeloAtual.titulo)}
                >
                  <Play className="h-4 w-4 fill-current" />
                  Iniciar Download
                </Button>
             </div>
          </div>
          
          {/* Mockup de slides em baixo */}
          <div className="absolute bottom-6 left-6 right-6 flex gap-4 overflow-hidden opacity-40 group-hover:opacity-60 transition-opacity">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex-1 aspect-video bg-slate-800 rounded border border-white/10 flex items-center justify-center">
                <span className="text-[10px] font-mono text-slate-500">SLIDE 0{i}</span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
              Detalhes do Modelo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                <div className="p-2 rounded bg-primary/10 text-primary">
                  <FileType className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium">Formato</p>
                  <p className="text-[11px] text-muted-foreground">Microsoft PowerPoint (.pptx)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border/50">
                <div className="p-2 rounded bg-primary/10 text-primary">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-medium">Tamanho</p>
                  <p className="text-[11px] text-muted-foreground">~2.4 MB</p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-xs font-semibold text-foreground">Incluso no modelo:</h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 list-disc pl-4">
                <li>Design institucional Agilliza</li>
                <li>Paleta de cores oficial</li>
                <li>Fontes padronizadas</li>
                <li>Layouts de transição</li>
                <li>Gráficos editáveis</li>
              </ul>
            </div>
            
            <Button 
              variant="outline" 
              className="w-full mt-4"
              onClick={() => baixar(modeloAtual.url, modeloAtual.titulo)}
            >
              Baixar agora
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function FileType({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 13v-1h6v1" />
      <path d="M12 12v6" />
      <path d="M11 18h2" />
    </svg>
  );
}

function Download({ className }: { className?: string }) {
  return (
    <svg 
      className={className} 
      xmlns="http://www.w3.org/2000/svg" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" x2="12" y1="15" y2="3" />
    </svg>
  );
}
