import path from "node:path";
import { Document, Font, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
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
  const { invoice, summary, items, client, company } = data;
  const rate = summary.vat_rate;

  return (
    <Document title={`Facture ${invoice.number}`} author={company.company_name || company.email} language="fr">
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.company}>
            <Text style={s.companyName}>{company.company_name || company.email}</Text>
            {company.address ? <Text style={s.soft}>{company.address}</Text> : null}
            {company.email ? <Text style={s.soft}>{company.email}</Text> : null}
            {company.vat_number ? <Text style={s.soft}>N° TVA : {company.vat_number}</Text> : null}
          </View>
          <View style={s.titleBlock}>
            <Text style={s.title}>Facture</Text>
            <View style={s.meta}>
              <Text style={s.metaLabel}>Numéro</Text>
              <Text style={[s.metaValue, s.strong]}>{invoice.number}</Text>
            </View>
            <View style={s.meta}>
              <Text style={s.metaLabel}>Date</Text>
              <Text style={s.metaValue}>{formatDate(invoice.issue_date)}</Text>
            </View>
            <View style={s.meta}>
              <Text style={s.metaLabel}>Échéance</Text>
              <Text style={s.metaValue}>{formatDate(invoice.due_date)}</Text>
            </View>
          </View>
        </View>

        <View style={s.billTo}>
          <Text style={s.label}>Facturé à</Text>
          <Text style={s.strong}>{client.name}</Text>
          {client.address ? <Text style={s.soft}>{client.address}</Text> : null}
          {client.vat_number ? <Text style={s.soft}>N° TVA : {client.vat_number}</Text> : null}
        </View>

        <View style={s.tableHead} fixed>
          <Text style={s.cDesc}>Description</Text>
          <Text style={s.cQty}>Qté</Text>
          <Text style={s.cPrice}>Prix unitaire HT</Text>
          <Text style={s.cTotal}>Total HT</Text>
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
              <Text>Total HT</Text>
              <Text>{money(summary.subtotal_cents)}</Text>
            </View>
            <View style={[s.totalLine, s.soft]}>
              <Text>{rate === 0 ? "TVA" : `TVA ${plain(formatRate(rate))}`}</Text>
              <Text>{money(summary.vat_cents)}</Text>
            </View>
            <View style={s.grandTotal}>
              <Text>Total TTC</Text>
              <Text>{money(summary.total_cents)}</Text>
            </View>
            {rate === 0 ? <Text style={[s.muted, { marginTop: 6 }]}>{VAT_EXEMPTION_NOTE}</Text> : null}
          </View>
        </View>

        <Text style={s.footer} fixed>
          Payable au plus tard le {formatDate(invoice.due_date)}. En cas de retard, pénalités au taux de trois fois
          le taux d&apos;intérêt légal et indemnité forfaitaire de 40 € pour frais de recouvrement (art. L441-10 du
          Code de commerce). Pas d&apos;escompte pour paiement anticipé.
        </Text>
      </Page>
    </Document>
  );
}

export function renderInvoicePdf(data: FullInvoice): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument data={data} />);
}

export function invoiceFileName(number: string) {
  return `facture-${number}.pdf`;
}
