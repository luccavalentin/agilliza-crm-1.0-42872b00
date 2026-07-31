

async function imprimirFichaPDF(
  ...args: Parameters<(typeof import("@/lib/crm/ficha-pdf"))["imprimirFichaPDF"]>
) {
  const mod = await import("@/lib/crm/ficha-pdf");
  return mod.imprimirFichaPDF(...args);
}
