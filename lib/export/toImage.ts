import type { InvoiceStatement } from "@/lib/types";
import { fileStamp } from "@/lib/format";
import { downloadBlob } from "@/lib/utils";

export async function downloadInvoiceImage(
  node: HTMLElement,
  kind: "png" | "jpeg",
  statement: InvoiceStatement,
) {
  const { toPng, toJpeg } = await import("html-to-image");
  const fn = kind === "png" ? toPng : toJpeg;
  const dataUrl = await fn(node, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
  });
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  const name = `${statement.transporterName || "invoice"}-${fileStamp(statement.generatedAt)}.${kind === "png" ? "png" : "jpg"}`;
  downloadBlob(blob, name.replace(/\s+/g, "_"));
}
