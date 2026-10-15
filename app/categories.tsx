import { useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { useRouter } from "expo-router";

import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { addCategory, useExpenseStore } from "@/lib/expense-store";
import { type Category } from "@/lib/expense-data";

const categoryColors = ["#F4B942", "#6B8AFD", "#A078D4", "#E9785D", "#E86C9A", "#45B8AC", "#4D9DE0"];

export default function CategoriesScreen() {
  const router = useRouter();
  const { categories } = useExpenseStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [color, setColor] = useState(categoryColors[0]);
  const expenseCategories = useMemo(() => categories.filter((category) => category.type !== "income"), [categories]);
  const incomeCategories = useMemo(() => categories.filter((category) => category.type !== "expense"), [categories]);

  const save = () => {
    if (!name.trim()) return;
    const safeId = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${Date.now()}`;
    const category: Category = { id: safeId, name: name.trim(), icon: type === "income" ? "add-card" : "label", color, type };
    addCategory(category);
    setName(""); setModalVisible(false);
  };

  const renderCategory = (category: Category) => <View key={category.id} style={styles.categoryRow}><View style={[styles.categoryIcon, { backgroundColor: `${category.color}1C` }]}><Text style={[styles.categoryGlyph, { color: category.color }]}>{category.name.slice(0, 1).toUpperCase()}</Text></View><View style={styles.categoryCopy}><Text style={styles.categoryName}>{category.name}</Text><Text style={styles.categoryMeta}>{category.type === "both" ? "Income & expense" : category.type === "income" ? "Income" : "Expense"}</Text></View><View style={[styles.colorPill, { backgroundColor: category.color }]} /></View>;

  return <ScreenContainer className="px-5 pt-3">
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}><Pressable onPress={() => router.back()} style={styles.backButton}><IconSymbol name="chevron.left" size={21} color="#14213D" /></Pressable><Text style={styles.title}>Categories</Text><Pressable onPress={() => setModalVisible(true)} style={styles.addButton}><IconSymbol name="plus" size={20} color="#FFFFFF" /></Pressable></View>
      <Text style={styles.description}>Keep your entries organized with labels that feel natural to you.</Text>
      <Text style={styles.sectionLabel}>EXPENSES</Text><View style={styles.card}>{expenseCategories.map(renderCategory)}</View>
      <Text style={styles.sectionLabel}>INCOME</Text><View style={styles.card}>{incomeCategories.map(renderCategory)}</View>
      <Pressable onPress={() => setModalVisible(true)} style={({ pressed }) => [styles.createButton, pressed && styles.pressed]}><IconSymbol name="plus" size={18} color="#2FBF9F" /><Text style={styles.createText}>Create custom category</Text></Pressable>
    </ScrollView>
    <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={() => setModalVisible(false)}><Pressable style={styles.modalBackdrop} onPress={() => setModalVisible(false)}><Pressable style={styles.modalCard} onPress={() => undefined}><View style={styles.modalHandle} /><View style={styles.modalTitleRow}><Text style={styles.modalTitle}>New category</Text><Pressable onPress={() => setModalVisible(false)}><IconSymbol name="xmark" size={19} color="#667085" /></Pressable></View><Text style={styles.inputLabel}>Name</Text><TextInput value={name} onChangeText={setName} placeholder="e.g. Subscriptions" placeholderTextColor="#B6BCC7" style={styles.input} autoFocus returnKeyType="done" /><Text style={styles.inputLabel}>Used for</Text><View style={styles.typeRow}>{(["expense", "income"] as const).map((option) => <Pressable key={option} onPress={() => setType(option)} style={[styles.typeOption, type === option && styles.typeSelected]}><Text style={[styles.typeText, type === option && styles.typeSelectedText]}>{option === "expense" ? "Expense" : "Income"}</Text></Pressable>)}</View><Text style={styles.inputLabel}>Color</Text><View style={styles.colorRow}>{categoryColors.map((option) => <Pressable key={option} onPress={() => setColor(option)} style={[styles.colorOption, { backgroundColor: option }, color === option && styles.colorSelected]} />)}</View><Pressable onPress={save} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}><Text style={styles.saveText}>Create category</Text></Pressable></Pressable></Pressable></Modal>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 60 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E7E5E0", alignItems: "center", justifyContent: "center" },
  title: { color: "#14213D", fontSize: 21, fontWeight: "800", letterSpacing: -0.5 },
  addButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#2FBF9F", alignItems: "center", justifyContent: "center" },
  description: { color: "#667085", fontSize: 13, lineHeight: 20, marginBottom: 27 },
  sectionLabel: { color: "#98A2B3", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 9, marginTop: 5 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", paddingHorizontal: 14, marginBottom: 21 },
  categoryRow: { flexDirection: "row", alignItems: "center", minHeight: 64, borderBottomWidth: 1, borderBottomColor: "#F1F0EC" },
  categoryIcon: { width: 36, height: 36, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 11 },
  categoryGlyph: { fontSize: 15, fontWeight: "800" },
  categoryCopy: { flex: 1 },
  categoryName: { color: "#14213D", fontSize: 13, fontWeight: "700" },
  categoryMeta: { color: "#98A2B3", fontSize: 11, marginTop: 4 },
  colorPill: { width: 8, height: 8, borderRadius: 4 },
  createButton: { height: 50, borderRadius: 15, borderWidth: 1, borderColor: "#BFEADF", backgroundColor: "#F8FDFC", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  createText: { color: "#2A9E87", fontSize: 13, fontWeight: "800" },
  pressed: { opacity: 0.78, transform: [{ scale: 0.98 }] },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(20,33,61,0.28)" },
  modalCard: { backgroundColor: "#FFFFFF", borderTopLeftRadius: 27, borderTopRightRadius: 27, paddingHorizontal: 20, paddingTop: 10, paddingBottom: 30 },
  modalHandle: { width: 38, height: 4, borderRadius: 4, backgroundColor: "#D9DDE5", alignSelf: "center", marginBottom: 16 },
  modalTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  modalTitle: { color: "#14213D", fontSize: 21, fontWeight: "800" },
  inputLabel: { color: "#667085", fontSize: 12, fontWeight: "700", marginBottom: 7, marginTop: 4 },
  input: { height: 48, borderWidth: 1, borderColor: "#E7E5E0", borderRadius: 13, color: "#14213D", paddingHorizontal: 13, fontSize: 13, marginBottom: 14 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 14 },
  typeOption: { flex: 1, height: 42, alignItems: "center", justifyContent: "center", borderRadius: 12, borderWidth: 1, borderColor: "#E7E5E0" },
  typeSelected: { backgroundColor: "#E5F6F1", borderColor: "#BFEADF" },
  typeText: { color: "#667085", fontSize: 12, fontWeight: "700" },
  typeSelectedText: { color: "#2A9E87" },
  colorRow: { flexDirection: "row", gap: 13, marginBottom: 24 },
  colorOption: { width: 28, height: 28, borderRadius: 14 },
  colorSelected: { borderWidth: 3, borderColor: "#FFFFFF", shadowColor: "#14213D", shadowOpacity: 0.4, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 3 },
  saveButton: { height: 50, borderRadius: 15, backgroundColor: "#14213D", alignItems: "center", justifyContent: "center" },
  saveText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
});
