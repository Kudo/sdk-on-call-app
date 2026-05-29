import { HStack, Image, Spacer, Text, VStack } from '@expo/ui/swift-ui';
import {
  containerBackground,
  font,
  foregroundStyle,
  padding,
  widgetURL,
} from '@expo/ui/swift-ui/modifiers';
import { createWidget, type WidgetEnvironment } from 'expo-widgets';
import type { NextShiftWidgetProps } from '@/lib/widget-timeline';

// IMPORTANT: this component must be fully self-contained. The `'widget'` babel
// transform serializes only this function's body and runs it in a separate
// JavaScriptCore runtime inside the widget extension — module-scope helpers,
// constants, and imports (other than the `@expo/ui` globals the runtime injects)
// are NOT available there. Keep every value and helper inside the function body.
const NextShiftWidget = (props: NextShiftWidgetProps, environment: WidgetEnvironment) => {
  'widget';
  const ACCENT = '#0A84FF';
  const isOnCall = props.status === 'on-call';
  const isNone = props.status === 'none';
  const isDark = environment.colorScheme === 'dark';

  const background = isOnCall ? ACCENT : isDark ? '#1C1C1E' : '#FFFFFF';
  const primary = isOnCall || isDark ? '#FFFFFF' : '#000000';
  const subtle = isOnCall ? '#FFFFFFD9' : '#8E8E93';

  const topLabel = isOnCall ? 'ON CALL' : isNone ? 'NO SHIFTS' : 'NEXT SHIFT';
  const bigLine = isOnCall
    ? 'This week'
    : isNone
      ? 'You’re clear'
      : props.daysUntil <= 0
        ? 'Today'
        : `${props.daysUntil}d`;
  const statusLine = isOnCall
    ? 'On call this week'
    : isNone
      ? 'No upcoming rotation'
      : `Starts ${props.dateLabel}`;

  // `containerBackground` must be the outermost (last) modifier so WidgetKit
  // adopts it as the widget's container background (required on iOS 17+).
  const rootModifiers = [
    widgetURL('sdkoncall:///(tabs)/(shifts)'),
    padding({ all: 16 }),
    containerBackground(background, 'widget'),
  ];

  if (environment.widgetFamily === 'systemMedium') {
    return (
      <HStack spacing={14} modifiers={rootModifiers}>
        <Image
          systemName={isOnCall ? 'phone.fill' : 'calendar.badge.clock'}
          size={42}
          color={isOnCall ? primary : ACCENT}
        />
        <VStack alignment="leading" spacing={3}>
          <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(subtle)]}>
            {topLabel}
          </Text>
          <Text modifiers={[font({ size: 20, weight: 'bold' }), foregroundStyle(primary)]}>
            {isNone ? 'You’re clear' : props.name}
          </Text>
          {props.weekLabel ? (
            <Text modifiers={[font({ size: 13 }), foregroundStyle(subtle)]}>{props.weekLabel}</Text>
          ) : null}
          <Text modifiers={[font({ size: 13, weight: 'medium' }), foregroundStyle(primary)]}>
            {statusLine}
          </Text>
        </VStack>
        <Spacer />
      </HStack>
    );
  }

  // systemSmall (and any other family) — compact stat layout.
  return (
    <VStack alignment="leading" spacing={2} modifiers={rootModifiers}>
      <Text modifiers={[font({ size: 11, weight: 'semibold' }), foregroundStyle(subtle)]}>
        {topLabel}
      </Text>
      <Text modifiers={[font({ size: 34, weight: 'bold' }), foregroundStyle(primary)]}>
        {bigLine}
      </Text>
      <Spacer />
      {props.name ? (
        <Text modifiers={[font({ size: 15, weight: 'semibold' }), foregroundStyle(primary)]}>
          {props.name}
        </Text>
      ) : null}
      <Text modifiers={[font({ size: 12 }), foregroundStyle(subtle)]}>
        {props.weekLabel || statusLine}
      </Text>
    </VStack>
  );
};

export default createWidget<NextShiftWidgetProps>('NextShiftWidget', NextShiftWidget);
