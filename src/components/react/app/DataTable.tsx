import { useMemo, useState } from 'react';
import { Table, proportional } from '@astryxdesign/core/Table';
import { useTableSortable } from '@astryxdesign/core/Table';
import { useTableSelection, useTableSelectionState } from '@astryxdesign/core/Table';
import { TableSelectionToolbar } from '@astryxdesign/core/Table';
import { Stack } from '@astryxdesign/core/Stack';
import { Badge } from '@astryxdesign/core/Badge';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import type { TableSortState } from '@astryxdesign/core/Table';

/**
 * A sortable, selectable data table.
 *
 * Sorting and selection are Astryx *plugins* fed through `plugins`, not props:
 * `useTableSortable` and `useTableSelection` each return a TablePlugin. Row
 * types must extend Record<string, unknown>, which is why TRow is constrained.
 */
export interface DataTableColumn<TRow> {
  key: string & keyof TRow;
  header: string;
  /** Render a cell; omit for the raw value. */
  renderCell?: (row: TRow) => React.ReactNode;
  width?: number;
  /**
   * Columns opt IN to sorting. The sortable plugin alone does nothing —
   * without this the header renders with no sort control and no aria-sort.
   */
  isSortable?: boolean;
}

export function DataTable<TRow extends Record<string, unknown>>({
  rows,
  columns,
  idKey,
  emptyMessage = 'Nothing here yet',
}: {
  rows: ReadonlyArray<TRow>;
  columns: ReadonlyArray<DataTableColumn<TRow>>;
  idKey: string & keyof TRow;
  emptyMessage?: string;
}) {
  const [sort, setSort] = useState<TableSortState>([]);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());

  // Sorting is client-side here; swap for a server query when the dataset
  // outgrows the page.
  const sorted = useMemo(() => {
    const entry = sort[0];
    if (!entry) return [...rows];
    const dir = entry.direction === 'descending' ? -1 : 1;
    return [...rows].sort((a, b) => {
      const av = a[entry.sortKey as keyof TRow];
      const bv = b[entry.sortKey as keyof TRow];
      if (av === bv) return 0;
      return (av! > bv! ? 1 : -1) * dir;
    });
  }, [rows, sort]);

  const sortable = useTableSortable<TRow>({ sort, onSortChange: setSort });

  // useTableSelectionState owns the bookkeeping and hands back BOTH the
  // plugin config and the toolbar's state object — the toolbar takes
  // `selection`, not a count plus a callback.
  const { selectionConfig, selectionState } = useTableSelectionState<TRow>({
    data: sorted,
    idKey,
    selectedKeys,
    setSelectedKeys,
  });
  const selection = useTableSelection<TRow>(selectionConfig);

  if (rows.length === 0) {
    return <EmptyState title={emptyMessage} />;
  }

  return (
    <Stack direction="vertical" gap={3}>
      {selectedKeys.size > 0 && <TableSelectionToolbar selection={selectionState} />}

      <Table
        data={sorted}
        idKey={idKey}
        columns={columns.map((c) => ({
          key: c.key,
          header: c.header,
          width: c.width ? proportional(1, { minWidth: c.width }) : undefined,
          renderCell: c.renderCell ? (row: TRow) => c.renderCell!(row) : undefined,
          sortable: c.isSortable ?? true,
        }))}
        plugins={{ sortable, selection }}
        hasHover
        dividers="rows"
      />
    </Stack>
  );
}

/** Convenience cell renderer for a status column. */
export function StatusCell({ value }: { value: string }) {
  const variant =
    value === 'active' || value === 'confirmed'
      ? 'success'
      : value === 'pending'
        ? 'warning'
        : value === 'cancelled'
          ? 'error'
          : 'neutral';
  return <Badge label={value} variant={variant} />;
}
