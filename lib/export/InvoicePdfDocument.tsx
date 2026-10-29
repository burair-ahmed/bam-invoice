import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { InvoiceStatement } from "@/lib/types";
import { formatMoney } from "@/lib/calculations";
import { formatDate, formatDateTime } from "@/lib/format";
import { COMPANY_NAME, COMPANY_SUBTITLE } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Layout constants
// ---------------------------------------------------------------------------
// A4 portrait: 595pt wide, 842pt tall
// Margins: 20pt left/right, 28pt top/bottom for breathing room
// Usable width: 595 - 40 = 555pt
// ---------------------------------------------------------------------------
const ROWS_PER_FIRST_PAGE = 14; // fewer rows on page 1 (header takes space)
const ROWS_PER_OTHER_PAGE = 20; // more rows on continuation pages

// Column widths (must fit within ~486pt so borders don't overflow)
// Sr | Invoice # | Date | Fare | Advance | Detention | I.Tax | Unload | ExWgt | Other | Total | RecFrom | PayTo
const W = [18, 50, 42, 38, 38, 38, 30, 34, 34, 30, 42, 38, 34];

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
    paddingTop: 28,
    paddingBottom: 28,
    paddingLeft: 20,
    paddingRight: 20,
    fontSize: 7,
    fontFamily: "Helvetica",
    color: "#111",
  },
  // ── Full header (first page) ─────────────────────────────────────────────
  header: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    paddingBottom: 6,
    marginBottom: 4,
  },
  logoBox: {
    width: 60,
    height: 50,
    borderWidth: 1,
    borderColor: "#000",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 58, height: 48, objectFit: "contain" },
  center: { flex: 1, alignItems: "center" },
  company: { fontSize: 13, fontFamily: "Helvetica-Bold", letterSpacing: 0.5 },
  subtitle: {
    fontSize: 7.5,
    marginTop: 2,
    textDecoration: "underline",
    fontFamily: "Helvetica-Bold",
  },
  period: { fontSize: 7.5, marginTop: 3 },
  stamp: { fontSize: 6.5, textAlign: "right", width: 85 },
  meta: { fontSize: 8.5, fontFamily: "Helvetica-Bold", marginBottom: 3 },
  // ── Continuation header (page 2+) ────────────────────────────────────────
  contHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    paddingBottom: 3,
    marginBottom: 4,
  },
  contTitle: { fontSize: 8, fontFamily: "Helvetica-Bold" },
  contPage: { fontSize: 7, color: "#555" },
  // ── Table ────────────────────────────────────────────────────────────────
  table: { borderWidth: 1, borderColor: "#000" },
  head: {
    flexDirection: "row",
    backgroundColor: "#d4d4d4",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    fontFamily: "Helvetica-Bold",
    fontSize: 6,
  },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#000" },
  sub: {
    flexDirection: "row",
    paddingHorizontal: 3,
    paddingVertical: 1.5,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000",
    fontSize: 6,
    gap: 7,
  },
  cell: {
    borderRightWidth: 0.5,
    borderRightColor: "#000",
    paddingHorizontal: 2,
    paddingVertical: 1.5,
  },
  right: { textAlign: "right" },
  centerT: { textAlign: "center" },
  // ── Footer (last page only) ──────────────────────────────────────────────
  totals: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#000",
    padding: 4,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 14,
    fontFamily: "Helvetica-Bold",
  },
  net: { marginTop: 3, textAlign: "right", fontFamily: "Helvetica-Bold" },
  bottom: { marginTop: 14, flexDirection: "row" },
  notes: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderColor: "#000",
    padding: 4,
    marginRight: 12,
  },
  sign: { width: 120, alignItems: "center" },
  signLine: {
    marginTop: 26,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
  pageNum: {
    marginTop: 4,
    fontSize: 6.5,
    textAlign: "right",
    color: "#666",
  },
});

// ---------------------------------------------------------------------------
// Sub-components
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
          style={[s.cell, { width: W[i] }, i >= 3 ? s.right : s.centerT]}
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
    <View>
      <View style={s.row}>
        <Text style={[s.cell, { width: W[0] }, s.centerT]}>{it.sr}</Text>
        <Text style={[s.cell, { width: W[1] }]}>{it.invoiceNo}</Text>
        <Text style={[s.cell, { width: W[2] }]}>{formatDate(it.date)}</Text>
        {nums.map((v, i) => (
          <Text
            key={i}
            style={[
              s.cell,
              { width: W[i + 3] },
              s.right,
              i === 7 ? { fontFamily: "Helvetica-Bold" } : {},
            ]}
          >
            {v}
          </Text>
        ))}
      </View>
      <View style={s.sub}>
        <Text>Vehicle: {it.vehicleNo || "-"}</Text>
        <Text>City: {it.city || "-"}</Text>
        <Text>Weight: {it.weight || "-"}</Text>
        <Text>Receiver: {it.receiver || "-"}</Text>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------
