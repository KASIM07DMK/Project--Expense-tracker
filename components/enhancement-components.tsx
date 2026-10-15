import { Pressable, StyleSheet, Switch, Text, View } from "react-native";

import { IconSymbol } from "@/components/ui/icon-symbol";
import { formatCurrency, getCategoryForTransaction, type BudgetProgress, type Category, type RecurringRule } from "@/lib/expense-data";

export function BudgetProgressCard({
  progress,
  currency,
  onManage,
  compact = false,
}: {
  progress: BudgetProgress | null;
  currency: string;
  onManage: () => void;
  compact?: boolean;
}) {
  if (!progress) {
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.titleWrap}><View style={[styles.iconBubble, { backgroundColor: "#E5F6F1" }]}><IconSymbol name="target" size={16} color="#2FBF9F" /></View><View><Text style={styles.eyebrow}>BUDGET</Text><Text style={styles.title}>Set a monthly target</Text></View></View>
          <Pressable onPress={onManage} style={({ pressed }) => [styles.smallButton, pressed && styles.pressed]}><Text style={styles.smallButtonText}>Set up</Text></Pressable>
        </View>
        <Text style={styles.emptyCopy}>Give your spending a gentle boundary and see what remains as the month unfolds.</Text>
      </View>
    );
  }

  const percentage = Math.min(progress.percentage, 1);
  const progressColor = progress.over ? "#E9785D" : "#2FBF9F";
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.titleWrap}><View style={[styles.iconBubble, { backgroundColor: progress.over ? "#FCEBE6" : "#E5F6F1" }]}><IconSymbol name="target" size={16} color={progressColor} /></View><View><Text style={styles.eyebrow}>MONTHLY BUDGET</Text><Text style={styles.title}>{formatCurrency(progress.limit, currency)} target</Text></View></View>
        <Pressable onPress={onManage} style={({ pressed }) => [styles.moreButton, pressed && styles.pressed]}><Text style={styles.moreButtonText}>Edit</Text></Pressable>
      </View>
      <View style={styles.amountRow}><Text style={styles.spentLabel}>{formatCurrency(progress.spent, currency)} spent</Text><Text style={[styles.remaining, { color: progress.over ? "#E9785D" : "#2A9E87" }]}>{progress.over ? `${formatCurrency(Math.abs(progress.remaining), currency)} over` : `${formatCurrency(progress.remaining, currency)} left`}</Text></View>
      <View style={styles.track}><View style={[styles.fill, { width: `${Math.max(percentage * 100, progress.spent > 0 ? 2 : 0)}%`, backgroundColor: progressColor }]} /></View>
      {!compact && <Text style={styles.footnote}>{progress.over ? "You’re over the monthly target. A reset is always available next month." : `${Math.round(progress.percentage * 100)}% of your monthly target used`}</Text>}
      {!compact && progress.categoryProgress.length > 0 && <View style={styles.limitList}>{progress.categoryProgress.slice(0, 3).map((item) => <View key={item.categoryId} style={styles.limitRow}><Text style={styles.limitName}>{item.categoryId}</Text><Text style={[styles.limitValue, { color: item.over ? "#E9785D" : "#667085" }]}>{formatCurrency(item.spent, currency)} / {formatCurrency(item.limit, currency)}</Text></View>)}</View>}
    </View>
  );
}

export function RecurringRuleRow({
  rule,
  categories,
  currency,
  onToggle,
  onDelete,
  onEdit,
}: {
  rule: RecurringRule;
  categories: Category[];
  currency: string;
  onToggle: (enabled: boolean) => void;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const category = getCategoryForTransaction({ ...rule, date: rule.nextDate }, categories);
  return (
    <View style={styles.ruleRow}>
      <View style={[styles.ruleIcon, { backgroundColor: `${category.color}22` }]}><IconSymbol name="repeat" size={16} color={category.color} /></View>
      <View style={styles.ruleCopy}><Text style={styles.ruleTitle}>{rule.note || category.name}</Text><Text style={styles.ruleSubtitle}>{category.name} · {rule.frequency} · next {rule.nextDate}{rule.endDate ? ` · until ${rule.endDate}` : ""}</Text></View>
      <View style={styles.ruleActions}><Text style={[styles.ruleAmount, { color: rule.type === "income" ? "#2FBF9F" : "#E9785D" }]}>{rule.type === "income" ? "+" : "−"}{formatCurrency(rule.amount, currency)}</Text><View style={styles.toggleLine}><Text style={styles.toggleLabel}>{rule.enabled ? "Active" : "Paused"}</Text><Switch value={rule.enabled} onValueChange={onToggle} trackColor={{ false: "#D9DDE5", true: "#9AE7D3" }} thumbColor={rule.enabled ? "#2FBF9F" : "#FFFFFF" } /></View></View>
      <Pressable accessibilityLabel={`Edit ${rule.note || category.name} recurring rule`} onPress={onEdit} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}><IconSymbol name="pencil" size={15} color="#667085" /></Pressable><Pressable accessibilityLabel={`Delete ${rule.note || category.name} recurring rule`} onPress={onDelete} style={({ pressed }) => [styles.deleteButton, pressed && styles.pressed]}><IconSymbol name="trash" size={15} color="#E9785D" /></Pressable>
    </View>
  );
}

