import { useMemo, useRef, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { MonthlyReportCard } from "@/components/monthly-report";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatCurrency, getAllMonthReport, getMonthLabel, summarizeAllTime } from "@/lib/expense-data";
import { useExpenseStore } from "@/lib/expense-store";
import { exportReportPdf, getFilteredReport, summarizeReport, type ReportFilterMode } from "@/lib/reporting";

const filterOptions: { id: ReportFilterMode; label: string }[] = [
  { id: "all", label: "All time" },
  { id: "year", label: "Year" },
  { id: "quarter", label: "Quarter" },
  { id: "custom", label: "Custom" },
];

export default function ReportScreen() {
  const router = useRouter();
  const { hydrated, transactions, categories, currency } = useExpenseStore();
  const allReport = useMemo(() => getAllMonthReport(transactions), [transactions]);
  const allTotals = useMemo(() => summarizeAllTime(transactions), [transactions]);
  const years = useMemo(() => Array.from(new Set(allReport.map((item) => Number(item.month.slice(0, 4))))).sort((a, b) => b - a), [allReport]);
  const [mode, setMode] = useState<ReportFilterMode>("all");
  const [year, setYear] = useState(new Date().getFullYear());
  const [quarter, setQuarter] = useState<1 | 2 | 3 | 4>(1);
  const [startMonth, setStartMonth] = useState("");
  const [endMonth, setEndMonth] = useState("");
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState("");
  const scrollRef = useRef<ScrollView>(null);

  const filter = useMemo(() => ({ mode, year, quarter, startMonth: startMonth || undefined, endMonth: endMonth || undefined }), [endMonth, mode, quarter, startMonth, year]);
  const report = useMemo(() => getFilteredReport(transactions, filter), [filter, transactions]);
  const reportMonths = useMemo(() => new Set(report.map((item) => item.month)), [report]);
  const reportTransactions = useMemo(() => transactions.filter((item) => reportMonths.has(item.date.slice(0, 7))), [reportMonths, transactions]);
  const totals = useMemo(() => mode === "all" ? allTotals : summarizeReport(report), [allTotals, mode, report]);
  const filterLabel = mode === "all" ? "All recorded months" : mode === "year" ? `${year} report` : mode === "quarter" ? `Q${quarter} ${year} report` : `${startMonth || "start"} to ${endMonth || "present"}`;

  const handleExport = async () => {
    setExporting(true);
    setStatus("");
    try {
      const result = await exportReportPdf(report, totals, currency, filterLabel, reportTransactions, categories);
      setStatus(result === "shared" ? "PDF ready in the share sheet." : "Print dialog opened — choose Save as PDF.");
    } catch {
      setStatus("Could not create the report. Please try again.");
    } finally {
      setExporting(false);
    }
  };

  if (!hydrated) return <ScreenContainer className="px-5 pt-6"><Text style={styles.loading}>Building your report…</Text></ScreenContainer>;

  return (
    <ScreenContainer className="px-5 pt-3">
      <ScrollView ref={scrollRef} showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.topBar}><Pressable accessibilityLabel="Back" onPress={() => router.back()} style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}><IconSymbol name="chevron.left" size={20} color="#14213D" /></Pressable><View style={styles.titleBlock}><Text style={styles.eyebrow}>YOUR HISTORY</Text><Text style={styles.title}>Monthly report</Text></View></View>
        <View style={styles.quickActions}><Pressable accessibilityLabel="Back to overview" onPress={() => router.back()} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}><IconSymbol name="house.fill" size={15} color="#667085" /><Text style={styles.quickActionText}>Overview</Text></Pressable><Pressable accessibilityLabel="Show report filters" onPress={() => scrollRef.current?.scrollTo({ y: 105, animated: true })} style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}><IconSymbol name="slider.horizontal.3" size={15} color="#667085" /><Text style={styles.quickActionText}>Filters</Text></Pressable><Pressable accessibilityLabel="Export PDF report" onPress={handleExport} disabled={exporting} style={({ pressed }) => [styles.quickAction, styles.quickActionPrimary, pressed && styles.pressed]}><IconSymbol name="arrow.up.doc" size={15} color="#FFFFFF" /><Text style={styles.quickActionPrimaryText}>{exporting ? "Preparing…" : "Export PDF"}</Text></Pressable></View>
        <Text style={styles.intro}>See the full rhythm of your money, month by month. Use the visible filters below to focus the totals and chart, then export exactly this view.</Text>
        <View style={styles.filterCard}><View style={styles.filterHeader}><View><Text style={styles.eyebrow}>REPORT RANGE</Text><Text style={styles.filterTitle}>Show me</Text></View><Text style={styles.filterHint}>All options visible</Text></View><View style={styles.filterRow}>{filterOptions.map((option) => <Pressable key={option.id} onPress={() => setMode(option.id)} style={({ pressed }) => [styles.filterOption, mode === option.id && styles.filterOptionSelected, pressed && styles.pressed]}><Text style={[styles.filterOptionText, mode === option.id && styles.filterOptionSelectedText]}>{option.label}</Text></Pressable>)}</View>{mode === "year" && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.choiceScroll}>{(years.length > 0 ? years : [new Date().getFullYear()]).map((value) => <Pressable key={value} onPress={() => setYear(value)} style={[styles.choiceChip, year === value && styles.choiceChipSelected]}><Text style={[styles.choiceText, year === value && styles.choiceTextSelected]}>{value}</Text></Pressable>)}</ScrollView>}{mode === "quarter" && <><View style={styles.inlineLabel}><Text style={styles.subLabel}>Year</Text><Text style={styles.subLabel}>Quarter</Text></View><View style={styles.twoColumn}><View style={styles.choiceGroup}>{(years.length > 0 ? years : [new Date().getFullYear()]).map((value) => <Pressable key={value} onPress={() => setYear(value)} style={[styles.choiceChip, year === value && styles.choiceChipSelected]}><Text style={[styles.choiceText, year === value && styles.choiceTextSelected]}>{value}</Text></Pressable>)}</View><View style={styles.choiceGroup}>{([1, 2, 3, 4] as const).map((value) => <Pressable key={value} onPress={() => setQuarter(value)} style={[styles.choiceChip, quarter === value && styles.choiceChipSelected]}><Text style={[styles.choiceText, quarter === value && styles.choiceTextSelected]}>Q{value}</Text></Pressable>)}</View></View></>}{mode === "custom" && <><Text style={styles.customHint}>Enter months as YYYY-MM. Boundaries are inclusive.</Text><View style={styles.twoColumn}><View style={styles.inputGroup}><Text style={styles.subLabel}>From</Text><TextInput value={startMonth} onChangeText={setStartMonth} placeholder="2026-01" placeholderTextColor="#B4BBC6" style={styles.filterInput} autoCapitalize="none" /></View><View style={styles.inputGroup}><Text style={styles.subLabel}>To</Text><TextInput value={endMonth} onChangeText={setEndMonth} placeholder="2026-12" placeholderTextColor="#B4BBC6" style={styles.filterInput} autoCapitalize="none" /></View></View></>}</View>
        <View style={styles.actionCard}><View style={styles.actionCopy}><Text style={styles.eyebrow}>SHARE THIS VIEW</Text><Text style={styles.actionTitle}>Export filtered report</Text><Text style={styles.actionDescription}>Create a PDF with these exact months and totals. On mobile it opens the share sheet; on web it opens print-to-PDF.</Text></View><Pressable onPress={handleExport} disabled={exporting} style={({ pressed }) => [styles.exportButton, pressed && styles.pressed]}><IconSymbol name="arrow.up.doc" size={16} color="#FFFFFF" /><Text style={styles.exportButtonText}>{exporting ? "Preparing…" : "Export PDF"}</Text></Pressable>{status ? <Text style={styles.status}>{status}</Text> : null}</View>
        <View style={styles.rangePill}><IconSymbol name="calendar" size={14} color="#2A9E87" /><Text style={styles.rangePillText}>{filterLabel} · {report.length} month{report.length === 1 ? "" : "s"}</Text></View>
        <MonthlyReportCard transactions={transactions} currency={currency} reportOverride={report} totalsOverride={totals} />
        <View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>MONTHLY DETAIL</Text><Text style={styles.sectionTitle}>Income and expenses</Text></View><Text style={styles.count}>{report.length} month{report.length === 1 ? "" : "s"}</Text></View>
        {report.length === 0 ? <View style={styles.empty}><IconSymbol name="chart.bar.fill" size={18} color="#98A2B3" /><Text style={styles.emptyText}>No saved transactions match this report range.</Text></View> : <View style={styles.detailCard}>{[...report].reverse().map((item) => <View key={item.month} style={styles.detailRow}><View><Text style={styles.month}>{getMonthLabel(item.month)}</Text><Text style={styles.detailNet}>{item.net >= 0 ? "Positive" : "Negative"} month</Text></View><View style={styles.detailValues}><Text style={styles.income}>+{formatCurrency(item.income, currency)}</Text><Text style={styles.expense}>−{formatCurrency(item.expenses, currency)}</Text></View></View>)}</View>}
        <View style={styles.totalCard}><Text style={styles.totalEyebrow}>FILTERED TOTALS</Text><View style={styles.totalLine}><Text style={styles.totalLabel}>Income</Text><Text style={styles.totalIncome}>{formatCurrency(totals.income, currency)}</Text></View><View style={styles.totalLine}><Text style={styles.totalLabel}>Expenses</Text><Text style={styles.totalExpense}>{formatCurrency(totals.expenses, currency)}</Text></View><View style={[styles.totalLine, styles.netLine]}><Text style={styles.totalLabel}>Net balance</Text><Text style={[styles.totalNet, { color: totals.net >= 0 ? "#2A9E87" : "#D66A56" }]}>{formatCurrency(totals.net, currency)}</Text></View></View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 50 },
  loading: { color: "#667085", fontSize: 15, textAlign: "center", marginTop: 80 },
  topBar: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  backButton: { width: 39, height: 39, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E7E5E0" },
  quickActions: { flexDirection: "row", gap: 7, marginBottom: 16 },
  quickAction: { flex: 1, minHeight: 39, borderRadius: 11, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 5, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E7E5E0" },
  quickActionPrimary: { backgroundColor: "#14213D", borderColor: "#14213D" },
  quickActionText: { color: "#667085", fontSize: 10, fontWeight: "800" },
  quickActionPrimaryText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  titleBlock: { flex: 1, paddingLeft: 12 },
  eyebrow: { color: "#98A2B3", fontSize: 10, fontWeight: "800", letterSpacing: 1.1 },
  title: { color: "#14213D", fontSize: 27, fontWeight: "800", letterSpacing: -0.8, marginTop: 3 },
  intro: { color: "#667085", fontSize: 12, lineHeight: 18, marginBottom: 16 },
  filterCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", padding: 15 },
  filterHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between" },
  filterTitle: { color: "#14213D", fontSize: 16, fontWeight: "800", marginTop: 3 },
  filterHint: { color: "#2A9E87", fontSize: 10, fontWeight: "800" },
  filterRow: { flexDirection: "row", gap: 6, marginTop: 13 },
  filterOption: { flex: 1, minHeight: 34, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F5F6", paddingHorizontal: 4 },
  filterOptionSelected: { backgroundColor: "#14213D" },
  filterOptionText: { color: "#667085", fontSize: 10, fontWeight: "800" },
  filterOptionSelectedText: { color: "#FFFFFF" },
  choiceScroll: { gap: 7, paddingTop: 12 },
  choiceChip: { minHeight: 31, paddingHorizontal: 11, borderRadius: 9, alignItems: "center", justifyContent: "center", backgroundColor: "#F4F5F6", borderWidth: 1, borderColor: "#F4F5F6" },
  choiceChipSelected: { backgroundColor: "#E5F6F1", borderColor: "#BDEBDD" },
  choiceText: { color: "#667085", fontSize: 10, fontWeight: "800" },
  choiceTextSelected: { color: "#2A9E87" },
  inlineLabel: { flexDirection: "row", justifyContent: "space-between", marginTop: 13, paddingHorizontal: 2 },
  twoColumn: { flexDirection: "row", gap: 10, marginTop: 7 },
  choiceGroup: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6 },
  inputGroup: { flex: 1 },
  subLabel: { color: "#667085", fontSize: 10, fontWeight: "800" },
  filterInput: { height: 39, borderRadius: 10, borderWidth: 1, borderColor: "#E7E5E0", marginTop: 6, paddingHorizontal: 10, color: "#14213D", fontSize: 12, fontWeight: "700" },
  customHint: { color: "#98A2B3", fontSize: 10, marginTop: 13 },
  actionCard: { backgroundColor: "#EAF8F4", borderRadius: 18, padding: 15, marginTop: 14, borderWidth: 1, borderColor: "#CBEFE5" },
  actionCopy: { marginBottom: 12 },
  actionTitle: { color: "#14213D", fontSize: 15, fontWeight: "800", marginTop: 4 },
  actionDescription: { color: "#667085", fontSize: 10, lineHeight: 15, marginTop: 5 },
  exportButton: { height: 39, borderRadius: 11, backgroundColor: "#14213D", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7 },
  exportButtonText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  status: { color: "#2A9E87", fontSize: 10, fontWeight: "700", textAlign: "center", marginTop: 9 },
  rangePill: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#F0F8F6", borderRadius: 10, paddingHorizontal: 9, height: 28, marginTop: 16 },
  rangePillText: { color: "#2A9E87", fontSize: 10, fontWeight: "800" },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 25, marginBottom: 11 },
  sectionTitle: { color: "#14213D", fontSize: 18, fontWeight: "800", letterSpacing: -0.4, marginTop: 4 },
  count: { color: "#2A9E87", fontSize: 11, fontWeight: "800", marginBottom: 2 },
  detailCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", paddingHorizontal: 15 },
  detailRow: { minHeight: 63, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#F0EFEB" },
  month: { color: "#14213D", fontSize: 12, fontWeight: "800" },
  detailNet: { color: "#98A2B3", fontSize: 10, marginTop: 4 },
  detailValues: { alignItems: "flex-end", gap: 3 },
  income: { color: "#2A9E87", fontSize: 10, fontWeight: "800" },
  expense: { color: "#D66A56", fontSize: 10, fontWeight: "800" },
  empty: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", padding: 18, flexDirection: "row", alignItems: "center", gap: 9 },
  emptyText: { color: "#98A2B3", fontSize: 11, flex: 1 },
  totalCard: { backgroundColor: "#14213D", borderRadius: 18, padding: 17, marginTop: 18 },
  totalEyebrow: { color: "#A9B4C7", fontSize: 10, fontWeight: "800", letterSpacing: 1.1, marginBottom: 9 },
  totalLine: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 9 },
  totalLabel: { color: "#A9B4C7", fontSize: 12, fontWeight: "600" },
  totalIncome: { color: "#9AE7D3", fontSize: 14, fontWeight: "800" },
  totalExpense: { color: "#F3AE9D", fontSize: 14, fontWeight: "800" },
  netLine: { borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)", marginTop: 3, paddingTop: 13 },
  totalNet: { fontSize: 17, fontWeight: "800" },
  pressed: { opacity: 0.65 },
});