export function InvoicePdfDocument({
  statement,
}: {
  statement: InvoiceStatement;
}) {
  const net = statement.netSettlement;
  const netText =
    net >= 0 ? `Receive ${formatMoney(net)}` : `Pay ${formatMoney(-net)}`;
  const logo = statement.logoUrl;
  const items = statement.items;

  // ── Paginate items ────────────────────────────────────────────────────────
  type PageData = {
    items: typeof items;
    isFirst: boolean;
    isLast: boolean;
    pageNum: number;
    totalPages: number;
  };
  const pages: PageData[] = [];
  let idx = 0;
  let pageIdx = 0;

  while (idx < items.length) {
    const limit = pageIdx === 0 ? ROWS_PER_FIRST_PAGE : ROWS_PER_OTHER_PAGE;
    pages.push({
      items: items.slice(idx, idx + limit),
      isFirst: pageIdx === 0,
      isLast: false,
      pageNum: pageIdx + 1,
      totalPages: 0,
    });
    idx += limit;
    pageIdx++;
  }

  // Edge case: no items – still render one page
  if (pages.length === 0) {
    pages.push({ items: [], isFirst: true, isLast: true, pageNum: 1, totalPages: 1 });
  }

  const totalPages = pages.length;
  pages.forEach((p, i) => {
    p.isLast = i === totalPages - 1;
    p.totalPages = totalPages;
  });

  return (
    <Document>
      {pages.map((page) => (
        <Page
          key={page.pageNum}
          size="A4"
          // Portrait is the default – no orientation prop
          style={s.page}
        >
          {/* First page: full invoice header + transporter meta */}
          {page.isFirst && (
            <>
              <View style={s.header}>
                <View style={s.logoBox}>
                  {logo ? (
                    // eslint-disable-next-line jsx-a11y/alt-text
                    <Image src={logo} style={s.logo} />
                  ) : (
                    <Text> </Text>
                  )}
                </View>
                <View style={s.center}>
                  <Text style={s.company}>{COMPANY_NAME}</Text>
                  <Text style={s.subtitle}>{COMPANY_SUBTITLE}</Text>
                  <Text style={s.period}>
                    Period From {formatDate(statement.periodFrom)} To{" "}
                    {formatDate(statement.periodTo)}
                  </Text>
                </View>
                <Text style={s.stamp}>{formatDateTime(statement.generatedAt)}</Text>
              </View>
              <Text style={s.meta}>Transporter: {statement.transporterName}</Text>
            </>
          )}

          {/* Continuation pages: compact header with page number */}
          {!page.isFirst && (
            <View style={s.contHeader}>
              <Text style={s.contTitle}>
                {COMPANY_NAME} — {statement.transporterName}
              </Text>
              <Text style={s.contPage}>
                Page {page.pageNum} / {page.totalPages}
              </Text>
            </View>
          )}

          {/* Table: column header row + data rows */}
          <View style={s.table}>
            <TableHead />
            {page.items.map((it) => (
              <ItemRow key={it.id} it={it} />
            ))}
          </View>

          {/* Page number indicator on first page (when multi-page) */}
          {page.isFirst && totalPages > 1 && (
            <Text style={s.pageNum}>
              Page 1 / {totalPages}
            </Text>
          )}

          {/* Footer: totals + notes + signature – last page only */}
          {page.isLast && (
            <>
              <View style={s.totals}>
                <Text>Total: {formatMoney(statement.totalFare)}</Text>
                <Text>Total Rec From: {formatMoney(statement.totalRecFrom)}</Text>
              </View>
              <Text style={s.net}>Recv From / Pay To: {netText}</Text>
              <View style={s.bottom}>
                <View style={s.notes}>
                  <Text>{statement.notes || " "}</Text>
                </View>
                <View style={s.sign}>
                  <View style={s.signLine} />
                  <Text>{statement.signatureLabel || "Signature"}</Text>
                </View>
              </View>
            </>
          )}
        </Page>
      ))}
    </Document>
  );
}
