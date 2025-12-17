'use client';

import { OrganizationProfile } from "@clerk/nextjs";
import { Container, Title, Text, Stack, Center } from "@mantine/core";

export default function TeamPage() {
  return (
    <Center h="100vh">
      {/* Este componente mágico faz tudo: Lista, Convida, Remove, Muda Cargo */}
      <OrganizationProfile
        routing="hash" // Usa # para navegação interna do componente
      // appearance={{
      //   elements: {
      //     card: { boxShadow: 'none', border: '1px solid #dee2e6' },
      //     navbar: { display: 'none' } // Esconde o menu lateral se quiser só a lista
      //   }
      // }}
      />

    </Center>
    // <Container size="xl">
    //   <Stack gap="lg">
    //     <div>
    //       <Title order={2}>Gestão de Equipe</Title>
    //       <Text c="dimmed">Convide membros e gerencie permissões.</Text>
    //     </div>

    //   </Stack>
    // </Container>
  );
}