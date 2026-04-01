import { feature } from 'bun:bundle'
import * as React from 'react'
import {
  companionUserId,
  getCompanion,
  roll,
} from '../../buddy/companion.js'
import { BuddyProfileCard } from '../../buddy/BuddyProfileCard.js'
import { HATS, RARITIES, SPECIES, type Species } from '../../buddy/types.js'
import type { LocalJSXCommandContext } from '../../commands.js'
import type { LocalJSXCommandOnDone } from '../../types/command.js'
import { getGlobalConfig, saveGlobalConfig } from '../../utils/config.js'

function resolveSpecies(token: string): Species | undefined {
  const t = token.trim().toLowerCase()
  if (!t) return undefined
  return (SPECIES as readonly string[]).includes(t) ? (t as Species) : undefined
}

function showCard(
  onDone: LocalJSXCommandOnDone,
  speciesOverride: boolean,
  banner?: string,
): React.ReactNode {
  const c = getCompanion()
  if (!c) {
    onDone('No companion loaded.', { display: 'system' })
    return null
  }
  return (
    <BuddyProfileCard
      companion={c}
      speciesOverride={speciesOverride}
      banner={banner}
      onDone={onDone}
    />
  )
}

export async function call(
  onDone: LocalJSXCommandOnDone,
  _context: LocalJSXCommandContext,
  args: string,
): Promise<React.ReactNode> {
  const parts = args.trim().split(/\s+/).filter(Boolean)
  const head = parts[0]?.toLowerCase() ?? ''
  const second = parts[1] ?? ''

  if (head === 'mute' && parts.length <= 1) {
    saveGlobalConfig(c => ({ ...c, companionMuted: true }))
    onDone('Buddy muted (sprite hidden when BUDDY UI is on).', {
      display: 'system',
    })
    return null
  }
  if (head === 'unmute' && parts.length <= 1) {
    saveGlobalConfig(c => ({ ...c, companionMuted: false }))
    onDone('Buddy unmuted.', { display: 'system' })
    return null
  }
  if ((head === 'forget' || head === 'reset') && parts.length <= 1) {
    saveGlobalConfig(c => {
      const next = { ...c }
      delete next.companion
      delete next.buddySpeciesOverride
      return next
    })
    onDone('Companion cleared. Run /buddy again to hatch a new one.', {
      display: 'system',
    })
    return null
  }

  if ((head === 'auto' || head === 'default') && parts.length <= 1) {
    saveGlobalConfig(c => {
      const next = { ...c }
      delete next.buddySpeciesOverride
      return next
    })
    const has = !!getGlobalConfig().companion
    if (!has) {
      onDone('Species override cleared (no active companion).', {
        display: 'system',
      })
      return null
    }
    return showCard(onDone, false, 'Species override cleared.')
  }

  if (head === 'pick' || head === 'as' || head === 'show') {
    if (parts.length < 2) {
      onDone(`Usage: /buddy ${head} <species>  (names from /buddy list)`, {
        display: 'system',
      })
      return null
    }
    const sp = resolveSpecies(second)
    if (!sp) {
      onDone(`Unknown species "${second}". Run /buddy list for valid names.`, {
        display: 'system',
      })
      return null
    }
    if (!getGlobalConfig().companion) {
      onDone(
        'Hatch first with /buddy, then /buddy pick <species> to change the sprite look.',
        { display: 'system' },
      )
      return null
    }
    saveGlobalConfig(c => ({ ...c, buddySpeciesOverride: sp }))
    return showCard(onDone, true, `Corner sprite species set to ${sp}.`)
  }

  if (head === 'list' || head === 'species') {
    const hats = HATS.filter(h => h !== 'none').join(', ')
    onDone(
      [
        'Species (use `/buddy pick <name>` after hatching):',
        SPECIES.join(', '),
        '',
        `Rarities: ${RARITIES.join(', ')}`,
        `Hats (when not common): ${hats}`,
      ].join('\n'),
      { display: 'system' },
    )
    return null
  }

  if (head === 'help') {
    onDone(
      [
        '/buddy — hatch or show profile card',
        '/buddy list — all species names',
        '/buddy pick <species> — show that sprite (after hatch); /buddy auto to undo',
        '/buddy new — new random name (species override kept unless you /buddy auto)',
        '/buddy reset — remove companion + override',
        '/buddy mute | unmute',
        '',
        'Tip: no leading space before /buddy.',
      ].join('\n'),
      { display: 'system' },
    )
    return null
  }

  const arg = head
  const stored = getGlobalConfig().companion
  const existing = getCompanion()
  const overrideActive = !!getGlobalConfig().buddySpeciesOverride

  if (existing && !arg) {
    return showCard(onDone, overrideActive)
  }

  if (stored && arg !== 'new' && arg !== 'hatch') {
    onDone(
      [
        `You already have ${stored.name}. Use /buddy new to hatch another, or /buddy reset to clear.`,
        feature('BUDDY')
          ? ''
          : '(Sprite hidden: run `bun run dev` with --feature=BUDDY.)',
      ]
        .filter(Boolean)
        .join('\n'),
      { display: 'system' },
    )
    return null
  }

  const uid = companionUserId()
  const { bones } = roll(uid)
  const names = ['Pixel', 'Patch', 'Bits', 'Mer', 'Noodle', 'Kernel']
  const name = names[Math.floor(Math.random() * names.length)]!
  const personalities = ['curious', 'cheerful', 'mischievous', 'calm', 'witty']
  const personality =
    personalities[Math.floor(Math.random() * personalities.length)]!
  saveGlobalConfig(c => ({
    ...c,
    companion: {
      name,
      personality,
      hatchedAt: Date.now(),
    },
  }))

  return showCard(
    onDone,
    !!getGlobalConfig().buddySpeciesOverride,
    `Hatched ${name} (${bones.species}, ${bones.rarity}).`,
  )
}
