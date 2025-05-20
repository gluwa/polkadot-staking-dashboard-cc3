// Copyright 2025 @polkadot-cloud/polkadot-staking-dashboard authors & contributors
// SPDX-License-Identifier: GPL-3.0-only

import type { NetworkId, Networks } from 'types'

// The default network to use when no network is specified
export const DefaultNetwork: NetworkId = 'creditcoin3-dev'

// All supported networks
export const NetworkList: Networks = {
  'creditcoin3-dev': {
    name: 'creditcoin3-dev',
    endpoints: {
      lightClient: async () => null,
      rpc: {
        'CC3-Devnet': 'wss://rpc.cc3-devnet.creditcoin.network/ws',
      },
    },
    unit: 'CTC',
    units: 18,
    ss58: 42,
    defaultFeeReserve: 100000000000000000n,
  },
}
