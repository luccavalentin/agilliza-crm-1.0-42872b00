

async function baixarTarefasPDF(
  ...args: Parameters<(typeof import("@/lib/operacional/export-pdf"))["baixarTarefasPDF"]>
) {
  const mod = await import("@/lib/operacional/export-pdf");
  return mod.baixarTarefasPDF(...args);
}
