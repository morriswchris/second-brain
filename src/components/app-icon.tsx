import Ionicons from '@expo/vector-icons/Ionicons';
import type { ComponentProps } from 'react';
import { View } from 'react-native';

import { useHydrated } from '@/hooks/use-hydrated';

export type AppIconName = ComponentProps<typeof Ionicons>['name'];

type AppIconProps = {
  name: AppIconName;
  size: number;
  color: string;
};

/**
 * Ionicons glyph that is safe for web static rendering. The icon font isn't
 * available to the server render, so on web the glyph is swapped in after
 * hydration, with a same-size placeholder until then to avoid layout shift.
 */
export function AppIcon({ name, size, color }: AppIconProps) {
  const hydrated = useHydrated();
  if (!hydrated) return <View style={{ width: size, height: size }} />;
  return <Ionicons name={name} size={size} color={color} />;
}
