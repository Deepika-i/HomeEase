
import { NativeTabs } from 'expo-router/native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();

  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      tintColor="#B85D32"
      labelVisibilityMode="labeled"
      labelStyle={{
        default: {
          color: colors.text,
          fontSize: 11,
        },
        selected: {
          color: '#B85D32',
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      {/* Home */}
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'house',
            selected: 'house.fill',
          }}
          md={{
            default: 'home',
            selected: 'home_filled',
          }}
        />
        <NativeTabs.Trigger.Label>
          Home
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* Explore */}
      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'safari',
            selected: 'safari.fill',
          }}
          md={{
            default: 'explore',
            selected: 'explore',
          }}
        />
        <NativeTabs.Trigger.Label>
          Explore
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* My Bookings */}
      <NativeTabs.Trigger name="bookings">
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'calendar',
            selected: 'calendar.circle.fill',
          }}
          md={{
            default: 'calendar_month',
            selected: 'calendar_month',
          }}
        />
        <NativeTabs.Trigger.Label>
          My Bookings
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

      {/* Profile */}
      <NativeTabs.Trigger name="profile">
        <NativeTabs.Trigger.Icon
          sf={{
            default: 'person.crop.circle',
            selected: 'person.crop.circle.fill',
          }}
          md={{
            default: 'account_circle',
            selected: 'account_circle',
          }}
        />
        <NativeTabs.Trigger.Label>
          Profile
        </NativeTabs.Trigger.Label>
      </NativeTabs.Trigger>

    </NativeTabs>
  );
}
