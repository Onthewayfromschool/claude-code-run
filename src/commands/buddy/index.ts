import type { Command } from '../../commands.js'

const buddy = {
  type: 'local-jsx',
  name: 'buddy',
  description: 'Hatch or manage the terminal coding companion',
  argumentHint: '[list|pick <sp>|new|auto|mute|reset|help]',
  immediate: true,
  load: () => import('./buddy-ui.js'),
} satisfies Command

export default buddy
