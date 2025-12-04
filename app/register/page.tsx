import { SubscriptionWizard } from "@/components/subscription/subscription-wizard";
import { Center } from "@mantine/core";

export default function Page() {
  return (
    <Center style={{ height: '100vh' }}>
      <SubscriptionWizard />
    </Center>
  );
}