import { feature } from 'bun:bundle'
import * as React from 'react'
import { useInput } from '../ink.js'
import { Box, Text } from '../ink.js'
import type { LocalJSXCommandOnDone } from '../types/command.js'
import { renderSprite } from './sprites.js'
import type { Companion } from './types.js'
import {
  RARITY_COLORS,
  RARITY_STARS,
  STAT_NAMES,
  type StatName,
} from './types.js'

function statBar(value: number, width = 10): string {
  const filled = Math.min(width, Math.max(0, Math.round((value / 100) * width)))
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

export type BuddyProfileCardProps = {
  companion: Companion
  speciesOverride: boolean
  banner?: string
  onDone: LocalJSXCommandOnDone
}

export function BuddyProfileCard({
  companion,
  speciesOverride,
  banner,
  onDone,
}: BuddyProfileCardProps): React.ReactNode {
  useInput((_input, key) => {
    if (key.escape || key.return) {
      onDone(undefined, { display: 'skip' })
    }
  })

  const rarityColor = RARITY_COLORS[companion.rarity]
  const spriteLines = renderSprite(companion, 0)
  const stars = RARITY_STARS[companion.rarity]

  return (
    <Box
      flexDirection="column"
      borderStyle="round"
      borderColor="warning"
      paddingX={2}
      paddingY={1}
      marginY={1}
    >
      <Text bold color="warning">
        Buddy profile
      </Text>
      {banner ? (
        <Box marginTop={1}>
          <Text dimColor>{banner}</Text>
        </Box>
      ) : null}

      <Box flexDirection="row" marginTop={1} alignItems="flex-start">
        <Box flexDirection="column" marginRight={3}>
          {spriteLines.map((line, i) => (
            <Text key={i} dimColor>
              {line}
            </Text>
          ))}
        </Box>
        <Box flexDirection="column" flexGrow={1}>
          <Text bold>{companion.name}</Text>
          <Text dimColor>
            {companion.species}
            {companion.shiny ? ' · shiny' : ''}
          </Text>
          <Text color={rarityColor}>
            {stars} {companion.rarity}
          </Text>
          {companion.hat !== 'none' ? (
            <Text dimColor>hat: {companion.hat}</Text>
          ) : null}
          <Box marginTop={1}>
            <Text dimColor>personality: {companion.personality}</Text>
          </Box>
        </Box>
      </Box>

      <Box flexDirection="column" marginTop={1}>
        <Text dimColor bold>
          Stats
        </Text>
        {STAT_NAMES.map((name: StatName) => (
          <Box key={name} flexDirection="row" marginTop={0}>
            <Box width={14}>
              <Text dimColor>{name}</Text>
            </Box>
            <Box width={4}>
              <Text>{companion.stats[name]}</Text>
            </Box>
            <Text color="inactive">{statBar(companion.stats[name])}</Text>
          </Box>
        ))}
      </Box>

      {speciesOverride ? (
        <Box marginTop={1}>
          <Text dimColor>
            Species is overridden (/buddy auto to use your roll again).
          </Text>
        </Box>
      ) : null}

      <Box marginTop={1}>
        <Text dimColor>
          {feature('BUDDY')
            ? 'Corner buddy is enabled — wide terminals show the sprite beside input.'
            : 'Corner buddy needs a BUDDY build: bun run dev or bun --feature=BUDDY …'}
        </Text>
      </Box>
      <Box marginTop={1}>
        <Text dimColor>
          Esc or Enter to close · /buddy list · /buddy pick &lt;species&gt; ·
          /buddy help
        </Text>
      </Box>
    </Box>
  )
}
