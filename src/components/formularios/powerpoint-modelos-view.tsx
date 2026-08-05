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
    // Forçar download automático garantindo que o link seja absoluto ou resolvido corretamente
    const link = document.createElement("a");
    link.href = url;
    // O atributo download ajuda o navegador a entender que deve baixar, não abrir
    link.setAttribute("download", url.split("/").pop() || "apresentacao.pptx");
    link.target = "_blank";
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
    }, 100);
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
        <Card className="lg:col-span-2 overflow-hidden border-none shadow-2xl bg-[#0F172A] relative group min-h-[400px]">
          {/* Main Slide Preview */}
          <div className="absolute inset-0 p-8 flex flex-col items-center justify-center">
            <div className="relative w-full max-w-3xl aspect-video rounded-lg overflow-hidden shadow-2xl border border-white/10 group-hover:scale-[1.02] transition-transform duration-500">
              <img 
                src={modeloAtual.slides[0]} 
                alt={modeloAtual.titulo}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-6">
                <p className="text-white font-medium text-lg">Preview da Capa</p>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-center space-y-4">
              <h2 className="text-2xl font-bold text-white tracking-tight">{modeloAtual.titulo}</h2>
              <p className="text-slate-400 text-sm max-w-md text-center">{modeloAtual.descricao}</p>
              
              <div className="flex gap-4 pt-4">
                <Button 
                  size="lg" 
                  className="bg-white text-slate-900 hover:bg-slate-200 gap-2 font-semibold shadow-lg shadow-white/10"
                  onClick={() => baixar(modeloAtual.url, modeloAtual.titulo)}
                >
                  <Play className="h-4 w-4 fill-current" />
                  Iniciar Download
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-white/20 text-white hover:bg-white/10 gap-2 backdrop-blur-sm"
                  onClick={() => window.open(modeloAtual.slides[0], '_blank')}
                >
                  <Eye className="h-4 w-4" />
                  Abrir Pré-visualização
                </Button>
              </div>
            </div>
          </div>
          
          {/* Slide Thumbnails Overlay */}
          <div className="absolute bottom-6 left-6 right-6 flex gap-4 opacity-60 group-hover:opacity-100 transition-opacity pointer-events-none">
            {modeloAtual.slides.slice(1, 5).map((slide, i) => (
              <div key={i} className="flex-1 aspect-video rounded border border-white/20 overflow-hidden shadow-lg bg-slate-800">
                <img src={slide} alt={`Slide ${i + 2}`} className="w-full h-full object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" />
              </div>
            ))}
          </div>
        </Card>

        <Card className="h-full border-border/60 shadow-lg">
          <CardHeader className="border-b border-border/50 bg-muted/30">
            <div className="flex items-center gap-2">
              <Layers className="h-4 w-4 text-primary" />
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Ficha Técnica do Modelo
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <FileType className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Formato do Arquivo</p>
                  <p className="text-[11px] text-muted-foreground">Microsoft PowerPoint (.pptx)</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 border border-border/50 hover:border-primary/30 transition-colors">
                <div className="p-2.5 rounded-lg bg-primary/10 text-primary">
                  <Download className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-foreground">Tamanho do Arquivo</p>
                  <p className="text-[11px] text-muted-foreground">{modeloAtual.tamanho}</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Recursos Inclusos:</h4>
              <ul className="grid grid-cols-1 gap-2">
                {[
                  "Design exclusivo Agilliza",
                  "Paleta de cores institucional",
                  "Gráficos 100% editáveis",
                  "Iconografia personalizada",
                  "Layouts mestre padronizados",
                  "Fontes seguras incorporadas"
                ].map((item, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="h-1 w-1 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="pt-4 space-y-3">
              <Button 
                className="w-full h-11 shadow-md shadow-primary/20 font-bold"
                onClick={() => baixar(modeloAtual.url, modeloAtual.titulo)}
              >
                <FileDown className="mr-2 h-4 w-4" />
                Baixar agora
              </Button>
              <p className="text-[10px] text-center text-muted-foreground px-4">
                Ao baixar, você concorda com as diretrizes de uso da marca Agilliza.
              </p>
            </div>
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
