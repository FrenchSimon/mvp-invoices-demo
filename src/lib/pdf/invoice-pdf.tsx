import path from "node:path";
import { Document, Font, Image, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { formatDate, formatMoney, formatNumber, formatRate } from "@/lib/format";
import { lineTotalCents, VAT_EXEMPTION_NOTE } from "@/lib/invoices/totals";
import type { FullInvoice } from "@/lib/invoices/load";

// Polices de DESIGN.md, embarquées dans le PDF (fichiers dans ./fonts, licence OFL).
// next.config.ts les inclut dans le déploiement (outputFileTracingIncludes).
const fontDir = path.join(process.cwd(), "src/lib/pdf/fonts");
Font.register({ family: "Newsreader", src: path.join(fontDir, "newsreader-latin-500-normal.woff") });
Font.register({
  family: "Source Sans 3",
  fonts: [
    { src: path.join(fontDir, "source-sans-3-latin-400-normal.woff"), fontWeight: 400 },
    { src: path.join(fontDir, "source-sans-3-latin-600-normal.woff"), fontWeight: 600 },
  ],
});
// Pas de césure automatique des mots.
Font.registerHyphenationCallback((word) => [word]);

// Couleurs de DESIGN.md (le PDF ne lit pas les variables CSS du site).
const INK = "#2B2520";
const INK_SOFT = "#4A4038";
const MUTED = "#6B5F55";
const RULE = "#DCD1C2";
const TERRACOTTA = "#B5532F";

// Espaces insécables fines de Intl -> espaces simples, présentes dans toutes les polices.
const plain = (s: string) => s.replace(/[  ]/g, " ");
const money = (cents: number) => plain(formatMoney(cents));

const s = StyleSheet.create({
  page: { paddingTop: 48, paddingBottom: 64, paddingHorizontal: 48, fontFamily: "Source Sans 3", fontSize: 10, color: INK, lineHeight: 1.4 },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 36 },
  company: { maxWidth: 260 },
  // Logo (Pro) : tient dans 160 × 56 pt, proportions gardées, aligné à gauche.
  logo: { maxWidth: 160, maxHeight: 56, objectFit: "contain", objectPosition: "left", marginBottom: 10 },
  companyName: { fontFamily: "Newsreader", fontSize: 18, marginBottom: 4 },
  soft: { color: INK_SOFT },
  muted: { color: MUTED, fontSize: 9 },
  titleBlock: { alignItems: "flex-end" },
  title: { fontFamily: "Newsreader", fontSize: 26, lineHeight: 1.1, color: TERRACOTTA, marginBottom: 8 },
  meta: { flexDirection: "row", marginTop: 2 },
  metaLabel: { color: MUTED, width: 80, textAlign: "right", marginRight: 8 },
  metaValue: { width: 70, textAlign: "right" },
  billTo: { marginBottom: 28, maxWidth: 280 },
  label: { color: MUTED, fontSize: 9, marginBottom: 3, textTransform: "uppercase", letterSpacing: 0.6 },
  strong: { fontWeight: 600 },
  tableHead: { flexDirection: "row", borderTopWidth: 1, borderTopColor: INK, borderBottomWidth: 0.5, borderBottomColor: RULE, paddingVertical: 6, color: MUTED, fontSize: 9, fontWeight: 600 },
  row: { flexDirection: "row", borderBottomWidth: 0.5, borderBottomColor: RULE, paddingVertical: 7 },
  cDesc: { flex: 1, paddingRight: 8 },
  cQty: { width: 50, textAlign: "right" },
  cPrice: { width: 90, textAlign: "right" },
  cTotal: { width: 90, textAlign: "right" },
  bottom: { flexDirection: "row", justifyContent: "space-between", marginTop: 16 },
  notes: { maxWidth: 260, color: INK_SOFT },
  totals: { width: 220 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 2 },
  grandTotal: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: INK, marginTop: 4, paddingTop: 6, fontFamily: "Newsreader", fontSize: 15 },
  footer: { position: "absolute", left: 48, right: 48, bottom: 32, color: MUTED, fontSize: 8, textAlign: "center" },
});

