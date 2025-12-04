
'use client';


import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core';
import { theme } from '../theme';
import { AuthProvider } from '@/providers/auth-provider';
import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Notifications } from '@mantine/notifications';
import { BillingModal } from '@/components/ui/modals/billing-modal';


export default function RootLayout({ children }: { children: any }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <html lang="en" {...mantineHtmlProps}>
      <head>
        <ColorSchemeScript />
        <link rel="shortcut icon" href="/favicon.svg" />
        <meta
          name="viewport"
          content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
        />
      </head>
      <body>
        <QueryClientProvider client={queryClient}>
          <MantineProvider theme={theme}>
            <Notifications position="top-center" />
            <AuthProvider>
              <BillingModal />
              {children}
            </AuthProvider>
          </MantineProvider>
        </QueryClientProvider>
      </body>
    </html>
  );
}
