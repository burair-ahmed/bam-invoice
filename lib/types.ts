// Core domain types for the transport invoice / statement app.

export type InvoiceLineItem = {
  id: string;
  sr: number;
  invoiceNo: string;
  date: string; // ISO date string
  fare: number;
  advance: number;
  detention: number;
  iTax: number;
  unload: number;
  exWeight: number;
  other: number;
  total: number; // auto-calculated, see lib/calculations.ts
  recFrom: number; // auto-calculated
  payTo: number; // auto-calculated
  vehicleNo: string;
  city: string;
  weight: string; // free text e.g. "20/25"
  receiver: string;
};

export type InvoiceStatement = {
  id: string;
  companyName: string; // default "Burair Ahmed Movers"
  companySubtitle: string; // default "Goods Transport Company"
  logoUrl?: string | null;
  periodFrom: string; // ISO
  periodTo: string; // ISO
  generatedAt: string; // ISO
  transporterName: string;
  items: InvoiceLineItem[];
  notes?: string;
  totalFare: number; // sum of Total column
  totalRecFrom: number; // sum of Rec From column
  netSettlement: number; // final net figure
  signatureLabel?: string;
};

// Row as entered in the form before auto-calculated fields are derived.
export type InvoiceLineItemInput = Omit<
  InvoiceLineItem,
  "total" | "recFrom" | "payTo"
>;

// Autocomplete history categories.
export type SuggestionKind = "transporter" | "vehicle" | "city" | "receiver";