function InvoiceDocument({ data }: { data: FullInvoice }) {
  const { invoice, summary, items, client, company, logo } = data;
  const rate = summary.vat_rate;

  return (
    <Document title={`Invoice ${invoice.number}`} author={company.company_name || company.email} language="en">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.company}>
            {/* eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf, pas une balise img */}
            {logo ? <Image src={logo} style={s.logo} /> : null}
            <Text style={s.companyName}>{company.company_name || company.email}</Text>
            {company.address ? <Text style={s.soft}>{company.address}</Text> : null}
            {company.email ? <Text style={s.soft}>{company.email}</Text> : null}
            {company.vat_number ? <Text style={s.soft}>VAT no. {company.vat_number}</Text> : null}
          </View>
          <View style={s.titleBlock}>
            <Text style={s.title}>Invoice</Text>
            <View style={s.meta}>
              <Text style={s.metaLabel}>Number</Text>
              <Text style={[s.metaValue, s.strong]}>{invoice.number}</Text>
            </View>
            <View style={s.meta}>
              <Text style={s.metaLabel}>Date</Text>
              <Text style={s.metaValue}>{formatDate(invoice.issue_date)}</Text>
            </View>
            <View style={s.meta}>
              <Text style={s.metaLabel}>Due date</Text>
              <Text style={s.metaValue}>{formatDate(invoice.due_date)}</Text>
            </View>
          </View>
        </View>

        <View style={s.billTo}>
          <Text style={s.label}>Bill to</Text>
          <Text style={s.strong}>{client.name}</Text>
          {client.address ? <Text style={s.soft}>{client.address}</Text> : null}
          {client.vat_number ? <Text style={s.soft}>VAT no. {client.vat_number}</Text> : null}
        </View>

        <View style={s.tableHead} fixed>
          <Text style={s.cDesc}>Description</Text>
          <Text style={s.cQty}>Qty</Text>
          <Text style={s.cPrice}>Unit price</Text>
          <Text style={s.cTotal}>Amount</Text>
        </View>
        {items.map((it) => (
          <View key={it.id} style={s.row} wrap={false}>
            <Text style={s.cDesc}>{it.description}</Text>
            <Text style={s.cQty}>{plain(formatNumber(it.quantity))}</Text>
            <Text style={s.cPrice}>{money(it.unit_price_cents)}</Text>
            <Text style={s.cTotal}>
              {money(lineTotalCents({ quantity: it.quantity, unitPriceCents: it.unit_price_cents }))}
            </Text>
          </View>
        ))}

        <View style={s.bottom} wrap={false}>
          <View style={s.notes}>
            {invoice.notes ? <Text>{invoice.notes}</Text> : null}
          </View>
          <View style={s.totals}>
            <View style={s.totalLine}>
              <Text>Subtotal</Text>
              <Text>{money(summary.subtotal_cents)}</Text>
            </View>
            <View style={[s.totalLine, s.soft]}>
              <Text>{rate === 0 ? "VAT" : `VAT ${plain(formatRate(rate))}`}</Text>
              <Text>{money(summary.vat_cents)}</Text>
            </View>
            <View style={s.grandTotal}>
              <Text>Total</Text>
              <Text>{money(summary.total_cents)}</Text>
            </View>
            {rate === 0 ? <Text style={[s.muted, { marginTop: 6 }]}>{VAT_EXEMPTION_NOTE}</Text> : null}
          </View>
        </View>

        <Text style={s.footer} fixed>
          Payment due by {formatDate(invoice.due_date)}. Late payments may incur statutory interest and a fixed
          €40 recovery fee (EU Late Payment Directive 2011/7/EU). No discount for early payment.
        </Text>
      </Page>
    </Document>
  );
}

export function renderInvoicePdf(data: FullInvoice): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}

export function invoiceFileName(number: string) {
  return `invoice-${number}.pdf`;
}
