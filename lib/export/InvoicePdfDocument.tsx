import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { InvoiceLineItem, InvoiceStatement } from "@/lib/types";
import { formatMoney } from "@/lib/calculations";
import { formatDate, formatDateTime } from "@/lib/format";
import { COMPANY_NAME, COMPANY_SUBTITLE } from "@/lib/constants";
import { LETTERHEAD_BG_DATA_URL } from "./letterhead-image";

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
// A4 dimensions: 595.28 pt wide, 841.89 pt tall
// Top letterhead graphics end at ~129pt. Content starts at paddingTop: 138pt.
// Bottom letterhead swoosh rises to ~720pt on left. Content stops at paddingBottom: 130pt (Y = 711.9pt).
// Horizontal margins: 20pt left and right. Usable width: 595.28 - 40 = 555.28pt.
// ---------------------------------------------------------------------------

// Column widths summing exactly to 555pt (matching usable printable width)
// Sr | Invoice # | Date | Fare | Advance | Detention | I.Tax | Unload | ExWgt | Other | Total | RecFrom | PayTo
const W = [20, 58, 46, 44, 44, 40, 36, 38, 38, 36, 49, 53, 53];

const HEADS = [
  "Sr.",
  "Invoice #",
  "Date",
  "Fare",
  "Advance",
  "Detention",
  "I.Tax",
  "Unload",
  "Ex Wght",
  "Other",
  "Total",
  "Rec From",
  "Pay To",
];

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------
const s = StyleSheet.create({
  page: {
    paddingTop: 138,
    paddingBottom: 130,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 7,
    fontFamily: "Helvetica",
    color: "#111827",
    position: "relative",
  },
  // Full-bleed A4 letterhead background
  bgImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 595.28,
    height: 841.89,
  },

  // ── Header (Page 1) ───────────────────────────────────────────────────────
  // Letterhead artwork already includes BAM logo + "BURAIR AHMED MOVERS" at top left.
  // Header bar neatly sits below letterhead at Y=138pt.
  headerBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    borderBottomWidth: 1.5,
    borderBottomColor: "#1e293b",
    paddingBottom: 6,
    marginBottom: 8,
  },
  headerLeft: {
    flex: 1,
  },
  docTitle: {
    fontSize: 12,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 0.8,
    color: "#0f172a",
  },
  docSubtitle: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#e67e22",
    marginTop: 1,
    letterSpacing: 0.5,
  },
  transporterLine: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  transporterTag: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
  },
  transporterName: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  metaText: {
    fontSize: 7,
    color: "#334155",
    lineHeight: 1.3,
  },
  metaBold: {
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },

  // ── Continuation Header (Page 2+) ────────────────────────────────────────
  contHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#1e293b",
    paddingBottom: 4,
    marginBottom: 6,
  },
  contTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  contPage: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#475569",
  },

  // ── Table ────────────────────────────────────────────────────────────────
  table: {
    borderWidth: 1,
    borderColor: "#000000",
  },
  head: {
    flexDirection: "row",
    backgroundColor: "#2c343b",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
  },
  headCell: {
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
    color: "#ffffff",
    paddingVertical: 3,
  },
  rowGroup: {
    borderBottomWidth: 0.5,
    borderBottomColor: "#000000",
  },
  row: {
    flexDirection: "row",
  },
  subRow: {
    flexDirection: "row",
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    backgroundColor: "#f8fafc",
    borderTopWidth: 0.5,
    borderTopColor: "#cbd5e1",
    fontSize: 6,
    gap: 10,
  },
  subLabel: {
    fontFamily: "Helvetica-Bold",
    color: "#475569",
  },
  subValue: {
    color: "#0f172a",
  },
  cell: {
    borderRightWidth: 0.5,
    borderRightColor: "#000000",
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  lastCell: {
    borderRightWidth: 0,
  },
  right: { textAlign: "right" },
  centerT: { textAlign: "center" },

  // ── Footer (last page only) ──────────────────────────────────────────────
  footerWrap: {
    marginTop: 6,
  },
  totalsBox: {
    borderWidth: 1,
    borderColor: "#000000",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 6,
    paddingVertical: 4,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  totalItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  totalLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
  },
  totalValue: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  netBanner: {
    marginTop: 4,
    paddingHorizontal: 6,
    paddingVertical: 3,
    backgroundColor: "#e2e8f0",
    borderWidth: 1,
    borderColor: "#000000",
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    gap: 6,
  },
  netLabel: {
    fontSize: 7.5,
    fontFamily: "Helvetica-Bold",
    color: "#1e293b",
  },
  netValue: {
    fontSize: 8.5,
    fontFamily: "Helvetica-Bold",
    color: "#0f172a",
  },
  bottomSplit: {
    marginTop: 8,
    flexDirection: "row",
    gap: 12,
  },
  notesBox: {
    flex: 1,
    minHeight: 40,
    borderWidth: 1,
    borderColor: "#000000",
    padding: 4,
  },
  notesTitle: {
    fontSize: 6,
    fontFamily: "Helvetica-Bold",
    color: "#64748b",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  notesContent: {
    fontSize: 6.5,
    color: "#1e293b",
    lineHeight: 1.2,
  },
  signBlock: {
    width: 140,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  signLine: {
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    marginBottom: 3,
  },
  signLabel: {
    fontSize: 7,
    fontFamily: "Helvetica-Bold",
    color: "#334155",
  },

  // Page indicator at bottom of page (page 1 of multi-page only)
  pageNumber: {
    marginTop: 4,
    fontSize: 6.5,
    textAlign: "right",
    color: "#64748b",
  },
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function money(n: number) {
  return n ? formatMoney(n) : "";
}

function TableHead() {
  return (
    <View style={s.head}>
      {HEADS.map((h, i) => (
        <Text
          key={h}
          style={[
            s.cell,
            s.headCell,
            { width: W[i] },
            i >= 3 ? s.right : s.centerT,
            i === HEADS.length - 1 ? s.lastCell : {},
          ]}
        >
          {h}
        </Text>
      ))}
    </View>
  );
}

function ItemRow({ it }: { it: InvoiceStatement["items"][number] }) {
  const nums = [
    money(it.fare),
    money(it.advance),
    money(it.detention),
    money(it.iTax),
    money(it.unload),
    money(it.exWeight),
    money(it.other),
    formatMoney(it.total),
    money(it.recFrom),
    money(it.payTo),
  ];
  return (
    <View style={s.rowGroup} wrap={false}>
      <View style={s.row}>
        <Text style={[s.cell, { width: W[0] }, s.centerT]}>{it.sr}</Text>
        <Text style={[s.cell, { width: W[1] }, s.centerT]}>{it.invoiceNo}</Text>
        <Text style={[s.cell, { width: W[2] }, s.centerT]}>{formatDate(it.date)}</Text>
        {nums.map((v, i) => (
          <Text
            key={i}
            style={[
              s.cell,
              { width: W[i + 3] },
              s.right,
              i === 7 ? { fontFamily: "Helvetica-Bold" } : {},
              i === nums.length - 1 ? s.lastCell : {},
            ]}
          >
            {v}
          </Text>
        ))}
      </View>
      <View style={s.subRow}>
        <Text>
          <Text style={s.subLabel}>Vehicle: </Text>
          <Text style={s.subValue}>{it.vehicleNo || "-"}</Text>
        </Text>
        <Text>
          <Text style={s.subLabel}>City: </Text>
          <Text style={s.subValue}>{it.city || "-"}</Text>
        </Text>
        <Text>
          <Text style={s.subLabel}>Weight: </Text>
          <Text style={s.subValue}>{it.weight || "-"}</Text>
        </Text>
        <Text>
          <Text style={s.subLabel}>Receiver: </Text>
          <Text style={s.subValue}>{it.receiver || "-"}</Text>
        </Text>
      </View>
    </View>
  );
}

/**
 * Dynamically partitions items into balanced pages:
 * - Up to 13 items comfortably fit on 1 single page along with header and footer.
 * - For multi-page, page 1 (no footer) holds up to 15 items.
 * - Continuation page with footer holds up to 14 items.
 * - Continuation page without footer holds up to 18 items.
 * - Automatically balances items across pages so the final page is never empty.
 */
function partitionPages(items: InvoiceLineItem[]): InvoiceLineItem[][] {
  const n = items.length;
  if (n <= 13) {
    return [items];
  }

  const result: InvoiceLineItem[][] = [];
  let remaining = [...items];

  // If total items is between 14 and 18, split cleanly into two balanced pages
  let p1Size = 15;
  if (remaining.length <= 18) {
    p1Size = Math.ceil(remaining.length / 2);
  }
  result.push(remaining.slice(0, p1Size));
  remaining = remaining.slice(p1Size);

  while (remaining.length > 0) {
    if (remaining.length <= 14) {
      result.push(remaining);
      break;
    }
    if (remaining.length <= 20) {
      const take = Math.ceil(remaining.length / 2);
      result.push(remaining.slice(0, take));
      remaining = remaining.slice(take);
    } else {
      result.push(remaining.slice(0, 18));
      remaining = remaining.slice(18);
    }
  }

  return result;
}

// ---------------------------------------------------------------------------
// Document Component
// ---------------------------------------------------------------------------
export function InvoicePdfDocument({
  statement,
}: {
  statement: InvoiceStatement;
}) {
  const net = statement.netSettlement;
  const netText =
    net >= 0 ? `Receive ${formatMoney(net)}` : `Pay ${formatMoney(-net)}`;
  const items = statement.items;

  // ── Paginate items ────────────────────────────────────────────────────────
  type PageData = {
    items: InvoiceLineItem[];
    isFirst: boolean;
    isLast: boolean;
    pageNum: number;
    totalPages: number;
  };

  const itemChunks = partitionPages(items);
  const totalPages = itemChunks.length;

  const pages: PageData[] = itemChunks.map((chunk, i) => ({
    items: chunk,
    isFirst: i === 0,
    isLast: i === totalPages - 1,
    pageNum: i + 1,
    totalPages,
  }));

  return (
    <Document>
      {pages.map((page) => (
        <Page
          key={page.pageNum}
          size="A4"
          style={s.page}
        >
          {/* Exact full-bleed A4 background letterhead graphic on every page */}
          {/* eslint-disable-next-line jsx-a11y/alt-text */}
          <Image
            src={LETTERHEAD_BG_DATA_URL}
            style={s.bgImage}
            fixed
          />

          {/* First page header: sits below the letterhead top graphic */}
          {page.isFirst && (
            <View style={s.headerBar}>
              <View style={s.headerLeft}>
                <Text style={s.docTitle}>FREIGHT STATEMENT</Text>
                <Text style={s.docSubtitle}>{COMPANY_SUBTITLE}</Text>
                <View style={s.transporterLine}>
                  <Text style={s.transporterTag}>Transporter: </Text>
                  <Text style={s.transporterName}>{statement.transporterName || "-"}</Text>
                </View>
              </View>
              <View style={s.headerRight}>
                <Text style={s.metaText}>
                  <Text style={s.metaBold}>Period: </Text>
                  {formatDate(statement.periodFrom)} to {formatDate(statement.periodTo)}
                </Text>
                <Text style={s.metaText}>
                  <Text style={s.metaBold}>Generated: </Text>
                  {formatDateTime(statement.generatedAt)}
                </Text>
              </View>
            </View>
          )}

          {/* Continuation header (pages 2+) */}
          {!page.isFirst && (
            <View style={s.contHeader}>
              <Text style={s.contTitle}>
                {COMPANY_NAME} — {statement.transporterName || "Statement"}
              </Text>
              <Text style={s.contPage}>
                Page {page.pageNum} of {page.totalPages}
              </Text>
            </View>
          )}

          {/* Data Table */}
          <View style={s.table}>
            <TableHead />
            {page.items.map((it) => (
              <ItemRow key={it.id} it={it} />
            ))}
          </View>

          {/* First page page number indicator (when multi-page) */}
          {page.isFirst && totalPages > 1 && (
            <Text style={s.pageNumber}>
              Page 1 of {totalPages}
            </Text>
          )}

          {/* Footer (totals, net, notes, signature) – last page only */}
          {page.isLast && (
            <View style={s.footerWrap} wrap={false}>
              <View style={s.totalsBox}>
                <View style={s.totalItem}>
                  <Text style={s.totalLabel}>Grand Total:</Text>
                  <Text style={s.totalValue}>{formatMoney(statement.totalFare)}</Text>
                </View>
                <View style={s.totalItem}>
                  <Text style={s.totalLabel}>Total Rec From:</Text>
                  <Text style={s.totalValue}>{formatMoney(statement.totalRecFrom)}</Text>
                </View>
                <View style={s.totalItem}>
                  <Text style={s.totalLabel}>Total Pay To:</Text>
                  <Text style={s.totalValue}>{formatMoney(statement.totalPayTo)}</Text>
                </View>
              </View>

              <View style={s.netBanner}>
                <Text style={s.netLabel}>Recv From / Pay To Net Settlement:</Text>
                <Text style={s.netValue}>{netText}</Text>
              </View>

              <View style={s.bottomSplit}>
                <View style={s.notesBox}>
                  <Text style={s.notesTitle}>Notes / Remarks</Text>
                  <Text style={s.notesContent}>{statement.notes || "-"}</Text>
                </View>
                <View style={s.signBlock}>
                  <View style={s.signLine} />
                  <Text style={s.signLabel}>{statement.signatureLabel || "Authorized Signature"}</Text>
                </View>
              </View>
            </View>
          )}
        </Page>
      ))}
    </Document>
  );
}