import type {
  InvoiceLineItem,
  InvoiceLineItemInput,
  InvoiceStatement,
} from "./types";

// Safely coerce a possibly-empty/NaN numeric input to a finite number.
export function num(value: unknown): number {
  const n = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(n) ? n : 0;
}

// Round to 2 decimals to avoid floating point drift in money math.
export function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

// Row total: fare minus all deductions.
// total = fare - advance - detention - iTax - unload - exWeight - other
export function computeRowTotal(row: {
  fare: number;
  advance: number;
  detention: number;
  iTax: number;
  unload: number;
  exWeight: number;
  other: number;
}): number {
  return money(
    num(row.fare) -
      num(row.advance) -
      num(row.detention) -
      num(row.iTax) -
      num(row.unload) -
      num(row.exWeight) -
      num(row.other),
  );
}

// Given a row input, derive total / recFrom / payTo.
// Positive total => money to receive (recFrom). Negative => money to pay (payTo).
export function deriveRow(input: InvoiceLineItemInput): InvoiceLineItem {
  const total = computeRowTotal(input);
  const recFrom = total >= 0 ? total : 0;
  const payTo = total < 0 ? money(-total) : 0;
  return { ...input, total, recFrom, payTo };
}

export function deriveRows(inputs: InvoiceLineItemInput[]): InvoiceLineItem[] {
  return inputs.map((r, i) => deriveRow({ ...r, sr: i + 1 }));
}

// Grand totals over all rows.
export function computeTotals(items: InvoiceLineItem[]): {
  totalFare: number;
  totalRecFrom: number;
  totalPayTo: number;
  netSettlement: number;
} {
  let totalFare = 0;
  let totalRecFrom = 0;
  let totalPayTo = 0;
  for (const it of items) {
    totalFare = money(totalFare + num(it.total));
    totalRecFrom = money(totalRecFrom + num(it.recFrom));
    totalPayTo = money(totalPayTo + num(it.payTo));
  }
  // Net settlement: positive => net to receive, negative => net to pay.
  const netSettlement = money(totalRecFrom - totalPayTo);
  return { totalFare, totalRecFrom, totalPayTo, netSettlement };
}

// Recompute an entire statement's derived fields (rows + grand totals).
export function recomputeStatement(
  statement: InvoiceStatement,
): InvoiceStatement {
  const items = deriveRows(statement.items);
  const { totalFare, totalRecFrom, netSettlement } = computeTotals(items);
  return { ...statement, items, totalFare, totalRecFrom, netSettlement };
}

// Format a number as a money string with thousands separators.
export function formatMoney(value: number): string {
  const n = num(value);
  return n.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}
