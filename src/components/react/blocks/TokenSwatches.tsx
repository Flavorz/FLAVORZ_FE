import { Grid } from '@astryxdesign/core/Grid';
import { Stack } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Section } from '@astryxdesign/core/Section';

const COLOR_TOKENS = [
  '--color-accent',
  '--color-on-accent',
  '--color-background-body',
  '--color-background-surface',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-border',
  '--color-success',
  '--color-warning',
  '--color-error',
];

/** Text's own semantic types. Heading levels are shown by <Heading>, not here. */
const TYPE_TOKENS = [
  ['Display 2', 'display-2'],
  ['Display 3', 'display-3'],
  ['Large', 'large'],
  ['Body', 'body'],
  ['Label', 'label'],
  ['Supporting', 'supporting'],
] as const;

/**
 * Live documentation of the active brand's tokens.
 *
 * Reads the resolved CSS custom properties from the DOM, so it shows what the
 * brand ACTUALLY renders rather than what a config file claims.
 */
export function TokenSwatches() {
  return (
    <Section variant="transparent" paddingBlock={8} paddingInline={6}>
      <Stack direction="vertical" gap={6} maxWidth={1100} width="100%">
        <Heading level={2}>Colour tokens</Heading>
        <Grid columns={{ minWidth: 180, max: 5 }} gap={3}>
          {COLOR_TOKENS.map((token) => (
            <Stack key={token} direction="vertical" gap={1}>
              <div
                style={{
                  height: 56,
                  borderRadius: 'var(--radius-element)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: `var(${token})`,
                }}
              />
              <Text type="supporting">{token.replace('--color-', '')}</Text>
            </Stack>
          ))}
        </Grid>

        <Heading level={2}>Type scale</Heading>
        <Stack direction="vertical" gap={3}>
          {TYPE_TOKENS.map(([label, type]) => (
            <Stack key={type} direction="vertical" gap={0.5}>
              <Text type="supporting">{label}</Text>
              <Text type={type}>The quick brown fox jumps over the lazy dog</Text>
            </Stack>
          ))}
        </Stack>
      </Stack>
    </Section>
  );
}
