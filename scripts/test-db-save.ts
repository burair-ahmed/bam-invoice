import { createClient } from "@supabase/supabase-js";
import { createTestInvoice } from "../lib/test-invoice";
import { recomputeStatement } from "../lib/calculations";
import { randomUUID } from "node:crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("❌ Missing Supabase credentials in environment!");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", url);
  console.error("SUPABASE_SERVICE_ROLE_KEY:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "EXISTS" : "MISSING");
  process.exit(1);
}

console.log(`Connecting to Supabase at ${url}...`);
const sb = createClient(url, key);

async function testCloudDb() {
  const testId = randomUUID();
  const statement = recomputeStatement({
    ...createTestInvoice(),
    id: testId,
  });

  console.log(`1. Testing invoice UPSERT into 'invoices' table with ID: ${testId}...`);
  const searchText = `${statement.transporterName} ${statement.periodFrom} ${statement.periodTo} BAM-101 BAM-102`.toLowerCase();

  const { data: upsertData, error: upsertErr } = await sb.from("invoices").upsert({
    id: testId,
    owner_key: "default",
    transporter_name: statement.transporterName,
    period_from: statement.periodFrom || null,
    period_to: statement.periodTo || null,
    search_text: searchText,
    is_draft: false,
    payload: statement,
    updated_at: new Date().toISOString(),
  }).select();

  if (upsertErr) {
    console.error("❌ Upsert failed:", upsertErr);
    process.exit(1);
  }

  console.log("✅ Invoice saved successfully in Supabase DB!");

  console.log("2. Testing SELECT from 'invoices' table...");
  const { data: selectData, error: selectErr } = await sb.from("invoices").select("*").eq("id", testId).single();

  if (selectErr || !selectData) {
    console.error("❌ Select failed:", selectErr);
    process.exit(1);
  }

  console.log(`✅ Invoice retrieved successfully! Transporter: "${selectData.transporter_name}", Total: ${selectData.payload.totalFare}`);

  console.log("3. Testing UPSERT into 'suggestions' table...");
  const now = new Date().toISOString();
  const { error: sugErr } = await sb.from("suggestions").upsert([
    {
      id: `default:transporter:${statement.transporterName.toLowerCase()}`,
      owner_key: "default",
      kind: "transporter",
      value: statement.transporterName,
      last_used: now,
    },
    {
      id: "default:vehicle:les-1234",
      owner_key: "default",
      kind: "vehicle",
      value: "LES-1234",
      last_used: now,
    }
  ]);

  if (sugErr) {
    console.error("❌ Suggestions upsert failed:", sugErr);
  } else {
    console.log("✅ Suggestions updated successfully!");
  }

  console.log("4. Cleaning up test invoice...");
  const { error: delErr } = await sb.from("invoices").delete().eq("id", testId);
  if (delErr) {
    console.error("⚠️ Cleanup failed:", delErr);
  } else {
    console.log("✅ Test invoice cleaned up!");
  }

  console.log("\n🎉 ALL SUPABASE DB TESTS PASSED SUCCESSFULLY!");
}

testCloudDb().catch(err => {
  console.error("Unexpected error:", err);
  process.exit(1);
});
