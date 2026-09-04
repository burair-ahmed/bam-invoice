import type { InvoiceFormValues } from "./schema";
import type { InvoiceStatement } from "./types";
import { deriveRows, computeTotals } from "./calculations";
import { COMPANY_NAME, COMPANY_SUBTITLE } from "./constants";
import { emptyLineItem } from "./invoice-factory";

export function statementToForm(s: InvoiceStatement): InvoiceFormValues {
  return {
    transporterName: s.transporterName,
    periodFrom: s.periodFrom,
    periodTo: s.periodTo,
    notes: s.notes ?? "",
    signatureLabel: s.signatureLabel ?? "",
    items: s.items.map((it) => ({
      id: it.id,
      sr: it.sr,
      invoiceNo: it.invoiceNo,
      date: it.date,
      fare: it.fare,
      advance: it.advance,
      detention: it.detention,
      iTax: it.iTax,
      unload: it.unload,
      exWeight: it.exWeight,
      other: it.other,
      vehicleNo: it.vehicleNo,
      city: it.city,
      weight: it.weight,
      receiver: it.receiver,
    })),
  };
}

export function formToStatement(
  values: InvoiceFormValues,
  base: Pick<InvoiceStatement, "id" | "logoUrl" | "generatedAt">,
): InvoiceStatement {
  const items = deriveRows(
    (values.items.length ? values.items : [emptyLineItem(1)]).map((it, i) => ({
      ...it,
      sr: i + 1,
    })),
  );
  const totals = computeTotals(items);
  return {
    id: base.id,
    companyName: COMPANY_NAME,
    companySubtitle: COMPANY_SUBTITLE,
    logoUrl: base.logoUrl,
    periodFrom: values.periodFrom,
    periodTo: values.periodTo,
    generatedAt: base.generatedAt,
    transporterName: values.transporterName.trim(),
    items,
    notes: values.notes,
    signatureLabel: values.signatureLabel,
    ...totals,
  };
}
