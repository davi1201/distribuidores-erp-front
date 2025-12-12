'use client';

import { AppProgressBar as ProgressBar } from 'next-nprogress-bar';
import { ReactNode, Suspense } from 'react';

interface ProgressBarProviderProps {
  children: ReactNode;
}

export function ProgressBarProvider({ children }: ProgressBarProviderProps) {
  return (
    <>
      {children}
      {/* O Suspense é crucial no Next.js 14+ para evitar de-opt de páginas estáticas */}
      <Suspense fallback={null}>
        <ProgressBar
          height="4px"
          color="var(--mantine-color-blue-6)"
          options={{ showSpinner: false }}
          shallowRouting
        />
      </Suspense>
    </>
  );
}