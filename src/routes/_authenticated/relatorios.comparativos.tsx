import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/relatorios/comparativos")({
  head: () => ({
    meta: [
      { title: "Dashboards comparativos — Agilliza" },
      {
        name: "description",
        content:
          "Área reservada para dashboards comparativos gerenciais da Agilliza.",
      },
      { property: "og:title", content: "Dashboards comparativos — Agilliza" },
      {
        property: "og:description",
        content:
          "Área reservada para dashboards comparativos gerenciais da Agilliza.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => s,
  component: Pagina,
});

function Pagina() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 p-8 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">
        Dashboards comparativos
      </h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Esta área está reservada para os dashboards comparativos. O conteúdo
        será definido em breve.
      </p>
    </div>
  );
}
