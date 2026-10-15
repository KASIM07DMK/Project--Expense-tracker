import { useMemo, useState } from "react";
import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";

import { EmptyState, MonthNavigator, TransactionRow, TransactionSheet } from "@/components/expense-components";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatCurrency, formatLongDate, getMonthKey, getMonthTransactions, groupTransactionsByDate, type Transaction, type TransactionType } from "@/lib/expense-data";
import { useExpenseStore } from "@/lib/expense-store";

export default function TransactionsScreen() {
  const { hydrated, transactions, categories, currency } = useExpenseStore();
  const [monthKey, setMonthKey] = useState(getMonthKey());
  const [filter, setFilter] = useState<"all" | TransactionType>("all");
  const [sheetVisible, setSheetVisible] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const filteredTransactions = useMemo(() => {
    const monthTransactions = getMonthTransactions(transactions, monthKey);
    return filter === "all" ? monthTransactions : monthTransactions.filter((transaction) => transaction.type === filter);
  }, [filter, monthKey, transactions]);
  const groups = useMemo(() => groupTransactionsByDate(filteredTransactions), [filteredTransactions]);
  const incomeTotal = filteredTransactions.filter((transaction) => transaction.type === "income").reduce((total, transaction) => total + transaction.amount, 0);
  const expenseTotal = filteredTransactions.filter((transaction) => transaction.type === "expense").reduce((total, transaction) => total + transaction.amount, 0);

  const openAdd = () => { setEditingTransaction(null); setSheetVisible(true); };
  const openEdit = (transaction: Transaction) => { setEditingTransaction(transaction); setSheetVisible(true); };

  if (!hydrated) return <ScreenContainer className="px-5 pt-6"><Text style={styles.loadingText}>Loading transactions…</Text></ScreenContainer>;

  return (
    <ScreenContainer className="px-5 pt-3">
      <FlatList
        data={groups}
        keyExtractor={(group) => group.date}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        ListHeaderComponent={<View>
          <View style={styles.headerRow}><View><Text style={styles.eyebrow}>LEDGER</Text><Text style={styles.title}>Transactions</Text></View><Pressable accessibilityRole="button" accessibilityLabel="Add transaction" onPress={openAdd} style={({ pressed }) => [styles.addIcon, pressed && styles.pressed]}><IconSymbol name="plus" size={20} color="#FFFFFF" /></Pressable></View>
          <MonthNavigator monthKey={monthKey} onChange={setMonthKey} />
          <View style={styles.filterRow}>
            {(["all", "expense", "income"] as const).map((option) => <Pressable key={option} accessibilityRole="button" accessibilityState={{ selected: filter === option }} accessibilityLabel={`Show ${option === "all" ? "all entries" : `${option} entries`}`} onPress={() => setFilter(option)} style={[styles.filterChip, filter === option && (option === "income" ? styles.incomeChip : option === "expense" ? styles.expenseChip : styles.allChip)]}><Text style={[styles.filterText, filter === option && styles.activeFilterText]}>{option === "all" ? "All entries" : option === "expense" ? "Expenses" : "Income"}</Text></Pressable>)}
          </View>
          <View style={styles.summaryStrip}><View><Text style={styles.stripLabel}>Showing</Text><Text style={styles.stripValue}>{filteredTransactions.length} {filteredTransactions.length === 1 ? "entry" : "entries"}</Text></View><View style={styles.stripDivider} /><View><Text style={styles.stripLabel}>In</Text><Text style={[styles.stripValue, { color: "#2FBF9F" }]}>{formatCurrency(incomeTotal, currency)}</Text></View><View style={styles.stripDivider} /><View><Text style={styles.stripLabel}>Out</Text><Text style={[styles.stripValue, { color: "#E9785D" }]}>{formatCurrency(expenseTotal, currency)}</Text></View></View>
        </View>}
        renderItem={({ item: group }) => <View style={styles.group}><Text style={styles.groupTitle}>{formatLongDate(group.date)}</Text>{group.data.map((transaction) => <TransactionRow key={transaction.id} transaction={transaction} categories={categories} currency={currency} onPress={() => openEdit(transaction)} />)}</View>}
        ListEmptyComponent={<EmptyState title="Nothing logged yet" description="Your entries for this month will appear here, grouped by day." buttonLabel="Add transaction" onPress={openAdd} />}
      />
      <TransactionSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} currency={currency} categories={categories} editTransaction={editingTransaction} />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 120 },
  loadingText: { color: "#667085", fontSize: 15, textAlign: "center", marginTop: 80 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 21 },
  eyebrow: { color: "#98A2B3", fontSize: 10, fontWeight: "800", letterSpacing: 1.15, marginBottom: 4 },
  title: { color: "#14213D", fontSize: 27, fontWeight: "800", letterSpacing: -0.9 },
  addIcon: { width: 42, height: 42, borderRadius: 15, backgroundColor: "#2FBF9F", alignItems: "center", justifyContent: "center", shadowColor: "#2FBF9F", shadowOpacity: 0.25, shadowRadius: 9, shadowOffset: { width: 0, height: 5 }, elevation: 6 },
  pressed: { opacity: 0.72 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  filterChip: { height: 34, paddingHorizontal: 12, borderRadius: 11, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E7E5E0", alignItems: "center", justifyContent: "center" },
  allChip: { backgroundColor: "#14213D", borderColor: "#14213D" },
  expenseChip: { backgroundColor: "#FCEBE6", borderColor: "#F5CEC4" },
  incomeChip: { backgroundColor: "#E5F6F1", borderColor: "#BFEADF" },
  filterText: { color: "#667085", fontSize: 11, fontWeight: "700" },
  activeFilterText: { color: "#FFFFFF" },
  summaryStrip: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 16, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E7E5E0", paddingHorizontal: 14, paddingVertical: 12, marginBottom: 18 },
  stripLabel: { color: "#98A2B3", fontSize: 10, fontWeight: "600", marginBottom: 4 },
  stripValue: { color: "#14213D", fontSize: 12, fontWeight: "800" },
  stripDivider: { height: 25, width: 1, backgroundColor: "#ECEAE5" },
  group: { marginBottom: 15 },
  groupTitle: { color: "#667085", fontSize: 12, fontWeight: "800", marginBottom: 2, textTransform: "uppercase", letterSpacing: 0.5 },
});
