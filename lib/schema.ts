import { z } from "zod";
import { t } from "./i18n";

const moneyField = z.coerce.number().finite().min(0, t.error);

export const lineItemFormSchema = z.object({
  id: z.string(),
  sr: z.number(),
  invoiceNo: z.string().min(1, t.needInvoiceNo),
  date: z.string().min(1, t.date),
  fare: moneyField,
  advance: moneyField,
  detention: moneyField,
  iTax: moneyField,
  unload: moneyField,
  exWeight: moneyField,
  other: moneyField,
  vehicleNo: z.string(),
  city: z.string(),
  weight: z.string(),
  receiver: z.string(),
});

export const invoiceFormSchema = z.object({
  transporterName: z.string().trim().min(1, t.needTransporter),
  periodFrom: z.string().min(1, t.periodFrom),
  periodTo: z.string().min(1, t.periodTo),
  notes: z.string().optional(),
  signatureLabel: z.string().optional(),
  items: z.array(lineItemFormSchema).min(1, t.needTrip),
});

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>;
export type LineItemFormValues = z.infer<typeof lineItemFormSchema>;
