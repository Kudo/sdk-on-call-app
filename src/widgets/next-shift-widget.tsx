import type { Widget } from 'expo-widgets';
import type { NextShiftWidgetProps } from '@/lib/widget-timeline';

/**
 * Web fallback for the iOS widget. `expo-widgets` and `@expo/ui/swift-ui` call
 * `requireNativeViewManager` at import time, which throws on web (and during
 * static web rendering). The real implementation lives in
 * `next-shift-widget.native.tsx`; this no-op keeps universal code
 * (`@/lib/widget`) importable on web without pulling in native-only modules.
 */
const NextShiftWidget = {
  reload: () => {},
  updateTimeline: () => {},
  updateSnapshot: () => {},
  getTimeline: async () => [],
} as unknown as Widget<NextShiftWidgetProps>;

export default NextShiftWidget;
