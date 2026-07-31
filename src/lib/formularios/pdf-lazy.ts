/**
 * Carregamento sob demanda do PDF de papel timbrado.
 */
export async function gerarPapelTimbradoPDF(
  ...args: Parameters<(typeof import("./papel-timbrado-pdf"))["gerarPapelTimbradoPDF"]>
) {
  const mod = await import("./papel-timbrado-pdf");
  return mod.gerarPapelTimbradoPDF(...args);
}
