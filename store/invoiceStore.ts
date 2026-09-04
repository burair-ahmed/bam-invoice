import { create } from "zustand";
import type { InvoiceLineItemInput, InvoiceStatement } from "@/lib/types";
import {
  deriveRow,
  deriveRows,
  recomputeStatement,
} from "@/lib/calculations";
import { emptyLineItem, emptyStatement } from "@/lib/invoice-factory";
import { COMPANY_NAME, COMPANY_SUBTITLE } from "@/lib/constants";

type InvoiceStore = {
  statement: InvoiceStatement;
  dirty: boolean;
  lastSavedAt: string | null;
  hydrate: (s: InvoiceStatement) => void;
  resetNew: (logoUrl?: string | null) => void;
  setHeader: (
    patch: Partial<
      Pick<
        InvoiceStatement,
        | "transporterName"
        | "periodFrom"
        | "periodTo"
        | "notes"
        | "signatureLabel"
        | "logoUrl"
      >
    >,
  ) => void;
  setItem: (id: string, patch: Partial<InvoiceLineItemInput>) => void;
  addItem: () => void;
  removeItem: (id: string) => void;
  markSaved: () => void;
};

function withCompany(s: InvoiceStatement): InvoiceStatement {
  return {
    ...s,
    companyName: COMPANY_NAME,
    companySubtitle: COMPANY_SUBTITLE,
  };
}

export const useInvoiceStore = create<InvoiceStore>((set, get) => ({
  statement: emptyStatement(),
  dirty: false,
  lastSavedAt: null,

  hydrate: (s) =>
    set({
      statement: withCompany(recomputeStatement(s)),
      dirty: false,
    }),

  resetNew: (logoUrl) =>
    set({
      statement: withCompany({ ...emptyStatement(), logoUrl: logoUrl ?? null }),
      dirty: false,
      lastSavedAt: null,
    }),

  setHeader: (patch) => {
    const next = withCompany({ ...get().statement, ...patch });
    set({ statement: recomputeStatement(next), dirty: true });
  },

  setItem: (id, patch) => {
    const { statement } = get();
    const items = statement.items.map((row) => {
      if (row.id !== id) return row;
      const input: InvoiceLineItemInput = {
        id: row.id,
        sr: row.sr,
        invoiceNo: row.invoiceNo,
        date: row.date,
        fare: row.fare,
        advance: row.advance,
        detention: row.detention,
        iTax: row.iTax,
        unload: row.unload,
        exWeight: row.exWeight,
        other: row.other,
        vehicleNo: row.vehicleNo,
        city: row.city,
        weight: row.weight,
        receiver: row.receiver,
        ...patch,
      };
      return deriveRow(input);
    });
    set({
      statement: recomputeStatement({ ...statement, items: deriveRows(items) }),
      dirty: true,
    });
  },

  addItem: () => {
    const { statement } = get();
    const items = deriveRows([
      ...statement.items,
      emptyLineItem(statement.items.length + 1),
    ]);
    set({
      statement: recomputeStatement({ ...statement, items }),
      dirty: true,
    });
  },

  removeItem: (id) => {
    const { statement } = get();
    const remaining = statement.items.filter((r) => r.id !== id);
    const items = deriveRows(
      remaining.length ? remaining : [emptyLineItem(1)],
    );
    set({
      statement: recomputeStatement({ ...statement, items }),
      dirty: true,
    });
  },

  markSaved: () =>
    set({ dirty: false, lastSavedAt: new Date().toISOString() }),
}));
