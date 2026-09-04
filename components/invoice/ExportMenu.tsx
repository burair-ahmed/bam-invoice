"use client";

import { useState } from "react";
import { toast } from "sonner";
import { t } from "@/lib/i18n";
import { Button } from "@/components/ui/button";
import type { InvoiceStatement } from "@/lib/types";

export function ExportMenu({
  statement,
  getNode,
}: {
  statement: InvoiceStatement;
  getNode: () => HTMLElement | null;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  async function run(kind: "png" | "jpg" | "pdf" | "xlsx") {
    setBusy(kind);
    try {
      if (kind === "png" || kind === "jpg") {
        const node = getNode();
        if (!node) throw new Error("missing node");
        const { downloadInvoiceImage } = await import("@/lib/export/toImage");
        await downloadInvoiceImage(
          node,
          kind === "png" ? "png" : "jpeg",
          statement,
        );
      } else if (kind === "pdf") {
        const { downloadInvoicePdf } = await import("@/lib/export/toPdf");
        await downloadInvoicePdf(statement);
      } else {
        const { downloadInvoiceXlsx } = await import("@/lib/export/toXlsx");
        await downloadInvoiceXlsx(statement);
      }
      toast.success(t.downloadOk);
    } catch {
      toast.error(t.downloadFail);
    } finally {
      setBusy(null);
    }
  }

  const label = (kind: string, text: string) =>
    busy === kind ? t.downloading : text;

  return (
    <div className="flex flex-col gap-3">
      <Button
        type="button"
        className="w-full"
        disabled={!!busy}
        onClick={() => run("png")}
      >
        {label("png", t.downloadPicture)}
      </Button>
      <Button
        type="button"
        variant="secondary"
        className="w-full"
        disabled={!!busy}
        onClick={() => run("pdf")}
      >
        {label("pdf", t.downloadPdf)}
      </Button>
      <Button
        type="button"
        variant="outline"
        className="w-full"
        disabled={!!busy}
        onClick={() => run("xlsx")}
      >
        {label("xlsx", t.downloadExcel)}
      </Button>
    </div>
  );
}
