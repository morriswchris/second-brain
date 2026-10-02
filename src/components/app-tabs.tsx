import { Icon, Label, NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      tintColor={colors.tint}
      iconColor={colors.textTertiary}
      indicatorColor={colors.tintSoft}
      labelStyle={{ color: colors.textTertiary, selected: { color: colors.tint } }}
      minimizeBehavior="onScrollDown"
    >
      <NativeTabs.Trigger name="index">
        <Label>Capture</Label>
        <Icon
          sf={{ default: 'square.and.pencil', selected: 'square.and.pencil' }}
          androidSrc={require('@/assets/images/tabIcons/home.png')}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <Label>Search</Label>
        <Icon
          sf={{ default: 'magnifyingglass', selected: 'magnifyingglass' }}
          androidSrc={require('@/assets/images/tabIcons/explore.png')}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
