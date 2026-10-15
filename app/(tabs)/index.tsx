import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BudgetProgressCard } from "@/components/enhancement-components";
import { MonthlyReportCard } from "@/components/monthly-report";
import { EmptyState, MonthNavigator, ProgressBar, TransactionRow, TransactionSheet } from "@/components/expense-components";
import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  formatCurrency,
  getMonthKey,
  getMonthTransactions,
  calculateBudgetProgress,
  summarizeMonth,
  type Transaction,
} from "@/lib/expense-data";
import { useExpenseStore } from "@/lib/expense-store";
import { ScreenContainer } from "@/components/screen-container";
import { useColors } from "@/hooks/use-colors";

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { hydrated, transactions, categories, currency, budgets } = useExpenseStore();
  const colors = useColors();
  const [monthKey, setMonthKey] = useState(getMonthKey());
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const summary = useMemo(() => summarizeMonth(transactions, monthKey, categories), [transactions, monthKey, categories]);
  const monthTransactions = useMemo(() => getMonthTransactions(transactions, monthKey), [transactions, monthKey]);
  const recentTransactions = monthTransactions.slice(0, 5);
  const balance = useMemo(() => transactions.reduce((total, transaction) => total + (transaction.type === "income" ? transaction.amount : -transaction.amount), 0), [transactions]);
  const maxCategory = summary.byCategory[0]?.amount ?? 0;
  const budget = budgets.find((item) => item.month === monthKey);
  const budgetProgress = useMemo(() => calculateBudgetProgress(summary, budget), [summary, budget]);

  const openAdd = () => {
    setEditingTransaction(null);
    setSheetVisible(true);
  };

  const openEdit = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setSheetVisible(true);
  };

  if (!hydrated) {
    return <ScreenContainer className="px-5 pt-6"><Text style={styles.loadingText}>Loading your ledger…</Text></ScreenContainer>;
  }

  return (
    <ScreenContainer className="px-5 pt-3">
      <FlatList
        data={recentTransactions}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View>
            <View style={styles.topBar}>
              <Text style={[styles.greeting, { color: colors.muted }]}>Good to see you</Text>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>Your money, clear.</Text>
            </View>
            <View style={styles.headerActions}>
              <Pressable accessibilityLabel="Monthly report" onPress={() => router.push("/report" as never)} style={({ pressed }) => [styles.reportButton, pressed && styles.pressed]}><IconSymbol name="chart.bar.fill" size={16} color="#2A9E87" /><Text style={styles.reportButtonText}>Report</Text></Pressable>
              <Pressable accessibilityLabel="Categories" onPress={() => router.push("/categories" as never)} style={({ pressed }) => [styles.headerIcon, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><IconSymbol name="tag.fill" size={17} color={colors.muted} /><Text style={[styles.headerIconText, { color: colors.foreground }]}>Categories</Text></Pressable>
              <Pressable accessibilityLabel="Settings" onPress={() => router.push("/settings" as never)} style={({ pressed }) => [styles.headerIcon, { backgroundColor: colors.surface, borderColor: colors.border }, pressed && styles.pressed]}><IconSymbol name="gearshape.fill" size={17} color={colors.muted} /><Text style={[styles.headerIconText, { color: colors.foreground }]}>Settings</Text></Pressable>
            </View>
            <MonthNavigator monthKey={monthKey} onChange={setMonthKey} />
            <View style={styles.balanceCard}>
              <View style={styles.balanceTopLine}><Text style={styles.balanceLabel}>TOTAL BALANCE</Text><View style={styles.balanceBadge}><IconSymbol name="wallet.pass.fill" size={14} color="#2FBF9F" /><Text style={styles.balanceBadgeText}>On device</Text></View></View>
              <Text style={styles.balanceAmount}>{formatCurrency(balance, currency)}</Text>
              <Text style={styles.balanceHint}>{balance >= 0 ? "You’re in a healthy place this month." : "A closer look at spending may help."}</Text>
              <View style={styles.balanceStats}>
                <View style={styles.balanceStat}><View style={[styles.statDot, { backgroundColor: "#2FBF9F" }]} /><Text style={styles.statLabel}>Income</Text><Text style={styles.statValue}>{formatCurrency(summary.income, currency)}</Text></View>
                <View style={styles.balanceDivider} />
                <View style={styles.balanceStat}><View style={[styles.statDot, { backgroundColor: "#E9785D" }]} /><Text style={styles.statLabel}>Spent</Text><Text style={styles.statValue}>{formatCurrency(summary.expenses, currency)}</Text></View>
              </View>
            </View>
            <View style={styles.sectionHeading}><View><Text style={styles.sectionEyebrow}>MONTHLY PULSE</Text><Text style={styles.sectionTitle}>Spending overview</Text></View><Text style={styles.netValue}>{summary.net >= 0 ? "+" : "−"}{formatCurrency(Math.abs(summary.net), currency)}</Text></View>
            <View style={styles.pulseCard}>
              <View style={styles.pulseCopy}><View><Text style={styles.pulseLabel}>Spent this month</Text><Text style={styles.pulseAmount}>{formatCurrency(summary.expenses, currency)}</Text></View><View style={styles.pulsePercent}><IconSymbol name="chart.bar.fill" size={16} color="#E9785D" /><Text style={styles.pulsePercentText}>{summary.income > 0 ? `${Math.round((summary.expenses / summary.income) * 100)}%` : "0%"} of income</Text></View></View>
              <ProgressBar value={summary.income > 0 ? summary.expenses / summary.income : 0} color="#E9785D" />
              <Text style={styles.pulseFootnote}>{summary.income > 0 ? `${formatCurrency(Math.max(summary.income - summary.expenses, 0), currency)} left after spending` : "Log income to see your spending ratio"}</Text>
            </View>
            <View style={[styles.sectionHeading, { marginTop: 25 }]}><View><Text style={styles.sectionEyebrow}>STAY ON TRACK</Text><Text style={styles.sectionTitle}>Monthly budget</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Manage monthly budget" onPress={() => router.push("/manage" as never)}><Text style={styles.linkText}>Manage</Text></Pressable></View>
            <BudgetProgressCard progress={budgetProgress} currency={currency} onManage={() => router.push("/manage" as never)} compact />
            <View style={styles.sectionHeading}><View><Text style={styles.sectionEyebrow}>THE BIG PICTURE</Text><Text style={styles.sectionTitle}>Every month, at a glance</Text></View></View>
            <MonthlyReportCard transactions={transactions} currency={currency} onOpenReport={() => router.push("/report" as never)} />
            <View style={styles.sectionHeading}><View><Text style={styles.sectionEyebrow}>WHERE IT GOES</Text><Text style={styles.sectionTitle}>Top categories</Text></View><Pressable accessibilityRole="button" accessibilityLabel="See spending insights" onPress={() => router.push("/(tabs)/insights" as never)}><Text style={styles.linkText}>See insights</Text></Pressable></View>
            <View style={styles.categoryCard}>
              {summary.byCategory.length === 0 ? <Text style={styles.noDataText}>Your category breakdown will appear here.</Text> : summary.byCategory.slice(0, 3).map((item) => {
                const category = categories.find((candidate) => candidate.id === item.categoryId) ?? categories[categories.length - 1];
                return <View key={item.categoryId} style={styles.categoryRow}><View style={styles.categoryRowTop}><View style={styles.categoryNameWrap}><View style={[styles.categoryDot, { backgroundColor: category?.color ?? "#667085" }]} /><Text style={styles.categoryName}>{category?.name ?? "Other"}</Text></View><Text style={styles.categoryValue}>{formatCurrency(item.amount, currency)}</Text></View><ProgressBar value={maxCategory > 0 ? item.amount / maxCategory : 0} color={category?.color ?? "#667085"} /></View>;
              })}
            </View>
            <View style={[styles.sectionHeading, styles.recentHeading]}><View><Text style={styles.sectionEyebrow}>ACTIVITY</Text><Text style={styles.sectionTitle}>Recent transactions</Text></View><Pressable accessibilityRole="button" accessibilityLabel="View all transactions" onPress={() => router.push("/(tabs)/transactions" as never)}><Text style={styles.linkText}>View all</Text></Pressable></View>
          </View>
        }
        renderItem={({ item }) => <TransactionRow transaction={item} categories={categories} currency={currency} onPress={() => openEdit(item)} />}
        ListEmptyComponent={<EmptyState title="Start with one small entry" description="Track an expense or income and your monthly picture will take shape here." buttonLabel="Add transaction" onPress={openAdd} />}
      />
      <Pressable accessibilityLabel="Add transaction" onPress={openAdd} style={({ pressed }) => [styles.floatingAdd, { bottom: insets.bottom + 72 }, pressed && styles.floatingPressed]}>
        <IconSymbol name="plus" size={21} color="#FFFFFF" /><Text style={styles.floatingText}>Add</Text>
      </Pressable>
      <TransactionSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} currency={currency} categories={categories} editTransaction={editingTransaction} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  listContent: { paddingBottom: 150 },
  loadingText: { color: "#667085", fontSize: 15, textAlign: "center", marginTop: 80 },
  topBar: { marginBottom: 12 },
  greeting: { color: "#98A2B3", fontSize: 12, fontWeight: "600", letterSpacing: 0.2, marginBottom: 4 },
  pageTitle: { color: "#14213D", fontSize: 27, fontWeight: "800", letterSpacing: -0.9 },
  headerActions: { flexDirection: "row", gap: 8, marginBottom: 21 },
  headerIcon: { flex: 1, minWidth: 0, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 5, borderWidth: 1 },
  headerIconText: { fontSize: 10, fontWeight: "800" },
  reportButton: { flex: 1, minWidth: 0, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 5, paddingHorizontal: 5, backgroundColor: "#E5F6F1", borderWidth: 1, borderColor: "#C5EEE3" },
  reportButtonText: { color: "#2A9E87", fontSize: 10, fontWeight: "800" },
  pressed: { opacity: 0.65 },
  balanceCard: { backgroundColor: "#14213D", borderRadius: 23, padding: 19, shadowColor: "#14213D", shadowOpacity: 0.16, shadowRadius: 14, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  balanceTopLine: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  balanceLabel: { color: "#A9B4C7", fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  balanceBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(47,191,159,0.14)", borderRadius: 9, paddingHorizontal: 8, height: 25 },
  balanceBadgeText: { color: "#9AE7D3", fontSize: 10, fontWeight: "700" },
  balanceAmount: { color: "#FFFFFF", fontSize: 33, fontWeight: "800", letterSpacing: -1.1, marginTop: 16 },
  balanceHint: { color: "#A9B4C7", fontSize: 12, marginTop: 4 },
  balanceStats: { flexDirection: "row", alignItems: "center", marginTop: 20, paddingTop: 15, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)" },
  balanceStat: { flex: 1, flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: 6, rowGap: 4 },
  statDot: { width: 7, height: 7, borderRadius: 4 },
  statLabel: { color: "#A9B4C7", fontSize: 11, fontWeight: "600" },
  statValue: { width: "100%", color: "#FFFFFF", fontSize: 14, fontWeight: "700", marginTop: 3, paddingLeft: 13 },
  balanceDivider: { height: 30, width: 1, backgroundColor: "rgba(255,255,255,0.14)", marginHorizontal: 12 },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 25, marginBottom: 11 },
  sectionEyebrow: { color: "#98A2B3", fontSize: 10, fontWeight: "800", letterSpacing: 1.15, marginBottom: 4 },
  sectionTitle: { color: "#14213D", fontSize: 18, fontWeight: "800", letterSpacing: -0.4 },
  netValue: { color: "#2FBF9F", fontSize: 13, fontWeight: "800", marginBottom: 2 },
  linkText: { color: "#2FBF9F", fontSize: 12, fontWeight: "800", marginBottom: 2 },
  pulseCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", padding: 16 },
  pulseCopy: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 },
  pulseLabel: { color: "#667085", fontSize: 12, fontWeight: "600" },
  pulseAmount: { color: "#14213D", fontSize: 21, fontWeight: "800", marginTop: 4 },
  pulsePercent: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "#FCEBE6", borderRadius: 9, paddingHorizontal: 8, height: 26 },
  pulsePercentText: { color: "#C55F4B", fontSize: 10, fontWeight: "800" },
  pulseFootnote: { color: "#98A2B3", fontSize: 11, marginTop: 9 },
  categoryCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", paddingHorizontal: 15, paddingVertical: 5 },
  categoryRow: { paddingVertical: 10 },
  categoryRowTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  categoryNameWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryDot: { width: 9, height: 9, borderRadius: 5 },
  categoryName: { color: "#667085", fontSize: 12, fontWeight: "700" },
  categoryValue: { color: "#14213D", fontSize: 12, fontWeight: "800" },
  noDataText: { color: "#98A2B3", fontSize: 12, paddingVertical: 17 },
  recentHeading: { marginTop: 27 },
  floatingAdd: { position: "absolute", right: 22, height: 50, paddingHorizontal: 17, borderRadius: 17, backgroundColor: "#2FBF9F", flexDirection: "row", alignItems: "center", gap: 7, shadowColor: "#2FBF9F", shadowOpacity: 0.28, shadowRadius: 11, shadowOffset: { width: 0, height: 6 }, elevation: 7 },
  floatingText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  floatingPressed: { opacity: 0.86, transform: [{ scale: 0.97 }] },
});
