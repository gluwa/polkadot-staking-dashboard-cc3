// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { ChainIcons, NetworkId } from 'types'
import WestendTokenSVG from '../token/wnd.svg?react'
import WestendIconSVG from './westendIcon.svg?react'
import WestendInlineSVG from './westendInline.svg?react'

export const chainIcons: Record<NetworkId, ChainIcons> = {
  'creditcoin3-dev': {
    icon: WestendIconSVG,
    token: WestendTokenSVG,
    inline: {
      svg: WestendInlineSVG,
      size: '0.96em',
    },
  },
}
