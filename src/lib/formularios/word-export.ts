
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  AlignmentType, 
  Header, 
  Footer, 
  ImageRun, 
  ExternalHyperlink,
  BorderStyle,
  Table,
  TableRow,
  TableCell,
  WidthType
} from "docx";
import { saveAs } from "file-saver";
import { 
  getPapelTimbradoModelo, 
  type PapelTimbradoModeloId 
} from "./papel-timbrado-modelos";
import type { PapelTimbradoDados } from "./papel-timbrado-pdf";
import { AGILLIZA_LOGO_DARK } from "@/lib/relatorios/brand-logo";

/**
 * Gera um arquivo Word (.docx) do papel timbrado.
 * Tenta replicar a formatação visual do PDF usando os recursos do docx.
 */
export async function gerarPapelTimbradoWord(dados: PapelTimbradoDados = {}) {
  const modelo = getPapelTimbradoModelo(dados.modelo);
  
  // Converter logo base64 para Buffer (Browser-safe)
  const logoBase64 = AGILLIZA_LOGO_DARK.split(",")[1];
  const logoBuffer = Uint8Array.from(atob(logoBase64), c => c.charCodeAt(0));

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440, // ~2.54cm
              right: 1440,
              bottom: 1440,
              left: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new ImageRun({
                    data: logoBuffer,
                    transformation: {
                      width: 120,
                      height: 35,
                    },
                  }),
                ],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { before: 200 },
                children: [
                  new TextRun({
                    text: "AGILLIZA · CRÉDITO IMOBILIÁRIO",
                    bold: true,
                    size: 24,
                    color: modelo.primaria.replace("#", ""),
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                border: {
                  top: {
                    color: "E5E7EB",
                    space: 1,
                    value: BorderStyle.SINGLE,
                    size: 6,
                  },
                },
                children: [
                  new TextRun({
                    text: "www.agillizacrm.com.br",
                    size: 18,
                    color: "9CA3AF",
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          // Cidade e Data
          new Paragraph({
            alignment: AlignmentType.RIGHT,
            spacing: { before: 400, after: 400 },
            children: [
              new TextRun({
                text: `${dados.cidade || ""}, ${dados.data || ""}`,
                size: 22,
              }),
            ],
          }),
          
          // Destinatário
          ...(dados.destinatario ? dados.destinatario.split("\n").map(line => 
            new Paragraph({
              spacing: { after: 100 },
              children: [new TextRun({ text: line, size: 22 })],
            })
          ) : []),

          // Referência
          ...(dados.referencia ? [
            new Paragraph({
              spacing: { before: 200, after: 200 },
              children: [
                new TextRun({
                  text: "Ref.: ",
                  bold: true,
                  color: modelo.destaqueTexto.replace("#", ""),
                  size: 22,
                }),
                new TextRun({
                  text: dados.referencia,
                  size: 22,
                }),
              ],
            })
          ] : []),

          // Saudação
          new Paragraph({
            spacing: { before: 200, after: 200 },
            children: [
              new TextRun({
                text: dados.saudacao || "Prezados,",
                size: 22,
              }),
            ],
          }),

          // Mensagem
          ...(dados.mensagem ? dados.mensagem.split(/\n{2,}/).map(par => 
            new Paragraph({
              alignment: AlignmentType.JUSTIFY,
              spacing: { before: 200, after: 200 },
              children: [
                new TextRun({
                  text: par.replace(/\n/g, " "),
                  size: 22,
                }),
              ],
            })
          ) : []),

          // Despedida
          new Paragraph({
            spacing: { before: 400, after: 800 },
            children: [
              new TextRun({
                text: dados.despedida || "Atenciosamente,",
                size: 22,
              }),
            ],
          }),

          // Assinatura
          new Paragraph({
            border: {
              top: {
                color: "E5E7EB",
                space: 1,
                value: BorderStyle.SINGLE,
                size: 6,
              },
            },
            children: [
              new TextRun({
                text: dados.assinante || "",
                bold: true,
                color: modelo.destaqueTexto.replace("#", ""),
                size: 22,
              }),
            ],
          }),
          new Paragraph({
            children: [
              new TextRun({
                text: dados.cargo || "",
                size: 18,
                color: "6B7280",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `Papel_Timbrado_Agilliza_${new Date().getTime()}.docx`);
}
