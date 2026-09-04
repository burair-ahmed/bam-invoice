import { format, parseISO, isValid } from "date-fns";

export function formatDate(iso: string): string {
  if (!iso) return "";
  try {
    const d = iso.length <= 10 ? parseISO(iso) : new Date(iso);
    if (!isValid(d)) return iso;
    return format(d, "dd-MM-yyyy");
  } catch {
    return iso;
  }
}

export function formatDateTime(iso: string): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    if (!isValid(d)) return iso;
    return format(d, "dd-MM-yyyy hh:mm a");
  } catch {
    return iso;
  }
}

export function todayISO(): string {
  return format(new Date(), "yyyy-MM-dd");
}

export function fileStamp(iso?: string): string {
  const d = iso ? new Date(iso) : new Date();
  if (!isValid(d)) return format(new Date(), "yyyyMMdd-HHmm");
  return format(d, "yyyyMMdd-HHmm");
}
