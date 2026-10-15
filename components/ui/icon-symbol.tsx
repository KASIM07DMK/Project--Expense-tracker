// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<SymbolViewProps["name"], ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING = {
  "house.fill": "home",
  "paperplane.fill": "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right": "chevron-right",
  "chevron.left": "chevron-left",
  "plus": "add",
  "plus.circle.fill": "add-circle",
  "chart.bar.fill": "bar-chart",
  "chart.pie.fill": "pie-chart",
  "list.bullet": "format-list-bulleted",
  "gearshape.fill": "settings",
  "tag.fill": "local-offer",
  "pencil": "edit",
  "trash": "delete",
  "calendar": "calendar-today",
  "checkmark": "check",
  "xmark": "close",
  "arrow.up": "arrow-upward",
  "arrow.down": "arrow-downward",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  "filter": "filter-list",
  "magnifyingglass": "search",
  "ellipsis": "more-horiz",
  "circle.fill": "circle",
  "wallet.pass.fill": "account-balance-wallet",
  "slider.horizontal.3": "tune",
  "info.circle": "info-outline",
  "moon.fill": "dark-mode",
  "sun.max.fill": "light-mode",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "repeat": "repeat",
  "arrow.up.doc": "file-upload",
  "arrow.down.doc": "file-download",
  "target": "gps-fixed",
  "bell.fill": "notifications",
  "externaldrive.fill": "save-alt",
} as unknown as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return <MaterialIcons color={color} size={size} name={MAPPING[name]} style={style} />;
}
