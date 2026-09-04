import { pdf, type DocumentProps } from "@react-pdf/renderer";
import type { ReactElement } from "react";
import type { InvoiceStatement } from "@/lib/types";
import { InvoicePdfDocument } from "@/lib/export/InvoicePdfDocument";
import { fileStamp } from "@/lib/format";
import { downloadBlob } from "@/lib/utils";

export async function downloadInvoicePdf(statement: InvoiceStatement) {
  const blob = await pdf(
    (
      <InvoicePdfDocument statement={statement} />
    ) as ReactElement<DocumentProps>,
  ).toBlob();
  const name = `${statement.transporterName || "invoice"}-${fileStamp(statement.generatedAt)}.pdf`;
  downloadBlob(blob, name.replace(/\s+/g, "_"));
}
