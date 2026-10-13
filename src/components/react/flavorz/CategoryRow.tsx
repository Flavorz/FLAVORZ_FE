import { Grid } from '@astryxdesign/core/Grid';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import type { Category } from './types';

/** "Shop the pantry" — round category tiles. */
export function CategoryRow({ categories }: { categories: ReadonlyArray<Category> }) {
  return (
    <Grid columns={{ minWidth: 110, max: 8 }} gap={3}>
      {categories.map((c) => (
        <Stack key={c.id} direction="vertical" gap={1.5} align="center">
          <span
            aria-hidden="true"
            style={{
              width: 92,
              height: 92,
              borderRadius: '50%',
              backgroundColor: 'var(--color-background-muted)',
            }}
          />
          <Text type="supporting">{c.label}</Text>
        </Stack>
      ))}
    </Grid>
  );
}
