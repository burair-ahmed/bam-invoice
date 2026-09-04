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

const s = StyleSheet.create({
  page: {
    padding: 18,
    fontSize: 7,
    fontFamily: "Helvetica",
    color: "#111",
  },
  header: {
    flexDirection: "row",
    borderBottomWidth: 1.5,
    borderBottomColor: "#000",
    paddingBottom: 6,
    marginBottom: 4,
  },
  logoBox: {
    width: 64,
    height: 52,
    borderWidth: 1,
    borderColor: "#000",
    marginRight: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  logo: { width: 62, height: 50, objectFit: "contain" },
  center: { flex: 1, alignItems: "center" },
  company: { fontSize: 14, fontFamily: "Helvetica-Bold", letterSpacing: 0.6 },
  subtitle: {
    fontSize: 8,
    marginTop: 2,
    textDecoration: "underline",
    fontFamily: "Helvetica-Bold",
  },
  period: { fontSize: 8, marginTop: 4 },
  stamp: { fontSize: 7, textAlign: "right", width: 90 },
  meta: { fontSize: 9, fontFamily: "Helvetica-Bold", marginVertical: 4 },
  table: { borderWidth: 1, borderColor: "#000" },
  head: {
    flexDirection: "row",
    backgroundColor: "#d4d4d4",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
    fontFamily: "Helvetica-Bold",
    fontSize: 6.5,
  },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: "#000" },
  sub: {
    flexDirection: "row",
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: "#f5f5f5",
    borderBottomWidth: 0.5,
    borderBottomColor: "#000",
    fontSize: 6.5,
    gap: 8,
  },
  cell: {
    borderRightWidth: 0.5,
    borderRightColor: "#000",
    paddingHorizontal: 2,
    paddingVertical: 2,
  },
  right: { textAlign: "right" },
  centerT: { textAlign: "center" },
  totals: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: "#000",
    padding: 4,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 16,
    fontFamily: "Helvetica-Bold",
  },
  net: { marginTop: 4, textAlign: "right", fontFamily: "Helvetica-Bold" },
  bottom: { marginTop: 16, flexDirection: "row" },
  notes: {
    flex: 1,
    minHeight: 48,
    borderWidth: 1,
    borderColor: "#000",
    padding: 4,
    marginRight: 12,
  },
  sign: { width: 130, alignItems: "center" },
  signLine: {
    marginTop: 28,
    width: "100%",
    borderBottomWidth: 1,
    borderBottomColor: "#000",
  },
});

const W = [22, 52, 48, 42, 42, 42, 34, 38, 38, 34, 46, 42, 38];

const HEADS = [
  "Sr.",
  "Invoice #",
  "Date",
  "Fare",
  "Advance",
  "Detension",
  "I.Tax",
  "Unload",
  "Ex Wght",
  "Other",
  "Total",
  "Rec From",
  "Payto",
];

function money(n: number) {
  return n ? formatMoney(n) : "";
}

export function InvoicePdfDocument({
  statement,
}: {
  statement: InvoiceStatement;
}) {
  const net = statement.netSettlement;
  const netText =
    net >= 0 ? `Receive ${formatMoney(net)}` : `Pay ${formatMoney(-net)}`;
  const logo = statement.logoUrl;

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={s.page}>
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
        <View style={s.table}>
          <View style={s.head}>
            {HEADS.map((h, i) => (
              <Text
                key={h}
                style={[
                  s.cell,
                  { width: W[i] },
                  i >= 3 ? s.right : s.centerT,
                ]}
              >
                {h}
              </Text>
            ))}
          </View>
          {statement.items.map((it) => (
            <View key={it.id}>
              <View style={s.row}>
                <Text style={[s.cell, { width: W[0] }, s.centerT]}>{it.sr}</Text>
                <Text style={[s.cell, { width: W[1] }]}>{it.invoiceNo}</Text>
                <Text style={[s.cell, { width: W[2] }]}>
                  {formatDate(it.date)}
                </Text>
                <Text style={[s.cell, { width: W[3] }, s.right]}>
                  {money(it.fare)}
                </Text>
                <Text style={[s.cell, { width: W[4] }, s.right]}>
                  {money(it.advance)}
                </Text>
                <Text style={[s.cell, { width: W[5] }, s.right]}>
                  {money(it.detention)}
                </Text>
                <Text style={[s.cell, { width: W[6] }, s.right]}>
                  {money(it.iTax)}
                </Text>
                <Text style={[s.cell, { width: W[7] }, s.right]}>
                  {money(it.unload)}
                </Text>
                <Text style={[s.cell, { width: W[8] }, s.right]}>
                  {money(it.exWeight)}
                </Text>
                <Text style={[s.cell, { width: W[9] }, s.right]}>
                  {money(it.other)}
                </Text>
                <Text style={[s.cell, { width: W[10] }, s.right]}>
                  {formatMoney(it.total)}
                </Text>
                <Text style={[s.cell, { width: W[11] }, s.right]}>
                  {money(it.recFrom)}
                </Text>
                <Text style={[s.cell, { width: W[12] }, s.right]}>
                  {money(it.payTo)}
                </Text>
              </View>
              <View style={s.sub}>
                <Text>Vehicle: {it.vehicleNo || "-"}</Text>
                <Text>City: {it.city || "-"}</Text>
                <Text>Weight: {it.weight || "-"}</Text>
                <Text>Receiver: {it.receiver || "-"}</Text>
              </View>
            </View>
          ))}
        </View>
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
      </Page>
    </Document>
  );
}
