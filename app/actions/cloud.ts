"use server";

import { cookies } from "next/headers";
import type { InvoiceStatement, SuggestionKind } from "@/lib/types";
import { createServiceSupabase } from "@/lib/supabase";
import { hasValidSession } from "@/lib/session";
import { recomputeStatement } from "@/lib/calculations";

const OWNER = "default";

async function assertSession() {
  const jar = await cookies();
  const header = jar
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join("; ");
  return hasValidSession(header);
}

function searchTextOf(s: InvoiceStatement): string {
  const nos = s.items.map((i) => i.invoiceNo).join(" ");
  return `${s.transporterName} ${s.periodFrom} ${s.periodTo} ${nos}`.toLowerCase();
}

export async function cloudSaveInvoice(
  statement: InvoiceStatement,
  isDraft: boolean,
): Promise<{ ok: boolean; skipped?: boolean }> {
  if (!(await assertSession())) return { ok: false };
  const sb = createServiceSupabase();
  if (!sb || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: true, skipped: true };
  }
  const payload = recomputeStatement(statement);
  const { error } = await sb.from("invoices").upsert({
    id: payload.id,
    owner_key: OWNER,
    transporter_name: payload.transporterName,
    period_from: payload.periodFrom || null,
    period_to: payload.periodTo || null,
    search_text: searchTextOf(payload),
    is_draft: isDraft,
    payload,
    updated_at: new Date().toISOString(),
  });
  if (error) return { ok: false };

  const now = new Date().toISOString();
  const suggestions: { id: string; owner_key: string; kind: SuggestionKind; value: string; last_used: string }[] =
    [];
  const add = (kind: SuggestionKind, value: string) => {
    const v = value.trim();
    if (!v) return;
    suggestions.push({
      id: `${OWNER}:${kind}:${v.toLowerCase()}`,
      owner_key: OWNER,
      kind,
      value: v,
      last_used: now,
    });
  };
  add("transporter", payload.transporterName);
  for (const it of payload.items) {
    add("vehicle", it.vehicleNo);
    add("city", it.city);
    add("receiver", it.receiver);
  }
  if (suggestions.length) {
    await sb.from("suggestions").upsert(suggestions);
  }
  return { ok: true };
}

export async function cloudDeleteInvoice(id: string): Promise<{ ok: boolean }> {
  if (!(await assertSession())) return { ok: false };
  const sb = createServiceSupabase();
  if (!sb || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { ok: true };
  const { error } = await sb.from("invoices").delete().eq("id", id);
  return { ok: !error };
}

export async function cloudSaveLogoUrl(
  logoUrl: string | null,
): Promise<{ ok: boolean }> {
  if (!(await assertSession())) return { ok: false };
  const sb = createServiceSupabase();
  if (!sb || !process.env.SUPABASE_SERVICE_ROLE_KEY) return { ok: true };
  const { error } = await sb.from("company_settings").upsert({
    owner_key: OWNER,
    logo_url: logoUrl,
    updated_at: new Date().toISOString(),
  });
  return { ok: !error };
}

export async function cloudListInvoices(): Promise<
  Array<{
    id: string;
    updatedAt: string;
    isDraft: boolean;
    transporterName: string;
    periodFrom: string;
    periodTo: string;
    searchText: string;
    payload: InvoiceStatement;
  }>
> {
  if (!(await assertSession())) return [];
  const sb = createServiceSupabase();
  if (!sb || !process.env.SUPABASE_SERVICE_ROLE_KEY) return [];
  const { data, error } = await sb
    .from("invoices")
    .select("*")
    .eq("owner_key", OWNER)
    .order("updated_at", { ascending: false });
  if (error || !data) return [];
  return data.map((row) => ({
    id: row.id,
    updatedAt: row.updated_at,
    isDraft: Boolean(row.is_draft),
    transporterName: row.transporter_name || "",
    periodFrom: row.period_from || "",
    periodTo: row.period_to || "",
    searchText: row.search_text || "",
    payload: row.payload as InvoiceStatement,
  }));
}

export async function cloudGetInvoice(
  id: string,
): Promise<InvoiceStatement | null> {
  if (!(await assertSession())) return null;
  const sb = createServiceSupabase();
  if (!sb || !process.env.SUPABASE_SERVICE_ROLE_KEY) return null;
  const { data, error } = await sb
    .from("invoices")
    .select("payload")
    .eq("id", id)
    .eq("owner_key", OWNER)
    .maybeSingle();
  if (error || !data) return null;
  return data.payload as InvoiceStatement;
}

