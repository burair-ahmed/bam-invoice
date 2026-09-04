import {
  COMPANY_NAME,
  COMPANY_SUBTITLE,
} from "./constants";
import type { InvoiceLineItemInput, InvoiceStatement } from "./types";
import { deriveRows, computeTotals } from "./calculations";
import { todayISO } from "./format";
import { uid } from "./utils";

export function emptyLineItem(sr = 1): InvoiceLineItemInput {
  return {
    id: uid(),
    sr,
    invoiceNo: "",
    date: todayISO(),
    fare: 0,
    advance: 0,
    detention: 0,
    iTax: 0,
    unload: 0,
    exWeight: 0,
    other: 0,
    vehicleNo: "",
    city: "",
    weight: "",
    receiver: "",
  };
}

export function emptyStatement(): InvoiceStatement {
  const items = deriveRows([emptyLineItem(1)]);
  const totals = computeTotals(items);
  const now = new Date().toISOString();
  return {
    id: uid(),
    companyName: COMPANY_NAME,
    companySubtitle: COMPANY_SUBTITLE,
    logoUrl: null,
    periodFrom: todayISO(),
    periodTo: todayISO(),
    generatedAt: now,
    transporterName: "",
    items,
    notes: "",
    signatureLabel: "",
    ...totals,
  };
}
