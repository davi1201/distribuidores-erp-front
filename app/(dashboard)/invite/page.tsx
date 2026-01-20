'use client';

import { OrganizationProfile } from "@clerk/nextjs";
import { Center } from "@mantine/core";

export default function TeamPage() {
  return (
    <Center h="100%" p="md">
      <OrganizationProfile
        routing="hash" // Usa hash na URL para navegação interna do componente
        appearance={{
          elements: {
            navbarButton__general: { display: "none" },
            navbarButton__organizationSettings: { display: "none" },
            card: {
              boxShadow: 'none',
              border: '1px solid #e5e7eb',
            }
          }
        }}
      />
    </Center>
  );
}