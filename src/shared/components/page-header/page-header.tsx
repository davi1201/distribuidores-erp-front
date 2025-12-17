'use client';

import { Title, Text, Breadcrumbs, Anchor, Stack, Box, Group } from '@mantine/core';
import { IconChevronRight } from '@tabler/icons-react';
import Link from 'next/link';

interface BreadcrumbItem {
  title: string;
  href: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumbs?: BreadcrumbItem[];
  action?: React.ReactNode; // Botão opcional no canto direito
}

export function PageHeader({ title, description, breadcrumbs = [], action }: PageHeaderProps) {
  const items = breadcrumbs.map((item, index) => {
    const isLast = index === breadcrumbs.length - 1;

    if (isLast) {
      return (
        <Text key={index} size="sm" c="dimmed">
          {item.title}
        </Text>
      );
    }

    return (
      <Anchor component={Link} href={item.href} key={index} size="sm">
        {item.title}
      </Anchor>
    );
  });

  return (
    <Box mb="lg">
      <Stack gap="xs">
        {items.length > 0 && (
          <Breadcrumbs separator={<IconChevronRight size={14} />} mt="xs">
            {items}
          </Breadcrumbs>
        )}

        <Group justify="space-between" align="flex-end">
          <div>
            <Title order={2} fw={700}>{title}</Title>
            {description && (
              <Text c="dimmed" size="sm" mt={4}>
                {description}
              </Text>
            )}
          </div>
          {action && <div>{action}</div>}
        </Group>
      </Stack>
    </Box>
  );
}