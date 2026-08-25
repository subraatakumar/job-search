declare module "pdf-parse/lib/pdf-parse.js" {
  type PdfResult = { text: string; numpages: number; info: Record<string, unknown> };
  function pdfParse(data: Uint8Array): Promise<PdfResult>;
  export default pdfParse;
}
