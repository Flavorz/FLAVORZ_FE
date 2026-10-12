import { useState, type ReactNode } from 'react';
import { Layout, LayoutHeader, LayoutContent, LayoutPanel } from '@astryxdesign/core/Layout';
import { SideNav, SideNavItem, SideNavSection } from '@astryxdesign/core/SideNav';
import { Stack, StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Avatar } from '@astryxdesign/core/Avatar';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import type { TenantConfig } from '../../../lib/tenant/schema';

export interface AppNavItem {
  id: string;
  label: string;
  /**
   * A semantic icon name from Astryx's registry (`astryx docs icons`).
   * The set is deliberately small — there is no "home" or "dashboard".
   */
  icon?: string;
}

/**
 * The authenticated application frame: brand mark, side navigation, content.
 *
 * Brand-agnostic like every other block — the logo and name come from the
 * tenant, and all colour, type and motion resolve from theme tokens.
 */
export function AppShell({
  tenant,
  items,
  activeId,
  onNavigate,
  children,
}: {
  tenant: TenantConfig;
  items: ReadonlyArray<AppNavItem>;
  activeId: string;
  onNavigate: (id: string) => void;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout
      height="fill"
      header={
        <LayoutHeader>
          <Stack direction="horizontal" gap={3} align="center" width="100%">
            <IconButton
              label={collapsed ? 'Expand navigation' : 'Collapse navigation'}
              icon={<Icon icon="menu" />}
              variant="ghost"
              size="sm"
              onClick={() => setCollapsed((c) => !c)}
            />
            <span
              aria-label={tenant.name}
              role="img"
              style={{
                display: 'block',
                width: 96,
                height: 24,
                backgroundColor: 'var(--color-text-primary)',
                maskImage: `url(${tenant.assets.logo})`,
                maskRepeat: 'no-repeat',
                maskPosition: 'left center',
                maskSize: 'contain',
                WebkitMaskImage: `url(${tenant.assets.logo})`,
                WebkitMaskRepeat: 'no-repeat',
                WebkitMaskPosition: 'left center',
                WebkitMaskSize: 'contain',
              }}
            />
            <StackItem size="fill">
              <Stack direction="horizontal" gap={2} align="center" justify="end">
                <Avatar name="Nathish" size="sm" />
              </Stack>
            </StackItem>
          </Stack>
        </LayoutHeader>
      }
      start={
        collapsed ? undefined : (
          <LayoutPanel width={232}>
            <SideNav>
              {/* title is required; hide it when the nav needs no heading. */}
              <SideNavSection title="Navigation" isHeaderHidden>
                {items.map((item) => (
                  <SideNavItem
                    key={item.id}
                    label={item.label}
                    icon={item.icon}
                    isSelected={item.id === activeId}
                    onClick={() => onNavigate(item.id)}
                  />
                ))}
              </SideNavSection>
            </SideNav>
          </LayoutPanel>
        )
      }
      content={<LayoutContent padding={6}>{children}</LayoutContent>}
    />
  );
}
