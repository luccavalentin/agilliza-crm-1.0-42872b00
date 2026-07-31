

async function gerarEbookFaqPDF(
  ...args: Parameters<(typeof import("@/lib/consultor-ia/ebook-pdf"))["gerarEbookFaqPDF"]>
) {
  const mod = await import("@/lib/consultor-ia/ebook-pdf");
  return mod.gerarEbookFaqPDF(...args);
}
