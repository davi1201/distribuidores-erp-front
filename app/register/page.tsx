'use client'; // A correção principal é aqui (espaço, não hífen)

import { useEffect } from "react";
import { Center } from "@mantine/core";
import { SubscriptionWizardModal } from "@/components/subscription/subscription-wizard"; // Verifique se o caminho está correto
import { useAppStore } from "@/store/app/use-app-store";

export default function Page() {
  const openSubscriptionWizard = useAppStore((state) => state.openSubscriptionWizard);

  useEffect(() => {
    openSubscriptionWizard();
  }, [openSubscriptionWizard]);

  return (
    <Center style={{ height: '100vh' }}>
      <SubscriptionWizardModal />
    </Center>
  );
}