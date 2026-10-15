import { useState } from "react";
import { Alert, Platform, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useRouter } from "expo-router";

import { FeatureLinkCard } from "@/components/enhancement-components";
import { ScreenContainer } from "@/components/screen-container";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { setMonthlyReminderEnabled, setCurrency, setTheme, useExpenseStore } from "@/lib/expense-store";
import { type ThemeMode } from "@/lib/expense-data";
import { setMonthlyReviewReminder } from "@/lib/reminders";

const currencies = ["USD", "EUR", "GBP", "INR"];
const themes: { id: ThemeMode; label: string; icon: "sun.max.fill" | "moon.fill" | "slider.horizontal.3" }[] = [
  { id: "system", label: "System", icon: "slider.horizontal.3" },
  { id: "light", label: "Light", icon: "sun.max.fill" },
  { id: "dark", label: "Dark", icon: "moon.fill" },
];

export default function SettingsScreen() {
  const router = useRouter();
  const { currency, theme, monthlyReminderEnabled } = useExpenseStore();
  const [reminderBusy, setReminderBusy] = useState(false);

  const updateReminder = async (enabled: boolean) => {
    setReminderBusy(true);
    const scheduled = await setMonthlyReviewReminder(enabled);
    setReminderBusy(false);
    if (Platform.OS === "web" || scheduled) {
      setMonthlyReminderEnabled(enabled);
      return;
    }
    Alert.alert("Notifications are off", "Enable notifications for Expense Tracker in your device settings, then try again.");
  };

  return <ScreenContainer className="px-5 pt-3">
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
      <View style={styles.headerRow}><Pressable onPress={() => router.back()} style={styles.backButton}><IconSymbol name="chevron.left" size={21} color="#14213D" /></Pressable><Text style={styles.title}>Settings</Text><View style={styles.headerSpacer} /></View>
      <Text style={styles.description}>Make your ledger feel like yours. Changes are saved on this device.</Text>
      <Text style={styles.sectionLabel}>PREFERENCES</Text>
      <View style={styles.card}>
        <View style={styles.row}><View style={[styles.rowIcon, { backgroundColor: "#E5F6F1" }]}><IconSymbol name="wallet.pass.fill" size={17} color="#2FBF9F" /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>Currency</Text><Text style={styles.rowSubtitle}>Used across your summaries</Text></View><Text style={styles.selectedValue}>{currency}</Text></View>
        <View style={styles.currencyRow}>{currencies.map((option) => <Pressable key={option} onPress={() => setCurrency(option)} style={[styles.currencyOption, currency === option && styles.currencySelected]}><Text style={[styles.currencyText, currency === option && styles.currencySelectedText]}>{option}</Text></Pressable>)}</View>
        <View style={styles.separator} />
        <View style={styles.row}><View style={[styles.rowIcon, { backgroundColor: "#FFF1C8" }]}><IconSymbol name="sun.max.fill" size={17} color="#C18A16" /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>Appearance</Text><Text style={styles.rowSubtitle}>Choose how Ledger looks</Text></View></View>
        <View style={styles.themeRow}>{themes.map((option) => <Pressable key={option.id} onPress={() => setTheme(option.id)} style={[styles.themeOption, theme === option.id && styles.themeSelected]}><IconSymbol name={option.icon} size={15} color={theme === option.id ? "#2A9E87" : "#98A2B3"} /><Text style={[styles.themeText, theme === option.id && styles.themeSelectedText]}>{option.label}</Text></Pressable>)}</View>
      </View>

      <Text style={styles.sectionLabel}>PLAN AHEAD</Text>
      <View style={styles.featureStack}>
        <FeatureLinkCard icon="repeat" title="Recurring rules & budgets" description="Schedule predictable entries and set boundaries." actionLabel="Manage" onPress={() => router.push("/manage" as never)} />
        <FeatureLinkCard icon="arrow.down.doc" title="Backup & restore" description="Export a CSV or merge one back into this device." actionLabel="Open" onPress={() => router.push("/backup" as never)} />
        <FeatureLinkCard icon="externaldrive.fill" title="Storage health & recovery" description="Check local data integrity or reset this device safely." actionLabel="Check" onPress={() => router.push("/storage-health" as never)} />
      </View>

      <Text style={styles.sectionLabel}>REMINDERS</Text>
      <View style={styles.card}><View style={styles.row}><View style={[styles.rowIcon, { backgroundColor: "#FCEBE6" }]}><IconSymbol name="bell.fill" size={17} color="#E9785D" /></View><View style={styles.rowCopy}><Text style={styles.rowTitle}>Monthly check-in</Text><Text style={styles.rowSubtitle}>{Platform.OS === "web" ? "Preference is saved; native alerts run on device" : "A gentle reminder to review your month"}</Text></View><Switch disabled={reminderBusy} value={monthlyReminderEnabled} onValueChange={updateReminder} trackColor={{ false: "#D9DDE5", true: "#9AE7D3" }} thumbColor={monthlyReminderEnabled ? "#2FBF9F" : "#FFFFFF"} /></View></View>
      <Text style={styles.sectionLabel}>ABOUT</Text>
      <View style={styles.aboutCard}><View style={styles.aboutIcon}><IconSymbol name="wallet.pass.fill" size={19} color="#2FBF9F" /></View><View style={styles.aboutCopy}><Text style={styles.aboutTitle}>Your data stays with you</Text><Text style={styles.aboutText}>Expense Tracker stores your entries locally on this device. No account or connection is required to keep your ledger up to date.</Text></View></View>
      <Text style={styles.version}>Expense Tracker · v1.0</Text>
    </ScrollView>
  </ScreenContainer>;
}

