import { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatCurrency, getAllMonthReport, getMonthLabel, summarizeAllTime, type AllTimeSummary, type MonthlyReport, type Transaction } from "@/lib/expense-data";

export function MonthlyReportCard({
  transactions,
  currency,
  onOpenReport,
  limit,
  reportOverride,
  totalsOverride,
}: {
  transactions: Transaction[];
  currency: string;
  onOpenReport?: () => void;
  limit?: number;
  reportOverride?: MonthlyReport[];
  totalsOverride?: AllTimeSummary;
}) {
  const report = useMemo(() => reportOverride ?? getAllMonthReport(transactions), [reportOverride, transactions]);
  const visibleReport = limit ? report.slice(-limit) : report;
  const totals = useMemo(() => totalsOverride ?? summarizeAllTime(transactions), [totalsOverride, transactions]);
  const maxAmount = Math.max(1, ...visibleReport.flatMap((item) => [item.income, item.expenses]));

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.titleWrap}>
          <View style={styles.iconBubble}><IconSymbol name="chart.bar.fill" size={16} color="#2FBF9F" /></View>
          <View><Text style={styles.eyebrow}>ALL-MONTH REPORT</Text><Text style={styles.title}>Income vs expenses</Text></View>
        </View>
        {onOpenReport && <Pressable onPress={onOpenReport} style={({ pressed }) => [styles.action, pressed && styles.pressed]}><Text style={styles.actionText}>View report</Text><IconSymbol name="chevron.right" size={14} color="#2A9E87" /></Pressable>}
      </View>
      <View style={styles.totalsRow}>
        <View style={styles.totalBlock}><Text style={styles.totalLabel}>Income total</Text><Text style={[styles.totalValue, { color: "#2A9E87" }]}>{formatCurrency(totals.income, currency)}</Text></View>
        <View style={styles.totalDivider} />
        <View style={styles.totalBlock}><Text style={styles.totalLabel}>Expenses total</Text><Text style={[styles.totalValue, { color: "#D66A56" }]}>{formatCurrency(totals.expenses, currency)}</Text></View>
        <View style={styles.totalDivider} />
        <View style={styles.totalBlock}><Text style={styles.totalLabel}>Net total</Text><Text style={[styles.totalValue, { color: totals.net >= 0 ? "#2A9E87" : "#D66A56" }]}>{formatCurrency(totals.net, currency)}</Text></View>
      </View>
      {visibleReport.length === 0 ? <View style={styles.empty}><IconSymbol name="chart.bar.fill" size={18} color="#98A2B3" /><Text style={styles.emptyText}>Your monthly report will build as you add entries.</Text></View> : <>
        <View style={styles.legend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#2FBF9F" }]} /><Text style={styles.legendText}>Income</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#E9785D" }]} /><Text style={styles.legendText}>Expenses</Text></View></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chartScroll}><View style={styles.chart}>{visibleReport.map((item) => <View key={item.month} style={styles.monthColumn}><View style={styles.bars}><View style={[styles.bar, { height: Math.max(item.income > 0 ? 8 : 3, (item.income / maxAmount) * 92), backgroundColor: "#2FBF9F" }]} /><View style={[styles.bar, { height: Math.max(item.expenses > 0 ? 8 : 3, (item.expenses / maxAmount) * 92), backgroundColor: "#E9785D" }]} /></View><Text style={styles.monthLabel}>{getMonthLabel(item.month).split(" ")[0].slice(0, 3)}</Text><Text style={styles.yearLabel}>{item.month.slice(0, 4)}</Text></View>)}</View></ScrollView>
        <Text style={styles.caption}>{limit && report.length > limit ? `Showing the latest ${limit} months · ` : ""}Bar height follows each month’s actual total.</Text>
      </>}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", padding: 15 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  titleWrap: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  iconBubble: { width: 32, height: 32, borderRadius: 10, backgroundColor: "#E5F6F1", alignItems: "center", justifyContent: "center" },
  eyebrow: { color: "#98A2B3", fontSize: 9, fontWeight: "800", letterSpacing: 1.05 },
  title: { color: "#14213D", fontSize: 14, fontWeight: "800", marginTop: 3 },
  action: { flexDirection: "row", alignItems: "center", gap: 2, paddingVertical: 7, paddingLeft: 5 },
  actionText: { color: "#2A9E87", fontSize: 10, fontWeight: "800" },
  pressed: { opacity: 0.65 },
  totalsRow: { flexDirection: "row", alignItems: "center", marginTop: 15, paddingTop: 13, borderTopWidth: 1, borderTopColor: "#F0EFEB" },
  totalBlock: { flex: 1 },
  totalDivider: { width: 1, height: 27, backgroundColor: "#EEF0F1", marginHorizontal: 6 },
  totalLabel: { color: "#98A2B3", fontSize: 9, fontWeight: "700" },
  totalValue: { fontSize: 12, fontWeight: "800", marginTop: 4 },
  legend: { flexDirection: "row", gap: 14, marginTop: 17, marginBottom: 2 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: "#98A2B3", fontSize: 10, fontWeight: "700" },
  chartScroll: { minWidth: "100%", paddingTop: 7 },
  chart: { minWidth: "100%", height: 132, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", borderBottomWidth: 1, borderBottomColor: "#F0EFEB", paddingHorizontal: 3 },
  monthColumn: { width: 44, height: "100%", alignItems: "center", justifyContent: "flex-end" },
  bars: { height: 99, flexDirection: "row", alignItems: "flex-end", gap: 3 },
  bar: { width: 10, borderRadius: 5 },
  monthLabel: { color: "#667085", fontSize: 9, fontWeight: "800", marginTop: 7 },
  yearLabel: { color: "#B4BBC6", fontSize: 8, marginTop: 2, marginBottom: 4 },
  caption: { color: "#98A2B3", fontSize: 10, marginTop: 10 },
  empty: { borderTopWidth: 1, borderTopColor: "#F0EFEB", marginTop: 14, paddingTop: 15, flexDirection: "row", alignItems: "center", gap: 8 },
  emptyText: { color: "#98A2B3", fontSize: 11 },
});

export { getAllMonthReport, summarizeAllTime } from "@/lib/expense-data";
export type { MonthlyReport } from "@/lib/expense-data";
