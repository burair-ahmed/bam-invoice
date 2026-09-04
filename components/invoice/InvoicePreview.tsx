"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { t } from "@/lib/i18n";
import { getInvoice, saveInvoice } from "@/lib/db";
import { cloudGetInvoice } from "@/app/actions/cloud";
import type { InvoiceStatement } from "@/lib/types";
import { InvoiceDocument } from "@/components/invoice/InvoiceDocument";
import { ExportMenu } from "@/components/invoice/ExportMenu";
import { Button } from "@/components/ui/button";
import {
  AppHeader,
  Screen,
  ScreenBody,
} from "@/components/app/AppShell";

export function InvoicePreview({ id }: { id: string }) {
  const [statement, setStatement] = useState<InvoiceStatement | null>(null);
  const [missing, setMissing] = useState(false);
  const nodeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      let s = await getInvoice(id);
      if (!s) {
        s = await cloudGetInvoice(id);
        if (s) {
          await saveInvoice(s);
        }
      }
      if (!s) setMissing(true);
      else setStatement(s);
    })();
  }, [id]);

  if (missing) {
    return (
      <Screen>
        <AppHeader title={t.viewTitle} backHref="/" backLabel={t.home} />
        <ScreenBody>
          <p className="text-lg">{t.notFound}</p>
        </ScreenBody>
      </Screen>
    );
  }

  if (!statement) {
    return (
      <Screen>
        <AppHeader title={t.viewTitle} backHref="/" backLabel={t.home} />
        <ScreenBody>
          <p className="text-lg">{t.loading}</p>
        </ScreenBody>
      </Screen>
    );
  }

  return (
    <Screen>
      <AppHeader
        title={statement.transporterName || t.viewTitle}
        backHref="/"
        backLabel={t.home}
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={`/invoice/${id}/edit`}>{t.editInvoice}</Link>
          </Button>
        }
      />
      <ScreenBody>
        <div className="print:hidden space-y-3">
        <ExportMenu
          statement={statement}
          getNode={() => nodeRef.current?.querySelector("[data-invoice-root]") ?? null}
        />
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => window.print()}
        >
          {t.print}
        </Button>
        </div>
        <div className="overflow-x-auto rounded-xl border-2 border-border bg-white print:overflow-visible print:border-0">
          <div ref={nodeRef} className="min-w-[1100px]">
            <InvoiceDocument statement={statement} virtualize />
          </div>
        </div>
      </ScreenBody>
    </Screen>
  );
}
