import type { InvoiceStatement } from "@/lib/types";
import { formatDate, fileStamp } from "@/lib/format";
import { downloadBlob } from "@/lib/utils";
import * as XLSX from "xlsx";

type Cell = string | number | { t: "n"; f: string };

export function buildInvoiceWorkbook(statement: InvoiceStatement) {
  const wb = XLSX.utils.book_new();

  const colHeaders = [
    "Sr.",
    "Invoice #",
    "Date",
    "Fare",
    "Advance",
    "Detension",
    "I.Tax",
    "Unload",
    "Ex Wght",
    "Other",
    "Total",
    "Rec From",
    "Payto",
    "Vehicle",
    "City",
    "Weight",
    "Receiver",
  ];

  const rows: Cell[][] = [
    [statement.companyName],
    [statement.companySubtitle],
    [
      `Period From ${formatDate(statement.periodFrom)} To ${formatDate(statement.periodTo)}`,
    ],
    [`Transporter: ${statement.transporterName}`],
    [],
    colHeaders,
  ];

  const firstData = 7;
  statement.items.forEach((it, i) => {
    const r = firstData + i;
    rows.push([
      it.sr,
      it.invoiceNo,
      formatDate(it.date),
      it.fare,
      it.advance,
      it.detention,
      it.iTax,
      it.unload,
      it.exWeight,
      it.other,
      { t: "n", f: `D${r}-E${r}-F${r}-G${r}-H${r}-I${r}-J${r}` },
      { t: "n", f: `IF(K${r}>=0,K${r},0)` },
      { t: "n", f: `IF(K${r}<0,-K${r},0)` },
      it.vehicleNo,
      it.city,
      it.weight,
      it.receiver,
    ]);
  });

  if (statement.items.length) {
    const last = firstData + statement.items.length - 1;
    const totalRow = last + 1;
    rows.push([
      "",
      "",
      "Total",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      { t: "n", f: `SUM(K${firstData}:K${last})` },
      { t: "n", f: `SUM(L${firstData}:L${last})` },
      { t: "n", f: `SUM(M${firstData}:M${last})` },
    ]);
    rows.push(["Recv From / Pay To", { t: "n", f: `L${totalRow}-M${totalRow}` }]);
  }

  if (statement.notes) {
    rows.push([]);
    rows.push(["Notes", statement.notes]);
  }
  if (statement.signatureLabel) {
    rows.push(["Signature", statement.signatureLabel]);
  }

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = colHeaders.map((_, i) => ({
    wch: i === 1 ? 14 : i >= 13 ? 12 : 10,
  }));
  XLSX.utils.book_append_sheet(wb, ws, "Statement");
  return wb;
}

export function invoiceXlsxFilename(statement: InvoiceStatement) {
  return `${statement.transporterName || "invoice"}-${fileStamp(statement.generatedAt)}.xlsx`.replace(
    /\s+/g,
    "_",
  );
}

export async function downloadInvoiceXlsx(statement: InvoiceStatement) {
  const wb = buildInvoiceWorkbook(statement);
  const out = XLSX.write(wb, { bookType: "xlsx", type: "array" });
  downloadBlob(
    new Blob([out], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    invoiceXlsxFilename(statement),
  );
}
