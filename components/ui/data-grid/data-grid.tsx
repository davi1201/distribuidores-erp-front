'use client';

import { IconAlertCircle, IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { Alert, Center, Group, Pagination, ScrollArea, Table, Tooltip } from '@mantine/core';

type DataGridProps<T> = {
  columns: ColumnDef<T>[] & { actions?: ColumnDef<T>; rowBgColor?: string }[];
  data: T[];
  useRowClicked?: boolean;
  totalRows?: number;
  onRowClicked?: (row: T) => void;
  headerTitle?: string;
};

export function DataGrid<T>({
  columns,
  data,
  useRowClicked = false,
  totalRows = 10,
  onRowClicked,
  headerTitle,
}: DataGridProps<T>) {
  // REMOVIDO: const theme = useMantineTheme();
  // Essa linha estava causando o erro, pois useMantineTheme() acessa document

  const table = useReactTable({
    columns,
    data,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageIndex: 0, pageSize: totalRows } },
    autoResetPageIndex: false,
  });

  if (!data.length) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} title="Atenção!" variant="outline" mt="md">
        {headerTitle || 'Nenhum registro encontrado!'}
      </Alert>
    );
  }

  return (
    <div>
      <ScrollArea>
        <Table
          variant="vertical"
          withRowBorders
          highlightOnHover={useRowClicked}
          style={{ cursor: useRowClicked ? 'pointer' : 'default' }}
        >
          <Table.Thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <Table.Tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <Table.Th key={header.id}>
                    {(header.column.columnDef.meta as { description?: string } | undefined)
                      ?.description ? (
                      <Tooltip
                        label={
                          (header.column.columnDef.meta as { description?: string } | undefined)
                            ?.description
                        }
                        withArrow
                      >
                        <Group>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span>
                            {header.column.getIsSorted() ? (
                              header.column.getIsSorted() === 'desc' ? (
                                <IconChevronDown size={12} />
                              ) : (
                                <IconChevronUp size={12} />
                              )
                            ) : null}
                          </span>
                        </Group>
                      </Tooltip>
                    ) : (
                      <Group>
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        <span>
                          {header.column.getIsSorted() ? (
                            header.column.getIsSorted() === 'desc' ? (
                              <IconChevronDown size={12} />
                            ) : (
                              <IconChevronUp size={12} />
                            )
                          ) : null}
                        </span>
                      </Group>
                    )}
                  </Table.Th>
                ))}
              </Table.Tr>
            ))}
          </Table.Thead>
          <Table.Tbody>
            {table.getRowModel().rows.map((row) => (
              <Table.Tr
                key={row.id}
                onClick={() => onRowClicked && onRowClicked(row.original)}
                style={{ cursor: useRowClicked ? 'pointer' : 'default' }}
              >
                {row.getVisibleCells().map((cell) => (
                  <Table.Td key={cell.id}>
                    {(cell.getValue() as string) === ''
                      ? '-'
                      : flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </Table.Td>
                ))}
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </ScrollArea>

      <Center mt="md">
        {table.getPageCount() > 1 && (
          <Pagination
            size="sm"
            value={table.getState().pagination.pageIndex + 1}
            onChange={(page) => table.setPageIndex(page - 1)}
            total={table.getPageCount()}
          />
        )}
      </Center>
    </div>
  );
}
