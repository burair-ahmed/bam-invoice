import { InvoicePreview } from "@/components/invoice/InvoicePreview";

export default async function InvoiceViewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InvoicePreview id={id} />;
}
