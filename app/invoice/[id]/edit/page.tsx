import { InvoiceBuilder } from "@/components/invoice/InvoiceBuilder";

export default async function InvoiceEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InvoiceBuilder invoiceId={id} />;
}
