'use client'

import { AcceptInviteForm } from '@/features/public/team/components/accept-invite-form';
import { Center, Container } from '@mantine/core';


export default function InvitePage() {
  return (
    <Container size="xs" h="100vh">
      <Center h="100%">
        <AcceptInviteForm />
      </Center>
    </Container>
  );
}