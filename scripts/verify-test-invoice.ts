import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as XLSX from "xlsx";
import { createTestInvoice, TEST_INVOICE_EXPECT } from "../lib/test-invoice";
import { buildInvoiceWorkbook } from "../lib/export/toXlsx";
import { recomputeStatement } from "../lib/calculations";

function assertEqual(label: string, actual: number, expected: number) {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${actual}`);
  }
  console.log(`ok  ${label} = ${actual}`);
}

const statement = recomputeStatement(createTestInvoice());
const e = TEST_INVOICE_EXPECT;
const [a, b] = statement.items;

assertEqual("trip 1 total", a.total, e.row1Total);
assertEqual("trip 1 recFrom", a.recFrom, e.row1RecFrom);
assertEqual("trip 1 payTo", a.payTo, e.row1PayTo);
assertEqual("trip 2 total", b.total, e.row2Total);
assertEqual("trip 2 recFrom", b.recFrom, e.row2RecFrom);
assertEqual("trip 2 payTo", b.payTo, e.row2PayTo);
assertEqual("grand total", statement.totalFare, e.totalFare);
assertEqual("total recFrom", statement.totalRecFrom, e.totalRecFrom);
assertEqual("net settlement", statement.netSettlement, e.netSettlement);

if (statement.companyName !== "BURAIR AHMED MOVERS") {
  throw new Error("company name mismatch");
}
if (statement.transporterName !== "Malik Transport") {
  throw new Error("transporter mismatch");
}

const wb = buildInvoiceWorkbook(statement);
const ws = wb.Sheets.Statement;
if (!ws.A1 || String(ws.A1.v).indexOf("BURAIR") === -1) {
  throw new Error("xlsx header missing company name");
}
if (String(ws.K7?.f || "") !== "D7-E7-F7-G7-H7-I7-J7") {
  throw new Error(`xlsx row formula missing, got ${ws.K7?.f}`);
}
if (String(ws.K9?.f || "") !== "SUM(K7:K8)") {
  throw new Error(`xlsx total formula missing, got ${ws.K9?.f}`);
}

const dir = join(dirname(fileURLToPath(import.meta.url)), "..", "tmp");
mkdirSync(dir, { recursive: true });
const out = join(dir, "Malik_Transport-test.xlsx");
writeFileSync(out, Buffer.from(XLSX.write(wb, { bookType: "xlsx", type: "array" })));
console.log(`ok  wrote ${out}`);
console.log("All invoice checks passed.");
