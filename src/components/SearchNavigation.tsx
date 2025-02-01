import { Group, ActionIcon, Text, Box, Tooltip } from '@mantine/core';
import { IconChevronUp, IconChevronDown } from '@tabler/icons-react';

interface SearchNavigationProps {
  totalMatches: number;
  currentMatch: number;
  onPrevious: () => void;
  onNext: () => void;
}

export default function SearchNavigation({
  totalMatches,
  currentMatch,
  onPrevious,
  onNext
}: SearchNavigationProps) {
  if (totalMatches === 0) return null;

  return (
    <Group gap="xs" style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)' }}>
      <Text size="xs" c="dimmed">
        {currentMatch} / {totalMatches}
      </Text>
      <Box>
        <Tooltip label="上一个匹配项">
          <ActionIcon 
            size="sm" 
            variant="subtle"
            onClick={onPrevious}
            disabled={totalMatches === 0}
          >
            <IconChevronUp size={16} />
          </ActionIcon>
        </Tooltip>
        <Tooltip label="下一个匹配项">
          <ActionIcon 
            size="sm" 
            variant="subtle"
            onClick={onNext}
            disabled={totalMatches === 0}
          >
            <IconChevronDown size={16} />
          </ActionIcon>
        </Tooltip>
      </Box>
    </Group>
  );
} 