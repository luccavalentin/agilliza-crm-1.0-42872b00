import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/servidor-email")({
  head: () => ({
    meta: [
      { title: "Servidor de Email — Agilliza" },
      {
        name: "description",
        content:
          "Gestão do servidor de email da Agilliza — configurações e monitoramento.",
      },
      { property: "og:title", content: "Servidor de Email — Agilliza" },
      {
        property: "og:description",
        content:
          "Gestão do servidor de email da Agilliza — configurações e monitoramento.",
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
      <h1 className="text-2xl font-semibold tracking-tight">Servidor de Email</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        Esta área está reservada para a gestão do servidor de email. O conteúdo
        será definido em breve.
      </p>
    </div>
  );
}
