import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { Stack, StackItem } from '@astryxdesign/core/Stack';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Avatar } from '@astryxdesign/core/Avatar';
import type { Leaderboard } from './types';

/** Community leaderboards. The viewer's own row is marked, not hidden. */
export function Leaderboards({ boards }: { boards: ReadonlyArray<Leaderboard> }) {
  return (
    <Grid columns={{ minWidth: 260, max: 3 }} gap={4}>
      {boards.map((board) => (
        <Card key={board.title} padding={4} variant="muted" height="100%">
          <Stack direction="vertical" gap={3}>
            <Text type="label">{board.title}</Text>
            <Stack direction="vertical" gap={2}>
              {board.entries.map((entry) => (
                <Stack key={entry.rank} direction="horizontal" gap={2} align="center">
                  <Text type="supporting">{entry.rank}</Text>
                  <Avatar name={entry.name} size="xsm" />
                  <StackItem size="fill">
                    <Text type={entry.isViewer ? 'label' : 'body'}>
                      {entry.isViewer ? 'You' : entry.name}
                    </Text>
                  </StackItem>
                  <Badge label={entry.detail} variant="neutral" />
                </Stack>
              ))}
            </Stack>
          </Stack>
        </Card>
      ))}
    </Grid>
  );
}
