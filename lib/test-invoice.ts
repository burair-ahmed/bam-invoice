import { deriveRows, computeTotals } from "./calculations";
import { COMPANY_NAME, COMPANY_SUBTITLE } from "./constants";
import type { InvoiceStatement } from "./types";

/** Sample freight statement used for automated checks. */
export function createTestInvoice(): InvoiceStatement {
  const items = deriveRows([
    {
      id: "test-row-1",
      sr: 1,
      invoiceNo: "BAM-101",
      date: "2026-08-05",
      fare: 50000,
      advance: 10000,
      detention: 500,
      iTax: 2000,
      unload: 1500,
      exWeight: 0,
      other: 0,
      vehicleNo: "LES-1234",
      city: "Lahore",
      weight: "20/25",
      receiver: "Ali Traders",
    },
    {
      id: "test-row-2",
      sr: 2,
      invoiceNo: "BAM-102",
      date: "2026-08-12",
      fare: 8000,
      advance: 12000,
      detention: 0,
      iTax: 0,
      unload: 0,
      exWeight: 0,
      other: 0,
      vehicleNo: "FSD-7788",
      city: "Faisalabad",
      weight: "10/12",
      receiver: "-",
    },
  ]);
  const totals = computeTotals(items);
  return {
    id: "test-invoice-malik-2026-08",
    companyName: COMPANY_NAME,
    companySubtitle: COMPANY_SUBTITLE,
    logoUrl: null,
    periodFrom: "2026-08-01",
    periodTo: "2026-08-31",
    generatedAt: "2026-09-04T06:00:00.000Z",
    transporterName: "Malik Transport",
    items,
    notes: "Balance from last month: 2,500",
    signatureLabel: "Burair Ahmed",
    ...totals,
  };
}

export const TEST_INVOICE_EXPECT = {
  row1Total: 36000,
  row1RecFrom: 36000,
  row1PayTo: 0,
  row2Total: -4000,
  row2RecFrom: 0,
  row2PayTo: 4000,
  totalFare: 32000,
  totalRecFrom: 36000,
  totalPayTo: 4000,
  netSettlement: 32000,
};
