import { MaterialIcons } from '@react-native-vector-icons/material-icons';
import { Tabs as WebTabs } from 'expo-router/tabs';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

export default function TabsLayout() {
  if (process.env.EXPO_OS === 'web') {
    return (
      <WebTabs screenOptions={{ headerShown: false }}>
        <WebTabs.Screen
          name="(schedule)"
          options={{
            title: 'Schedule',
            tabBarIcon: (props) => <MaterialIcons {...props} name="calendar-month" />,
          }}
        />
        <WebTabs.Screen
          name="(shifts)"
          options={{
            title: 'My Shifts',
            tabBarIcon: (props) => <MaterialIcons {...props} name="person" />,
          }}
        />
        <WebTabs.Screen
          name="(team)"
          options={{
            title: 'Team',
            tabBarIcon: (props) => <MaterialIcons {...props} name="group" />,
          }}
        />
        <WebTabs.Screen
          name="(settings)"
          options={{
            title: 'Settings',
            tabBarIcon: (props) => <MaterialIcons {...props} name="settings" />,
          }}
        />
      </WebTabs>
    );
  }

  return (
    <NativeTabs>
      <NativeTabs.Trigger name="(schedule)">
        <NativeTabs.Trigger.Label>Schedule</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'calendar', selected: 'calendar.fill' as any }}
          md="calendar_month"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(shifts)">
        <NativeTabs.Trigger.Label>My Shifts</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.circle', selected: 'person.circle.fill' }}
          md="person"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(team)">
        <NativeTabs.Trigger.Label>Team</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.3', selected: 'person.3.fill' }}
          md="group"
        />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="(settings)">
        <NativeTabs.Trigger.Label>Settings</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'gearshape', selected: 'gearshape.fill' }}
          md="settings"
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
