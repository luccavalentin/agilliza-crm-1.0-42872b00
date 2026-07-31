

async function gerarFichaFuncionarioPdf(
  ...args: Parameters<(typeof import("@/lib/rh/ficha-pdf"))["gerarFichaFuncionarioPdf"]>
) {
  const mod = await import("@/lib/rh/ficha-pdf");
  return mod.gerarFichaFuncionarioPdf(...args);
}
