import { createClient } from "@supabase/supabase-js";
import { createTestInvoice } from "../lib/test-invoice";
import { recomputeStatement } from "../lib/calculations";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Missing credentials");
  process.exit(1);
}

const sb = createClient(url, key);

async function seed() {
  const testId = randomUUID();
  const statement = recomputeStatement({
    ...createTestInvoice(),
    id: testId,
  });

  const searchText = `${statement.transporterName} ${statement.periodFrom} ${statement.periodTo} BAM-101 BAM-102`.toLowerCase();

  const { error } = await sb.from("invoices").upsert({
    id: testId,
    owner_key: "default",
    transporter_name: statement.transporterName,
    period_from: statement.periodFrom || null,
    period_to: statement.periodTo || null,
    search_text: searchText,
    is_draft: false,
    payload: statement,
    updated_at: new Date().toISOString(),
  });

  if (error) {
    console.error("❌ Failed to seed invoice:", error);
    process.exit(1);
  }

  console.log(`✅ Test invoice created in Supabase DB with ID: ${testId}`);
}

seed();
