// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { ChainIcons, NetworkId } from 'types'
import CreditcoinTokenSVG from '../token/ic_creditcoin.svg?react'

export const chainIcons: Record<NetworkId, ChainIcons> = {
  'creditcoin3-dev': {
    icon: CreditcoinTokenSVG,
    token: CreditcoinTokenSVG,
    inline: {
      svg: CreditcoinTokenSVG,
      size: '0.96em',
    },
  },
  'creditcoin3-testnet': {
    icon: CreditcoinTokenSVG,
    token: CreditcoinTokenSVG,
    inline: {
      svg: CreditcoinTokenSVG,
      size: '0.96em',
    },
  },
  'creditcoin3-dryrun': {
    icon: CreditcoinTokenSVG,
    token: CreditcoinTokenSVG,
    inline: {
      svg: CreditcoinTokenSVG,
      size: '0.96em',
    },
  },
}
