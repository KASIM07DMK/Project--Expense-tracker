import { createElement, useRef, useState, type ChangeEvent } from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { FeatureLinkCard } from "@/components/enhancement-components";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { exportExpenseCsv, pickExpenseCsv } from "@/lib/backup";
import { mergeImportedData, useExpenseStore } from "@/lib/expense-store";
import { parseExpenseCsv, type ExpenseImportData } from "@/lib/expense-data";

export default function BackupScreen() {
  const router = useRouter();
  const { hydrated, transactions, categories, recurringRules, budgets, currency, theme, monthlyReminderEnabled } = useExpenseStore();
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const [status, setStatus] = useState("");
  const [preview, setPreview] = useState<{ data: ExpenseImportData; errors: string[] } | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleExport = async () => {
    setBusy("export");
    setStatus("");
    try {
      await exportExpenseCsv({ transactions, categories, recurringRules, budgets, currency, theme, monthlyReminderEnabled });
      setStatus("Backup ready. Your CSV contains transactions, categories, recurring rules, budgets, and settings.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The backup could not be created.");
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    setBusy("import");
    setStatus("");
    try {
      const result = await pickExpenseCsv();
      if (!result) {
        setBusy(null);
        return;
      }
      setPreview(result);
      const importedCount = result.data.transactions.length + result.data.categories.length + result.data.recurringRules.length + result.data.budgets.length;
      setStatus(`${importedCount} records are ready to review. Nothing has been changed yet.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The CSV could not be imported.");
    } finally {
      setBusy(null);
    }
  };

  const handleWebFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setBusy("import");
    setStatus("");
    try {
      const result = parseExpenseCsv(await file.text());
      setPreview(result);
      const importedCount = result.data.transactions.length + result.data.categories.length + result.data.recurringRules.length + result.data.budgets.length;
      setStatus(`${importedCount} records are ready to review. Nothing has been changed yet.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "The CSV could not be imported.");
    } finally {
      event.target.value = "";
      setBusy(null);
    }
  };

  const confirmImport = () => {
    if (!preview) return;
    mergeImportedData(preview.data);
    const importedCount = preview.data.transactions.length + preview.data.categories.length + preview.data.recurringRules.length + preview.data.budgets.length;
    setPreview(null);
    setStatus(`${importedCount} records merged successfully. Existing records were kept.`);
  };

  if (!hydrated) return <ScreenContainer className="px-5 pt-6"><Text style={styles.loadingText}>Preparing your backup tools…</Text></ScreenContainer>;

  return <ScreenContainer className="px-5 pt-3">
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}><Pressable onPress={() => router.back()} style={styles.backButton}><IconSymbol name="chevron.left" size={21} color="#14213D" /></Pressable><View><Text style={styles.eyebrow}>LOCAL DATA</Text><Text style={styles.title}>Backup & restore</Text></View><View style={styles.headerSpacer} /></View>
      <Text style={styles.description}>Take your ledger with you. CSV backups stay readable, portable, and under your control.</Text>
      <View style={styles.heroCard}><View style={styles.heroIcon}><IconSymbol name="externaldrive.fill" size={21} color="#9AE7D3" /></View><View style={styles.heroCopy}><Text style={styles.heroTitle}>Your backup is yours</Text><Text style={styles.heroText}>{transactions.length} transactions · {recurringRules.length} recurring rules · {budgets.length} budgets</Text></View></View>
      <Text style={styles.sectionLabel}>EXPORT</Text>
      <View style={styles.actionCard}><View style={styles.actionIcon}><IconSymbol name="arrow.up.doc" size={20} color="#2FBF9F" /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>Export a CSV backup</Text><Text style={styles.actionText}>Create a full snapshot of your local ledger that you can keep or share.</Text></View><Pressable disabled={busy !== null} onPress={handleExport} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>{busy === "export" ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.actionButtonText}>Export</Text>}</Pressable></View>
      <Text style={styles.sectionLabel}>IMPORT</Text>
      <View style={styles.actionCard}><View style={[styles.actionIcon, { backgroundColor: "#FFF1C8" }]}><IconSymbol name="arrow.down.doc" size={20} color="#C18A16" /></View><View style={styles.actionCopy}><Text style={styles.actionTitle}>Merge a CSV backup</Text><Text style={styles.actionText}>Choose an Expense Tracker export. Valid rows will be merged without duplicating matching IDs.</Text></View><Pressable disabled={busy !== null} onPress={Platform.OS === "web" ? () => fileInputRef.current?.click() : handleImport} style={({ pressed }) => [styles.actionButton, { backgroundColor: "#C18A16" }, pressed && styles.pressed]}>{busy === "import" ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.actionButtonText}>Import</Text>}</Pressable></View>
      {Platform.OS === "web" && <View style={styles.webInputCard}><Text style={styles.webInputLabel}>Web file picker</Text>{createElement("input", { ref: fileInputRef, type: "file", accept: "text/csv,text/plain,application/vnd.ms-excel", onChange: handleWebFileChange, style: { flex: 1, minWidth: 0, fontSize: 12, color: "#667085" } })}</View>}
      {!!status && <View style={styles.statusCard}><IconSymbol name="info.circle" size={17} color="#2A9E87" /><Text style={styles.statusText}>{status}</Text></View>}
      {preview && <View style={styles.previewCard}><View style={styles.previewHeader}><View><Text style={styles.previewEyebrow}>IMPORT PREVIEW</Text><Text style={styles.previewTitle}>Review before merging</Text></View><Pressable onPress={() => setPreview(null)} style={({ pressed }) => [styles.previewClose, pressed && styles.pressed]}><IconSymbol name="xmark" size={15} color="#667085" /></Pressable></View><View style={styles.previewGrid}><View style={styles.previewMetric}><Text style={styles.previewMetricValue}>{preview.data.transactions.length}</Text><Text style={styles.previewMetricLabel}>transactions</Text></View><View style={styles.previewMetric}><Text style={styles.previewMetricValue}>{preview.data.categories.length}</Text><Text style={styles.previewMetricLabel}>categories</Text></View><View style={styles.previewMetric}><Text style={styles.previewMetricValue}>{preview.data.recurringRules.length}</Text><Text style={styles.previewMetricLabel}>recurring</Text></View><View style={styles.previewMetric}><Text style={styles.previewMetricValue}>{preview.data.budgets.length}</Text><Text style={styles.previewMetricLabel}>budgets</Text></View></View>{preview.errors.length > 0 && <View style={styles.warningBox}><IconSymbol name="info.circle" size={15} color="#C18A16" /><Text style={styles.warningText}>{preview.errors.length} validation note{preview.errors.length === 1 ? "" : "s"}; malformed rows will be skipped.</Text></View>}<View style={styles.previewActions}><Pressable onPress={() => setPreview(null)} style={({ pressed }) => [styles.cancelButton, pressed && styles.pressed]}><Text style={styles.cancelText}>Cancel</Text></Pressable><Pressable onPress={confirmImport} style={({ pressed }) => [styles.confirmButton, pressed && styles.pressed]}><IconSymbol name="checkmark" size={15} color="#FFFFFF" /><Text style={styles.confirmText}>Confirm merge</Text></Pressable></View></View>}
      <Text style={styles.sectionLabel}>WHAT’S INCLUDED</Text>
      <View style={styles.includedCard}><Text style={styles.includedText}>Transactions, custom categories, recurring rules, monthly budgets, category limits, currency, appearance, and reminder preference.</Text></View>
      <Text style={styles.sectionLabel}>FORMAT</Text>
      <View style={styles.formatCard}><Text style={styles.formatTitle}>Readable CSV</Text><Text style={styles.formatText}>The file uses one record per row and keeps notes safely quoted. Import accepts files created by this app and skips malformed rows with a note.</Text></View>
      <FeatureLinkCard icon="repeat" title="Need to change a rule?" description="Recurring schedules and budgets live in one place." actionLabel="Manage" onPress={() => router.push("/manage" as never)} />
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 100, gap: 0 },
  loadingText: { color: "#667085", fontSize: 15, textAlign: "center", marginTop: 80 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 15 },
  backButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E7E5E0", alignItems: "center", justifyContent: "center" },
  headerSpacer: { width: 40 },
  eyebrow: { color: "#98A2B3", fontSize: 10, fontWeight: "800", letterSpacing: 1.15, marginBottom: 4 },
  title: { color: "#14213D", fontSize: 25, fontWeight: "800", letterSpacing: -0.8 },
  description: { color: "#667085", fontSize: 12, lineHeight: 19, marginBottom: 18 },
  heroCard: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: "#14213D", borderRadius: 18, padding: 15, marginBottom: 22 },
  heroIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(47,191,159,0.15)", alignItems: "center", justifyContent: "center" },
  heroCopy: { flex: 1 },
  heroTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  heroText: { color: "#A9B4C7", fontSize: 10, lineHeight: 16, marginTop: 4 },
  sectionLabel: { color: "#98A2B3", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 9, marginTop: 5 },
  actionCard: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", padding: 14, flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 17 },
  actionIcon: { width: 35, height: 35, borderRadius: 11, backgroundColor: "#E5F6F1", alignItems: "center", justifyContent: "center" },
  actionCopy: { flex: 1 },
  actionTitle: { color: "#14213D", fontSize: 12, fontWeight: "800" },
  actionText: { color: "#98A2B3", fontSize: 10, lineHeight: 15, marginTop: 4 },
  actionButton: { minWidth: 66, height: 32, borderRadius: 10, backgroundColor: "#2FBF9F", alignItems: "center", justifyContent: "center", paddingHorizontal: 10 },
  actionButtonText: { color: "#FFFFFF", fontSize: 10, fontWeight: "800" },
  pressed: { opacity: 0.75 },
  statusCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#F0FAF7", borderRadius: 14, borderWidth: 1, borderColor: "#D9F1E9", padding: 12, marginBottom: 17 },
  statusText: { flex: 1, color: "#2A9E87", fontSize: 10, lineHeight: 16, fontWeight: "700" },
  previewCard: { backgroundColor: "#F0FAF7", borderRadius: 18, borderWidth: 1, borderColor: "#BFEADF", padding: 14, marginBottom: 17 },
  webInputCard: { flexDirection: "row", alignItems: "center", gap: 9, backgroundColor: "#FFFFFF", borderRadius: 13, borderWidth: 1, borderColor: "#E7E5E0", paddingHorizontal: 12, paddingVertical: 9, marginTop: -8, marginBottom: 17 },
  webInputLabel: { color: "#98A2B3", fontSize: 10, fontWeight: "800" },
  previewHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  previewEyebrow: { color: "#2A9E87", fontSize: 9, fontWeight: "800", letterSpacing: 1.1 },
  previewTitle: { color: "#14213D", fontSize: 14, fontWeight: "800", marginTop: 3 },
  previewClose: { width: 28, height: 28, borderRadius: 9, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center" },
  previewGrid: { flexDirection: "row", gap: 7, marginTop: 13 },
  previewMetric: { flex: 1, backgroundColor: "#FFFFFF", borderRadius: 10, paddingVertical: 8, alignItems: "center" },
  previewMetricValue: { color: "#2A9E87", fontSize: 16, fontWeight: "800" },
  previewMetricLabel: { color: "#98A2B3", fontSize: 8, marginTop: 2 },
  warningBox: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#FFF8E8", borderRadius: 10, padding: 9, marginTop: 10 },
  warningText: { flex: 1, color: "#927A44", fontSize: 10, lineHeight: 15 },
  previewActions: { flexDirection: "row", gap: 8, marginTop: 12 },
  cancelButton: { flex: 1, height: 38, borderRadius: 11, borderWidth: 1, borderColor: "#BFEADF", alignItems: "center", justifyContent: "center" },
  cancelText: { color: "#2A9E87", fontSize: 11, fontWeight: "800" },
  confirmButton: { flex: 1.6, height: 38, borderRadius: 11, backgroundColor: "#14213D", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  confirmText: { color: "#FFFFFF", fontSize: 11, fontWeight: "800" },
  includedCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E7E5E0", padding: 14, marginBottom: 17 },
  includedText: { color: "#667085", fontSize: 11, lineHeight: 18 },
  formatCard: { backgroundColor: "#FFFAEF", borderRadius: 16, borderWidth: 1, borderColor: "#F8E7B9", padding: 14, marginBottom: 17 },
  formatTitle: { color: "#7C5B12", fontSize: 12, fontWeight: "800" },
  formatText: { color: "#927A44", fontSize: 11, lineHeight: 17, marginTop: 4 },
});