export function FeatureLinkCard({ icon, title, description, actionLabel, onPress }: { icon: "repeat" | "arrow.up.doc" | "arrow.down.doc" | "externaldrive.fill"; title: string; description: string; actionLabel: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={({ pressed }) => [styles.featureCard, pressed && styles.pressed]}><View style={styles.featureIcon}><IconSymbol name={icon} size={17} color="#2FBF9F" /></View><View style={styles.featureCopy}><Text style={styles.featureTitle}>{title}</Text><Text style={styles.featureDescription}>{description}</Text></View><Text style={styles.featureAction}>{actionLabel}</Text></Pressable>;
}

const styles = StyleSheet.create({
  card: { backgroundColor: "#FFFFFF", borderRadius: 18, borderWidth: 1, borderColor: "#E7E5E0", padding: 15 },
  cardHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  titleWrap: { flexDirection: "row", alignItems: "center", gap: 9, flex: 1 },
  iconBubble: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  eyebrow: { color: "#98A2B3", fontSize: 9, fontWeight: "800", letterSpacing: 1.1 },
  title: { color: "#14213D", fontSize: 14, fontWeight: "800", marginTop: 3 },
  smallButton: { paddingHorizontal: 10, height: 29, alignItems: "center", justifyContent: "center", borderRadius: 9, backgroundColor: "#E5F6F1" },
  smallButtonText: { color: "#2A9E87", fontSize: 11, fontWeight: "800" },
  moreButton: { paddingHorizontal: 8, height: 27, alignItems: "center", justifyContent: "center" },
  moreButtonText: { color: "#2A9E87", fontSize: 11, fontWeight: "800" },
  emptyCopy: { color: "#98A2B3", fontSize: 11, lineHeight: 17, marginTop: 12 },
  amountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 15 },
  spentLabel: { color: "#667085", fontSize: 12, fontWeight: "700" },
  remaining: { fontSize: 12, fontWeight: "800" },
  track: { height: 8, borderRadius: 4, backgroundColor: "#EEF0F1", overflow: "hidden", marginTop: 10 },
  fill: { height: "100%", borderRadius: 4 },
  footnote: { color: "#98A2B3", fontSize: 10, marginTop: 8 },
  limitList: { borderTopWidth: 1, borderTopColor: "#F0EFEB", marginTop: 13, paddingTop: 10, gap: 7 },
  limitRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  limitName: { color: "#667085", fontSize: 10, textTransform: "capitalize" },
  limitValue: { fontSize: 10, fontWeight: "700" },
  ruleRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "#F0EFEB", gap: 9 },
  ruleIcon: { width: 34, height: 34, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  ruleCopy: { flex: 1, minWidth: 0 },
  ruleTitle: { color: "#14213D", fontSize: 12, fontWeight: "800" },
  ruleSubtitle: { color: "#98A2B3", fontSize: 10, marginTop: 3 },
  ruleActions: { alignItems: "flex-end", gap: 3 },
  ruleAmount: { fontSize: 11, fontWeight: "800" },
  toggleLine: { flexDirection: "row", alignItems: "center", gap: 4 },
  toggleLabel: { color: "#98A2B3", fontSize: 9, fontWeight: "700" },
  deleteButton: { width: 25, height: 30, alignItems: "center", justifyContent: "center" },
  featureCard: { backgroundColor: "#FFFFFF", borderRadius: 16, borderWidth: 1, borderColor: "#E7E5E0", padding: 13, flexDirection: "row", alignItems: "center", gap: 10 },
  featureIcon: { width: 31, height: 31, borderRadius: 10, backgroundColor: "#E5F6F1", alignItems: "center", justifyContent: "center" },
  featureCopy: { flex: 1 },
  featureTitle: { color: "#14213D", fontSize: 12, fontWeight: "800" },
  featureDescription: { color: "#98A2B3", fontSize: 10, lineHeight: 15, marginTop: 2 },
  featureAction: { color: "#2A9E87", fontSize: 10, fontWeight: "800" },
  pressed: { opacity: 0.7 },
});
