import { DarkTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { restoreSession } from '@/services/sessionService';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const [sessionRestored, setSessionRestored] = useState(false);

  useEffect(() => {
    restoreSession().finally(() => setSessionRestored(true));
  }, []);

  if (!sessionRestored) {
    return null;
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <AnimatedSplashOverlay />
      <AppTabs />
    </ThemeProvider>
  );
}
