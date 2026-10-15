import { useEffect, useMemo, useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { CalendarPicker } from "@/components/calendar-picker";
import { BudgetProgressCard, RecurringRuleRow } from "@/components/enhancement-components";
import { MonthNavigator } from "@/components/expense-components";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { calculateBudgetProgress, formatCurrency, getBudgetHistory, getCategoriesForType, getMonthKey, getMonthLabel, summarizeMonth, todayString, type RecurrenceFrequency, type RecurringRule, type TransactionType } from "@/lib/expense-data";
import { addRecurringRule, deleteRecurringRule, setCategoryBudget, setMonthlyBudget, updateRecurringRule, useExpenseStore } from "@/lib/expense-store";

const frequencies: { id: RecurrenceFrequency; label: string }[] = [
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
  { id: "yearly", label: "Yearly" },
];

export default function ManageScreen() {
  const router = useRouter();
  const { hydrated, transactions, categories, recurringRules, budgets, currency } = useExpenseStore();
  const [entryType, setEntryType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [categoryId, setCategoryId] = useState("food");
  const [frequency, setFrequency] = useState<RecurrenceFrequency>("monthly");
  const [startDate, setStartDate] = useState(todayString());
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [editingRule, setEditingRule] = useState<RecurringRule | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [endCalendarVisible, setEndCalendarVisible] = useState(false);
  const [budgetMonth, setBudgetMonth] = useState(getMonthKey());
  const [budgetAmount, setBudgetAmount] = useState("");
  const [categoryInputs, setCategoryInputs] = useState<Record<string, string>>({});

  const availableCategories = useMemo(() => getCategoriesForType(categories, entryType), [categories, entryType]);
  const expenseCategories = useMemo(() => getCategoriesForType(categories, "expense"), [categories]);
  const budget = budgets.find((item) => item.month === budgetMonth);
  const budgetSummary = useMemo(() => summarizeMonth(transactions, budgetMonth, categories), [transactions, budgetMonth, categories]);
  const progress = useMemo(() => calculateBudgetProgress(budgetSummary, budget), [budgetSummary, budget]);
  const budgetHistory = useMemo(() => getBudgetHistory(transactions, budgets, categories), [transactions, budgets, categories]);

  useEffect(() => {
    if (!availableCategories.some((category) => category.id === categoryId)) setCategoryId(availableCategories[0]?.id ?? "other");
  }, [availableCategories, categoryId]);

  useEffect(() => {
    setBudgetAmount(budget?.amount ? String(budget.amount) : "");
    setCategoryInputs(Object.fromEntries(expenseCategories.map((category) => [category.id, budget?.categoryLimits[category.id] ? String(budget.categoryLimits[category.id]) : ""])));
  }, [budgetMonth, budget, expenseCategories]);

  const saveRecurring = () => {
    const parsedAmount = Number(amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(startDate) || (endDate && (!/^\d{4}-\d{2}-\d{2}$/.test(endDate) || endDate < startDate))) {
      Alert.alert("Check your entry", "Add a positive amount and a date in YYYY-MM-DD format.");
      return;
    }
    if (editingRule) {
      updateRecurringRule(editingRule.id, { type: entryType, amount: parsedAmount, categoryId, note: note.trim(), startDate, nextDate: startDate, frequency, endDate: endDate || undefined });
      Alert.alert("Recurring rule updated", "Future scheduled entries will follow the new details.");
    } else {
      addRecurringRule({ type: entryType, amount: parsedAmount, categoryId, note: note.trim(), startDate, frequency, enabled: true, endDate: endDate || undefined });
      Alert.alert("Recurring rule added", `${getMonthLabel(startDate.slice(0, 7))} will now stay on top of this schedule.`);
    }
    setAmount("");
    setNote("");
    setEndDate("");
    setEditingRule(null);
    setCalendarVisible(false);
    setEndCalendarVisible(false);
  };

  const beginEdit = (rule: RecurringRule) => {
    setEditingRule(rule);
    setEntryType(rule.type);
    setAmount(String(rule.amount));
    setCategoryId(rule.categoryId);
    setFrequency(rule.frequency);
    setStartDate(rule.startDate);
    setEndDate(rule.endDate ?? "");
    setNote(rule.note);
    setCalendarVisible(false);
  };

  const cancelEdit = () => {
    setEditingRule(null);
    setAmount("");
    setNote("");
    setEndDate("");
    setCalendarVisible(false);
    setEndCalendarVisible(false);
  };

  const saveBudget = () => {
    const parsedAmount = Number(budgetAmount || 0);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) {
      Alert.alert("Check your budget", "Enter a monthly target of zero or more.");
      return;
    }
    setMonthlyBudget(budgetMonth, parsedAmount);
    expenseCategories.forEach((category) => setCategoryBudget(budgetMonth, category.id, Number(categoryInputs[category.id] || 0)));
    Alert.alert("Budget saved", `${getMonthLabel(budgetMonth)} now has your latest spending boundaries.`);
  };

  if (!hydrated) return <ScreenContainer className="px-5 pt-6"><Text style={styles.loadingText}>Loading management tools…</Text></ScreenContainer>;

  return (
    <ScreenContainer className="px-5 pt-3">
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.headerRow}><Pressable onPress={() => router.back()} style={styles.backButton}><IconSymbol name="chevron.left" size={21} color="#14213D" /></Pressable><View><Text style={styles.eyebrow}>PLAN AHEAD</Text><Text style={styles.title}>Manage money</Text></View><View style={styles.headerSpacer} /></View>
        <Text style={styles.description}>Set up the things that should happen on autopilot, without losing the calm local-first feel of your ledger.</Text>

        <View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>RECURRING</Text><Text style={styles.sectionTitle}>Scheduled entries</Text></View><View style={styles.countBadge}><Text style={styles.countText}>{recurringRules.length}</Text></View></View>
        <View style={styles.card}>
          <View style={styles.segmentRow}>{(["expense", "income"] as TransactionType[]).map((type) => <Pressable key={type} onPress={() => setEntryType(type)} style={[styles.segment, entryType === type && styles.segmentSelected]}><Text style={[styles.segmentText, entryType === type && styles.segmentSelectedText]}>{type === "expense" ? "Expense" : "Income"}</Text></Pressable>)}</View>
          <Text style={styles.fieldLabel}>Amount</Text><View style={styles.amountInput}><Text style={styles.currencySign}>{currency === "USD" ? "$" : currency}</Text><TextInput value={amount} onChangeText={setAmount} placeholder="0.00" placeholderTextColor="#B4BBC6" keyboardType="decimal-pad" style={styles.amountTextInput} /></View>
          <Text style={styles.fieldLabel}>Category</Text><ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroller}>{availableCategories.map((category) => <Pressable key={category.id} onPress={() => setCategoryId(category.id)} style={[styles.categoryChip, categoryId === category.id && styles.categoryChipSelected]}><View style={[styles.categoryDot, { backgroundColor: category.color }]} /><Text style={[styles.categoryChipText, categoryId === category.id && styles.categoryChipSelectedText]}>{category.name}</Text></Pressable>)}</ScrollView>
          <Text style={styles.fieldLabel}>Repeats</Text><View style={styles.frequencyRow}>{frequencies.map((option) => <Pressable key={option.id} onPress={() => setFrequency(option.id)} style={[styles.frequencyOption, frequency === option.id && styles.frequencySelected]}><IconSymbol name="repeat" size={14} color={frequency === option.id ? "#2A9E87" : "#98A2B3"} /><Text style={[styles.frequencyText, frequency === option.id && styles.frequencySelectedText]}>{option.label}</Text></Pressable>)}</View>
          <Text style={styles.fieldLabel}>Start date</Text><Pressable onPress={() => setCalendarVisible((visible) => !visible)} style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}><IconSymbol name="calendar" size={16} color="#2FBF9F" /><Text style={styles.dateButtonText}>{startDate}</Text><IconSymbol name={calendarVisible ? "chevron.up" : "chevron.down"} size={15} color="#98A2B3" /></Pressable><CalendarPicker value={startDate} visible={calendarVisible} onChange={setStartDate} onClose={() => setCalendarVisible(false)} />
          <Text style={styles.fieldLabel}>End date <Text style={styles.optionalText}>optional</Text></Text><Pressable onPress={() => { if (!endDate) setEndDate(startDate); setEndCalendarVisible((visible) => !visible); }} style={({ pressed }) => [styles.dateButton, pressed && styles.pressed]}><IconSymbol name="calendar" size={16} color="#F4B942" /><Text style={[styles.dateButtonText, !endDate && styles.placeholderText]}>{endDate || "No end date"}</Text><IconSymbol name={endCalendarVisible ? "chevron.up" : "chevron.down"} size={15} color="#98A2B3" /></Pressable>{endDate && <Pressable onPress={() => { setEndDate(""); setEndCalendarVisible(false); }}><Text style={styles.clearDateText}>Clear end date</Text></Pressable>}<CalendarPicker value={endDate || startDate} visible={endCalendarVisible} onChange={setEndDate} onClose={() => setEndCalendarVisible(false)} />
          <Text style={styles.fieldLabel}>Note</Text><TextInput value={note} onChangeText={setNote} placeholder="e.g. Rent or paycheck" placeholderTextColor="#B4BBC6" style={styles.textInput} />
          <Pressable onPress={saveRecurring} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><IconSymbol name={editingRule ? "checkmark" : "repeat"} size={16} color="#FFFFFF" /><Text style={styles.primaryButtonText}>{editingRule ? "Save rule changes" : "Add recurring rule"}</Text></Pressable>{editingRule && <Pressable onPress={cancelEdit} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}><Text style={styles.cancelButtonText}>Cancel editing</Text></Pressable>}
        </View>
        {recurringRules.length > 0 ? <View style={styles.rulesCard}>{recurringRules.map((rule) => <RecurringRuleRow key={rule.id} rule={rule} categories={categories} currency={currency} onToggle={(enabled) => updateRecurringRule(rule.id, { enabled })} onEdit={() => beginEdit(rule)} onDelete={() => Alert.alert("Delete recurring rule?", "Future entries will no longer be created.", [{ text: "Keep", style: "cancel" }, { text: "Delete", style: "destructive", onPress: () => deleteRecurringRule(rule.id) }])} />)}</View> : <View style={styles.emptyCard}><IconSymbol name="repeat" size={18} color="#2FBF9F" /><Text style={styles.emptyTitle}>Nothing scheduled yet</Text><Text style={styles.emptyCopy}>Use a rule for rent, salary, subscriptions, or anything else that follows a rhythm.</Text></View>}

        <View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>BUDGETS</Text><Text style={styles.sectionTitle}>{getMonthLabel(budgetMonth)}</Text></View><View style={styles.countBadge}><IconSymbol name="target" size={14} color="#2A9E87" /></View></View>
        <MonthNavigator monthKey={budgetMonth} onChange={setBudgetMonth} />
        <BudgetProgressCard progress={progress} currency={currency} onManage={() => undefined} />
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Monthly target</Text><View style={styles.amountInput}><Text style={styles.currencySign}>{currency === "USD" ? "$" : currency}</Text><TextInput value={budgetAmount} onChangeText={setBudgetAmount} placeholder="0.00" placeholderTextColor="#B4BBC6" keyboardType="decimal-pad" style={styles.amountTextInput} /></View>
          <Text style={styles.helper}>Set to 0 if you only want category limits.</Text>
          <Text style={styles.fieldLabel}>Category limits</Text>
          <View style={styles.limitInputs}>{expenseCategories.map((category) => <View key={category.id} style={styles.limitInputRow}><View style={styles.limitLabel}><View style={[styles.categoryDot, { backgroundColor: category.color }]} /><Text style={styles.limitName}>{category.name}</Text></View><View style={styles.limitField}><Text style={styles.limitCurrency}>{currency === "USD" ? "$" : currency}</Text><TextInput value={categoryInputs[category.id] ?? ""} onChangeText={(value) => setCategoryInputs((current) => ({ ...current, [category.id]: value }))} placeholder="—" placeholderTextColor="#B4BBC6" keyboardType="decimal-pad" style={styles.limitTextInput} /></View></View>)}</View>
          <Pressable onPress={saveBudget} style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}><IconSymbol name="target" size={16} color="#FFFFFF" /><Text style={styles.primaryButtonText}>Save budget</Text></Pressable>
        </View>
        {budgetHistory.length > 0 && <><View style={styles.sectionHeader}><View><Text style={styles.eyebrow}>HISTORY</Text><Text style={styles.sectionTitle}>Budget by month</Text></View><Text style={styles.historyHint}>{budgetHistory.length} saved</Text></View><View style={styles.historyCard}>{budgetHistory.map((item) => <View key={item.month} style={styles.historyRow}><View style={styles.historyCopy}><Text style={styles.historyMonth}>{getMonthLabel(item.month)}</Text><Text style={styles.historyMeta}>{item.over ? `${formatCurrency(Math.abs(item.remaining), currency)} over target` : `${formatCurrency(item.remaining, currency)} remaining`}</Text></View><View style={styles.historyRight}><Text style={styles.historySpent}>{formatCurrency(item.spent, currency)} <Text style={styles.historyTarget}>/ {formatCurrency(item.limit, currency)}</Text></Text><View style={styles.historyTrack}><View style={[styles.historyFill, { width: `${Math.min(item.percentage, 1) * 100}%`, backgroundColor: item.over ? "#E9785D" : "#2FBF9F" }]} /></View></View></View>)}</View></>}
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  content: { paddingBottom: 100 },
  loadingText: { color: "#667085", fontSize: 15, textAlign: "center", marginTop: 80 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  backButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E7E5E0", alignItems: "center", justifyContent: "center" },
  headerSpacer: { width: 40 },
  eyebrow: { color: "#98A2B3", fontSize: 10, fontWeight: "800", letterSpacing: 1.15, marginBottom: 4 },
  title: { color: "#14213D", fontSize: 25, fontWeight: "800", letterSpacing: -0.8 },
  description: { color: "#667085", fontSize: 12, lineHeight: 19, marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 7, marginBottom: 10 },
  sectionTitle: { color: "#14213D", fontSize: 18, fontWeight: "800", letterSpacing: -0.4 },
  countBadge: { width: 27, height: 27, borderRadius: 9, backgroundColor: "#E5F6F1", alignItems: "center", justifyContent: "center" },
  countText: { color: "#2A9E87", fontSize: 11, fontWeight: "800" },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", padding: 15, marginBottom: 12 },
  rulesCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", paddingHorizontal: 15, marginBottom: 14 },
  segmentRow: { flexDirection: "row", padding: 3, backgroundColor: "#F4F5F4", borderRadius: 11, gap: 4, marginBottom: 15 },
  segment: { flex: 1, height: 32, alignItems: "center", justifyContent: "center", borderRadius: 8 },
  segmentSelected: { backgroundColor: "#14213D" },
  segmentText: { color: "#667085", fontSize: 11, fontWeight: "700" },
  segmentSelectedText: { color: "#FFFFFF" },
  fieldLabel: { color: "#667085", fontSize: 11, fontWeight: "700", marginTop: 12, marginBottom: 7 },
  optionalText: { color: "#98A2B3", fontWeight: "500" },
  placeholderText: { color: "#98A2B3", fontWeight: "500" },
  clearDateText: { color: "#C18A16", fontSize: 10, fontWeight: "700", marginTop: 5 },
  amountInput: { height: 45, borderRadius: 12, borderWidth: 1, borderColor: "#E7E5E0", flexDirection: "row", alignItems: "center", paddingHorizontal: 12 },
  currencySign: { color: "#2FBF9F", fontSize: 15, fontWeight: "800", marginRight: 7 },
  amountTextInput: { flex: 1, color: "#14213D", fontSize: 17, fontWeight: "800", paddingVertical: 0 },
  categoryScroller: { gap: 8, paddingBottom: 2 },
  categoryChip: { flexDirection: "row", alignItems: "center", gap: 6, height: 32, paddingHorizontal: 9, borderRadius: 10, borderWidth: 1, borderColor: "#E7E5E0" },
  categoryChipSelected: { backgroundColor: "#E5F6F1", borderColor: "#BFEADF" },
  categoryDot: { width: 8, height: 8, borderRadius: 4 },
  categoryChipText: { color: "#667085", fontSize: 10, fontWeight: "700" },
  categoryChipSelectedText: { color: "#2A9E87" },
  frequencyRow: { flexDirection: "row", gap: 8 },
  frequencyOption: { flex: 1, flexDirection: "row", gap: 5, height: 35, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: "#E7E5E0" },
  frequencySelected: { backgroundColor: "#E5F6F1", borderColor: "#BFEADF" },
  frequencyText: { color: "#667085", fontSize: 10, fontWeight: "700" },
  frequencySelectedText: { color: "#2A9E87" },
  textInput: { height: 43, borderRadius: 12, borderWidth: 1, borderColor: "#E7E5E0", paddingHorizontal: 12, color: "#14213D", fontSize: 12 },
  dateButton: { height: 43, borderRadius: 12, borderWidth: 1, borderColor: "#E7E5E0", paddingHorizontal: 12, flexDirection: "row", alignItems: "center", gap: 8 },
  dateButtonText: { flex: 1, color: "#14213D", fontSize: 12, fontWeight: "700" },
  cancelButton: { height: 36, alignItems: "center", justifyContent: "center", marginTop: 6 },
  cancelButtonText: { color: "#98A2B3", fontSize: 11, fontWeight: "700" },
  primaryButton: { height: 45, borderRadius: 13, backgroundColor: "#14213D", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 16 },
  primaryButtonText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  pressed: { opacity: 0.75, transform: [{ scale: 0.985 }] },
  emptyCard: { backgroundColor: "#F0FAF7", borderRadius: 18, borderWidth: 1, borderColor: "#D9F1E9", padding: 15, marginBottom: 18 },
  emptyTitle: { color: "#14213D", fontSize: 13, fontWeight: "800", marginTop: 9 },
  emptyCopy: { color: "#667085", fontSize: 11, lineHeight: 17, marginTop: 5 },
  historyHint: { color: "#98A2B3", fontSize: 10, fontWeight: "700", marginBottom: 2 },
  historyCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", paddingHorizontal: 15, marginBottom: 14 },
  historyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 62, borderBottomWidth: 1, borderBottomColor: "#F0EFEB", gap: 10 },
  historyCopy: { flex: 1 },
  historyMonth: { color: "#14213D", fontSize: 11, fontWeight: "800" },
  historyMeta: { color: "#98A2B3", fontSize: 10, marginTop: 4 },
  historyRight: { width: 125, alignItems: "flex-end" },
  historySpent: { color: "#14213D", fontSize: 11, fontWeight: "800" },
  historyTarget: { color: "#98A2B3", fontWeight: "600" },
  historyTrack: { width: "100%", height: 5, backgroundColor: "#EEF0F1", borderRadius: 3, overflow: "hidden", marginTop: 6 },
  historyFill: { height: "100%", borderRadius: 3 },
  helper: { color: "#98A2B3", fontSize: 10, marginTop: 7 },
  limitInputs: { borderTopWidth: 1, borderTopColor: "#F0EFEB", marginTop: 5, paddingTop: 5 },
  limitInputRow: { minHeight: 45, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: "#F0EFEB" },
  limitLabel: { flexDirection: "row", alignItems: "center", gap: 8 },
  limitName: { color: "#667085", fontSize: 11, fontWeight: "700" },
  limitField: { width: 102, height: 32, borderRadius: 9, borderWidth: 1, borderColor: "#E7E5E0", flexDirection: "row", alignItems: "center", paddingHorizontal: 7 },
  limitCurrency: { color: "#98A2B3", fontSize: 10, fontWeight: "700" },
  limitTextInput: { flex: 1, color: "#14213D", fontSize: 11, fontWeight: "700", textAlign: "right", paddingVertical: 0 },
});
