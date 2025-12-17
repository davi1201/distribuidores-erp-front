
'use client';


import '@mantine/core/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/dates/styles.css';

import { ColorSchemeScript, mantineHtmlProps, MantineProvider } from '@mantine/core';
import { theme } from '../theme';
import { AuthProvider } from '../providers/auth-provider';
import { useState } from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { ptBR } from '@clerk/localizations';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Notifications } from '@mantine/notifications';
import { BillingModal } from '../src/shared/components/ui/modals/billing-modal';
import { ProgressBarProvider } from '../providers/progress-bar.provider';
import { NotificationListener } from '../src/shared/components/notifications/notification-listener';


export default function RootLayout({ children }: { children: any }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <ClerkProvider localization={ptBR}>

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
                <NotificationListener />
                <ProgressBarProvider>
                  {children}
                </ProgressBarProvider>
              </AuthProvider>
            </MantineProvider>
          </QueryClientProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
