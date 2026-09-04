import type { InvoiceStatement, SuggestionKind } from "./types";
import { recomputeStatement } from "./calculations";
import { COMPANY_NAME, COMPANY_SUBTITLE } from "./constants";
import { uid } from "./utils";

const DB_NAME = "burair-invoices";
const DB_VERSION = 1;
const INVOICES = "invoices";
const SUGGESTIONS = "suggestions";
const META = "meta";

export type StoredInvoice = {
  id: string;
  updatedAt: string;
  isDraft: boolean;
  transporterName: string;
  periodFrom: string;
  periodTo: string;
  searchText: string;
  payload: InvoiceStatement;
};

export type SuggestionRow = {
  id: string;
  kind: SuggestionKind;
  value: string;
  lastUsed: string;
};

function searchTextOf(s: InvoiceStatement): string {
  const nos = s.items.map((i) => i.invoiceNo).join(" ");
  return `${s.transporterName} ${s.periodFrom} ${s.periodTo} ${nos} ${s.notes ?? ""}`.toLowerCase();
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(INVOICES)) {
        const store = db.createObjectStore(INVOICES, { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
        store.createIndex("transporterName", "transporterName");
      }
      if (!db.objectStoreNames.contains(SUGGESTIONS)) {
        const store = db.createObjectStore(SUGGESTIONS, { keyPath: "id" });
        store.createIndex("kind", "kind");
        store.createIndex("kindValue", ["kind", "value"], { unique: true });
      }
      if (!db.objectStoreNames.contains(META)) {
        db.createObjectStore(META, { keyPath: "key" });
      }
    };
    req.onsuccess = () => resolve(req.result);
  });
}

function txDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function listInvoices(): Promise<StoredInvoice[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INVOICES, "readonly");
    const req = tx.objectStore(INVOICES).getAll();
    req.onsuccess = () => {
      const rows = (req.result as StoredInvoice[]).sort((a, b) =>
        b.updatedAt.localeCompare(a.updatedAt),
      );
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getInvoice(id: string): Promise<InvoiceStatement | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(INVOICES, "readonly");
    const req = tx.objectStore(INVOICES).get(id);
    req.onsuccess = () => {
      const row = req.result as StoredInvoice | undefined;
      resolve(row ? recomputeStatement(withFixedCompany(row.payload)) : null);
    };
    req.onerror = () => reject(req.error);
  });
}

function withFixedCompany(s: InvoiceStatement): InvoiceStatement {
  return {
    ...s,
    companyName: COMPANY_NAME,
    companySubtitle: COMPANY_SUBTITLE,
  };
}

export async function saveInvoice(
  statement: InvoiceStatement,
  opts?: { isDraft?: boolean },
): Promise<InvoiceStatement> {
  const now = new Date().toISOString();
  const payload = recomputeStatement({
    ...withFixedCompany(statement),
    generatedAt: statement.generatedAt || now,
  });
  const row: StoredInvoice = {
    id: payload.id,
    updatedAt: now,
    isDraft: Boolean(opts?.isDraft),
    transporterName: payload.transporterName,
    periodFrom: payload.periodFrom,
    periodTo: payload.periodTo,
    searchText: searchTextOf(payload),
    payload: { ...payload, generatedAt: now },
  };
  const db = await openDb();
  const tx = db.transaction(INVOICES, "readwrite");
  tx.objectStore(INVOICES).put({ ...row, payload: row.payload });
  await txDone(tx);
  await rememberSuggestions(payload);
  return row.payload;
}

export async function deleteInvoice(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(INVOICES, "readwrite");
  tx.objectStore(INVOICES).delete(id);
  await txDone(tx);
}

export async function duplicateInvoice(
  id: string,
): Promise<InvoiceStatement | null> {
  const src = await getInvoice(id);
  if (!src) return null;
  const copy: InvoiceStatement = {
    ...src,
    id: uid(),
    generatedAt: new Date().toISOString(),
  };
  return saveInvoice(copy, { isDraft: true });
}

export async function listSuggestions(
  kind: SuggestionKind,
): Promise<string[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(SUGGESTIONS, "readonly");
    const idx = tx.objectStore(SUGGESTIONS).index("kind");
    const req = idx.getAll(kind);
    req.onsuccess = () => {
      const rows = (req.result as SuggestionRow[]).sort((a, b) =>
        b.lastUsed.localeCompare(a.lastUsed),
      );
      resolve(rows.map((r) => r.value));
    };
    req.onerror = () => reject(req.error);
  });
}

async function rememberSuggestions(s: InvoiceStatement) {
  const now = new Date().toISOString();
  const entries: { kind: SuggestionKind; value: string }[] = [];
  if (s.transporterName.trim()) {
    entries.push({ kind: "transporter", value: s.transporterName.trim() });
  }
  for (const it of s.items) {
    if (it.vehicleNo.trim())
      entries.push({ kind: "vehicle", value: it.vehicleNo.trim() });
    if (it.city.trim()) entries.push({ kind: "city", value: it.city.trim() });
    if (it.receiver.trim())
      entries.push({ kind: "receiver", value: it.receiver.trim() });
  }
  const db = await openDb();
  const tx = db.transaction(SUGGESTIONS, "readwrite");
  const store = tx.objectStore(SUGGESTIONS);
  for (const e of entries) {
    const id = `${e.kind}:${e.value.toLowerCase()}`;
    store.put({ id, kind: e.kind, value: e.value, lastUsed: now } satisfies SuggestionRow);
  }
  await txDone(tx);
}

export async function getMeta<T>(key: string): Promise<T | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(META, "readonly");
    const req = tx.objectStore(META).get(key);
    req.onsuccess = () => {
      const row = req.result as { key: string; value: T } | undefined;
      resolve(row ? row.value : null);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  const db = await openDb();
  const tx = db.transaction(META, "readwrite");
  tx.objectStore(META).put({ key, value });
  await txDone(tx);
}

export async function getLogoDataUrl(): Promise<string | null> {
  return getMeta<string>("logoDataUrl");
}

export async function setLogoDataUrl(dataUrl: string | null): Promise<void> {
  await setMeta("logoDataUrl", dataUrl);
}
