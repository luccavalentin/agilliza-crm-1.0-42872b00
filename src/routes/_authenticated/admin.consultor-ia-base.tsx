

async function gerarVerbetePDF(
  ...args: Parameters<(typeof import("@/lib/consultor-ia/biblioteca-pdf"))["gerarVerbetePDF"]>
) {
  const mod = await import("@/lib/consultor-ia/biblioteca-pdf");
  return mod.gerarVerbetePDF(...args);
}

async function gerarCompendioPDF(
  ...args: Parameters<(typeof import("@/lib/consultor-ia/biblioteca-pdf"))["gerarCompendioPDF"]>
) {
  const mod = await import("@/lib/consultor-ia/biblioteca-pdf");
  return mod.gerarCompendioPDF(...args);
}
