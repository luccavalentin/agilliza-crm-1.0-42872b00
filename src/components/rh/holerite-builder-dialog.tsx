

async function gerarHoleritePdf(
  ...args: Parameters<(typeof import("@/lib/rh/holerite-pdf"))["gerarHoleritePdf"]>
) {
  const mod = await import("@/lib/rh/holerite-pdf");
  return mod.gerarHoleritePdf(...args);
}
