import type { InvoiceStatement } from "@/lib/types";
import { formatMoney } from "@/lib/calculations";
import { t } from "@/lib/i18n";

export function InvoiceFooterTotals({
  statement,
}: {
  statement: InvoiceStatement;
}) {
  const net = statement.netSettlement;
  const netLabel =
    net >= 0 ? `${t.netReceive} ${formatMoney(net)}` : `${t.netPay} ${formatMoney(-net)}`;

  return (
    <div className="mt-2 space-y-2 text-[13px]">
      <div className="flex flex-wrap items-center justify-end gap-x-8 gap-y-1 border border-black px-3 py-1.5 font-semibold">
        <span>
          {t.grandTotal}: {formatMoney(statement.totalFare)}
        </span>
        <span>
          {t.totalRecFrom}: {formatMoney(statement.totalRecFrom)}
        </span>
      </div>
      <div className="text-right font-bold">
        {t.netSettlement}: {netLabel}
      </div>
    </div>
  );
}

export function InvoiceNotesAndSign({
  statement,
}: {
  statement: InvoiceStatement;
}) {
  return (
    <div className="mt-6 grid grid-cols-[1fr_180px] gap-6">
      <div className="min-h-20 border border-black p-2 text-[12px] whitespace-pre-wrap">
        {statement.notes || ""}
      </div>
      <div className="flex flex-col items-center justify-end">
        <div className="h-12 w-full border-b border-black" />
        <div className="mt-1 text-[11px] font-medium">
          {statement.signatureLabel || t.signHere}
        </div>
      </div>
    </div>
  );
}
