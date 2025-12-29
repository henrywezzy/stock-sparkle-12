import type { NFEData, NFEItem } from "@/hooks/useNFe";

function textFrom(parent: ParentNode, localName: string): string {
  const el = (parent as Document | Element).getElementsByTagNameNS("*", localName)?.[0];
  return el?.textContent?.trim() ?? "";
}

function elementsFrom(parent: ParentNode, localName: string): Element[] {
  return Array.from(
    (parent as Document | Element).getElementsByTagNameNS("*", localName) ?? []
  );
}

function numberFrom(parent: ParentNode, localName: string): number {
  const raw = textFrom(parent, localName);
  const n = Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function normalizeISODate(dateLike: string): string {
  // dhEmi vem como 2024-01-01T10:00:00-03:00
  // dEmi vem como 2024-01-01
  if (!dateLike) return new Date().toISOString();
  const d = new Date(dateLike);
  if (!Number.isNaN(d.getTime())) return d.toISOString();
  // fallback simples
  return new Date().toISOString();
}

function extractChave(doc: Document): string {
  // 1) protNFe/infProt/chNFe
  const chFromProt = textFrom(doc, "chNFe");
  if (chFromProt && chFromProt.replace(/\D/g, "").length === 44) {
    return chFromProt.replace(/\D/g, "");
  }

  // 2) infNFe @Id="NFe{44}" (alguns XMLs)
  const infNFe = doc.getElementsByTagNameNS("*", "infNFe")?.[0];
  const id = infNFe?.getAttribute("Id") || "";
  const cleaned = id.replace(/^NFe/, "").replace(/\D/g, "");
  if (cleaned.length === 44) return cleaned;

  return "";
}

export function parseNFeXml(xmlText: string): NFEData {
  if (!xmlText?.trim()) {
    throw new Error("O arquivo XML está vazio.");
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(xmlText, "application/xml");

  const parserError = doc.getElementsByTagName("parsererror")?.[0];
  if (parserError) {
    throw new Error("XML inválido ou corrompido.");
  }

  const infNFe = doc.getElementsByTagNameNS("*", "infNFe")?.[0];
  if (!infNFe) {
    throw new Error("Não encontrei a tag infNFe no XML.");
  }

  const ide = doc.getElementsByTagNameNS("*", "ide")?.[0];
  const emit = doc.getElementsByTagNameNS("*", "emit")?.[0];
  const dest = doc.getElementsByTagNameNS("*", "dest")?.[0];
  const total = doc.getElementsByTagNameNS("*", "ICMSTot")?.[0];

  const chave = extractChave(doc);

  const dataEmissao = normalizeISODate(
    (ide && (textFrom(ide, "dhEmi") || textFrom(ide, "dEmi"))) || ""
  );

  const numero = (ide && textFrom(ide, "nNF")) || "";
  const serie = (ide && textFrom(ide, "serie")) || "";

  const nomeEmitente = (emit && textFrom(emit, "xNome")) || "Emitente não identificado";
  const cnpjEmitente =
    (emit && (textFrom(emit, "CNPJ") || textFrom(emit, "CPF"))) || "";

  const nomeDest = dest ? textFrom(dest, "xNome") : "";
  const cnpjDest = dest ? textFrom(dest, "CNPJ") || textFrom(dest, "CPF") : "";

  const dets = elementsFrom(infNFe, "det");
  const itens: NFEItem[] = dets
    .map((detEl) => {
      const prod = (detEl as Element).getElementsByTagNameNS("*", "prod")?.[0];
      if (!prod) return null;

      const numeroItem = (detEl as Element).getAttribute("nItem") || "";
      const codigo = textFrom(prod, "cProd");
      const descricao = textFrom(prod, "xProd");
      const unidade = textFrom(prod, "uCom") || "UN";

      const quantidade = numberFrom(prod, "qCom");
      const valorUnit = numberFrom(prod, "vUnCom");
      const valorProd = numberFrom(prod, "vProd");

      const ncm = textFrom(prod, "NCM") || undefined;
      const cfop = textFrom(prod, "CFOP") || undefined;

      return {
        numero_item: numeroItem,
        codigo_produto: codigo,
        descricao,
        quantidade_comercial: quantidade,
        valor_unitario_comercial: valorUnit,
        valor_bruto: valorProd,
        unidade_comercial: unidade,
        ncm,
        cfop,
      } satisfies NFEItem;
    })
    .filter(Boolean) as NFEItem[];

  const valorTotal = total ? numberFrom(total, "vNF") : itens.reduce((s, i) => s + (i.valor_bruto || 0), 0);

  return {
    chave_nfe: chave,
    status: "xml",
    numero,
    serie,
    data_emissao: dataEmissao,
    nome_emitente: nomeEmitente,
    cnpj_emitente: cnpjEmitente,
    nome_destinatario: nomeDest || undefined,
    cnpj_destinatario: cnpjDest || undefined,
    valor_total: valorTotal,
    itens,
    status_manifestacao: "pendente",
  } satisfies NFEData;
}
