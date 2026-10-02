import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { RootNavigator } from './navigation/RootNavigator.js';
import { useMobileAuthStore } from './stores/mobile-auth.store.js';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 30, // 30 seconds
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  const { init } = useMobileAuthStore();

  useEffect(() => {
    init();
  }, [init]);

  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="light" backgroundColor="#020617" />
      <RootNavigator />
    </QueryClientProvider>
  );
}
