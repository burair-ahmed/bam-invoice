"use client";

import { InvoiceHeader, InvoiceMeta } from "@/components/invoice/InvoiceHeader";
import { InvoiceTable } from "@/components/invoice/InvoiceTable";
import {
  InvoiceFooterTotals,
  InvoiceNotesAndSign,
} from "@/components/invoice/InvoiceFooterTotals";
import type { InvoiceStatement } from "@/lib/types";

export function InvoiceDocument({
  statement,
  virtualize = false,
}: {
  statement: InvoiceStatement;
  virtualize?: boolean;
}) {
  return (
    <div
      data-invoice-root
      className="invoice-sheet w-[1100px] bg-white p-6 text-black"
    >
      <InvoiceHeader statement={statement} />
      <InvoiceMeta statement={statement} />
      <InvoiceTable statement={statement} virtualize={virtualize} />
      <InvoiceFooterTotals statement={statement} />
      <InvoiceNotesAndSign statement={statement} />
    </div>
  );
}
