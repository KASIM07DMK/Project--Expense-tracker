import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { BudgetProgressCard } from "@/components/enhancement-components";
import { CategoryLegend, MonthNavigator, ProgressBar } from "@/components/expense-components";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { calculateBudgetProgress, formatCurrency, getBudgetTrend, getMonthKey, getYearOverYearComparison, shiftMonth, summarizeMonth } from "@/lib/expense-data";
import { useExpenseStore } from "@/lib/expense-store";
import { useRouter } from "expo-router";

export default function InsightsScreen() {
  const router = useRouter();
  const { hydrated, transactions, categories, currency, budgets } = useExpenseStore();
  const [monthKey, setMonthKey] = useState(getMonthKey());
  const summary = useMemo(() => summarizeMonth(transactions, monthKey, categories), [categories, monthKey, transactions]);
  const previousSummary = useMemo(() => summarizeMonth(transactions, shiftMonth(monthKey, -1), categories), [categories, monthKey, transactions]);
  const spendChange = previousSummary.expenses > 0 ? ((summary.expenses - previousSummary.expenses) / previousSummary.expenses) * 100 : 0;
  const maxCategory = summary.byCategory[0]?.amount ?? 1;
  const budget = budgets.find((item) => item.month === monthKey);
  const budgetProgress = useMemo(() => calculateBudgetProgress(summary, budget), [summary, budget]);
  const budgetTrend = useMemo(() => getBudgetTrend(transactions, budgets, categories, 6), [transactions, budgets, categories]);
  const trendMax = Math.max(1, ...budgetTrend.flatMap((item) => [item.limit, item.spent]));
  const comparisonYears = useMemo(() => Array.from(new Set(transactions.map((item) => Number(item.date.slice(0, 4)).toString()).filter((item) => /^\d{4}$/.test(item)))).map(Number).sort((a, b) => b - a), [transactions]);
  const [comparisonYear, setComparisonYear] = useState(new Date().getFullYear());
  const yearOverYear = useMemo(() => getYearOverYearComparison(transactions, comparisonYear, categories), [categories, comparisonYear, transactions]);
  const yearTotals = useMemo(() => yearOverYear.reduce((totals, item) => ({ currentIncome: totals.currentIncome + item.income.current, previousIncome: totals.previousIncome + item.income.previous, currentExpenses: totals.currentExpenses + item.expenses.current, previousExpenses: totals.previousExpenses + item.expenses.previous }), { currentIncome: 0, previousIncome: 0, currentExpenses: 0, previousExpenses: 0 }), [yearOverYear]);
  const maxYoY = Math.max(1, ...yearOverYear.flatMap((item) => [item.expenses.current, item.expenses.previous]));

  if (!hydrated) return <ScreenContainer className="px-5 pt-6"><Text style={styles.loadingText}>Loading insights…</Text></ScreenContainer>;

  return (
    <ScreenContainer className="px-5 pt-3">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}><View><Text style={styles.eyebrow}>YOUR PATTERNS</Text><Text style={styles.title}>Insights</Text></View><View style={styles.insightBadge}><IconSymbol name="chart.pie.fill" size={15} color="#2FBF9F" /><Text style={styles.insightBadgeText}>Monthly</Text></View></View>
        <MonthNavigator monthKey={monthKey} onChange={setMonthKey} />
        <View style={styles.heroCard}><View><Text style={styles.heroEyebrow}>NET CHANGE</Text><Text style={[styles.heroAmount, { color: summary.net >= 0 ? "#9AE7D3" : "#F6B4A5" }]}>{summary.net >= 0 ? "+" : "−"}{formatCurrency(Math.abs(summary.net), currency)}</Text><Text style={styles.heroCaption}>{summary.net >= 0 ? "More in than out this month" : "Spending is ahead of income"}</Text></View><View style={styles.heroCircle}><IconSymbol name={summary.net >= 0 ? "arrow.up" : "arrow.down"} size={23} color={summary.net >= 0 ? "#9AE7D3" : "#F6B4A5"} /></View></View>
        <View style={styles.metricGrid}><View style={styles.metricCard}><View style={[styles.metricIcon, { backgroundColor: "#E5F6F1" }]}><IconSymbol name="arrow.down" size={16} color="#2FBF9F" /></View><Text style={styles.metricLabel}>Income</Text><Text style={styles.metricValue}>{formatCurrency(summary.income, currency)}</Text></View><View style={styles.metricCard}><View style={[styles.metricIcon, { backgroundColor: "#FCEBE6" }]}><IconSymbol name="arrow.up" size={16} color="#E9785D" /></View><Text style={styles.metricLabel}>Expenses</Text><Text style={styles.metricValue}>{formatCurrency(summary.expenses, currency)}</Text></View></View>
        <View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>COMPARED TO LAST MONTH</Text><Text style={styles.sectionTitle}>Spending trend</Text></View><Text style={[styles.trendText, { color: spendChange <= 0 ? "#2FBF9F" : "#E9785D" }]}>{previousSummary.expenses === 0 ? "New month" : `${spendChange > 0 ? "+" : "−"}${Math.abs(Math.round(spendChange))}%`}</Text></View>
        <View style={styles.trendCard}><View style={styles.trendRow}><View><Text style={styles.trendLabel}>This month</Text><Text style={styles.trendAmount}>{formatCurrency(summary.expenses, currency)}</Text></View><View style={styles.trendBarWrap}><View style={[styles.trendBar, { height: 30, backgroundColor: "#E9785D" }]} /></View></View><View style={styles.trendRow}><View><Text style={styles.trendLabel}>Last month</Text><Text style={styles.trendAmount}>{formatCurrency(previousSummary.expenses, currency)}</Text></View><View style={styles.trendBarWrap}><View style={[styles.trendBar, { height: previousSummary.expenses > 0 ? Math.max(10, Math.min(56, (previousSummary.expenses / Math.max(summary.expenses, previousSummary.expenses)) * 56)) : 8, backgroundColor: "#D6DCE7" }]} /></View></View><Text style={styles.trendFootnote}>{previousSummary.expenses === 0 ? "Log a full month to unlock comparisons." : spendChange <= 0 ? "Nice work — you spent less than last month." : "Your spending rose compared with last month."}</Text></View>
        <View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>BUDGET CHECK</Text><Text style={styles.sectionTitle}>Target vs actual</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Manage budgets" onPress={() => router.push("/manage" as never)}><Text style={styles.manageText}>Manage</Text></Pressable></View>
        <BudgetProgressCard progress={budgetProgress} currency={currency} onManage={() => router.push("/manage" as never)} />
        <View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>LONG-TERM VIEW</Text><Text style={styles.sectionTitle}>Budget trend</Text></View><Text style={styles.manageText}>{budgetTrend.length} month{budgetTrend.length === 1 ? "" : "s"}</Text></View>
        <View style={styles.chartCard}>{budgetTrend.length === 0 ? <Text style={styles.noData}>Save a monthly budget to start a longer-term view.</Text> : <><View style={styles.chartLegend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#2FBF9F" }]} /><Text style={styles.legendText}>Spent</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#D6DCE7" }]} /><Text style={styles.legendText}>Target</Text></View></View><View style={styles.chartPlot}>{budgetTrend.map((item) => <View key={item.month} style={styles.chartColumn}><View style={styles.chartBars}><View style={[styles.chartBar, { height: Math.max(6, (item.limit / trendMax) * 92), backgroundColor: "#D6DCE7" }]} /><View style={[styles.chartBar, { height: Math.max(5, (item.spent / trendMax) * 92), backgroundColor: item.over ? "#E9785D" : "#2FBF9F" }]} /></View><Text style={styles.chartLabel}>{item.label}</Text></View>)}</View><Text style={styles.chartFootnote}>Targets and actual spending across your saved monthly budgets.</Text></>}</View>
        <View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>YEAR OVER YEAR</Text><Text style={styles.sectionTitle}>Compare spending</Text></View><View style={styles.yearChoices}>{(comparisonYears.length > 0 ? comparisonYears : [new Date().getFullYear()]).slice(0, 3).map((value) => <Pressable key={value} accessibilityRole="button" accessibilityLabel={`Compare ${value} with ${value - 1}`} onPress={() => setComparisonYear(value)} style={[styles.yearChip, comparisonYear === value && styles.yearChipSelected]}><Text style={[styles.yearChipText, comparisonYear === value && styles.yearChipTextSelected]}>{value}</Text></Pressable>)}</View></View>
        <View style={styles.yoyCard}><View style={styles.yoySummary}><View><Text style={styles.yoyLabel}>{comparisonYear} income</Text><Text style={styles.yoyValue}>{formatCurrency(yearTotals.currentIncome, currency)}</Text></View><View><Text style={styles.yoyLabel}>{comparisonYear - 1} income</Text><Text style={styles.yoyPrevious}>{formatCurrency(yearTotals.previousIncome, currency)}</Text></View></View><View style={styles.yoyLegend}><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#2FBF9F" }]} /><Text style={styles.legendText}>{comparisonYear}</Text></View><View style={styles.legendItem}><View style={[styles.legendDot, { backgroundColor: "#D6DCE7" }]} /><Text style={styles.legendText}>{comparisonYear - 1}</Text></View></View><View style={styles.yoyPlot}>{yearOverYear.map((item) => <View key={item.month} style={styles.yoyColumn}><View style={styles.yoyBars}><View style={[styles.yoyBar, { height: Math.max(3, (item.expenses.previous / maxYoY) * 70), backgroundColor: "#D6DCE7" }]} /><View style={[styles.yoyBar, { height: Math.max(3, (item.expenses.current / maxYoY) * 70), backgroundColor: "#2FBF9F" }]} /></View><Text style={styles.yoyMonth}>{item.label}</Text></View>)}</View><Text style={styles.chartFootnote}>Monthly expense totals compared with the same month last year.</Text></View>
        <View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>SPENDING MIX</Text><Text style={styles.sectionTitle}>By category</Text></View><IconSymbol name="chart.pie.fill" size={19} color="#98A2B3" /></View>
        <View style={styles.categoryCard}>{summary.byCategory.length === 0 ? <Text style={styles.noData}>No expense categories to show yet.</Text> : summary.byCategory.map((item) => { const category = categories.find((candidate) => candidate.id === item.categoryId) ?? categories[categories.length - 1]; return <View key={item.categoryId}><CategoryLegend category={category} amount={item.amount} percentage={item.percentage} currency={currency} /><ProgressBar value={item.amount / maxCategory} color={category.color} /></View>; })}</View>
        <View style={styles.tipCard}><View style={styles.tipIcon}><IconSymbol name="info.circle" size={17} color="#F4B942" /></View><View style={styles.tipCopy}><Text style={styles.tipTitle}>A small habit goes a long way</Text><Text style={styles.tipText}>Review your top category at the end of each month and set one simple intention for the next.</Text></View></View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 100 },
  loadingText: { color: "#667085", fontSize: 15, textAlign: "center", marginTop: 80 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 21 },
  eyebrow: { color: "#98A2B3", fontSize: 10, fontWeight: "800", letterSpacing: 1.15, marginBottom: 4 },
  title: { color: "#14213D", fontSize: 27, fontWeight: "800", letterSpacing: -0.9 },
  insightBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#E5F6F1", borderRadius: 10, paddingHorizontal: 10, height: 30 },
  insightBadgeText: { color: "#2A9E87", fontSize: 11, fontWeight: "800" },
  heroCard: { borderRadius: 21, backgroundColor: "#14213D", padding: 19, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  heroEyebrow: { color: "#A9B4C7", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  heroAmount: { fontSize: 28, fontWeight: "800", letterSpacing: -0.8, marginTop: 12 },
  heroCaption: { color: "#A9B4C7", fontSize: 12, marginTop: 5 },
  heroCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(47,191,159,0.13)", alignItems: "center", justifyContent: "center" },
  metricGrid: { flexDirection: "row", gap: 10, marginTop: 12 },
  metricCard: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 17, borderWidth: 1, borderColor: "#E7E5E0", padding: 13 },
  metricIcon: { width: 28, height: 28, borderRadius: 9, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  metricLabel: { color: "#667085", fontSize: 11, fontWeight: "600" },
  metricValue: { color: "#14213D", fontSize: 16, fontWeight: "800", marginTop: 4 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 26, marginBottom: 11 },
  sectionTitle: { color: "#14213D", fontSize: 18, fontWeight: "800", letterSpacing: -0.4 },
  trendText: { fontSize: 13, fontWeight: "800", marginBottom: 2 },
  manageText: { color: "#2A9E87", fontSize: 12, fontWeight: "800", marginBottom: 2 },
  trendCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", padding: 15 },
  trendRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 7 },
  trendLabel: { color: "#667085", fontSize: 11, fontWeight: "600" },
  trendAmount: { color: "#14213D", fontSize: 14, fontWeight: "800", marginTop: 3 },
  trendBarWrap: { width: 100, height: 58, justifyContent: "flex-end", alignItems: "flex-end" },
  trendBar: { width: 42, borderRadius: 9 },
  trendFootnote: { color: "#98A2B3", fontSize: 11, lineHeight: 17, borderTopWidth: 1, borderTopColor: "#F0EFEB", paddingTop: 11, marginTop: 7 },
  chartCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", padding: 15 },
  chartLegend: { flexDirection: "row", gap: 14, marginBottom: 7 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  legendDot: { width: 7, height: 7, borderRadius: 4 },
  legendText: { color: "#98A2B3", fontSize: 10, fontWeight: "700" },
  chartPlot: { height: 126, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#F0EFEB", paddingHorizontal: 4 },
  chartColumn: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" },
  chartBars: { height: 100, flexDirection: "row", alignItems: "flex-end", gap: 3 },
  chartBar: { width: 9, borderRadius: 5 },
  chartLabel: { color: "#98A2B3", fontSize: 9, fontWeight: "700", marginTop: 7 },
  chartFootnote: { color: "#98A2B3", fontSize: 10, lineHeight: 16, marginTop: 11 },
  yearChoices: { flexDirection: "row", gap: 5 },
  yearChip: { paddingHorizontal: 8, height: 25, borderRadius: 8, justifyContent: "center", backgroundColor: "#F4F5F6" },
  yearChipSelected: { backgroundColor: "#E5F6F1" },
  yearChipText: { color: "#98A2B3", fontSize: 9, fontWeight: "800" },
  yearChipTextSelected: { color: "#2A9E87" },
  yoyCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", padding: 15 },
  yoySummary: { flexDirection: "row", justifyContent: "space-between" },
  yoyLabel: { color: "#667085", fontSize: 10, fontWeight: "700" },
  yoyValue: { color: "#2A9E87", fontSize: 15, fontWeight: "800", marginTop: 4 },
  yoyPrevious: { color: "#667085", fontSize: 15, fontWeight: "800", marginTop: 4 },
  yoyLegend: { flexDirection: "row", gap: 14, marginTop: 13 },
  yoyPlot: { height: 107, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#F0EFEB", paddingHorizontal: 2, marginTop: 8 },
  yoyColumn: { flex: 1, alignItems: "center", justifyContent: "flex-end", height: "100%" },
  yoyBars: { height: 77, flexDirection: "row", alignItems: "flex-end", gap: 2 },
  yoyBar: { width: 5, borderRadius: 3 },
  yoyMonth: { color: "#98A2B3", fontSize: 8, fontWeight: "700", marginTop: 6 },
  categoryCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", paddingHorizontal: 15, paddingVertical: 6 },
  noData: { color: "#98A2B3", fontSize: 12, paddingVertical: 15 },
  tipCard: { flexDirection: "row", gap: 11, backgroundColor: "#FFFAEF", borderRadius: 17, padding: 14, marginTop: 17, borderWidth: 1, borderColor: "#F8E7B9" },
  tipIcon: { width: 28, height: 28, borderRadius: 9, backgroundColor: "#FFF1C8", alignItems: "center", justifyContent: "center" },
  tipCopy: { flex: 1 },
  tipTitle: { color: "#7C5B12", fontSize: 12, fontWeight: "800" },
  tipText: { color: "#927A44", fontSize: 11, lineHeight: 17, marginTop: 4 },
});
