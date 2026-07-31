

async function baixarDemandasPDF(
  ...args: Parameters<(typeof import("@/lib/operacional/export-pdf"))["baixarDemandasPDF"]>
) {
  const mod = await import("@/lib/operacional/export-pdf");
  return mod.baixarDemandasPDF(...args);
}
