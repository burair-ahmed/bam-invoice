"use client";

import Image from "next/image";
import type { InvoiceStatement } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/format";
import { t } from "@/lib/i18n";
import { COMPANY_NAME, COMPANY_SUBTITLE } from "@/lib/constants";

export function InvoiceHeader({ statement }: { statement: InvoiceStatement }) {
  const logo = statement.logoUrl;
  return (
    <div className="invoice-header grid grid-cols-[88px_1fr_auto] items-start gap-3 border-b-2 border-black pb-2">
      <div className="flex h-[72px] w-[88px] items-center justify-center overflow-hidden border border-black bg-white">
        {logo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logo}
            alt=""
            className="h-full w-full object-contain"
          />
        ) : (
          <span className="px-1 text-center text-[10px] leading-tight text-neutral-500">
            {t.uploadLogo}
          </span>
        )}
      </div>
      <div className="min-w-0 text-center">
        <div className="text-[22px] font-black tracking-wide uppercase leading-tight">
          {COMPANY_NAME}
        </div>
        <div className="mt-0.5 inline-block border-b border-black text-[13px] font-semibold uppercase tracking-wide">
          {COMPANY_SUBTITLE}
        </div>
        <div className="mt-2 text-[13px] font-medium">
          {t.periodFromTo(
            formatDate(statement.periodFrom),
            formatDate(statement.periodTo),
          )}
        </div>
      </div>
      <div className="whitespace-nowrap pt-1 text-right text-[11px] font-medium">
        {formatDateTime(statement.generatedAt)}
      </div>
    </div>
  );
}

export function InvoiceMeta({ statement }: { statement: InvoiceStatement }) {
  return (
    <div className="py-2 text-[14px] font-semibold">
      {t.transporterLine(statement.transporterName || t.dash)}
    </div>
  );
}

/** Used only in the editor chrome — Next Image for uploaded http(s) logos. */
export function LogoPreview({ url }: { url?: string | null }) {
  if (!url) {
    return (
      <div className="flex h-24 w-32 items-center justify-center rounded-xl border-2 border-dashed border-border bg-muted text-center text-sm text-muted-foreground">
        {t.uploadLogo}
      </div>
    );
  }
  if (url.startsWith("http")) {
    return (
      <Image
        src={url}
        alt=""
        width={128}
        height={96}
        className="h-24 w-32 rounded-xl border-2 border-border object-contain bg-white"
      />
    );
  }
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={url}
      alt=""
      className="h-24 w-32 rounded-xl border-2 border-border object-contain bg-white"
    />
  );
}
