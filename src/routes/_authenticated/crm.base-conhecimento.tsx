import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { BookOpen } from "lucide-react";
import { BasePerguntasRespondidas } from "@/components/consultor-ia/base-perguntas";
import { assertModuloPermitido } from "@/lib/route-guards";

export const Route = createFileRoute("/_authenticated/crm/base-conhecimento")({
  beforeLoad: () => assertModuloPermitido("crm.scan_ia"),
  head: () => ({
    meta: [
      { title: "Base de Conhecimento IA — Agilliza" },
      {
        name: "description",
        content:
          "Perguntas já respondidas pelo Consultor IA, organizadas e pesquisáveis por palavra-chave.",
      },
      { property: "og:title", content: "Base de Conhecimento IA — Agilliza" },
      {
        property: "og:description",
        content: "Pesquise por palavra-chave o histórico de respostas do Consultor IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BaseConhecimentoPage,
});

function BaseConhecimentoPage() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <header className="flex items-center gap-2">
        <BookOpen className="size-5 text-primary" />
        <div>
          <h1 className="text-lg font-semibold sm:text-xl">Base de Conhecimento</h1>
          <p className="text-sm text-muted-foreground">
            Todas as perguntas respondidas pelo Consultor IA, pesquisáveis por palavra-chave.
          </p>
        </div>
      </header>

      <BasePerguntasRespondidas
        onReperguntar={(p) =>
          navigate({ to: "/crm/consultor-ia", search: { pergunta: p } as never })
        }
      />
    </div>
  );
}