const styles = StyleSheet.create({
  content: { paddingBottom: 70 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  backButton: { width: 40, height: 40, borderRadius: 13, backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E7E5E0", alignItems: "center", justifyContent: "center" },
  headerSpacer: { width: 40 },
  title: { color: "#14213D", fontSize: 21, fontWeight: "800", letterSpacing: -0.5 },
  description: { color: "#667085", fontSize: 13, lineHeight: 20, marginBottom: 22 },
  sectionLabel: { color: "#98A2B3", fontSize: 10, fontWeight: "800", letterSpacing: 1.2, marginBottom: 9, marginTop: 5 },
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", padding: 14, marginBottom: 18 },
  row: { flexDirection: "row", alignItems: "center", minHeight: 49 },
  rowIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center", marginRight: 10 },
  rowCopy: { flex: 1 },
  rowTitle: { color: "#14213D", fontSize: 13, fontWeight: "700" },
  rowSubtitle: { color: "#98A2B3", fontSize: 11, marginTop: 4 },
  selectedValue: { color: "#2A9E87", fontSize: 12, fontWeight: "800" },
  currencyRow: { flexDirection: "row", gap: 8, marginTop: 12 },
  currencyOption: { flex: 1, height: 36, borderRadius: 10, borderWidth: 1, borderColor: "#E7E5E0", alignItems: "center", justifyContent: "center" },
  currencySelected: { backgroundColor: "#E5F6F1", borderColor: "#BFEADF" },
  currencyText: { color: "#667085", fontSize: 11, fontWeight: "700" },
  currencySelectedText: { color: "#2A9E87" },
  separator: { height: 1, backgroundColor: "#F1F0EC", marginVertical: 15 },
  themeRow: { flexDirection: "row", gap: 8, marginTop: 11 },
  themeOption: { flex: 1, flexDirection: "row", gap: 5, height: 36, alignItems: "center", justifyContent: "center", borderRadius: 10, borderWidth: 1, borderColor: "#E7E5E0" },
  themeSelected: { backgroundColor: "#E5F6F1", borderColor: "#BFEADF" },
  themeText: { color: "#667085", fontSize: 10, fontWeight: "700" },
  themeSelectedText: { color: "#2A9E87" },
  featureStack: { gap: 9, marginBottom: 18 },
  aboutCard: { flexDirection: "row", gap: 11, borderRadius: 18, backgroundColor: "#14213D", padding: 15, marginBottom: 20 },
  aboutIcon: { width: 35, height: 35, borderRadius: 12, backgroundColor: "rgba(47,191,159,0.15)", alignItems: "center", justifyContent: "center" },
  aboutCopy: { flex: 1 },
  aboutTitle: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  aboutText: { color: "#A9B4C7", fontSize: 11, lineHeight: 17, marginTop: 5 },
  version: { color: "#A9B1BD", fontSize: 11, textAlign: "center" },
});
