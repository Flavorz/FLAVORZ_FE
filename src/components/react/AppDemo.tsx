import { useState } from 'react';
import { Stack } from '@astryxdesign/core/Stack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { ThemedIsland } from './ThemedIsland';
import { AppShell, DataTable, StatusCell, FormPanel } from './app';
import type { AppNavItem, DataTableColumn, FormFieldSpec } from './app';
import type { TenantConfig } from '../../lib/tenant/schema';

interface Booking extends Record<string, unknown> {
  id: string;
  guest: string;
  covers: number;
  date: string;
  status: string;
}

const BOOKINGS: Booking[] = [
  { id: 'b1', guest: 'Amara Osei', covers: 2, date: '2026-10-14', status: 'confirmed' },
  { id: 'b2', guest: 'Theo Lindqvist', covers: 4, date: '2026-10-14', status: 'pending' },
  { id: 'b3', guest: 'Priya Raman', covers: 6, date: '2026-10-15', status: 'confirmed' },
  { id: 'b4', guest: 'Noor Haddad', covers: 2, date: '2026-10-15', status: 'cancelled' },
  { id: 'b5', guest: 'Diego Marchetti', covers: 3, date: '2026-10-16', status: 'pending' },
];

const COLUMNS: DataTableColumn<Booking>[] = [
  { key: 'guest', header: 'Guest', width: 180 },
  { key: 'covers', header: 'Covers', width: 90 },
  { key: 'date', header: 'Date', width: 120 },
  {
    key: 'status',
    header: 'Status',
    width: 120,
    renderCell: (r) => <StatusCell value={r.status} />,
  },
];

const NAV: AppNavItem[] = [
  { id: 'bookings', label: 'Bookings', icon: 'calendar' },
  { id: 'settings', label: 'Settings', icon: 'wrench' },
];

const SETTINGS_FIELDS: FormFieldSpec[] = [
  { name: 'name', label: 'Restaurant name', isRequired: true, placeholder: 'Flavorz' },
  {
    name: 'email',
    label: 'Contact email',
    type: 'email',
    isRequired: true,
    description: 'Where booking confirmations are sent.',
    validate: (v) => (v && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v) ? 'Enter a valid email' : null),
  },
  { name: 'notes', label: 'Booking notes', type: 'textarea', placeholder: 'Anything guests should know' },
];

function AppDemoInner({ tenant }: { tenant: TenantConfig }) {
  const [active, setActive] = useState('bookings');

  return (
    <AppShell tenant={tenant} items={NAV} activeId={active} onNavigate={setActive}>
      {active === 'bookings' ? (
        <Stack direction="vertical" gap={4}>
          <Stack direction="vertical" gap={1}>
            <Heading level={1}>Bookings</Heading>
            <Text type="supporting" as="p">
              Sort by any column, select rows for bulk actions.
            </Text>
          </Stack>
          <DataTable rows={BOOKINGS} columns={COLUMNS} idKey="id" />
        </Stack>
      ) : (
        <Stack direction="vertical" gap={4}>
          <Heading level={1}>Settings</Heading>
          <FormPanel
            title="Venue details"
            fields={SETTINGS_FIELDS}
            submitLabel="Save changes"
            onSubmit={async () => {
              await new Promise((r) => setTimeout(r, 600));
            }}
          />
        </Stack>
      )}
    </AppShell>
  );
}

export default function AppDemo({ tenant }: { tenant?: TenantConfig }) {
  return <ThemedIsland tenant={tenant}>{(t) => <AppDemoInner tenant={t} />}</ThemedIsland>;
}
