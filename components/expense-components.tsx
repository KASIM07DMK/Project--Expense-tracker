import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { IconSymbol } from "@/components/ui/icon-symbol";
import {
  formatCurrency,
  formatShortDate,
  getCategoriesForType,
  getCategoryForTransaction,
  getMonthLabel,
  todayString,
  type Category,
  type Transaction,
  type TransactionType,
} from "@/lib/expense-data";
import { addTransaction, deleteTransaction, updateTransaction } from "@/lib/expense-store";
import { haptic } from "@/lib/haptics";

export function MonthNavigator({ monthKey, onChange }: { monthKey: string; onChange: (monthKey: string) => void }) {
  const [year, month] = monthKey.split("-").map(Number);
  const previous = new Date(year, month - 2, 1);
  const next = new Date(year, month, 1);
  const toKey = (date: Date) => `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;

  return (
    <View style={styles.monthNavigator}>
      <Pressable accessibilityLabel="Previous month" onPress={() => onChange(toKey(previous))} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <IconSymbol name="chevron.left" size={20} color="#667085" />
      </Pressable>
      <View style={styles.monthTitleWrap}>
        <Text style={styles.monthTitle}>{getMonthLabel(monthKey)}</Text>
        <Text style={styles.monthCaption}>Monthly view</Text>
      </View>
      <Pressable accessibilityLabel="Next month" onPress={() => onChange(toKey(next))} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
        <IconSymbol name="chevron.right" size={20} color="#667085" />
      </Pressable>
    </View>
  );
}

export function TransactionRow({ transaction, categories, currency, onPress }: { transaction: Transaction; categories: Category[]; currency: string; onPress: () => void }) {
  const category = getCategoryForTransaction(transaction, categories);
  const isIncome = transaction.type === "income";
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.transactionRow, pressed && styles.rowPressed]}>
      <View style={[styles.categoryIcon, { backgroundColor: `${category.color}20` }]}>
        <MaterialIcons name={category.icon as keyof typeof MaterialIcons.glyphMap} size={20} color={category.color} />
      </View>
      <View style={styles.transactionInfo}>
        <Text style={styles.transactionName} numberOfLines={1}>{category.name}</Text>
        <Text style={styles.transactionMeta} numberOfLines={1}>{transaction.note || "No note"} · {formatShortDate(transaction.date)}</Text>
      </View>
      <Text style={[styles.transactionAmount, { color: isIncome ? "#2FBF9F" : "#14213D" }]}>
        {isIncome ? "+" : "−"}{formatCurrency(transaction.amount, currency)}
      </Text>
    </Pressable>
  );
}

export function ProgressBar({ value, color = "#2FBF9F" }: { value: number; color?: string }) {
  return (
    <View style={styles.progressTrack}>
      <View style={[styles.progressFill, { width: `${Math.min(Math.max(value, 0), 1) * 100}%`, backgroundColor: color }]} />
    </View>
  );
}

export function EmptyState({ title, description, buttonLabel, onPress }: { title: string; description: string; buttonLabel: string; onPress: () => void }) {
  return (
    <View style={styles.emptyState}>
      <View style={styles.emptyIcon}><IconSymbol name="wallet.pass.fill" size={24} color="#2FBF9F" /></View>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyDescription}>{description}</Text>
      <Pressable onPress={onPress} style={({ pressed }) => [styles.emptyButton, pressed && styles.buttonPressed]}>
        <IconSymbol name="plus" size={18} color="#FFFFFF" />
        <Text style={styles.emptyButtonText}>{buttonLabel}</Text>
      </Pressable>
    </View>
  );
}

export function TransactionSheet({ visible, onClose, currency, categories, editTransaction: editingTransaction }: { visible: boolean; onClose: () => void; currency: string; categories: Category[]; editTransaction?: Transaction | null }) {
  const insets = useSafeAreaInsets();
  const [type, setType] = useState<TransactionType>(editingTransaction?.type ?? "expense");
  const [amount, setAmount] = useState(editingTransaction ? `${editingTransaction.amount}` : "");
  const [categoryId, setCategoryId] = useState(editingTransaction?.categoryId ?? "food");
  const [date, setDate] = useState(editingTransaction?.date ?? todayString());
  const [note, setNote] = useState(editingTransaction?.note ?? "");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!visible) return;
    setType(editingTransaction?.type ?? "expense");
    setAmount(editingTransaction ? `${editingTransaction.amount}` : "");
    setCategoryId(editingTransaction?.categoryId ?? "food");
    setDate(editingTransaction?.date ?? todayString());
    setNote(editingTransaction?.note ?? "");
    setError("");
  }, [editingTransaction, visible]);

  const availableCategories = useMemo(() => getCategoriesForType(categories, type), [categories, type]);
  useEffect(() => {
    if (!availableCategories.some((category) => category.id === categoryId)) {
      setCategoryId(availableCategories[0]?.id ?? "other");
    }
  }, [availableCategories, categoryId]);

  const submit = () => {
    const numericAmount = Number(amount.replace(/[^0-9.]/g, ""));
    if (!numericAmount || numericAmount <= 0) {
      setError("Enter an amount greater than zero.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      setError("Use a date in YYYY-MM-DD format.");
      return;
    }
    const payload = { type, amount: numericAmount, categoryId, date, note: note.trim() };
    if (editingTransaction) {
      updateTransaction(editingTransaction.id, payload);
    } else {
      addTransaction(payload);
    }
    haptic.success();
    onClose();
  };

  const confirmDelete = () => {
    if (!editingTransaction) return;
    Alert.alert("Delete transaction?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { haptic.medium(); deleteTransaction(editingTransaction.id); onClose(); } },
    ]);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.sheetKeyboard}>
          <Pressable style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 18) }]} onPress={() => undefined}>
            <View style={styles.sheetHandle} />
            <View style={styles.sheetHeader}>
              <View>
                <Text style={styles.sheetEyebrow}>{editingTransaction ? "Edit entry" : "New entry"}</Text>
                <Text style={styles.sheetTitle}>{editingTransaction ? "Update transaction" : "Add transaction"}</Text>
              </View>
              <Pressable accessibilityLabel="Close" onPress={onClose} style={styles.closeButton}><IconSymbol name="xmark" size={20} color="#667085" /></Pressable>
            </View>
            <View style={styles.segmentedControl}>
              {(["expense", "income"] as TransactionType[]).map((option) => {
                const selected = type === option;
                return <Pressable key={option} onPress={() => { setType(option); haptic.selection(); }} style={[styles.segment, selected && (option === "income" ? styles.incomeSegment : styles.expenseSegment)]}>
                  <Text style={[styles.segmentText, selected && styles.selectedSegmentText]}>{option === "expense" ? "Expense" : "Income"}</Text>
                </Pressable>;
              })}
            </View>
            <Text style={styles.inputLabel}>Amount</Text>
            <View style={[styles.amountInputWrap, type === "income" ? styles.incomeInputWrap : styles.expenseInputWrap]}>
              <Text style={[styles.currencyPrefix, { color: type === "income" ? "#2FBF9F" : "#E9785D" }]}>{currency === "USD" ? "$" : currency}</Text>
              <TextInput autoFocus={!editingTransaction} value={amount} onChangeText={(value) => { setAmount(value); setError(""); }} keyboardType="decimal-pad" placeholder="0.00" placeholderTextColor="#B6BCC7" style={styles.amountInput} returnKeyType="done" />
            </View>
            <Text style={styles.inputLabel}>Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroller}>
              {availableCategories.map((category) => {
                const selected = categoryId === category.id;
                return <Pressable key={category.id} onPress={() => { setCategoryId(category.id); haptic.selection(); }} style={[styles.categoryChoice, selected && { borderColor: category.color, backgroundColor: `${category.color}16` }]}>
                  <MaterialIcons name={category.icon as keyof typeof MaterialIcons.glyphMap} size={16} color={selected ? category.color : "#8B95A7"} />
                  <Text style={[styles.categoryChoiceText, selected && { color: category.color }]}>{category.name}</Text>
                </Pressable>;
              })}
            </ScrollView>
            <View style={styles.fieldRow}>
              <View style={styles.fieldHalf}>
                <Text style={styles.inputLabel}>Date</Text>
                <View style={styles.textInputWrap}><MaterialIcons name="calendar-today" size={16} color="#8B95A7" /><TextInput value={date} onChangeText={setDate} style={styles.textInput} placeholder="YYYY-MM-DD" placeholderTextColor="#B6BCC7" returnKeyType="next" /></View>
              </View>
              <View style={styles.fieldHalf}>
                <Text style={styles.inputLabel}>Note <Text style={styles.optionalLabel}>(optional)</Text></Text>
                <View style={styles.textInputWrap}><TextInput value={note} onChangeText={setNote} style={styles.textInput} placeholder="e.g. Coffee" placeholderTextColor="#B6BCC7" returnKeyType="done" /></View>
              </View>
            </View>
            {!!error && <Text style={styles.errorText}>{error}</Text>}
            <Pressable onPress={submit} style={({ pressed }) => [styles.saveButton, type === "income" ? styles.saveIncome : styles.saveExpense, pressed && styles.buttonPressed]}>
              <Text style={styles.saveButtonText}>{editingTransaction ? "Save changes" : type === "income" ? "Save income" : "Save expense"}</Text>
              <IconSymbol name="arrow.right" size={18} color="#FFFFFF" />
            </Pressable>
            {editingTransaction && <Pressable onPress={confirmDelete} style={({ pressed }) => [styles.deleteButton, pressed && styles.buttonPressed]}><IconSymbol name="trash" size={17} color="#E9785D" /><Text style={styles.deleteButtonText}>Delete transaction</Text></Pressable>}
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

export function CategoryLegend({ category, amount, percentage, currency }: { category: Category; amount: number; percentage: number; currency: string }) {
  return <View style={styles.legendRow}>
    <View style={styles.legendLeft}><View style={[styles.legendDot, { backgroundColor: category.color }]} /><Text style={styles.legendName}>{category.name}</Text></View>
    <View style={styles.legendRight}><Text style={styles.legendAmount}>{formatCurrency(amount, currency)}</Text><Text style={styles.legendPercent}>{Math.round(percentage * 100)}%</Text></View>
  </View>;
}

const styles = StyleSheet.create({
  monthNavigator: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  monthTitleWrap: { alignItems: "center" },
  monthTitle: { color: "#14213D", fontSize: 16, fontWeight: "700", letterSpacing: -0.2 },
  monthCaption: { color: "#98A2B3", fontSize: 11, marginTop: 3, letterSpacing: 0.4 },
  iconButton: { width: 40, height: 40, borderRadius: 14, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#E7E5E0" },
  pressed: { opacity: 0.7 },
  transactionRow: { flexDirection: "row", alignItems: "center", minHeight: 72, paddingVertical: 10 },
  rowPressed: { opacity: 0.7 },
  categoryIcon: { width: 42, height: 42, borderRadius: 14, alignItems: "center", justifyContent: "center", marginRight: 12 },
  transactionInfo: { flex: 1, minWidth: 0 },
  transactionName: { color: "#14213D", fontSize: 14, fontWeight: "700" },
  transactionMeta: { color: "#98A2B3", fontSize: 12, marginTop: 5 },
  transactionAmount: { fontSize: 14, fontWeight: "700", marginLeft: 8 },
  progressTrack: { height: 7, borderRadius: 8, backgroundColor: "#EEF0ED", overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 8 },
  emptyState: { alignItems: "center", paddingHorizontal: 26, paddingVertical: 36 },
  emptyIcon: { width: 56, height: 56, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "#E5F6F1", marginBottom: 14 },
  emptyTitle: { color: "#14213D", fontSize: 17, fontWeight: "700", textAlign: "center" },
  emptyDescription: { color: "#667085", fontSize: 13, lineHeight: 20, textAlign: "center", marginTop: 7, maxWidth: 270 },
  emptyButton: { marginTop: 18, flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 16, height: 44, borderRadius: 14, backgroundColor: "#2FBF9F" },
  emptyButtonText: { color: "#FFFFFF", fontSize: 13, fontWeight: "700" },
  buttonPressed: { opacity: 0.82, transform: [{ scale: 0.98 }] },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(20,33,61,0.28)" },
  sheetKeyboard: { justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28, paddingHorizontal: 20, paddingTop: 10, shadowColor: "#14213D", shadowOpacity: 0.16, shadowRadius: 22, shadowOffset: { width: 0, height: -8 }, elevation: 12 },
  sheetHandle: { width: 38, height: 4, borderRadius: 4, backgroundColor: "#D9DDE5", alignSelf: "center", marginBottom: 16 },
  sheetHeader: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 18 },
  sheetEyebrow: { color: "#98A2B3", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 1.1 },
  sheetTitle: { color: "#14213D", fontSize: 22, fontWeight: "800", letterSpacing: -0.6, marginTop: 4 },
  closeButton: { width: 38, height: 38, borderRadius: 14, alignItems: "center", justifyContent: "center", backgroundColor: "#F7F5F0" },
  segmentedControl: { flexDirection: "row", backgroundColor: "#F3F4F1", borderRadius: 13, padding: 4, marginBottom: 18 },
  segment: { flex: 1, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 10 },
  expenseSegment: { backgroundColor: "#FCEBE6" },
  incomeSegment: { backgroundColor: "#E5F6F1" },
  segmentText: { fontSize: 13, fontWeight: "700", color: "#8B95A7" },
  selectedSegmentText: { color: "#14213D" },
  inputLabel: { color: "#667085", fontSize: 12, fontWeight: "700", marginBottom: 7, marginTop: 2 },
  amountInputWrap: { flexDirection: "row", alignItems: "center", borderRadius: 15, borderWidth: 1, paddingHorizontal: 16, height: 58, marginBottom: 16 },
  incomeInputWrap: { borderColor: "#BFEADF", backgroundColor: "#F8FDFC" },
  expenseInputWrap: { borderColor: "#F5CEC4", backgroundColor: "#FFFBFA" },
  currencyPrefix: { fontSize: 22, fontWeight: "800", marginRight: 8 },
  amountInput: { flex: 1, color: "#14213D", fontSize: 24, fontWeight: "800", paddingVertical: 0 },
  categoryScroller: { gap: 8, paddingBottom: 4, marginBottom: 14 },
  categoryChoice: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: "#E7E5E0", paddingHorizontal: 10, height: 34, borderRadius: 10 },
  categoryChoiceText: { color: "#667085", fontSize: 11, fontWeight: "700" },
  fieldRow: { flexDirection: "row", gap: 10 },
  fieldHalf: { flex: 1 },
  optionalLabel: { color: "#A9B1BD", fontWeight: "500" },
  textInputWrap: { flexDirection: "row", alignItems: "center", gap: 7, height: 44, paddingHorizontal: 10, borderWidth: 1, borderColor: "#E7E5E0", borderRadius: 12, backgroundColor: "#FFFFFF" },
  textInput: { flex: 1, color: "#14213D", fontSize: 12, paddingVertical: 0 },
  errorText: { color: "#E9785D", fontSize: 12, fontWeight: "600", marginTop: 10 },
  saveButton: { height: 50, borderRadius: 15, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 18 },
  saveIncome: { backgroundColor: "#2FBF9F" },
  saveExpense: { backgroundColor: "#14213D" },
  saveButtonText: { color: "#FFFFFF", fontSize: 14, fontWeight: "800" },
  deleteButton: { height: 44, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 7, marginTop: 4 },
  deleteButtonText: { color: "#E9785D", fontSize: 12, fontWeight: "700" },
  legendRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10 },
  legendLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 9, height: 9, borderRadius: 5 },
  legendName: { color: "#667085", fontSize: 12, fontWeight: "600" },
  legendRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  legendAmount: { color: "#14213D", fontSize: 12, fontWeight: "700" },
  legendPercent: { color: "#98A2B3", fontSize: 11, minWidth: 30, textAlign: "right" },
});
