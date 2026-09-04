"use client";

import { useRef } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { InvoiceLineItem, InvoiceStatement } from "@/lib/types";
import { formatMoney } from "@/lib/calculations";
import { formatDate } from "@/lib/format";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";

const COLS =
  "44px 88px 78px 70px 70px 70px 58px 62px 62px 58px 78px 72px 62px";

function moneyCell(n: number) {
  if (!n) return "";
  return formatMoney(n);
}

function Head() {
  const headers = [
    t.sr,
    t.invoiceNo,
    t.date,
    t.fare,
    t.advance,
    t.detention,
    t.iTax,
    t.unload,
    t.exWeight,
    t.other,
    t.total,
    t.recFrom,
    t.payTo,
  ];
  return (
    <div
      className="grid border-b border-black bg-neutral-200 text-[10px] font-bold uppercase"
      style={{ gridTemplateColumns: COLS }}
    >
      {headers.map((h, i) => (
        <div
          key={h}
          className={cn(
            "border-r border-black px-1 py-1.5 text-center last:border-r-0",
            i >= 3 && "text-right",
          )}
        >
          {h}
        </div>
      ))}
    </div>
  );
}

function ItemBlock({ item }: { item: InvoiceLineItem }) {
  const nums = [
    moneyCell(item.fare),
    moneyCell(item.advance),
    moneyCell(item.detention),
    moneyCell(item.iTax),
    moneyCell(item.unload),
    moneyCell(item.exWeight),
    moneyCell(item.other),
    formatMoney(item.total),
    moneyCell(item.recFrom),
    moneyCell(item.payTo),
  ];
  return (
    <div className="border-b border-black">
      <div className="grid text-[11px]" style={{ gridTemplateColumns: COLS }}>
        <div className="border-r border-black px-1 py-1 text-center">{item.sr}</div>
        <div className="border-r border-black px-1 py-1">{item.invoiceNo}</div>
        <div className="border-r border-black px-1 py-1">
          {formatDate(item.date)}
        </div>
        {nums.map((v, i) => (
          <div
            key={i}
            className={cn(
              "border-r border-black px-1 py-1 text-right tabular-nums last:border-r-0",
              i === 7 && "font-semibold",
            )}
          >
            {v}
          </div>
        ))}
      </div>
      <div className="grid bg-neutral-50 text-[10px] text-neutral-800" style={{ gridTemplateColumns: COLS }}>
        <div className="col-span-full flex flex-wrap gap-x-4 gap-y-0.5 border-t border-neutral-300 px-2 py-0.5">
          <span>
            <b>{t.vehicleNo}:</b> {item.vehicleNo || t.dash}
          </span>
          <span>
            <b>{t.city}:</b> {item.city || t.dash}
          </span>
          <span>
            <b>{t.weight}:</b> {item.weight || t.dash}
          </span>
          <span>
            <b>{t.receiver}:</b> {item.receiver || t.dash}
          </span>
        </div>
      </div>
    </div>
  );
}

export function InvoiceTable({
  statement,
  virtualize,
}: {
  statement: InvoiceStatement;
  virtualize?: boolean;
}) {
  const parentRef = useRef<HTMLDivElement>(null);
  const items = statement.items;
  const shouldVirtualize = Boolean(virtualize && items.length > 50);
  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
    overscan: 8,
    enabled: shouldVirtualize,
  });

  if (!shouldVirtualize) {
    return (
      <div className="overflow-hidden border border-black">
        <Head />
        {items.map((item) => (
          <ItemBlock key={item.id} item={item} />
        ))}
      </div>
    );
  }

  return (
    <div className="overflow-hidden border border-black">
      <Head />
      <div ref={parentRef} className="max-h-[70vh] overflow-auto">
        <div
          className="relative w-full"
          style={{ height: virtualizer.getTotalSize() }}
        >
          {virtualizer.getVirtualItems().map((v) => {
            const item = items[v.index];
            return (
              <div
                key={item.id}
                className="absolute top-0 left-0 w-full"
                style={{ transform: `translateY(${v.start}px)` }}
              >
                <ItemBlock item={item} />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
